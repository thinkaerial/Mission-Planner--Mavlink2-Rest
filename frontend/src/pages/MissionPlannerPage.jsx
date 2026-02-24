// src/pages/MissionPlannerPage.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { TelemetryProvider } from "../context/TelemetryContext";
import AppLayout from "./AppLayoutPage";
import MapPlanner from "../components/map/MapPlanner";
import MapLibrePlanner from "../components/map/MapLibrePlanner";
import MissionTools from "../components/map/MissionTools";
import FlightPlannerSidebar from "../components/mission/FlightPlannerSidebar";
import GenerationModal from "../components/mission/GenerationModal";
import { generateSurveyGrid } from "../utils/missionGeneration";
import * as turf from "@turf/turf";
import { kml } from "@tmcw/togeojson";
import JSZip from "jszip";
import { cameraData } from "../data/cameraData";
import { toast } from "react-toastify";
import L from "leaflet";
import {
  getMissions,
  saveMission,
  createNewMission,
  deleteMission,
} from "../api/missionApi";
import { toArduPilotFormat, toKMLFormat } from "../utils/exportUtils";
import { useAuth } from "../context/AuthContext";
import ActionModal from "../components/common/ActionModal";
import { MPH_TO_MPS } from "../utils/unitConversion";
import { mapLayers } from "../data/mapLayers";

const MAV_CMD = {
  WAYPOINT: 16,
  RETURN_TO_LAUNCH: 20,
  TAKEOFF: 22,
  DO_CHANGE_SPEED: 178,
  DO_SET_CAM_TRIGG_DIST: 206,
};

