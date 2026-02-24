// src/components/common/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FaWifi,
  FaBatteryFull,
  FaSatelliteDish,
  FaUserCircle,
  FaBars,
  FaPlug,
} from "react-icons/fa";
import { useTelemetry } from "../../context/TelemetryContext";
import ThinkAerialLogo from "../../assets/Thinkaerial.png";
import ProfileDropdown from "../ProfileDropdown";
import { useAuth } from "../../context/AuthContext";
import MobileMenu from "../MobileMenu";

const Header = () => {
  const { user } = useAuth();
  const telemetry = useTelemetry();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isArmed = telemetry.droneState === "Armed";
  const droneStateBg = isArmed ? "bg-red-600" : "bg-green-600";

  let connectionIconColor = "text-red-500";
  if (telemetry.connected) {
    connectionIconColor = telemetry.isStale
      ? "text-yellow-400"
      : "text-green-500";
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 sm:px-6 h-16 bg-[#1e293b] border-b border-gray-700 text-white">
        <div className="flex items-center gap-4">
          <img src={ThinkAerialLogo} alt="Logo" className="h-8" />
        </div>

        <div className="hidden lg:flex items-center gap-5 text-sm">
          <div
            className="flex items-center gap-2 text-gray-300"
            title="WiFi Signal"
          >
            <FaWifi />
            <span>{telemetry.wifi}%</span>
          </div>
          <div
            className="flex items-center gap-2 text-gray-300"
            title="GPS Satellites"
          >
            <FaSatelliteDish />
            <span>{telemetry.satellites}</span>
          </div>
          <div
            className="flex items-center gap-2 text-gray-300"
            title="Battery"
          >
            <FaBatteryFull />
            <span>{telemetry.battery.toFixed(0)}%</span>
          </div>
          <div
            className={`px-3 py-1 text-xs font-bold rounded-full ${droneStateBg}`}
          >
            {telemetry.droneState}
          </div>
          <div className="px-3 py-1 text-xs rounded-full bg-gray-700">
            {telemetry.flightMode}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2.5 pl-4 pr-3 py-1.5 text-sm font-bold bg-gray-700/50 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors">
            <span>CONNECT</span>
            <FaPlug className={`h-5 w-5 ${connectionIconColor}`} />
          </button>

          <div className="hidden lg:block relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <FaUserCircle className="h-6 w-6" />
              <span className="text-sm font-medium">
                {user ? user.username : "Guest"}
              </span>
            </button>
            <ProfileDropdown isOpen={isProfileOpen} />
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-2xl rounded-md bg-none text-gray-300 hover:bg-gray-700"
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
