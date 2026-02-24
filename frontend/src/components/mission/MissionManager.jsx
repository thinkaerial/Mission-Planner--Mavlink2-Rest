// src/components/mission/MissionManager.jsx
import React, { useState } from "react";
import { FaPlus, FaEllipsisV, FaSave, FaTrash } from "react-icons/fa";

const MissionManager = ({
  allMissions,
  activeMission,
  onLoadMission,
  onNewMission,
  onSaveMission,
  onDeleteMission,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelectChange = (e) => {
    const selectedMission = allMissions.find((m) => m._id === e.target.value);
    if (selectedMission) {
      onLoadMission(selectedMission);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-900/50">
      <div className="flex-grow relative">
        <p className="text-xs text-gray-400 absolute -top-2 left-2 bg-[#1e293b] px-1">
          Capture Plan
        </p>
        <select
          value={activeMission?._id || ""}
          onChange={handleSelectChange}
          className="w-full bg-transparent p-2 border border-gray-600 rounded-md appearance-none text-white"
        >
          {allMissions.map((mission) => (
            <option key={mission._id} value={mission._id}>
              {mission.name}
            </option>
          ))}
          {allMissions.length === 0 && (
            <option disabled>No missions found</option>
          )}
        </select>
      </div>
      <button
        onClick={onSaveMission}
        title="Save Current Mission"
        className="p-3 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
        disabled={!activeMission}
      >
        <FaSave />
      </button>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
          disabled={!activeMission}
        >
          <FaEllipsisV />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
            <button
              onClick={() => {
                onDeleteMission(activeMission._id);
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
            >
              <FaTrash /> Delete Mission
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onNewMission}
        title="New Mission"
        className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default MissionManager;
