// src/components/PropertiesPanel.jsx
import React from "react";
import { FaTimes, FaMapMarkerAlt } from "react-icons/fa";

const PropertiesPanel = ({ selectedLayer }) => {
  if (!selectedLayer) {
    return null;
  }

  const renderContent = () => {
    if (selectedLayer.type === "marker") {
      return (
        <div>
          <h4 className="font-bold text-lg mb-2">Waypoint Properties</h4>
          <p className="text-sm text-gray-400">Latitude:</p>
          <p className="font-mono bg-gray-900 p-1 rounded mb-2">
            {selectedLayer.data.lat.toFixed(6)}
          </p>
          <p className="text-sm text-gray-400">Longitude:</p>
          <p className="font-mono bg-gray-900 p-1 rounded">
            {selectedLayer.data.lng.toFixed(6)}
          </p>
        </div>
      );
    }

    if (selectedLayer.type === "polygon") {
      const vertices = selectedLayer.data[0]; // Leaflet nests polygon coords
      return (
        <div>
          <h4 className="font-bold text-lg mb-2">Polygon Properties</h4>
          <p className="text-sm text-gray-400 mb-1">
            {vertices.length} Vertices
          </p>
          <div className="max-h-64 overflow-y-auto pr-2">
            {vertices.map((v, index) => (
              <div
                key={index}
                className="text-xs font-mono bg-gray-900 p-1.5 rounded mb-1.5"
              >
                <span className="font-bold text-cyan-400">P{index + 1}:</span>{" "}
                {v.lat.toFixed(5)}, {v.lng.toFixed(5)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Add renderer for 'polyline' later
    return <p>Select a layer to see its properties.</p>;
  };

  return (
    <div className="absolute top-5 left-5 z-[1000] w-72 bg-black/50 border border-white/10 backdrop-blur-md rounded-lg shadow-2xl text-white p-4 animate-fade-in-down">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
          Feature Properties
        </h3>
        {/* <button className="text-gray-400 hover:text-white">
          <FaTimes />
        </button> */}
      </div>
      {renderContent()}
    </div>
  );
};

export default PropertiesPanel;
