// src/components/map/MapLayerSwitcher.jsx
import React from "react";

const MapLayerSwitcher = ({ activeLayer, allLayers, onLayerChange }) => {
  return (
    <div
      className="absolute top-2 right-2 z-[1000] bg-white p-1 rounded shadow-lg border border-gray-300"
      // Stop click events from propagating to the map, which would cause it to move
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
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
        className="w-full p-2 text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      >
        {allLayers.map((layer) => (
          <option key={layer.name} value={layer.name}>
            {layer.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MapLayerSwitcher;
