import React, { useState } from "react";
import { FaCloudUploadAlt, FaPlay, FaUndo, FaLock } from "react-icons/fa";
import {
  uploadMissionToDrone,
  armDrone,
  setAutoMode,
} from "../../api/droneApi";
import { toast } from "react-toastify";

const MissionControlPanel = ({
  missionItems,
  homePosition,
  workflowStep,
  setWorkflowStep,
  setIsLocked,
  onReset,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    const success = await uploadMissionToDrone(missionItems, homePosition);
    if (success) {
      toast.success("Mission Uploaded!");
      setWorkflowStep("ready");
      setIsLocked(true); // Lock the UI
    }
    setLoading(false);
  };

  const handleStartFlight = async () => {
    await armDrone();
    toast.info("Starting Mission...");
    setTimeout(() => setAutoMode(), 2000);
  };

  return (
    <div className="p-6 bg-[#0f172a] mt-auto border-t border-gray-700">
      {workflowStep === "checklist" && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all"
        >
          {loading ? (
            "UPLOADING..."
          ) : (
            <>
              <FaCloudUploadAlt className="text-xl" /> UPLOAD MISSION
            </>
          )}
        </button>
      )}

      {workflowStep === "ready" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold animate-pulse text-sm mb-2">
            <FaLock /> SYSTEM LOCKED & READY
          </div>

          <button
            onClick={handleStartFlight}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-lg text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-blink border-2 border-emerald-400 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <FaPlay /> START FLIGHT
            </div>
          </button>

          <button
            onClick={onReset}
            className="w-full py-2 text-gray-500 hover:text-white text-xs flex items-center justify-center gap-2"
          >
            <FaUndo /> Abort and Edit Mission
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes blink {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-blink {
          animation: blink 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MissionControlPanel;
