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
import MissionTools from "../components/map/MissionTools";
import FlightPlannerSidebar from "../components/mission/FlightPlannerSidebar";
import GenerationModal from "../components/mission/GenerationModal";
import {
  generateSurveyGrid,
  calculateSurveyStats,
} from "../utils/missionGeneration";
import * as turf from "@turf/turf";
import { kml } from "@tmcw/togeojson";
import JSZip from "jszip";
import { cameraData } from "../data/cameraData";
import { toast } from "react-toastify";
import {
  getMissions,
  saveMission,
  createNewMission,
  deleteMission,
} from "../api/missionApi";
import { armDrone, setAutoMode } from "../api/droneApi"; // Added for flight control
import { toArduPilotFormat, toKMLFormat } from "../utils/exportUtils";
import { useAuth } from "../context/AuthContext";
import ActionModal from "../components/common/ActionModal";
import { mapLayers } from "../data/mapLayers";
import { FaPlay, FaLock, FaUndo, FaListUl } from "react-icons/fa"; // Added for UI buttons

const MAV_CMD = {
  WAYPOINT: 16,
  RETURN_TO_LAUNCH: 20,
  TAKEOFF: 22,
  DO_CHANGE_SPEED: 178,
  DO_SET_CAM_TRIGG_DIST: 206,
};

