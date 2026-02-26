// src/components/mission/ExportPanel.jsx
import React, { useState } from "react";
import {
  FaFileExport,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
} from "react-icons/fa";
import {
  uploadMissionToDrone,
  downloadMissionFromDrone,
} from "../../api/droneApi";
import { toast } from "react-toastify";

const ExportPanel = ({
  onExport,
  disabled,
  missionItems,
  homePosition,
  setMissionItems,
}) => {
  const [format, setFormat] = useState("ArduPilot");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportClick = () => {
    if (onExport) onExport(format);
  };

  const handleUploadToDrone = async () => {
    if (!missionItems || missionItems.length === 0) {
      toast.error("No mission generated to upload!");
      return;
    }
    setIsProcessing(true);
    // Note: uploadMissionToDrone already clears the mission first automatically
    await uploadMissionToDrone(missionItems, homePosition);
    setIsProcessing(false);
  };

  const handleDownloadFromDrone = async () => {
    setIsProcessing(true);
    const downloadedItems = await downloadMissionFromDrone();
    if (downloadedItems && downloadedItems.length > 0) {
      // Pass the downloaded items back to the parent state to show on the map
      if (setMissionItems) setMissionItems(downloadedItems);
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-3 border-b border-gray-700">
      <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
        <FaFileExport /> Pixhawk Drone Actions
      </h3>

      <div className="flex flex-col gap-2 text-xs">
        {/* ROW 1: Upload / Read (Start and Clear buttons removed as requested) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleUploadToDrone}
            disabled={disabled || isProcessing}
            className="w-full py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 shadow-md"
          >
            <FaCloudUploadAlt className="text-xl" />
            Upload
          </button>

          <button
            onClick={handleDownloadFromDrone}
            disabled={isProcessing}
            className="w-full py-2.5 flex flex-col items-center justify-center gap-1 text-xs font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-600 shadow-md"
          >
            <FaCloudDownloadAlt className="text-xl" />
            Read
          </button>
        </div>

        {/* EXPORT TO PC SECTION */}
        <div className="grid grid-cols-3 items-center mt-3 border-t border-gray-700 pt-3">
          <label className="text-gray-400 col-span-1">Export To:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="col-span-2 bg-gray-900 w-full p-1.5 rounded-md text-white outline-none border border-gray-600"
          >
            <option value="ArduPilot">Mission Planner (.waypoints)</option>
            <option value="KML">Google Earth (.kml)</option>
          </select>
        </div>

        <button
          onClick={handleExportClick}
          disabled={disabled}
          className="w-full mt-2 py-2 text-sm font-bold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:bg-gray-600 shadow-md"
        >
          Save File to PC
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
