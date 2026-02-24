// src/components/MobileMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaGlobe,
  FaCogs,
  FaWrench,
  FaDesktop,
  FaTerminal,
  FaQuestionCircle,
  FaDonate,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

const MenuItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-4 px-4 py-3 text-left text-lg text-gray-300 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
  >
    <span className="w-6 text-center">{icon}</span>
    <span>{label}</span>
  </button>
);

const MobileMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    navigate("/");
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className={`relative flex flex-col h-full w-full max-w-sm bg-[#1e293b] p-4 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-2xl text-gray-400 rounded-full hover:bg-gray-700 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="flex flex-col gap-2 py-4 flex-grow">
          <MenuItem icon={<FaFileAlt />} label="Flight Data" />
          <MenuItem icon={<FaGlobe />} label="Flight Plan" />
          {/* <MenuItem icon={<FaCogs />} label="Initial Setup" /> */}
          {/* <MenuItem icon={<FaWrench />} label="Config/Tuning" /> */}
          {/* <MenuItem icon={<FaDesktop />} label="Simulation" /> */}
          {/* <MenuItem icon={<FaTerminal />} label="Terminal" /> */}
        </nav>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-700">
          <MenuItem icon={<FaQuestionCircle />} label="Help" />
          {/* <MenuItem icon={<FaDonate />} label="Donate" /> */}
          <MenuItem
            icon={<FaSignOutAlt />}
            label="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
