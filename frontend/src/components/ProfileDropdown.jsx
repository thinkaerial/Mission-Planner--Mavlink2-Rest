// src/components/ProfileDropdown.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaFileAlt,
  FaGlobe,
  FaQuestionCircle,
  FaSignOutAlt,
} from "react-icons/fa";

const DropdownItem = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const ProfileDropdown = ({ isOpen }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  if (!isOpen) return null;
  const handleLogout = () => {
    logout();
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div
      className="absolute top-full right-0 mt-2 w-64 bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl z-50 p-2
                 origin-top-right animate-fade-in-down"
    >
      <nav className="flex flex-col gap-1 py-1">
        <DropdownItem
          icon={<FaFileAlt />}
          label="Flight Data"
          onClick={() => navigateTo("/dashboard")}
        />
        <DropdownItem
          icon={<FaGlobe />}
          label="Flight Plan"
          onClick={() => navigateTo("/mission-planner")}
        />
      </nav>

      <div className="my-1 border-t border-gray-700"></div>

      <nav className="flex flex-col gap-1 py-1">
        <DropdownItem icon={<FaQuestionCircle />} label="Help" />
      </nav>

      <div className="my-1 border-t border-gray-700"></div>

      <div className="py-1">
        <DropdownItem
          icon={<FaSignOutAlt />}
          label="Logout"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
};

export default ProfileDropdown;
