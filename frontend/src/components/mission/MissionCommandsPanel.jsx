// src/components/mission/MissionCommandsPanel.jsx
import React from "react";
import { FaArrowUp, FaArrowDown, FaTrash, FaPlusCircle } from "react-icons/fa";

const MAV_CMD_NAMES = {
  16: "WAYPOINT",
  20: "RETURN_TO_LAUNCH",
  21: "LAND",
  22: "TAKEOFF",
  206: "DO_SET_CAM_TRIGG_DIST",
};

const CommandRow = ({ item, index, onUpdate, onDelete, onMove }) => {
  const handleInputChange = (field, value) => {
    onUpdate(item.id, { ...item, [field]: parseFloat(value) || 0 });
  };

  const handleCommandChange = (e) => {
    onUpdate(item.id, { ...item, command: parseInt(e.target.value) });
  };

  return (
    <tr className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700/50 text-[11px]">
      <td className="px-1 py-1 text-center font-bold text-blue-400">
        {index + 1}
      </td>
      <td className="px-1 py-1">
        <select
          value={item.command}
          onChange={handleCommandChange}
          className="bg-gray-900 w-full p-1 rounded border border-gray-600 text-white outline-none"
        >
          {Object.entries(MAV_CMD_NAMES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </td>
      {/* Param 1 (Delay/Pitch/Dist) */}
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.1"
          value={item.param1 || 0}
          onChange={(e) => handleInputChange("param1", e.target.value)}
          className="bg-gray-900 w-12 p-1 rounded border border-gray-600 text-white text-center outline-none"
        />
      </td>
      {/* Param 2 */}
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.1"
          value={item.param2 || 0}
          onChange={(e) => handleInputChange("param2", e.target.value)}
          className="bg-gray-900 w-10 p-1 rounded border border-gray-600 text-white text-center outline-none"
        />
      </td>
      {/* Param 3 */}
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.1"
          value={item.param3 || 0}
          onChange={(e) => handleInputChange("param3", e.target.value)}
          className="bg-gray-900 w-10 p-1 rounded border border-gray-600 text-white text-center outline-none"
        />
      </td>
      {/* Param 4 */}
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.1"
          value={item.param4 || 0}
          onChange={(e) => handleInputChange("param4", e.target.value)}
          className="bg-gray-900 w-10 p-1 rounded border border-gray-600 text-white text-center outline-none"
        />
      </td>

      {/* Lat/Lon/Alt */}
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.0000001"
          value={item.lat.toFixed(7)}
          onChange={(e) => handleInputChange("lat", e.target.value)}
          className="bg-gray-900 w-20 p-1 rounded border border-gray-600 text-white outline-none"
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.0000001"
          value={item.lon.toFixed(7)}
          onChange={(e) => handleInputChange("lon", e.target.value)}
          className="bg-gray-900 w-20 p-1 rounded border border-gray-600 text-white outline-none"
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          value={item.alt}
          onChange={(e) => handleInputChange("alt", e.target.value)}
          className="bg-gray-900 w-12 p-1 rounded border border-gray-600 text-white text-center outline-none"
        />
      </td>

      <td className="px-1 py-1 text-center">
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-500 hover:text-red-400"
        >
          <FaTrash />
        </button>
      </td>
      <td className="px-1 py-1 text-center">
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => onMove(index, "up")}
            className="text-green-500 hover:text-green-400"
          >
            <FaArrowUp />
          </button>
          <button
            onClick={() => onMove(index, "down")}
            className="text-green-500 hover:text-green-400"
          >
            <FaArrowDown />
          </button>
        </div>
      </td>
    </tr>
  );
};

const MissionCommandsPanel = ({
  missionItems,
  setMissionItems,
  defaultAltitude,
  setDefaultAltitude,
}) => {
  const updateItem = (id, updatedValues) =>
    setMissionItems((prev) =>
      prev.map((item) => (item.id === id ? updatedValues : item)),
    );
  const deleteItem = (id) =>
    setMissionItems((prev) => prev.filter((item) => item.id !== id));

  const addItemBelow = (index) => {
    const newId =
      missionItems.length > 0
        ? Math.max(...missionItems.map((item) => item.id)) + 1
        : 1;
    const newItem = {
      id: newId,
      command: 16,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0, // Initialize all params
      lat: 0,
      lon: 0,
      alt: defaultAltitude,
    };
    const newItems = [...missionItems];
    newItems.splice(index + 1, 0, newItem);
    setMissionItems(newItems);
  };

  const moveItem = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === missionItems.length - 1)
    )
      return;
    const newItems = [...missionItems];
    const item = newItems.splice(index, 1)[0];
    newItems.splice(direction === "up" ? index - 1 : index + 1, 0, item);
    setMissionItems(newItems);
  };

  return (
    <div className="h-full flex flex-col text-white text-xs bg-transparent">
      <div className="flex items-center gap-4 p-2 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Default Alt (m):</label>
          <input
            type="number"
            value={defaultAltitude}
            onChange={(e) =>
              setDefaultAltitude(parseFloat(e.target.value) || 0)
            }
            className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-white outline-none"
          />
        </div>
        <button
          onClick={() => addItemBelow(missionItems.length - 1)}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md font-bold"
        >
          <FaPlusCircle /> Add
        </button>
      </div>

      <div className="flex-grow overflow-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#1e293b] z-10 shadow-md">
            <tr className="border-b border-gray-600 text-gray-400">
              <th className="p-1 w-8">#</th>
              <th className="p-1 w-32">Command</th>
              <th className="p-1 w-12 text-center">P1</th>
              <th className="p-1 w-10 text-center">P2</th>
              <th className="p-1 w-10 text-center">P3</th>
              <th className="p-1 w-10 text-center">P4</th>
              <th className="p-1 w-20">Lat</th>
              <th className="p-1 w-20">Lon</th>
              <th className="p-1 w-12 text-center">Alt</th>
              <th className="p-1 text-center w-8">Del</th>
              <th className="p-1 text-center w-12">Move</th>
            </tr>
          </thead>
          <tbody>
            {missionItems.map((item, index) => (
              <CommandRow
                key={item.id}
                item={item}
                index={index}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onMove={moveItem}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MissionCommandsPanel;
