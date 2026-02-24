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
}) => {
  const selectStyle =
    "bg-[#1e293b] text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer text-sm";
  const buttonStyle =
    "bg-[#1e293b] text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer";

  return (
    <div className="absolute top-5 right-5 z-[1000] flex flex-col gap-2 items-end">
      <select
        value={activeLayer.name}
        onChange={(e) => {
          const selectedLayer = allLayers.find(
            (layer) => layer.name === e.target.value
          );
          if (selectedLayer) {
            onLayerChange(selectedLayer);
          }
        }}
        className={selectStyle}
      >
        {allLayers.map((layer) => (
          <option key={layer.name} value={layer.name}>
            {layer.name}
          </option>
        ))}
      </select>

      {onZoomIn && (
        <div className="flex flex-col gap-2">
          <button onClick={onZoomIn} className={buttonStyle} title="Zoom In">
            <FaPlus className="text-xl" />
          </button>
          <button onClick={onZoomOut} className={buttonStyle} title="Zoom Out">
            <FaMinus className="text-xl" />
          </button>
        </div>
      )}

      {onDraw && (
        <div className="flex flex-col gap-2">
          <button
            onClick={onDraw}
            className={buttonStyle}
            title="Draw Polygon Area"
          >
            <FaDrawPolygon className="text-xl" />
          </button>
          <button onClick={onEdit} className={buttonStyle} title="Edit Area">
            <FaEdit className="text-xl" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={onCenter}
          className={buttonStyle}
          title="Center on Home"
        >
          <FaCrosshairs className="text-xl" />
        </button>
        <button
          onClick={onClear}
          className={buttonStyle}
          title="Clear Mission Area"
        >
          <FaTrash className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default MissionTools;
