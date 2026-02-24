// src/components/TelemetryReadout.jsx
import React, { useState } from "react";
import { useTelemetry } from "../../context/TelemetryContext";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

const ReadoutItem = ({ label, value, unit, colorClass = "text-green-400" }) => (
  <div>
    <p className="text-[10px] text-gray-400">{label}</p>
    <p className={`text-base font-mono font-bold ${colorClass}`}>
      {value}
      <span className="text-xs ml-1 text-gray-500">{unit}</span>
    </p>
  </div>
);
const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-0.5 text-xs font-medium transition-colors rounded ${
      active ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"
    }`}
  >
    {label}
  </button>
);

const TelemetryReadout = () => {
  const telemetry = useTelemetry();
  const [activeTab, setActiveTab] = useState("Quick");
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-56 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-700 p-1.5 shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-center text-[11px] font-semibold text-gray-300 uppercase tracking-wider pl-2">
          Info View
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-white"
        >
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1">
          <div className="flex items-center justify-center gap-1 p-1 mb-1 bg-black/30 rounded-md">
            <TabButton
              label="Quick"
              active={activeTab === "Quick"}
              onClick={() => setActiveTab("Quick")}
            />
            <TabButton
              label="Actions"
              active={activeTab === "Actions"}
              onClick={() => setActiveTab("Actions")}
            />
            <TabButton
              label="Status"
              active={activeTab === "Status"}
              onClick={() => setActiveTab("Status")}
            />
            <TabButton
              label="Msg"
              active={activeTab === "Msg"}
              onClick={() => setActiveTab("Msg")}
            />
          </div>

          {activeTab === "Quick" && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 p-1">
              <ReadoutItem
                label="Altitude (GPS)"
                value={telemetry.altitude.toFixed(1)}
                unit="m"
              />
              <ReadoutItem
                label="Altitude (REL)"
                value={telemetry.altitude.toFixed(1)}
                unit="m"
                colorClass="text-red-400"
              />
              <ReadoutItem
                label="Roll (deg)"
                value={telemetry.roll.toFixed(2)}
                unit="°"
                colorClass="text-yellow-400"
              />
              <ReadoutItem
                label="Pitch (deg)"
                value={telemetry.pitch.toFixed(2)}
                unit="°"
                colorClass="text-yellow-400"
              />
              <ReadoutItem
                label="Yaw (deg)"
                value={telemetry.heading.toFixed(1)}
                unit="°"
                colorClass="text-pink-400"
              />
              <ReadoutItem
                label="Climb (m/s)"
                value={telemetry.climbRate.toFixed(2)}
                unit="m/s"
                colorClass="text-cyan-400"
              />
              <ReadoutItem
                label="Voltage (V)"
                value={telemetry.voltage.toFixed(2)}
                unit="V"
              />
              <ReadoutItem
                label="Battery (%)"
                value={telemetry.battery.toFixed(0)}
                unit="%"
              />
              <ReadoutItem
                label="GPS Sats"
                value={telemetry.satellites}
                unit=""
              />
              <ReadoutItem
                label="GPS HDOP"
                value={"1.2"}
                unit="m"
                colorClass="text-purple-400"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TelemetryReadout;
