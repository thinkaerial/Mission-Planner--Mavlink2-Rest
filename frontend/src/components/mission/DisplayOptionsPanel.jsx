// src/components/mission/DisplayOptionsPanel.jsx
import React from "react";

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

const DisplayOptionsPanel = ({ displaySettings, setDisplaySettings }) => {
  const handleChange = (field, value) => {
    setDisplaySettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-3">
      {/* Group Box Style to match Mission Planner */}
      <fieldset className="border border-gray-600 rounded-md p-3">
        <legend className="text-xs text-blue-400 font-semibold px-1">
          Display
        </legend>
        <div className="flex flex-col gap-0.5">
          <CheckboxRow
            label="Boundary"
            checked={displaySettings.showBoundary}
            onChange={(v) => handleChange("showBoundary", v)}
          />
          <CheckboxRow
            label="Markers"
            checked={displaySettings.showMarkers}
            onChange={(v) => handleChange("showMarkers", v)}
          />
          <CheckboxRow
            label="Grid"
            checked={displaySettings.showGrid}
            onChange={(v) => handleChange("showGrid", v)}
          />
          <CheckboxRow
            label="Internals"
            checked={displaySettings.showInternals}
            onChange={(v) => handleChange("showInternals", v)}
          />
          <CheckboxRow
            label="Footprints"
            checked={displaySettings.showFootprints}
            onChange={(v) => handleChange("showFootprints", v)}
          />
        </div>
      </fieldset>
      {/* <div className="mt-2 text-[10px] text-gray-500 font-mono">
        <p>Control-S to save to file</p>
        <p>Control-O to load from file</p>
      </div> */}
    </div>
  );
};

export default DisplayOptionsPanel;