const MainContent = () => {
  // --- NEW WORKFLOW STATES ---
  const [workflowStep, setWorkflowStep] = useState("PLAN"); // PLAN, CHECKLIST, UPLOADED, FLYING
  const [isLocked, setIsLocked] = useState(false);
  const [logs, setLogs] = useState([]);

  // --- ORIGINAL STATES ---
  const [homePosition, setHomePosition] = useState(() => {
    const savedHome = localStorage.getItem("homePosition");
    return savedHome ? JSON.parse(savedHome) : [18.986392, 72.818327];
  });
  const [missionItems, setMissionItems] = useState([]);
  const [defaultAltitude, setDefaultAltitude] = useState(120);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [missionGenerated, setMissionGenerated] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const { user } = useAuth();
  const [allMissions, setAllMissions] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [altitudeUnit, setAltitudeUnit] = useState("m");
  const [autoSettings, setAutoSettings] = useState(true);
  const [activeMapLayer, setActiveMapLayer] = useState(mapLayers[0]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const mapRef = useRef(null);

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
    groundSpeed: 5,
    climbRate: 2.5,
    selectedCamera: defaultCamera,
    batteryFlightTime: 20,
    startingWaypoint: 1,
    waypointRadius: 2,
  });

  const [surveyOptions, setSurveyOptions] = useState({
    pattern: "Lawnmower",
    angle: 90,
    frontOverlap: 75,
    sideOverlap: 70,
    enhanced3D: false,
    leadIn: 20,
    overshoot: 25,
    useSpeed: true,
    addTakeoffLand: true,
    useRTL: true,
    splitSegments: 1,
  });

  // --- LOGGING HELPER ---
  const addLog = (msg) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50),
    );
  };

  // --- WORKFLOW HANDLERS ---
  const startPreflight = () => {
    if (!missionGenerated) {
      toast.error("Please generate a mission first!");
      return;
    }
    setWorkflowStep("CHECKLIST");
    setIsLocked(true);
    addLog("Pre-flight checklist initiated. UI Locked.");
  };

  const handleUploadSuccess = () => {
    setWorkflowStep("UPLOADED");
    addLog("Mission Uploaded Successfully. Drone ready for departure.");
    toast.success("Ready to Fly!");
  };

  const handleStartFlight = async () => {
    addLog("Initiating Takeoff sequence...");
    const armed = await armDrone();
    if (armed) {
      addLog("Drone ARMED.");
      const auto = await setAutoMode();
      if (auto) {
        setWorkflowStep("FLYING");
        addLog("Mission Started: AUTO Mode active.");
      }
    }
  };

  useEffect(() => {
    if (user) {
      getMissions().then((missions) => {
        setAllMissions(missions);
        if (missions.length > 0) loadMission(missions[0]);
        else handleNewMission(true);
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("homePosition", JSON.stringify(homePosition));
  }, [homePosition]);

  const regenerateMission = useCallback(
    (customSettings = null) => {
      if (boundaryPoints.length < 3) return;

      const takeoffAlt = customSettings ? customSettings.takeoffAlt : 30;
      const surveyAlt = customSettings
        ? customSettings.surveyAlt
        : defaultAltitude;

      const stats = calculateSurveyStats(
        surveyAlt,
        missionOptions.selectedCamera,
        surveyOptions.sideOverlap,
        surveyOptions.frontOverlap,
      );
      const polygonCoords = boundaryPoints.map((p) => [p.lon, p.lat]);

      let waypoints = generateSurveyGrid(
        polygonCoords,
        stats.lineSpacing,
        surveyOptions.angle,
        surveyOptions.leadIn,
        surveyOptions.overshoot,
      );

      if (waypoints.length === 0) return;

      if (missionOptions.startingWaypoint > 1 && waypoints.length > 1) {
        const sliceIndex = missionOptions.startingWaypoint - 1;
        if (sliceIndex < waypoints.length) {
          waypoints = [
            ...waypoints.slice(sliceIndex),
            ...waypoints.slice(0, sliceIndex),
          ];
        }
      }

      const newMissionItems = [];
      let id = 1;

      newMissionItems.push({
        id: id++,
        command: MAV_CMD.TAKEOFF,
        lat: 0,
        lon: 0,
        alt: takeoffAlt,
        param1: 15,
        param2: 0,
        param3: 0,
        param4: 0,
      });
      newMissionItems.push({
        id: id++,
        command: MAV_CMD.DO_CHANGE_SPEED,
        lat: 0,
        lon: 0,
        alt: 0,
        param1: 1,
        param2: missionOptions.groundSpeed,
        param3: -1,
        param4: 0,
      });
      newMissionItems.push({
        id: id++,
        command: MAV_CMD.WAYPOINT,
        lat: waypoints[0].lat,
        lon: waypoints[0].lon,
        alt: surveyAlt,
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
      });
      newMissionItems.push({
        id: id++,
        command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
        lat: 0,
        lon: 0,
        alt: 0,
        param1: stats.triggerDistance,
        param2: 0,
        param3: 1,
        param4: 0,
      });

      for (let i = 1; i < waypoints.length; i++) {
        newMissionItems.push({
          id: id++,
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

      newMissionItems.push({
        id: id++,
        command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
        lat: 0,
        lon: 0,
        alt: 0,
        param1: 0,
        param2: 0,
        param3: 1,
        param4: 0,
      });
      newMissionItems.push({
        id: id++,
        command: MAV_CMD.RETURN_TO_LAUNCH,
        lat: 0,
        lon: 0,
        alt: 0,
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
      });

      setMissionItems(newMissionItems);
      setMissionGenerated(true);
      if (customSettings) setDefaultAltitude(surveyAlt);
    },
    [boundaryPoints, missionOptions, surveyOptions, defaultAltitude],
  );

  useEffect(() => {
    if (missionGenerated && !showGenerationModal && !isLocked) {
      const handler = setTimeout(() => regenerateMission(null), 300);
      return () => clearTimeout(handler);
    }
  }, [
    missionGenerated,
    showGenerationModal,
    defaultAltitude,
    surveyOptions,
    missionOptions.groundSpeed,
    missionOptions.selectedCamera,
    missionOptions.startingWaypoint,
    regenerateMission,
    isLocked,
  ]);

  const missionCalcs = useMemo(() => {
    if (boundaryPoints.length < 3) return {};

    const stats = calculateSurveyStats(
      defaultAltitude,
      missionOptions.selectedCamera,
      surveyOptions.sideOverlap,
      surveyOptions.frontOverlap,
    );
    const coords = [
      ...boundaryPoints.map((p) => [p.lon, p.lat]),
      [boundaryPoints[0].lon, boundaryPoints[0].lat],
    ];
    const polygon = turf.polygon([coords]);

    const areaSqMeters = turf.area(polygon);
    const areaAcres = (areaSqMeters / 4046.86).toFixed(1);

    let distanceMeters = 0;
    const activeWps = missionItems.filter(
      (item) => item.command === MAV_CMD.WAYPOINT,
    );
    let numStrips = 0;

    if (activeWps.length > 1) {
      const line = turf.lineString(activeWps.map((wp) => [wp.lon, wp.lat]));
      distanceMeters = turf.length(line, { units: "meters" });
      numStrips = Math.max(1, Math.ceil(activeWps.length / 2));
    }

    const totalSeconds =
      missionOptions.groundSpeed > 0
        ? distanceMeters / missionOptions.groundSpeed
        : 0;
    const flightMins = Math.floor(totalSeconds / 60);
    const flightSecs = Math.floor(totalSeconds % 60);
    const flightTime = (totalSeconds / 60).toFixed(1);
    const flightTimeString = `${flightMins}:${flightSecs.toString().padStart(2, "0")}`;

    const photoEvery =
      missionOptions.groundSpeed > 0
        ? stats.triggerDistance / missionOptions.groundSpeed
        : 0;
    const imageCount =
      stats.triggerDistance > 0 && distanceMeters > 0
        ? Math.floor(distanceMeters / stats.triggerDistance) + 1
        : 0;

    const minShutterSpeedDenom =
      stats.gsd > 0 && missionOptions.groundSpeed > 0
        ? Math.ceil((missionOptions.groundSpeed / (stats.gsd / 100)) * 2)
        : 0;
    const minShutterSpeed =
      minShutterSpeedDenom > 0 ? `1/${minShutterSpeedDenom}` : "0";

    return {
      ...stats,
      areaSqMeters,
      areaAcres,
      imageCount,
      numStrips,
      flightTime,
      flightTimeString,
      photoEvery,
      distanceKm: distanceMeters / 1000,
      estimatedBatteries: Math.max(
        1,
        Math.ceil(totalSeconds / 60 / missionOptions.batteryFlightTime),
      ),
      minShutterSpeed,
      turnDia: 5,
      groundElevation: "0",
    };
  }, [
    boundaryPoints,
    missionItems,
    missionOptions,
    surveyOptions,
    defaultAltitude,
  ]);

  const handleFileImport = async (file) => {
    try {
      const fileName = file.name.toLowerCase();
      let kmlText;
      if (fileName.endsWith(".kmz")) {
        const zip = await JSZip.loadAsync(file);
        const kmlFile = Object.values(zip.files).find((f) =>
          f.name.toLowerCase().endsWith(".kml"),
        );
        kmlText = await kmlFile.async("string");
      } else {
        kmlText = await file.text();
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
      const newBoundary = vertices.map((v) => ({ lat: v.lat, lon: v.lng }));

      setBoundaryPoints(newBoundary);
      setMissionItems([]);
      setMissionGenerated(false);
      toast.success("Area Imported! Adjust settings and click Generate.");
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const loadMission = (mission) => {
    setActiveMission(mission);
    setMissionItems(mission.plan || []);
    setBoundaryPoints(mission.boundary || []);
    setMissionGenerated(!!(mission.plan && mission.plan.length > 0));
  };

  const handleNewMission = (isInitial = false) => {
    const name = `Mission ${allMissions.length + 1}`;
    if (isInitial) {
      createNewMission({ name, plan: [] }).then((m) => {
        if (m) {
          setAllMissions([m]);
          loadMission(m);
        }
      });
    } else {
      setModalState({
        isOpen: true,
        type: "new-mission",
        title: "New Mission",
        description: "Enter a name for your mission",
        data: { defaultValue: name },
      });
    }
  };

  const handleSaveMission = async () => {
    if (!activeMission) return;
    const payload = {
      ...activeMission,
      plan: missionItems,
      boundary: boundaryPoints,
      id: activeMission._id,
    };
    const saved = await saveMission(payload);
    if (saved) {
      setAllMissions(allMissions.map((x) => (x._id === saved._id ? saved : x)));
      setActiveMission(saved);
    }
  };

  const handleDeleteMission = (id) => {
    const m = allMissions.find((x) => x._id === id);
    setModalState({
      isOpen: true,
      type: "delete-mission",
      title: `Delete ${m?.name}?`,
      description: "This action cannot be undone.",
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

  const handleGenerateMission = () => {
    if (boundaryPoints.length < 3)
      return toast.error("Please draw or import an area first.");
    setShowGenerationModal(true);
  };

  const handleConfirmGeneration = (settings) => {
    setShowGenerationModal(false);
    regenerateMission(settings);
    toast.success("Mission Generated!");
  };

  const handleClearArea = () => {
    setMissionItems([]);
    setBoundaryPoints([]);
    setMissionGenerated(false);
    setWorkflowStep("PLAN");
    setIsLocked(false);
    setClearTrigger((prev) => prev + 1);
  };

  const handlePolygonAction = (vertices) => {
    const newBoundary = vertices.map((v) => ({ lat: v.lat, lon: v.lng }));
    setBoundaryPoints(newBoundary);
    setMissionGenerated(false);
  };

  const handleExportMission = (fmt) => {
    if (missionItems.length === 0)
      return toast.error("Generate a mission first.");
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
    link.click();
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    if (isSidebarCollapsed) setSidebarWidth(500);
  };

  const handleResizeMouseMove = useCallback(
    (e) => {
      if (isResizing && e.clientX > 300 && e.clientX < 800)
        setSidebarWidth(e.clientX);
    },
    [isResizing],
  );

  useEffect(() => {
    const up = () => setIsResizing(false);
    window.addEventListener("mousemove", handleResizeMouseMove);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", up);
    };
  }, [handleResizeMouseMove]);

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

      <div className="h-full w-full flex overflow-hidden relative">
        {/* SIDEBAR */}
        <div
          className="flex-shrink-0 h-full relative"
          style={{ width: isSidebarCollapsed ? "80px" : `${sidebarWidth}px` }}
        >
          <FlightPlannerSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            onResizeMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            onFileImport={handleFileImport}
            missionItems={missionItems}
            setMissionItems={setMissionItems}
            defaultAltitude={defaultAltitude}
            setDefaultAltitude={setDefaultAltitude}
            homePosition={homePosition}
            onSetHomeToView={() => {
              if (mapRef.current) {
                const c = mapRef.current.getCenter();
                setHomePosition([c.lat, c.lng]);
              }
            }}
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
            // NEW WORKFLOW PROPS
            workflowStep={workflowStep}
            setWorkflowStep={setWorkflowStep}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            onUploadSuccess={handleUploadSuccess}
            addLog={addLog}
          />
        </div>

        {/* MAP & TOOLS */}
        <div
          className={`flex-grow h-full w-full relative ${isLocked ? "cursor-not-allowed" : ""}`}
        >
          {/* FLOATING ACTION BUTTONS (Right Corner) */}
          <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-4 items-center">
            <button className="p-4 bg-white text-gray-800 rounded-full shadow-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <FaLock />
            </button>
            <button className="p-4 bg-white text-gray-400 rounded-full shadow-xl border border-gray-200 cursor-not-allowed">
              <FaUndo />
            </button>
            {/* BLUE CHECKLIST BUTTON */}
            {workflowStep === "PLAN" && missionGenerated && (
              <div className="group relative flex items-center">
                <span className="absolute right-16 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Start preflight checklist
                </span>
                <button
                  onClick={startPreflight}
                  className="p-5 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110"
                >
                  <FaListUl className="text-2xl" />
                </button>
              </div>
            )}
          </div>

          {/* START FLIGHT BLINKING BUTTON */}
          {workflowStep === "UPLOADED" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000]">
              <button
                onClick={handleStartFlight}
                className="bg-green-600 text-white px-12 py-5 rounded-full font-bold text-2xl shadow-2xl animate-blink border-4 border-white flex items-center gap-3 uppercase tracking-widest"
              >
                <FaPlay /> Start Flight
              </button>
            </div>
          )}

          <MapPlanner
            homePosition={homePosition}
            missionItems={missionItems}
            boundaryPoints={boundaryPoints}
            onPolygonCreated={(e) =>
              handlePolygonAction(e.layer.getLatLngs()[0])
            }
            onPolygonEdited={(e) => {
              const layer = Object.values(e.layers._layers)[0];
              if (layer) handlePolygonAction(layer.getLatLngs()[0]);
            }}
            onHomePositionChange={(p) => setHomePosition([p.lat, p.lng])}
            missionGenerated={missionGenerated}
            mapRef={mapRef}
            centerTrigger={centerTrigger}
            clearTrigger={clearTrigger}
            activeMapLayer={activeMapLayer}
            displaySettings={displaySettings}
            missionCalcs={missionCalcs}
            surveyOptions={surveyOptions}
            missionOptions={missionOptions}
            isLocked={isLocked}
          />

          <MissionTools
            onClear={handleClearArea}
            onCenter={() => setCenterTrigger((prev) => prev + 1)}
            activeLayer={activeMapLayer}
            allLayers={mapLayers}
            onLayerChange={setActiveMapLayer}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onDraw={() =>
              document.querySelector(".leaflet-draw-draw-polygon")?.click()
            }
            onEdit={() =>
              document.querySelector(".leaflet-draw-edit-edit")?.click()
            }
          />

          {/* CONSOLE LOG OVERLAY (Bottom Left) */}
          <div className="absolute bottom-5 left-5 z-[1000] w-80 h-40 bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded border border-gray-700 overflow-y-auto pointer-events-none shadow-2xl">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 leading-tight">
                {log}
              </div>
            ))}
          </div>
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
