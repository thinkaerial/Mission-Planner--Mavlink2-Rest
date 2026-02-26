// src/components/mission/MissionCommandsPanel.jsx
import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import * as turf from "@turf/turf";

const MAV_CMD_NAMES = {
  16: "WAYPOINT",
  20: "RETURN_TO_LAUNCH",
  21: "LAND",
  22: "TAKEOFF",
  178: "DO_CHANGE_SPEED",
  206: "DO_SET_CAM_TRIGG_DIST",
};

const CommandRow = ({ item, index, items, onUpdate, onDelete, onMove }) => {
  const handleInputChange = (field, value) => {
    onUpdate(item.id, { ...item, [field]: parseFloat(value) || 0 });
  };

  const handleCommandChange = (e) => {
    onUpdate(item.id, { ...item, command: parseInt(e.target.value) });
  };

  // Calculate Distance and Angle exactly like Mission Planner
  let dist = 0;
  let angle = 0;
  if (index > 0) {
    const prev = items[index - 1];
    if (
      prev.lat &&
      prev.lon &&
      item.lat &&
      item.lon &&
      item.command === 16 &&
      prev.command === 16
    ) {
      const p1 = turf.point([prev.lon, prev.lat]);
      const p2 = turf.point([item.lon, item.lat]);
      dist = turf.distance(p1, p2, { units: "meters" });
      angle = turf.bearing(p1, p2);
      if (angle < 0) angle += 360; // Normalize to 0-360
    }
  }

  return (
    <tr className="border-b border-gray-600 bg-[#2d2d2d] hover:bg-gray-600 text-[11px] text-gray-200">
      <td className="px-1 py-1 text-center font-bold text-gray-300 border-r border-gray-600 bg-[#1e1e1e] w-8">
        {index + 1}
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <select
          value={item.command}
          onChange={handleCommandChange}
          className="bg-transparent w-full text-white outline-none cursor-pointer"
        >
          {Object.entries(MAV_CMD_NAMES).map(([id, name]) => (
            <option key={id} value={id} className="bg-gray-800">
              {name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.1"
          value={item.param1 || 0}
          onChange={(e) => handleInputChange("param1", e.target.value)}
          className="bg-transparent w-12 text-center outline-none"
        />
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.1"
          value={item.param2 || 0}
          onChange={(e) => handleInputChange("param2", e.target.value)}
          className="bg-transparent w-10 text-center outline-none"
        />
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.1"
          value={item.param3 || 0}
          onChange={(e) => handleInputChange("param3", e.target.value)}
          className="bg-transparent w-10 text-center outline-none"
        />
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.1"
          value={item.param4 || 0}
          onChange={(e) => handleInputChange("param4", e.target.value)}
          className="bg-transparent w-10 text-center outline-none"
        />
      </td>

      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.0000001"
          value={item.lat.toFixed(7)}
          onChange={(e) => handleInputChange("lat", e.target.value)}
          className="bg-transparent w-20 outline-none"
        />
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          step="0.0000001"
          value={item.lon.toFixed(7)}
          onChange={(e) => handleInputChange("lon", e.target.value)}
          className="bg-transparent w-20 outline-none"
        />
      </td>
      <td className="px-1 py-1 border-r border-gray-600">
        <input
          type="number"
          value={item.alt}
          onChange={(e) => handleInputChange("alt", e.target.value)}
          className="bg-transparent w-10 text-center outline-none"
        />
      </td>

      <td className="px-1 py-1 border-r border-gray-600 text-center text-gray-300">
        Relative
      </td>

      <td className="px-1 py-1 border-r border-gray-600 text-center">
        <button
          onClick={() => onDelete(item.id)}
          className="bg-gray-200 text-black px-1.5 rounded font-bold hover:bg-red-600 hover:text-white border border-gray-400 transition-colors"
        >
          X
        </button>
      </td>

      <td className="px-1 py-1 border-r border-gray-600 text-center">
        <div className="flex justify-center gap-1">
          <button
            onClick={() => onMove(index, "up")}
            className="text-white hover:text-blue-400"
          >
            <FaArrowUp size={10} />
          </button>
          <button
            onClick={() => onMove(index, "down")}
            className="text-white hover:text-blue-400"
          >
            <FaArrowDown size={10} />
          </button>
        </div>
      </td>

      <td className="px-1 py-1 border-r border-gray-600 text-center text-gray-300">
        0.0
      </td>
      <td className="px-1 py-1 border-r border-gray-600 text-center text-gray-300">
        {angle > 0 ? angle.toFixed(1) : ""}
      </td>
      <td className="px-1 py-1 border-r border-gray-600 text-center text-gray-300">
        {dist > 0 ? dist.toFixed(1) : ""}
      </td>
      <td className="px-1 py-1 text-center text-gray-300">0</td>
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
    <div className="h-full flex flex-col text-white text-[11px] bg-[#1e1e1e]">
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left border-collapse border border-gray-600">
          <thead className="sticky top-0 bg-[#1e1e1e] z-10 shadow-md">
            <tr className="border-b border-gray-600 text-gray-300">
              <th className="p-1 border-r border-gray-600 text-center w-8">
                #
              </th>
              <th className="p-1 border-r border-gray-600 w-32">Command</th>
              <th className="p-1 border-r border-gray-600 text-center w-12">
                P1
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                P2
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                P3
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                P4
              </th>
              <th className="p-1 border-r border-gray-600 w-20">Lat</th>
              <th className="p-1 border-r border-gray-600 w-20">Lon</th>
              <th className="p-1 border-r border-gray-600 text-center w-12">
                Alt
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-16">
                Frame
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                Delete
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-12">
                ↕
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                Grad %
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                Angle
              </th>
              <th className="p-1 border-r border-gray-600 text-center w-10">
                Dist
              </th>
              <th className="p-1 text-center w-8">AZ</th>
            </tr>
          </thead>
          <tbody>
            {missionItems.map((item, index) => (
              <CommandRow
                key={item.id}
                item={item}
                index={index}
                items={missionItems}
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
