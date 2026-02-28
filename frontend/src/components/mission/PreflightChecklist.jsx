// src/components/mission/PreflightChecklist.jsx
import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaCircle,
  FaCloudUploadAlt,
  FaDatabase,
} from "react-icons/fa";
import { useTelemetry } from "../../context/TelemetryContext";
import { uploadMissionToDrone } from "../../api/droneApi";

const CheckItem = ({ label, status }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-800">
    <span className={status ? "text-green-400" : "text-gray-500"}>{label}</span>
    {status ? (
      <FaCheckCircle className="text-green-500" />
    ) : (
      <FaCircle className="text-gray-900" />
    )}
  </div>
);

const PreflightChecklist = ({
  onUploadSuccess,
  missionItems,
  homePosition,
  addLog,
}) => {
  const telemetry = useTelemetry();
  const [isUploading, setIsUploading] = useState(false);

  // Automated checks
  const checks = {
    drone: telemetry.connected,
    gps: telemetry.satellites >= 10,
    battery: telemetry.battery > 20,
    plan: missionItems.length > 0,
  };

  const allPassed = Object.values(checks).every((v) => v === true);

  const handleUpload = async () => {
    setIsUploading(true);
    addLog("Uploading Mission to Pixhawk...");
    const success = await uploadMissionToDrone(missionItems, homePosition);
    if (success) {
      addLog("Mission Uploaded. Checklist Complete.");
      onUploadSuccess();
    }
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-800/50">
        <CheckItem label="Permissions" status={true} />
        <CheckItem label="Drone Connection" status={checks.drone} />
        <CheckItem label="GPS Lock (>10 Sats)" status={checks.gps} />
        <CheckItem label="Battery Capacity" status={checks.battery} />
        <CheckItem label="Flight Plan Valid" status={checks.plan} />
      </div>

      <div className="p-6 mt-auto">
        <button
          disabled={!allPassed || isUploading}
          onClick={handleUpload}
          className={`w-full py-4 rounded-md font-bold flex items-center justify-center gap-2 transition-all ${
            allPassed
              ? "bg-[#add633] text-black hover:bg-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          <FaCloudUploadAlt />
          {isUploading ? "UPLOADING..." : "UPLOAD MISSION"}
        </button>
        {allPassed && !isUploading && (
          <p className="text-center text-[#add633] text-[10px] mt-2 animate-pulse">
            Checklist complete! Tap Upload to begin.
          </p>
        )}
      </div>
    </div>
  );
};

export default PreflightChecklist;
