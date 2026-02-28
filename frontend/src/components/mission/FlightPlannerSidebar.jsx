// src/components/mission/FlightPlannerSidebar.jsx
import React, { useState, useRef } from "react";
import MissionCommandsPanel from "./MissionCommandsPanel";
import SurveyPatternPanel from "./SurveyPatternPanel";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import MissionSettingsPanel from "./MissionSettingsPanel";
import MissionManager from "./MissionManager";
import ExportPanel from "./ExportPanel";
import PreflightChecklist from "./PreflightChecklist"; // Added for workflow

import {
  FaMap,
  FaTrash,
  FaWrench,
  FaListAlt,
  FaCloudUploadAlt,
  FaInfoCircle,
  FaChevronRight,
  FaQuestionCircle,
  FaHome,
  FaCog,
  FaChevronDown,
  FaArrowLeft, // Added for back button
} from "react-icons/fa";

const MissionSummary = ({ stats }) => (
  <div className="p-3 border-b border-gray-700 bg-gray-900/40">
    <div className="grid grid-cols-4 gap-2 text-center">
      <div>
        <p className="text-lg font-bold text-white">
          {Number(stats.flightTime || 0).toFixed(1)}
        </p>
        <p className="text-[10px] uppercase text-gray-500">Mins</p>
      </div>
      <div>
        <p className="text-lg font-bold text-white">
          {Number(stats.areaAcres || 0).toFixed(1)}
        </p>
        <p className="text-[10px] uppercase text-gray-500">Acres</p>
      </div>
      <div>
        <p className="text-lg font-bold text-white">
          {Math.round(stats.imageCount || 0)}
        </p>
        <p className="text-[10px] uppercase text-gray-500">Images</p>
      </div>
      <div>
        <p className="text-lg font-bold text-white">
          {Math.round(stats.estimatedBatteries || 0)}
        </p>
        <p className="text-[10px] uppercase text-gray-500">Batts</p>
      </div>
    </div>
  </div>
);

const TabButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
      isActive
        ? "text-white border-blue-500"
        : "text-gray-400 border-transparent hover:bg-gray-700/50"
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

const Section = ({ title, icon, children, noPadding = false }) => (
  <div className={`border-b border-gray-700 ${noPadding ? "" : "p-3"}`}>
    {title && (
      <div className="flex items-center gap-3 mb-3 px-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="font-semibold text-gray-300 flex-grow">{title}</h3>
      </div>
    )}
    <div>{children}</div>
  </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={onChange}
    />
    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
);

