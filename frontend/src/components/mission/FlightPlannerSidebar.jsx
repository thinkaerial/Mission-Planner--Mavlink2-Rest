import React, { useState, useRef } from "react";
import MissionCommandsPanel from "./MissionCommandsPanel";
import SurveyPatternPanel from "./SurveyPatternPanel";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import MissionSettingsPanel from "./MissionSettingsPanel";
import MissionManager from "./MissionManager";
import ExportPanel from "./ExportPanel";
// import DisplayOptionsPanel from "./DisplayOptionsPanel";

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
} from "react-icons/fa";

const MissionSummary = ({ stats }) => (
  <div className="p-3 border-b border-gray-700">
    <div className="grid grid-cols-4 gap-2 text-center">
      <div>
        <p className="text-xl font-bold text-white">
          {stats.flightTime || "0.0"}
        </p>
        <p className="text-xs text-gray-400">Minutes</p>
      </div>
      <div>
        <p className="text-xl font-bold text-white">
          {stats.areaAcres || "0.0"}
        </p>
        <p className="text-xs text-gray-400">Acres</p>
      </div>
      <div>
        <p className="text-xl font-bold text-white">{stats.imageCount || 0}</p>
        <p className="text-xs text-gray-400">Images</p>
      </div>
      <div>
        <p className="text-xl font-bold text-white">
          {stats.estimatedBatteries || 0}
        </p>
        <p className="text-xs text-gray-400">Battery</p>
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
}) => {
  const [activeTab, setActiveTab] = useState("survey");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
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
    <div className="h-full w-full bg-[#1e293b] text-white flex flex-col text-sm">
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize z-50 hover:bg-blue-600"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileImport(e.target.files[0])}
        accept=".kml,.kmz"
        className="hidden"
      />
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
        <div className="flex items-center border-b border-gray-700">
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

      <div className="flex-grow overflow-y-auto">
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
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-gray-400">Latitude:</span>
                <span className="font-mono text-gray-200">
                  {homePosition[0].toFixed(7)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Longitude:</span>
                <span className="font-mono text-gray-200">
                  {homePosition[1].toFixed(7)}
                </span>
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
                <div>
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
                        Settings are optimized automatically based on altitude
                        and camera.
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

                  {/* THIS CONTAINS THE CALCULATED VALUES BOX */}
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
    </div>
  );
};

export default FlightPlannerSidebar;
