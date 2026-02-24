// src/components/mission/MissionSettingsPanel.jsx
import React from "react";
import { FaCamera, FaCalculator } from "react-icons/fa";
import { cameraData } from "../../data/cameraData";

// Helper for Camera Config Rows (Fixed to match Calculated Values layout)
const SpecRow = ({ label, value, unit }) => (
  <div className="flex justify-between items-center text-xs mb-1.5">
    <span className="text-gray-400">{label}</span>
    <div className="text-right font-mono text-gray-200">
      <span>{value}</span>
      <span className="ml-1.5 text-gray-500 w-6 inline-block text-right">
        {unit}
      </span>
    </div>
  </div>
);

// Helper for Calculated Values Rows
const CalculatedField = ({ label, value, unit, highlight = false }) => (
  <div className="flex justify-between items-center text-xs mb-1.5">
    <span className="text-gray-400">{label}</span>
    <div
      className={`text-right font-mono ${
        highlight ? "text-green-400 font-bold" : "text-gray-200"
      }`}
    >
      <span>{value}</span>
      {unit && (
        <span className="ml-1.5 text-gray-500 w-6 inline-block text-right">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const MissionSettingsPanel = ({
  missionOptions,
  setMissionOptions,
  missionCalcs,
}) => {
  const { selectedCamera } = missionOptions;

  const handleCameraChange = (e) => {
    const newCamera = cameraData.find((c) => c.name === e.target.value);
    if (newCamera) {
      setMissionOptions((prev) => ({ ...prev, selectedCamera: newCamera }));
    }
  };

  return (
    <div className="bg-transparent text-white text-sm">
      {/* --- Section 1: Planning Camera --- */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold">
          <FaCamera className="text-gray-400" />
          <h3>Planning Camera</h3>
        </div>

        {/* Dropdown */}
        <select
          value={selectedCamera.name}
          onChange={handleCameraChange}
          className="bg-[#0f172a] w-full p-2.5 rounded-md text-white text-xs outline-none border border-gray-600 focus:border-blue-500 mb-4"
        >
          {cameraData.map((cam) => (
            <option key={cam.name} value={cam.name}>
              {cam.name}
            </option>
          ))}
        </select>

        {/* Camera Config Box */}
        <div className="p-3 bg-[#1e293b]/50 rounded-md border border-gray-700">
          <h4 className="text-[10px] text-gray-500 mb-3 uppercase tracking-widest font-bold">
            Camera Config
          </h4>

          <SpecRow
            label="Focal Length"
            value={selectedCamera.focalLength}
            unit="mm"
          />
          <SpecRow
            label="Image Width"
            value={selectedCamera.imageWidth}
            unit="px"
          />
          <SpecRow
            label="Image Height"
            value={selectedCamera.imageHeight}
            unit="px"
          />
          <SpecRow
            label="Sensor Width"
            value={selectedCamera.sensorWidth}
            unit="mm"
          />
          <SpecRow
            label="Sensor Height"
            value={selectedCamera.sensorHeight}
            unit="mm"
          />
        </div>
      </div>

      {/* --- Section 2: Calculated Values --- */}
      <div className="p-4 pt-0">
        <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold mt-2">
          <FaCalculator className="text-gray-400" />
          <h3>Calculated Values</h3>
        </div>

        <div className="p-3 bg-[#1e293b]/50 rounded-md border border-gray-700">
          <CalculatedField
            label="Ground Sample Distance"
            value={(missionCalcs.gsd || 0).toFixed(2)}
            unit="cm/px"
            highlight
          />
          <CalculatedField
            label="Image Footprint Width"
            value={(missionCalcs.imageFootprintWidth || 0).toFixed(1)}
            unit="m"
          />
          <CalculatedField
            label="Image Footprint Height"
            value={(missionCalcs.imageFootprintHeight || 0).toFixed(1)}
            unit="m"
          />
          <CalculatedField
            label="Line Spacing"
            value={(missionCalcs.lineSpacing || 0).toFixed(1)}
            unit="m"
            highlight
          />
          <CalculatedField
            label="Trigger Distance"
            value={(missionCalcs.triggerDistance || 0).toFixed(1)}
            unit="m"
          />
        </div>
      </div>
    </div>
  );
};

export default MissionSettingsPanel;