const FlightPlannerSidebar = ({
  isCollapsed,
  onToggleCollapse,
  onFileImport,
  missionItems,
  setMissionItems,
  defaultAltitude,
  setDefaultAltitude,
  homePosition,
  onSetHomeToView,
  onClearArea,
  missionOptions,
  setMissionOptions,
  surveyOptions,
  setSurveyOptions,
  onGenerateMission,
  missionGenerated,
  missionCalcs,
  boundaryPoints,
  onResizeMouseDown,
  allMissions,
  activeMission,
  onLoadMission,
  onNewMission,
  onSaveMission,
  onDeleteMission,
  onExportMission,
  altitudeUnit,
  setAltitudeUnit,
  autoSettings,
  setAutoSettings,
  displaySettings,
  setDisplaySettings,
  // NEW PROPS FOR WORKFLOW
  workflowStep,
  setWorkflowStep,
  isLocked,
  setIsLocked,
  onUploadSuccess,
  addLog,
  onSetHomeToMissionCenter,
  onSetHomeToDroneGPS,
}) => {
  const [activeTab, setActiveTab] = useState("survey");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleImportClick = () => fileInputRef.current.click();

  if (isCollapsed) {
    return (
      <div className="h-full w-full bg-[#1e293b] text-white flex flex-col items-center justify-between py-4 overflow-hidden">
        <div className="flex flex-col items-center gap-8 text-gray-400">
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="p-3 text-white"
          >
            <FaMap className="text-2xl" />
          </button>
          <FaWrench
            onClick={() => {
              setActiveTab("survey");
              onToggleCollapse();
            }}
            title="Plan"
            className="text-2xl hover:text-white cursor-pointer"
          />
          <FaListAlt
            onClick={() => {
              setActiveTab("commands");
              onToggleCollapse();
            }}
            title="Actions"
            className="text-2xl hover:text-white cursor-pointer"
          />
          <FaTrash
            onClick={onClearArea}
            title="Clear Area"
            className="text-2xl hover:text-white cursor-pointer"
          />
        </div>
        <div className="flex flex-col items-center gap-8 text-gray-400">
          <FaQuestionCircle
            title="Help"
            className="text-2xl hover:text-white cursor-pointer"
          />
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="p-2 rounded-md hover:bg-gray-700 hover:text-white"
          >
            <FaChevronRight className="text-xl" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1e293b] text-white flex flex-col text-sm shadow-2xl">
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize z-50 hover:bg-blue-600 transition-colors"
      />

      {/* --- NEW WORKFLOW HEADER --- */}
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {workflowStep !== "PLAN" && !isLocked && (
            <button
              onClick={() => {
                setWorkflowStep("PLAN");
                setIsLocked(false);
              }}
              className="text-blue-400 hover:text-blue-200"
            >
              <FaArrowLeft />
            </button>
          )}
          <h2 className="font-bold text-xs uppercase tracking-widest text-blue-400">
            {workflowStep === "PLAN"
              ? "1. Create Mission"
              : "2. Pre-flight Checks"}
          </h2>
        </div>
        {isLocked && (
          <span className="bg-red-600/20 text-red-500 text-[10px] px-2 py-0.5 rounded border border-red-500 font-bold uppercase">
            Locked
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileImport(e.target.files[0])}
        accept=".kml,.kmz"
        className="hidden"
      />

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {/* --- CONDITION 1: PLANNING UI --- */}
        {workflowStep === "PLAN" ? (
          <div
            className={
              isLocked ? "opacity-50 pointer-events-none select-none" : ""
            }
          >
            <MissionManager
              {...{
                allMissions,
                activeMission,
                onLoadMission,
                onNewMission,
                onSaveMission,
                onDeleteMission,
              }}
            />

            <div className="flex-shrink-0">
              <div className="flex items-center border-b border-gray-700 bg-gray-900/20">
                <TabButton
                  icon={<FaWrench />}
                  label="Plan"
                  isActive={activeTab === "survey"}
                  onClick={() => setActiveTab("survey")}
                />
                <TabButton
                  icon={<FaListAlt />}
                  label="Actions"
                  isActive={activeTab === "commands"}
                  onClick={() => setActiveTab("commands")}
                />
              </div>
            </div>

            {activeTab === "survey" && (
              <div>
                {missionGenerated && <MissionSummary stats={missionCalcs} />}

                <Section noPadding>
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <FaCloudUploadAlt className="text-gray-400 text-lg" />
                      <span className="text-gray-300">Import Flight Path</span>
                      <FaInfoCircle
                        className="text-gray-500"
                        title="Import a .kml or .kmz file"
                      />
                    </div>
                    <button
                      onClick={handleImportClick}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-700 cursor-pointer"
                    >
                      Import
                    </button>
                  </div>
                </Section>

                <Section title="Home Location" icon={<FaHome />}>
                  <div className="space-y-1 text-[11px] font-mono text-gray-400 px-1">
                    <p>Lat: {homePosition[0].toFixed(7)}</p>
                    <p>Lng: {homePosition[1].toFixed(7)}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={onSetHomeToMissionCenter}
                      className="w-full text-[10px] uppercase font-bold text-gray-400 bg-gray-800 py-2 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      Set Home to Mission Center
                    </button>
                    <button
                      onClick={onSetHomeToDroneGPS}
                      className="w-full text-[10px] uppercase font-bold text-gray-400 bg-gray-800 py-2 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      Set Home to Drone GPS
                    </button>
                  </div>
                </Section>

                <SurveyPatternPanel
                  {...{
                    onGenerateMission,
                    missionGenerated,
                    defaultAltitude,
                    setDefaultAltitude,
                    gsdInches: missionCalcs.gsdInches,
                    boundaryPoints,
                    altitudeUnit,
                    setAltitudeUnit,
                    surveyOptions,
                    setSurveyOptions,
                    missionOptions,
                    setMissionOptions,
                  }}
                />

                <div className="border-b border-gray-700">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full flex items-center justify-between p-3 text-sm hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <FaCog className="text-gray-400" />
                      <span className="font-semibold text-gray-300">
                        Advanced Settings
                      </span>
                    </div>
                    <FaChevronDown
                      className={`text-gray-400 transition-transform ${
                        isAdvancedOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isAdvancedOpen && (
                    <div className="bg-gray-900/40">
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-100">
                            Automatic Settings
                          </h3>
                          <ToggleSwitch
                            checked={autoSettings}
                            onChange={(e) => setAutoSettings(e.target.checked)}
                          />
                        </div>
                        {autoSettings && (
                          <p className="text-xs text-gray-400">
                            Settings are optimized automatically based on
                            altitude and camera.
                          </p>
                        )}
                      </div>

                      {!autoSettings && (
                        <AdvancedSettingsPanel
                          {...{
                            missionOptions,
                            setMissionOptions,
                            surveyOptions,
                            setSurveyOptions,
                            missionItems,
                            displaySettings,
                            setDisplaySettings,
                          }}
                        />
                      )}

                      <MissionSettingsPanel
                        missionOptions={missionOptions}
                        setMissionOptions={setMissionOptions}
                        missionCalcs={missionCalcs}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "commands" && (
              <div>
                <ExportPanel
                  onExport={onExportMission}
                  disabled={missionItems.length === 0}
                  missionItems={missionItems}
                  homePosition={homePosition}
                  setMissionItems={setMissionItems}
                />
                <MissionCommandsPanel
                  {...{
                    missionItems,
                    setMissionItems,
                    defaultAltitude,
                    setDefaultAltitude,
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          /* --- CONDITION 2: CHECKLIST UI --- */
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <PreflightChecklist
              workflowStep={workflowStep}
              onUploadSuccess={onUploadSuccess}
              missionItems={missionItems}
              homePosition={homePosition}
              addLog={addLog}
            />

            {/* Show summary at the bottom of checklist */}
            <div className="mt-8 border-t border-gray-700 pt-4">
              <p className="text-[10px] uppercase font-bold text-gray-500 px-4 mb-2">
                Flight Plan Details
              </p>
              <MissionSummary stats={missionCalcs} />
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between items-center text-gray-500">
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <FaQuestionCircle />
          <span className="text-[10px] font-bold uppercase">Help</span>
        </div>
        {!isLocked && (
          <button
            onClick={onClearArea}
            className="text-[10px] font-bold uppercase text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <FaTrash /> Clear Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default FlightPlannerSidebar;
