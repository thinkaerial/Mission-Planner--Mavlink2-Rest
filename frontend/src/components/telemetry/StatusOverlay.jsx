import React from "react";
import { useTelemetry } from "../../context/TelemetryContext";
import { FaInfoCircle } from "react-icons/fa";

const StatusOverlay = ({ isVisible }) => {
  const { droneState, flightMode, connected } = useTelemetry();

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
      <div className="bg-black/80 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full flex items-center gap-4 shadow-2xl">
        <div
          className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
        />
        <span className="text-white text-xs font-bold tracking-widest uppercase">
          {droneState === "ARMED"
            ? "Drone is Active"
            : "Drone is Initializing..."}
        </span>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="text-blue-400 text-xs font-mono">
          {flightMode} MODE
        </span>
        <FaInfoCircle className="text-gray-400 text-sm ml-2" />
      </div>
    </div>
  );
};

export default StatusOverlay;
