import React from "react";
import SliderInput from "../common/SliderInput";
import {
  FaLayerGroup,
  FaRuler,
  FaCompass,
  FaTachometerAlt,
  FaMapPin,
  FaArrowRight,
  FaArrowLeft,
  FaBullseye, // NEW: Icon for Waypoint Radius
} from "react-icons/fa";
import { MPS_TO_MPH, MPH_TO_MPS } from "../../utils/unitConversion";

// --- Helper Components ---

const SettingsRow = ({ icon, label, helpText, children }) => (
  <div className="grid grid-cols-3 items-center gap-4 text-xs mb-3">
    <div className="col-span-1 flex items-center gap-2">
      {icon}
      <label className="text-gray-300">{label}</label>
    </div>
    <div className="col-span-2 text-right">
      {children}
      {helpText && <p className="text-gray-500 mt-1 text-right">{helpText}</p>}
    </div>
  </div>
);

const CheckboxRow = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-800/50 rounded">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
    />
    <span className="text-sm text-gray-300 select-none">{label}</span>
  </label>
);

// --- Main Component ---

const AdvancedSettingsPanel = ({
  missionOptions,
  setMissionOptions,
  surveyOptions,
  setSurveyOptions,
  missionItems,
  displaySettings,
  setDisplaySettings,
}) => {
  const handleSurveyOptionChange = (field, value) => {
    setSurveyOptions((prev) => ({ ...prev, [field]: value }));
  };

  const handleMissionOptionChange = (field, value) => {
    setMissionOptions((prev) => ({ ...prev, [field]: value }));
  };

  const handleDisplayChange = (field, value) => {
    if (setDisplaySettings) {
      setDisplaySettings((prev) => ({ ...prev, [field]: value }));
    }
  };

  const waypointCount = missionItems.filter((i) => i.command === 16).length;

  return (
    <div className="p-4 flex flex-col gap-2">
      {/* --- NEW: Waypoint Radius (Threshold) --- */}
      <SettingsRow icon={<FaBullseye />} label="WP Radius [m]">
        <SliderInput
          value={missionOptions.waypointRadius || 2}
          onChange={(v) => handleMissionOptionChange("waypointRadius", v)}
          min={0.5}
          max={20}
          step={0.5}
          unit="m"
        />
      </SettingsRow>

      {/* Front Overlap */}
      <SettingsRow icon={<FaRuler />} label="Front Overlap">
        <SliderInput
          value={surveyOptions.frontOverlap}
          onChange={(v) => handleSurveyOptionChange("frontOverlap", v)}
          min={30}
          max={95}
          step={1}
          unit="%"
        />
      </SettingsRow>

      {/* Side Overlap */}
      <SettingsRow icon={<FaLayerGroup />} label="Side Overlap">
        <SliderInput
          value={surveyOptions.sideOverlap}
          onChange={(v) => handleSurveyOptionChange("sideOverlap", v)}
          min={30}
          max={95}
          step={1}
          unit="%"
        />
      </SettingsRow>

      {/* Flight Direction */}
      <SettingsRow icon={<FaCompass />} label="Flight Direction">
        <SliderInput
          value={surveyOptions.angle}
          onChange={(v) => handleSurveyOptionChange("angle", v)}
          min={0}
          max={360}
          step={1}
          unit="°"
        />
      </SettingsRow>

      {/* Flight Speed */}
      <SettingsRow icon={<FaTachometerAlt />} label="Flight Speed">
        <SliderInput
          value={Math.round(missionOptions.groundSpeed * MPS_TO_MPH)}
          onChange={(v) =>
            handleMissionOptionChange("groundSpeed", v * MPH_TO_MPS)
          }
          min={0}
          max={45}
          step={1}
          unit="mph"
        />
      </SettingsRow>

      {/* Starting Waypoint */}
      <SettingsRow icon={<FaMapPin />} label="Start At WP">
        <SliderInput
          value={missionOptions.startingWaypoint}
          onChange={(v) =>
            handleMissionOptionChange("startingWaypoint", parseInt(v))
          }
          min={1}
          max={waypointCount || 1}
          step={1}
          unit=""
          disabled={!waypointCount || waypointCount <= 1}
        />
      </SettingsRow>

      {/* Lead-In */}
      <SettingsRow icon={<FaArrowRight />} label="LeadIn [m]">
        <SliderInput
          value={surveyOptions.leadIn || 0}
          onChange={(v) => handleSurveyOptionChange("leadIn", v)}
          min={0}
          max={50}
          step={1}
          unit="m"
        />
      </SettingsRow>

      {/* OverShoot */}
      <SettingsRow icon={<FaArrowLeft />} label="OverShoot [m]">
        <SliderInput
          value={surveyOptions.overshoot || 0}
          onChange={(v) => handleSurveyOptionChange("overshoot", v)}
          min={0}
          max={50}
          step={1}
          unit="m"
        />
      </SettingsRow>

      {/* --- Display Options --- */}
      {displaySettings && setDisplaySettings && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <h4 className="text-xs text-blue-400 font-semibold mb-2">Display</h4>
          <div className="flex flex-col gap-1">
            <CheckboxRow
              label="Boundary"
              checked={displaySettings.showBoundary}
              onChange={(v) => handleDisplayChange("showBoundary", v)}
            />
            <CheckboxRow
              label="Markers"
              checked={displaySettings.showMarkers}
              onChange={(v) => handleDisplayChange("showMarkers", v)}
            />
            <CheckboxRow
              label="Grid"
              checked={displaySettings.showGrid}
              onChange={(v) => handleDisplayChange("showGrid", v)}
            />
            <CheckboxRow
              label="Internals"
              checked={displaySettings.showInternals}
              onChange={(v) => handleDisplayChange("showInternals", v)}
            />
            <CheckboxRow
              label="Footprints"
              checked={displaySettings.showFootprints}
              onChange={(v) => handleDisplayChange("showFootprints", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsPanel;
