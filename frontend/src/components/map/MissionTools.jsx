// src/components/map/MissionTools.jsx
import React from "react";
import {
  FaCrosshairs,
  FaTrash,
  FaPlus,
  FaMinus,
  FaDrawPolygon,
  FaEdit,
} from "react-icons/fa";

const MissionTools = ({
  onClear,
  onCenter,
  activeLayer,
  allLayers,
  onLayerChange,
  onZoomIn,
  onZoomOut,
  onDraw,
  onEdit,
  isLocked, // 1. STEP: Add isLocked to the props
}) => {
  const selectStyle =
    "bg-[#1e293b] text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer text-sm";

  // 2. STEP: Update buttonStyle to show visual feedback when locked
  const buttonStyle = (disabled) =>
    `bg-[#1e293b] text-white p-2 rounded-lg shadow-lg transition-colors duration-200 
    ${disabled ? "opacity-50 cursor-not-allowed text-gray-500" : "hover:bg-gray-700 cursor-pointer"}`;

  return (
    <div className="absolute top-5 right-5 z-[1000] flex flex-col gap-2 items-end">
      <select
        value={activeLayer.name}
        onChange={(e) => {
          const selectedLayer = allLayers.find(
            (layer) => layer.name === e.target.value,
          );
          if (selectedLayer) {
            onLayerChange(selectedLayer);
          }
        }}
        className={selectStyle}
        disabled={isLocked} // Optional: lock map switcher
      >
        {allLayers.map((layer) => (
          <option key={layer.name} value={layer.name}>
            {layer.name}
          </option>
        ))}
      </select>

      {onZoomIn && (
        <div className="flex flex-col gap-2">
          <button
            onClick={onZoomIn}
            className={buttonStyle(isLocked)}
            title="Zoom In"
            disabled={isLocked}
          >
            <FaPlus className="text-xl" />
          </button>
          <button
            onClick={onZoomOut}
            className={buttonStyle(isLocked)}
            title="Zoom Out"
            disabled={isLocked}
          >
            <FaMinus className="text-xl" />
          </button>
        </div>
      )}

      {onDraw && (
        <div className="flex flex-col gap-2">
          {/* 3. STEP: Update onDraw to check !isLocked */}
          <button
            onClick={() => !isLocked && onDraw()}
            className={buttonStyle(isLocked)}
            title="Draw Polygon Area"
            disabled={isLocked}
          >
            <FaDrawPolygon className="text-xl" />
          </button>

          {/* 4. STEP: Update onEdit to check !isLocked */}
          <button
            onClick={() => !isLocked && onEdit()}
            className={buttonStyle(isLocked)}
            title="Edit Area"
            disabled={isLocked}
          >
            <FaEdit className="text-xl" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={onCenter}
          className={buttonStyle(false)} // Usually allowed even if mission is locked
          title="Center on Home"
        >
          <FaCrosshairs className="text-xl" />
        </button>
        <button
          onClick={() => !isLocked && onClear()}
          className={buttonStyle(isLocked)}
          title="Clear Mission Area"
          disabled={isLocked}
        >
          <FaTrash className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default MissionTools;
