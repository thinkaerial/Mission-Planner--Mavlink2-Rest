// src/components/mission/DisplayOptionsPanel.jsx
import React from "react";

const CheckboxRow = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer py-1.5 hover:bg-gray-800/50 rounded px-2 transition-colors">
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer appearance-none w-4 h-4 border border-gray-500 rounded-sm bg-[#1e293b] checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all"
      />
      <svg
        className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <span className="text-sm font-medium text-gray-300 select-none">
      {label}
    </span>
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
