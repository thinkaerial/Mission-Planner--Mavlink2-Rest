// src/components/mission/PreflightChecklist.jsx
import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaCircle,
  FaSpinner,
  FaCloudUploadAlt,
  FaShieldAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import { useTelemetry } from "../../context/TelemetryContext";
import { uploadMissionToDrone, triggerCamera } from "../../api/droneApi";

const PreflightChecklist = ({
  onUploadSuccess,
  missionItems,
  homePosition,
  addLog,
}) => {
  const telemetry = useTelemetry();

  const [activeCheckIdx, setActiveCheckIdx] = useState(0);
  const [cameraTested, setCameraTested] = useState(false);
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [speed, setSpeed] = useState(10);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(1);
  const [uploadMsg, setUploadMsg] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);

  // ONLY 3 CHECKS ACTIVE FOR NOW. REST ARE COMMENTED OUT.
  const checks = [
    { label: "Permissions Verified", val: true },
    { label: "Drone Connection", val: telemetry.connected },
    {
      label: "Telemetry Signal",
      val: telemetry.connected && !telemetry.isStale,
    },

    /* --- COMMENTED OUT FOR NOW AS REQUESTED ---
    { label: `Battery Voltage (> 11.0V)[Current: ${telemetry.voltage ? telemetry.voltage.toFixed(1) : 0}V]`, val: telemetry.voltage > 11.0 },
    { label: "GPS Live Check", val: telemetry.satellites >= 8 },
    { label: "Flight Plan Valid", val: missionItems && missionItems.length > 0 },
    { label: "Controller Signal", val: telemetry.connected },
    { label: "Camera Trigger Test (1 Pic)", val: cameraTested }
    */
  ];

  // Automate Checklist Progression
  useEffect(() => {
    let isMounted = true;
    if (activeCheckIdx < checks.length) {
      const currentCheck = checks[activeCheckIdx];

      if (currentCheck.val) {
        const timer = setTimeout(() => {
          if (isMounted) setActiveCheckIdx((prev) => prev + 1);
        }, 500); // 0.5s visual delay per check
        return () => clearTimeout(timer);
      }
      // Trigger camera automatically when it's the camera's turn (Currently disabled since array is only 3 items long)
      else if (activeCheckIdx === 7 && !cameraTested && !isTestingCamera) {
        setIsTestingCamera(true);

        // SIMULATED PASS FOR CURRENT TESTING
        setTimeout(() => {
          if (isMounted) {
            setCameraTested(true);
            setIsTestingCamera(false);
            addLog("Camera trigger test simulated (Code Commented out).");
          }
        }, 1000);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [activeCheckIdx, checks, cameraTested, isTestingCamera]);

  const allPassed = activeCheckIdx >= checks.length;
  const progressPercent = Math.min(100, (activeCheckIdx / checks.length) * 100);

  const handleUpload = async () => {
    setIsUploading(true);
    addLog(`Setting Flight Speed to ${speed}%...`);

    const success = await uploadMissionToDrone(
      missionItems,
      homePosition,
      (cur, tot, msg) => {
        setUploadProgress(cur);
        setUploadTotal(tot);
        setUploadMsg(msg);
      },
    );

    if (success) {
      setIsUploaded(true);
      addLog("Mission uploaded to drone memory.");
      if (onUploadSuccess) onUploadSuccess();
    } else {
      addLog("Upload failed. Packet lost. Try again.");
    }
    setIsUploading(false);
  };

  const handleRequestArm = () => {
    // Triggers the safety popup overlay in MissionPlannerPage.jsx
    window.dispatchEvent(new Event("requestArmPopup"));
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-2">
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1 font-bold">
          <span>Pre-flight Checks</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Check Items List */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-0"
          >
            <span
              className={
                i < activeCheckIdx
                  ? "text-green-400 text-sm font-medium"
                  : i === activeCheckIdx
                    ? "text-white text-sm font-bold animate-pulse"
                    : "text-gray-500 text-sm"
              }
            >
              {check.label}
            </span>
            {i < activeCheckIdx ? (
              <FaCheckCircle className="text-green-500" />
            ) : i === activeCheckIdx ? (
              <FaSpinner className="text-blue-500 animate-spin" />
            ) : (
              <FaCircle className="text-gray-700" />
            )}
          </div>
        ))}
      </div>

      {/* Show Upload and Speed controls when checks pass */}
      {allPassed && !isUploaded && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Speed Slider */}
          <div className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <label className="text-xs font-bold text-gray-300 uppercase flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <FaTachometerAlt /> Mission Speed
              </span>
              <span className="text-blue-400 text-lg">{speed}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Upload Button */}
          {isUploading ? (
            <div className="mt-4 bg-blue-600/20 p-4 rounded border border-blue-500 text-center">
              <FaSpinner className="animate-spin mx-auto mb-2 text-xl text-blue-400" />
              <p className="text-xs font-bold text-blue-400 uppercase">
                {uploadMsg}
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full mt-4 py-4 rounded-lg font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
            >
              <FaCloudUploadAlt className="text-xl" /> UPLOAD MISSION
            </button>
          )}
        </div>
      )}

      {/* Show Request Arm button when upload finishes */}
      {isUploaded && (
        <div className="animate-in fade-in zoom-in duration-500 mt-4">
          <p className="text-center text-emerald-400 text-[11px] font-bold uppercase mb-4">
            Upload Complete! Ready to Arm.
          </p>
          <button
            onClick={handleRequestArm}
            className="w-full py-5 rounded-lg font-black flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
          >
            <FaShieldAlt className="text-xl" /> REQUEST ARM DRONE
          </button>
        </div>
      )}
    </div>
  );
};

export default PreflightChecklist;
