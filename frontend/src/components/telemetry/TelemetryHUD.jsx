// src/components/TelemetryHUD.jsx
import React from "react";
import { useTelemetry } from "../../context/TelemetryContext";
import Compass from "./Compass";
import {
  FaRegArrowAltCircleUp,
  FaPaperPlane,
  FaClock,
  FaHome,
  FaTachometerAlt,
  FaRoute,
} from "react-icons/fa";

const HudReadout = ({ icon, value, label }) => (
  <div className="flex items-center gap-2 text-left">
    <div className="text-xl text-gray-400">{icon}</div>
    <div>
      <div className="text-xl font-bold leading-none text-white">{value}</div>
      <div className="text-[11px] text-gray-400">{label}</div>
    </div>
  </div>
);

const AttitudeIndicator = ({ roll, pitch }) => {
  const horizonStyle = {
    transform: `rotate(${roll}deg) translateY(${pitch * 1.5}px)`,
    transition: "transform 150ms linear",
  };

  return (
    <div className="relative w-24 h-24 border-2 border-gray-600 rounded-full bg-gray-900/50 overflow-hidden">
      <div
        style={horizonStyle}
        className="absolute inset-[-50%] bg-gradient-to-b from-sky-500 to-amber-700"
      >
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/50"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-0.5 bg-yellow-400"></div>
        <div className="absolute w-0.5 h-3 bg-yellow-400 top-[calc(50%-12px)]"></div>
        <div className="absolute w-8 h-0.5 bg-yellow-400/0 border-t-2 border-yellow-400 -translate-y-3"></div>
      </div>
    </div>
  );
};

const TelemetryHUD = () => {
  const telemetry = useTelemetry();

  const hudContainerClasses = `
    absolute bottom-4 left-1/2 -translate-x-1/2 z-20 
    flex items-center gap-4 p-2 
    bg-black/50 border border-gray-700 backdrop-blur-md 
    rounded-full shadow-2xl text-white 
    transition-opacity duration-500 
    ${telemetry.isStale ? "opacity-60" : "opacity-100"}
  `;

  return (
    <div className={hudContainerClasses}>
      <AttitudeIndicator roll={telemetry.roll} pitch={telemetry.pitch} />
      <div className="grid grid-cols-3 grid-rows-2 gap-x-6 gap-y-1.5">
        <HudReadout
          icon={<FaRegArrowAltCircleUp />}
          value={telemetry.altitude.toFixed(1)}
          label="Alt (Rel) m"
        />
        <HudReadout
          icon={<FaPaperPlane />}
          value={telemetry.climbRate.toFixed(1)}
          label="Climb m/s"
        />
        <HudReadout icon={<FaClock />} value="00:00" label="Flight Time" />
        <HudReadout icon={<FaHome />} value="0.0" label="Distance m" />
        <HudReadout
          icon={<FaTachometerAlt />}
          value={telemetry.groundSpeed.toFixed(1)}
          label="Speed m/s"
        />
        <HudReadout icon={<FaRoute />} value="0.0" label="Flt. Distance" />
      </div>
      <Compass heading={telemetry.heading} />
    </div>
  );
};

export default TelemetryHUD;
