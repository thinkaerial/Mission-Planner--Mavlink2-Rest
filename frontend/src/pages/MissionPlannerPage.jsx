import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { TelemetryProvider, useTelemetry } from "../context/TelemetryContext";
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
import { armDrone, setAutoMode } from "../api/droneApi";
import { toArduPilotFormat, toKMLFormat } from "../utils/exportUtils";
import { useAuth } from "../context/AuthContext";
import ActionModal from "../components/common/ActionModal";
import { mapLayers } from "../data/mapLayers";
import {
  FaPlay,
  FaLock,
  FaUnlock,
  FaListUl,
  FaUndo,
  FaCamera,
  FaPlane,
} from "react-icons/fa";

const MAV_CMD = {
  WAYPOINT: 16,
  RETURN_TO_LAUNCH: 20,
  TAKEOFF: 22,
  DO_CHANGE_SPEED: 178,
  DO_SET_CAM_TRIGG_DIST: 206,
};

const MainContent = () => {
  const telemetry = useTelemetry();

  // --- WORKFLOW & UI STATES ---
  const [workflowStep, setWorkflowStep] = useState("PLAN");
  const [isLocked, setIsLocked] = useState(false); // Drawing is ENABLED when false
  const [showArmingPopup, setShowArmingPopup] = useState(false);
  const [imagesCaptured, setImagesCaptured] = useState(0);
  const [logs, setLogs] = useState([]);

  // --- MISSION STATES ---
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

  const handleSetHomeToMissionCenter = () => {
    if (boundaryPoints.length < 3) {
      toast.error("Please draw a mission area first!");
      return;
    }
    const coords = [
      ...boundaryPoints.map((p) => [p.lon, p.lat]),
      [boundaryPoints[0].lon, boundaryPoints[0].lat],
    ];
    const polygon = turf.polygon([coords]);
    const center = turf.centerOfMass(polygon);
    const [lon, lat] = center.geometry.coordinates;
    setHomePosition([lat, lon]);
    addLog("Home position set to mission center.");
  };

  const handleSetHomeToDroneGPS = () => {
    if (telemetry.position && telemetry.position[0] !== 0) {
      setHomePosition([telemetry.position[0], telemetry.position[1]]);
      addLog("Home position set to drone GPS location.");
    } else {
      toast.error("Drone GPS not available!");
    }
  };

  const addLog = (msg) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50),
    );
  };

  // --- WORKFLOW HANDLERS ---
  const startPreflight = () => {
    if (missionItems.length === 0) {
      toast.error("Generate a mission first!");
      return;
    }
    setWorkflowStep("CHECKLIST");
    setIsLocked(true);
    addLog("Pre-flight checklist initiated. UI Locked.");
  };
  const handleUploadSuccess = () => {
    setWorkflowStep("UPLOADED");
  };

  useEffect(() => {
    const handleArmReq = () => setShowArmingPopup(true);
    window.addEventListener("requestArmPopup", handleArmReq);
    return () => window.removeEventListener("requestArmPopup", handleArmReq);
  }, []);

  // const handleStartFlight = () => setShowArmingPopup(true);

  const toggleManualLock = () => {
    setIsLocked(!isLocked);
    addLog(isLocked ? "Map Unlocked for editing." : "Map Locked manually.");
  };

  const confirmArm = async () => {
    setShowArmingPopup(false);
    addLog("Arming Drone...");
    const armed = await armDrone();
    if (armed) {
      setWorkflowStep("ARMED");
      addLog("Drone Armed! Ready to Start Mission.");
    } else {
      addLog("Arming Failed. Check drone console.");
      toast.error("Failed to arm drone.");
    }
  };

  const handleStartFlight = async () => {
    addLog("Starting Mission (Auto Mode)...");
    const autoSet = await setAutoMode();
    if (autoSet) {
      setWorkflowStep("FLYING");
      setImagesCaptured(0);
      addLog("Mission Started.");
      toast.success("Mission Started!");
    } else {
      addLog("Failed to set Auto mode.");
      toast.error("Could not set Auto mode.");
    }
  };

  // Telemetry Conversions
  const altFt = (telemetry.altitude * 3.28084).toFixed(0);
  const speedMph = (telemetry.groundSpeed * 2.23694).toFixed(1);

  // --- CALCULATIONS ---
  const missionCalcs = useMemo(() => {
    if (boundaryPoints.length < 3)
      return {
        flightTime: 0,
        areaAcres: 0,
        imageCount: 0,
        estimatedBatteries: 0,
      };
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
    const areaAcres = areaSqMeters / 4046.86;
    let distanceMeters = 0;
    const activeWps = missionItems.filter(
      (item) => item.command === MAV_CMD.WAYPOINT,
    );
    if (activeWps.length > 1) {
      const line = turf.lineString(activeWps.map((wp) => [wp.lon, wp.lat]));
      distanceMeters = turf.length(line, { units: "meters" });
    }
    const totalSeconds =
      missionOptions.groundSpeed > 0
        ? distanceMeters / missionOptions.groundSpeed
        : 0;
    const flightTime = totalSeconds / 60;
    const imageCount =
      stats.triggerDistance > 0
        ? Math.floor(distanceMeters / stats.triggerDistance)
        : 0;
    return {
      ...stats,
      areaAcres: Number(areaAcres),
      flightTime: Number(flightTime),
      imageCount: Number(imageCount),
      estimatedBatteries: Math.max(
        1,
        Math.ceil(flightTime / missionOptions.batteryFlightTime),
      ),
      distanceKm: distanceMeters / 1000,
    };
  }, [
    boundaryPoints,
    missionItems,
    missionOptions,
    surveyOptions,
    defaultAltitude,
  ]);

  // --- PERSISTENCE ---
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

  // --- MISSION GENERATION ---
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
      const items = [];
      let id = 1;

      items.push({
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
      items.push({
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
      waypoints.forEach((wp, idx) => {
        items.push({
          id: id++,
          command: MAV_CMD.WAYPOINT,
          lat: wp.lat,
          lon: wp.lon,
          alt: surveyAlt,
          param1: 0,
          param2: 0,
          param3: 0,
          param4: 0,
        });
        if (idx === 0)
          items.push({
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
      });
      items.push({
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
      items.push({
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

      setMissionItems(items);
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
    isLocked,
    regenerateMission,
  ]);

  // --- HELPERS ---
  const handlePolygonAction = useCallback((vertices) => {
    const newBoundary = vertices.map((v) => ({
      lat: v.lat,
      lon: v.lng || v.lon,
    }));
    setBoundaryPoints(newBoundary);
    setMissionGenerated(false);
  }, []);
  const handleClearArea = () => {
    setMissionItems([]);
    setBoundaryPoints([]);
    setMissionGenerated(false);
    setWorkflowStep("PLAN");
    setIsLocked(false);
    setClearTrigger((prev) => prev + 1);
  };

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
        lon: coord[0],
      }));
      setBoundaryPoints(vertices);
      setMissionItems([]);
      setMissionGenerated(false);
      toast.success("Area Imported!");
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
        description: "Name:",
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
    setModalState({
      isOpen: true,
      type: "delete-mission",
      title: "Delete Mission?",
      description: "Final action.",
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
        onConfirm={(s) => {
          regenerateMission(s);
          setShowGenerationModal(false);
        }}
        defaultAltitude={defaultAltitude}
      />

      <ActionModal
        isOpen={showArmingPopup}
        onClose={() => setShowArmingPopup(false)}
        title="Safety Check: Arm Drone"
        description="Is the drone in a safe location? Props will spin immediately upon arming!"
      >
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={confirmArm}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded font-bold uppercase transition-colors"
          >
            Yes, Arm Drone
          </button>
          <button
            onClick={() => setShowArmingPopup(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded font-bold uppercase transition-colors"
          >
            Cancel
          </button>
        </div>
      </ActionModal>

      <div className="h-full w-full flex overflow-hidden relative">
        <div
          className="flex-shrink-0 h-full relative"
          style={{ width: isSidebarCollapsed ? "80px" : `${sidebarWidth}px` }}
        >
          <FlightPlannerSidebar
            {...{
              isCollapsed: isSidebarCollapsed,
              onToggleCollapse: () =>
                setIsSidebarCollapsed(!isSidebarCollapsed),
              onResizeMouseDown: (e) => {
                e.preventDefault();
                setIsResizing(true);
              },
              onFileImport: handleFileImport,
              missionItems,
              setMissionItems,
              defaultAltitude,
              setDefaultAltitude,
              homePosition,
              onSetHomeToView: () => {
                if (mapRef.current) {
                  const c = mapRef.current.getCenter();
                  setHomePosition([c.lat, c.lng]);
                }
              },
              onClearArea: handleClearArea,
              missionOptions,
              setMissionOptions,
              surveyOptions,
              setSurveyOptions,
              onGenerateMission: () =>
                boundaryPoints.length >= 3
                  ? setShowGenerationModal(true)
                  : toast.error("Draw an area."),
              missionGenerated,
              missionCalcs,
              boundaryPoints,
              allMissions,
              activeMission,
              onLoadMission: loadMission,
              onNewMission: handleNewMission,
              onSaveMission: handleSaveMission,
              onDeleteMission: handleDeleteMission,
              onExportMission: handleExportMission,
              altitudeUnit,
              setAltitudeUnit,
              autoSettings,
              setAutoSettings,
              displaySettings,
              setDisplaySettings,
              workflowStep,
              setWorkflowStep,
              isLocked,
              setIsLocked,
              onUploadSuccess: handleUploadSuccess,
              addLog,
              onSetHomeToMissionCenter: handleSetHomeToMissionCenter,
              onSetHomeToDroneGPS: handleSetHomeToDroneGPS,
            }}
          />
        </div>

        {/* Change: Removed pointer-events-none from wrapper so tools remain clickable */}
        <div
          className={`flex-grow h-full w-full relative ${isLocked ? "grayscale-[0.3] brightness-[0.8]" : ""}`}
        >
          {/* FLOATING ACTION BUTTONS (Right Side) */}
          {/* FLOATING ACTION BUTTONS (Right Side) */}
          <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-4 items-end">
            {/* Lock + Undo Buttons */}
            <div className="flex gap-4">
              <button
                onClick={toggleManualLock}
                className={`p-3 rounded-full shadow-lg border transition-colors pointer-events-auto z-[1001] ${
                  isLocked
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-100"
                }`}
                title={isLocked ? "Unlock Map" : "Lock Map"}
              >
                {isLocked ? <FaLock size={16} /> : <FaUnlock size={16} />}
              </button>

              <button className="p-3 bg-white text-gray-500 rounded-full shadow-lg border border-gray-200 hover:bg-gray-100 transition">
                <FaUndo size={16} />
              </button>
            </div>

            {/* Small / Normal Takeoff / Checks Button */}
            {workflowStep === "PLAN" && missionGenerated && (
              <button
                onClick={startPreflight}
                className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 text-sm mt-2"
              >
                <FaListUl size={14} />
                Takeoff / Checks
              </button>
            )}

            {/* START MISSION Button (unchanged big green blinking one) */}
            {workflowStep === "ARMED" && (
              <button
                onClick={handleStartFlight}
                className="px-8 py-4 bg-green-500 text-white rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-blink-ready font-bold text-lg flex items-center gap-3 transform hover:scale-105 transition-all mt-2"
              >
                <FaPlay size={18} />
                START MISSION
              </button>
            )}
          </div>

          {workflowStep === "FLYING" && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] bg-black/80 p-4 rounded-xl border border-gray-700 flex gap-8 text-white shadow-2xl backdrop-blur-md">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Altitude
                </p>
                <p className="text-xl font-bold">{altFt} ft</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Speed
                </p>
                <p className="text-xl font-bold">{speedMph} mph</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Images
                </p>
                <p className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <FaCamera className="text-sm" />
                  {imagesCaptured}
                </p>
              </div>
            </div>
          )}

          <div
            className={`flex-grow h-full w-full relative ${isLocked ? "pointer-events-none grayscale-[0.3] brightness-[0.8]" : ""}`}
          >
            {useMemo(
              () => (
                <MapPlanner
                  homePosition={homePosition}
                  missionItems={missionItems}
                  boundaryPoints={boundaryPoints}
                  onPolygonCreated={(e) =>
                    handlePolygonAction(e.layer.getLatLngs()[0])
                  }
                  onPolygonEdited={(e) => {
                    // STEP 2: Logic for the "Save" button click
                    const layers = e.layers;
                    layers.eachLayer((layer) => {
                      const latLngs = layer.getLatLngs()[0];
                      handlePolygonAction(latLngs);
                    });
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
                  isLocked={workflowStep !== "PLAN"}
                />
              ),
              [
                homePosition,
                missionItems,
                boundaryPoints,
                missionGenerated,
                centerTrigger,
                clearTrigger,
                activeMapLayer,
                displaySettings,
                missionCalcs,
                surveyOptions,
                missionOptions,
                workflowStep,
                handlePolygonAction,
              ],
            )}
          </div>

          <MissionTools
            onClear={handleClearArea}
            onCenter={() => setCenterTrigger((prev) => prev + 1)}
            activeLayer={activeMapLayer}
            allLayers={mapLayers}
            onLayerChange={setActiveMapLayer}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            // This allows clicking the Draw button only if we are in PLAN mode
            onDraw={() =>
              workflowStep === "PLAN" &&
              document.querySelector(".leaflet-draw-draw-polygon")?.click()
            }
            onEdit={() =>
              workflowStep === "PLAN" &&
              document.querySelector(".leaflet-draw-edit-edit")?.click()
            }
          />

          <div className="absolute bottom-5 left-5 z-[1000] w-80 h-32 bg-black/80 text-[#add633] font-mono text-[10px] p-2 rounded border border-gray-700 overflow-y-auto pointer-events-none shadow-2xl">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">
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
      {" "}
      <MainContent />{" "}
    </TelemetryProvider>
  );
}

export default MissionPlannerPage;
