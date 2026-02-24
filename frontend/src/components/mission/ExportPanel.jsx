// src/components/mission/ExportPanel.jsx
import React, { useState } from "react";
import { FaFileExport } from "react-icons/fa";

const ExportPanel = ({ onExport }) => {
  const [format, setFormat] = useState("ArduPilot");

  const handleExportClick = () => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
        <FaFileExport /> Export Mission to File
      </h3>
      <div className="flex flex-col gap-3 text-xs">
        <div className="grid grid-cols-3 items-center">
          <label className="text-gray-400 col-span-1">Format:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="col-span-2 bg-gray-900 w-full p-1.5 rounded-md text-white outline-none border border-gray-600"
          >
            <option value="ArduPilot">ArduPilot (.waypoints)</option>
            <option value="KML">KML (.kml)</option>
          </select>
        </div>
        <button
          onClick={handleExportClick}
          className="w-full py-2 text-sm font-bold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
        >
          Export Mission
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