const MainContent = () => {
  const [homePosition, setHomePosition] = useState(() => {
    const savedHome = localStorage.getItem("homePosition");
    return savedHome ? JSON.parse(savedHome) : [28.6129, 77.2295];
  });
  const [missionItems, setMissionItems] = useState([]);

  // DEFAULT MAPPING ALTITUDE
  const [defaultAltitude, setDefaultAltitude] = useState(120);

  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [missionGenerated, setMissionGenerated] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const { user } = useAuth();
  const [allMissions, setAllMissions] = useState([]);
  const [activeMission, setActiveMission] = useState(null);

  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [altitudeUnit, setAltitudeUnit] = useState("m");

  // DEFAULT SETTINGS ON
  const [autoSettings, setAutoSettings] = useState(true);
  const [activeMapLayer, setActiveMapLayer] = useState(mapLayers[0]);

  const [displaySettings, setDisplaySettings] = useState({
    showBoundary: true,
    showMarkers: true,
    showGrid: true,
    showInternals: false,
    showFootprints: false,
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    title: "",
    description: "",
    data: null,
  });

  const defaultCamera =
    cameraData.find((c) => c.name.includes("Sony A6000")) || cameraData[0];

  const [missionOptions, setMissionOptions] = useState({
    groundSpeed: 5, // DEFAULT SPEED 5 m/s
    climbRate: 2.5,
    selectedCamera: defaultCamera,
    batteryFlightTime: 20,
    startingWaypoint: 1,
    waypointRadius: 2,
  });

  const [surveyOptions, setSurveyOptions] = useState({
    pattern: "Lawnmower",
    angle: 90, // DEFAULT ANGLE 90 DEG
    frontOverlap: 75,
    sideOverlap: 70,
    enhanced3D: false,
    leadIn: 20, // DEFAULT LEAD-IN
    overshoot: 25, // DEFAULT OVERSHOOT
    cameraTopFacingForward: false, // Default Unchecked
    useSpeed: true, // Default Checked
    addTakeoffLand: true, // Default Checked
    useRTL: true, // Default Checked
    splitSegments: 1, // Default 1
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const mapRef = useRef(null);

  const handleZoomIn = () => {
    if (mapRef.current)
      activeMapLayer.type === "leaflet"
        ? mapRef.current.zoomIn()
        : mapRef.current.getMap().zoomIn();
  };
  const handleZoomOut = () => {
    if (mapRef.current)
      activeMapLayer.type === "leaflet"
        ? mapRef.current.zoomOut()
        : mapRef.current.getMap().zoomOut();
  };
  const handleDrawPolygon = () =>
    document.querySelector(".leaflet-draw-draw-polygon")?.click();
  const handleEditLayers = () =>
    document.querySelector(".leaflet-draw-edit-edit")?.click();

  useEffect(() => {
    if (user) {
      getMissions().then((missions) => {
        setAllMissions(missions);
        if (missions.length > 0) loadMission(missions[0]);
        else handleNewMission(true);
      });
    }
  }, [user]);

  // Handle Automatic Settings Reset
  useEffect(() => {
    if (autoSettings) {
      setSurveyOptions((prev) => ({
        ...prev,
        frontOverlap: 75,
        sideOverlap: 70,
        angle: 90,
        enhanced3D: false,
        leadIn: 20,
        overshoot: 25,
      }));
      setMissionOptions((prev) => ({
        ...prev,
        groundSpeed: 5,
        waypointRadius: 2,
      }));
    }
  }, [autoSettings]);

  useEffect(
    () => localStorage.setItem("homePosition", JSON.stringify(homePosition)),
    [homePosition],
  );

  const loadMission = (mission) => {
    setActiveMission(mission);
    const plan = mission.plan || [];
    const boundary = mission.boundary || [];
    setMissionItems(plan);
    setBoundaryPoints(boundary);
    if (plan.length > 0) setMissionGenerated(true);
    else {
      setMissionGenerated(false);
      setClearTrigger((c) => c + 1);
    }
    if (mapRef.current && (boundary.length > 0 || plan.length > 0)) {
      const allCoords = [
        ...boundary.map((p) => [p.lat, p.lon]),
        ...plan.map((p) => [p.lat, p.lon]),
      ];
      if (allCoords.length > 0)
        mapRef.current.flyToBounds(L.latLngBounds(allCoords), {
          padding: [50, 50],
        });
    }
  };

  const handleNewMission = (isInitial = false) => {
    const name = `Mission ${allMissions.length + 1}`;
    if (isInitial)
      createNewMission({ name, plan: [] }).then((m) => {
        if (m) {
          setAllMissions([m, ...allMissions]);
          loadMission(m);
        }
      });
    else
      setModalState({
        isOpen: true,
        type: "new-mission",
        title: "New Mission",
        description: "Enter name",
        data: { defaultValue: name },
      });
  };

  const handleSaveMission = async () => {
    if (!activeMission) return toast.error("No mission");
    const m = {
      ...activeMission,
      plan: missionItems,
      boundary: boundaryPoints,
      id: activeMission._id,
    };
    const saved = await saveMission(m);
    if (saved) {
      setAllMissions(allMissions.map((x) => (x._id === saved._id ? saved : x)));
      setActiveMission(saved);
      toast.success("Saved");
    }
  };

  const handleDeleteMission = (id) => {
    const m = allMissions.find((x) => x._id === id);
    setModalState({
      isOpen: true,
      type: "delete-mission",
      title: `Delete ${m?.name}?`,
      description: "Confirm?",
      data: { missionId: id },
    });
  };

  const handleModalConfirm = async (val) => {
    if (modalState.type === "new-mission" && val) {
      const m = await createNewMission({ name: val, plan: [] });
      if (m) {
        setAllMissions([m, ...allMissions]);
        loadMission(m);
      }
    } else if (modalState.type === "delete-mission") {
      if (await deleteMission(modalState.data.missionId)) {
        const rem = allMissions.filter(
          (x) => x._id !== modalState.data.missionId,
        );
        setAllMissions(rem);
        if (activeMission?._id === modalState.data.missionId)
          loadMission(rem[0] || null);
      }
    }
    handleModalClose();
  };

  const handleModalClose = () =>
    setModalState({
      isOpen: false,
      type: null,
      title: "",
      description: "",
      data: null,
    });

  const handleExportMission = (fmt) => {
    if (missionItems.length === 0) return toast.error("Empty mission");
    const name = activeMission?.name || "mission";
    const data =
      fmt === "KML"
        ? toKMLFormat(missionItems, name)
        : toArduPilotFormat(missionItems, homePosition);
    const blob = new Blob([data], {
      type:
        fmt === "KML" ? "application/vnd.google-earth.kml+xml" : "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${name}.${fmt === "KML" ? "kml" : "waypoints"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported");
  };

  const missionCalcs = useMemo(() => {
    if (boundaryPoints.length < 3) return {};
    const { selectedCamera } = missionOptions;
    const { sensorWidth, imageWidth, imageHeight, focalLength } =
      selectedCamera;
    const gsd =
      ((defaultAltitude * sensorWidth) / (focalLength * imageWidth)) * 100;
    const gsdInches = (gsd / 2.54).toFixed(1);
    const imageFootprintWidth = (gsd / 100) * imageWidth;
    const imageFootprintHeight = (gsd / 100) * imageHeight;
    const { sideOverlap, frontOverlap } = surveyOptions;
    const lineSpacing = imageFootprintWidth * (1 - sideOverlap / 100);
    const triggerDistance = imageFootprintHeight * (1 - frontOverlap / 100);
    const coords = [
      ...boundaryPoints.map((p) => [p.lon, p.lat]),
      [boundaryPoints[0].lon, boundaryPoints[0].lat],
    ];
    const polygon = turf.polygon([coords]);
    const areaSqMeters = turf.area(polygon);
    const areaAcres = (areaSqMeters / 4046.86).toFixed(1);
    let distanceMeters = 0,
      flightTimeMinutes = 0,
      imageCount = 0;
    if (missionGenerated && missionItems.length > 1) {
      const flightPath = turf.lineString(
        missionItems
          .filter((item) => item.command === MAV_CMD.WAYPOINT)
          .map((item) => [item.lon, item.lat]),
      );
      distanceMeters = turf.length(flightPath, { units: "meters" });
      flightTimeMinutes = distanceMeters / missionOptions.groundSpeed / 60;
      if (triggerDistance > 0)
        imageCount = Math.floor(distanceMeters / triggerDistance);
    }
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const estimatedBatteries = Math.ceil(
      flightTimeMinutes / missionOptions.batteryFlightTime,
    );
    return {
      gsd,
      gsdInches,
      areaAcres,
      imageCount,
      lineSpacing,
      triggerDistance,
      distanceKm,
      flightTime: flightTimeMinutes.toFixed(1),
      estimatedBatteries,
      imageFootprintWidth,
      imageFootprintHeight,
    };
  }, [
    boundaryPoints,
    missionItems,
    missionGenerated,
    defaultAltitude,
    missionOptions,
    surveyOptions,
  ]);

  const handlePolygonAction = (vertices) => {
    const newBoundary = vertices.map((v) => ({ lat: v.lat, lon: v.lng }));
    setBoundaryPoints(newBoundary);

    // --- AUTO-GENERATE MISSION WHEN POLYGON IS DRAWN ---
    if (autoSettings && newBoundary.length >= 3) {
      setMissionGenerated(true); // This triggers the useEffect below
    } else {
      setMissionGenerated(false);
      setMissionItems([]);
    }
  };

  const handlePolygonCreated = (e) =>
    handlePolygonAction(e.layer.getLatLngs()[0]);
  const handlePolygonEdited = (e) => {
    const layer = Object.values(e.layers._layers)[0];
    if (layer) handlePolygonAction(layer.getLatLngs()[0]);
  };

  const handleGenerateMission = () => {
    if (boundaryPoints.length < 3) return toast.error("Draw area first");
    setShowGenerationModal(true);
  };

  const handleConfirmGeneration = (settings) => {
    setMissionGenerated(true);
    regenerateMission(settings);
    toast.success("Mission generated successfully!");
  };

  const regenerateMission = useCallback(
    (customSettings = null) => {
      if (
        boundaryPoints.length < 3 ||
        !missionCalcs.lineSpacing ||
        missionCalcs.lineSpacing <= 0
      )
        return;

      const takeoffAlt = customSettings ? customSettings.takeoffAlt : 20;
      const surveyAlt = customSettings
        ? customSettings.surveyAlt
        : defaultAltitude;
      const rtlAlt = customSettings ? customSettings.rtlAlt : 30;

      const polygonCoords = boundaryPoints.map((p) => [p.lon, p.lat]);

      let waypoints = generateSurveyGrid(
        polygonCoords,
        missionCalcs.lineSpacing,
        surveyOptions.angle,
        missionCalcs.triggerDistance,
        surveyOptions.enhanced3D,
        surveyOptions.leadIn,
        surveyOptions.overshoot,
      );

      if (missionOptions.startingWaypoint > 1 && waypoints.length > 1) {
        const sliceIndex = missionOptions.startingWaypoint - 1;
        if (sliceIndex < waypoints.length)
          waypoints = [
            ...waypoints.slice(sliceIndex),
            ...waypoints.slice(0, sliceIndex),
          ];
      }

      const newMissionItems = [];
      let currentId = 1;
      const takeoffLat = homePosition ? homePosition[0] : 0;
      const takeoffLon = homePosition ? homePosition[1] : 0;

      // 1. HARDCODED STANDARD: ALWAYS TAKEOFF
      if (surveyOptions.addTakeoffLand) {
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.TAKEOFF,
          lat: takeoffLat,
          lon: takeoffLon,
          alt: takeoffAlt,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });
      }

      // 2. HARDCODED STANDARD: ALWAYS SET SPEED
      if (surveyOptions.useSpeed) {
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.DO_CHANGE_SPEED,
          lat: 0,
          lon: 0,
          alt: 0,
          param1: 1, // 1 = Ground Speed
          param2: missionOptions.groundSpeed,
          param3: -1,
          param4: 0,
        });
      }

      let lastLat = takeoffLat,
        lastLon = takeoffLon;

      if (waypoints.length > 0) {
        const firstWp = waypoints[0];
        // 3. NAVIGATE TO START
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.WAYPOINT,
          lat: firstWp.lat,
          lon: firstWp.lon,
          alt: surveyAlt,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });

        // 4. START CAMERA
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
          lat: 0,
          lon: 0,
          alt: 0,
          param1: missionCalcs.triggerDistance || 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });

        // 5. GRID WAYPOINTS
        for (let i = 1; i < waypoints.length; i++) {
          newMissionItems.push({
            id: currentId++,
            command: MAV_CMD.WAYPOINT,
            lat: waypoints[i].lat,
            lon: waypoints[i].lon,
            alt: surveyAlt,
            param1: 0,
            param2: 0,
            param3: 0,
            param4: 0,
          });
        }
        lastLat = waypoints[waypoints.length - 1].lat;
        lastLon = waypoints[waypoints.length - 1].lon;

        // 6. STOP CAMERA
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
          lat: 0,
          lon: 0,
          alt: 0,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });
      }

      // 7. HARDCODED STANDARD: ALWAYS RETURN TO LAUNCH
      if (surveyOptions.useRTL) {
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.WAYPOINT,
          lat: lastLat,
          lon: lastLon,
          alt: rtlAlt,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });
        newMissionItems.push({
          id: currentId++,
          command: MAV_CMD.RETURN_TO_LAUNCH,
          lat: homePosition ? homePosition[0] : 0,
          lon: homePosition ? homePosition[1] : 0,
          alt: 0,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });
      }

      setMissionItems(newMissionItems);
      if (customSettings) setDefaultAltitude(surveyAlt);
    },
    [
      boundaryPoints,
      missionCalcs,
      surveyOptions,
      defaultAltitude,
      missionOptions,
      homePosition,
    ],
  );

  // AUTOMATIC RE-GENERATION TRIGGER
  useEffect(() => {
    if (missionGenerated && !showGenerationModal) {
      const handler = setTimeout(() => regenerateMission(null), 500);
      return () => clearTimeout(handler);
    }
  }, [
    missionGenerated,
    regenerateMission,
    showGenerationModal,
    missionOptions,
    surveyOptions,
  ]);

  const handleClearArea = () => {
    setMissionItems([]);
    setBoundaryPoints([]);
    setMissionGenerated(false);
    setClearTrigger((c) => c + 1);
  };
  const handleSetHomeToView = () => {
    if (mapRef.current) {
      const c = mapRef.current.getCenter();
      setHomePosition([c.lat, c.lng]);
    }
  };
  const handleHomePositionChange = (p) => setHomePosition([p.lat, p.lng]);
  const centerMap = () => setCenterTrigger((c) => c + 1);
  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    if (isSidebarCollapsed) setSidebarWidth(350);
  };
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setIsSidebarCollapsed(false);
  };
  const handleResizeMouseMove = useCallback(
    (e) => {
      if (isResizing && e.clientX > 320 && e.clientX < 600)
        setSidebarWidth(e.clientX);
    },
    [isResizing],
  );
  const handleResizeMouseUp = () => setIsResizing(false);
  useEffect(() => {
    window.addEventListener("mousemove", handleResizeMouseMove);
    window.addEventListener("mouseup", handleResizeMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [handleResizeMouseMove]);

  const handleFileImport = async (file) => {
    try {
      const fileName = file.name.toLowerCase();
      let kmlText;
      if (fileName.endsWith(".kmz")) {
        const zip = await JSZip.loadAsync(file);
        const kmlFile = Object.values(zip.files).find((f) =>
          f.name.toLowerCase().endsWith(".kml"),
        );
        if (!kmlFile)
          throw new Error("No .kml file found inside the .kmz archive.");
        kmlText = await kmlFile.async("string");
      } else if (fileName.endsWith(".kml")) {
        kmlText = await file.text();
      } else {
        throw new Error("Unsupported file type.");
      }
      const geoJson = kml(new DOMParser().parseFromString(kmlText, "text/xml"));
      const polygonFeature = geoJson.features.find(
        (f) => f.geometry.type === "Polygon",
      );
      if (!polygonFeature) throw new Error("No polygon found.");
      const vertices = polygonFeature.geometry.coordinates[0].map((coord) => ({
        lat: coord[1],
        lng: coord[0],
      }));
      handlePolygonAction(vertices);
    } catch (error) {
      console.error("Error importing:", error);
      toast.error(`Failed: ${error.message}`);
    }
  };

  return (
    <AppLayout>
      <ActionModal
        {...modalState}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
      <GenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        onConfirm={handleConfirmGeneration}
        defaultAltitude={defaultAltitude}
      />

      <div className="h-full w-full flex overflow-hidden">
        <div
          className="flex-shrink-0 h-full relative"
          style={{ width: isSidebarCollapsed ? "80px" : `${sidebarWidth}px` }}
        >
          <FlightPlannerSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            onResizeMouseDown={handleResizeMouseDown}
            onFileImport={handleFileImport}
            missionItems={missionItems}
            setMissionItems={setMissionItems}
            defaultAltitude={defaultAltitude}
            setDefaultAltitude={setDefaultAltitude}
            homePosition={homePosition}
            onSetHomeToView={handleSetHomeToView}
            onClearArea={handleClearArea}
            missionOptions={missionOptions}
            setMissionOptions={setMissionOptions}
            surveyOptions={surveyOptions}
            setSurveyOptions={setSurveyOptions}
            onGenerateMission={handleGenerateMission}
            missionGenerated={missionGenerated}
            missionCalcs={missionCalcs}
            boundaryPoints={boundaryPoints}
            allMissions={allMissions}
            activeMission={activeMission}
            onLoadMission={loadMission}
            onNewMission={handleNewMission}
            onSaveMission={handleSaveMission}
            onDeleteMission={handleDeleteMission}
            onExportMission={handleExportMission}
            altitudeUnit={altitudeUnit}
            setAltitudeUnit={setAltitudeUnit}
            autoSettings={autoSettings}
            setAutoSettings={setAutoSettings}
            displaySettings={displaySettings}
            setDisplaySettings={setDisplaySettings}
          />
        </div>
        <div className="flex-grow h-full w-full relative">
          {activeMapLayer.type === "maplibre" ? (
            <MapLibrePlanner
              homePosition={homePosition}
              missionItems={missionItems}
              boundaryPoints={boundaryPoints}
              onHomePositionChange={handleHomePositionChange}
              missionGenerated={missionGenerated}
              activeMapLayer={activeMapLayer}
              mapRef={mapRef}
              centerTrigger={centerTrigger}
              displaySettings={displaySettings}
            />
          ) : (
            <MapPlanner
              homePosition={homePosition}
              missionItems={missionItems}
              boundaryPoints={boundaryPoints}
              onPolygonCreated={handlePolygonCreated}
              onPolygonEdited={handlePolygonEdited}
              onHomePositionChange={handleHomePositionChange}
              missionGenerated={missionGenerated}
              mapRef={mapRef}
              centerTrigger={centerTrigger}
              clearTrigger={clearTrigger}
              activeMapLayer={activeMapLayer}
              displaySettings={displaySettings}
              missionCalcs={missionCalcs}
              surveyOptions={surveyOptions}
              missionOptions={missionOptions}
            />
          )}
          <MissionTools
            onClear={handleClearArea}
            onCenter={centerMap}
            activeLayer={activeMapLayer}
            allLayers={mapLayers}
            onLayerChange={setActiveMapLayer}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDraw={
              activeMapLayer.type === "leaflet" ? handleDrawPolygon : null
            }
            onEdit={activeMapLayer.type === "leaflet" ? handleEditLayers : null}
          />
        </div>
      </div>
    </AppLayout>
  );
};

function MissionPlannerPage() {
  return (
    <TelemetryProvider>
      <MainContent />
    </TelemetryProvider>
  );
}

export default MissionPlannerPage;
