// src/components/map/MapLibrePlanner.jsx
import React, { useMemo, useEffect, useState } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Re-usable styling for the data layers
const boundaryLayerStyle = {
  id: "boundary-line",
  type: "line",
  paint: { "line-color": "#00f2ff", "line-width": 3 },
};
const flightPathLayerStyle = {
  id: "flight-path-line",
  type: "line",
  paint: { "line-color": "#65a30d", "line-width": 2 },
};

const MapLibrePlanner = ({
  homePosition,
  missionItems,
  boundaryPoints,
  onHomePositionChange,
  missionGenerated,
  activeMapLayer, // We need this to get the style URL
  mapRef,
  centerTrigger,
}) => {
  // A safe default view state to prevent crashes on the first render
  const [viewState, setViewState] = useState({
    longitude: homePosition ? homePosition[1] : 77.2295,
    latitude: homePosition ? homePosition[0] : 28.6129,
    zoom: 16,
    pitch: 0, // 3D tilt
    bearing: 0, // Rotation
  });

  // This effect recenters the map when the centerTrigger prop changes
  useEffect(() => {
    if (centerTrigger > 0 && homePosition) {
      setViewState((v) => ({
        ...v,
        longitude: homePosition[1],
        latitude: homePosition[0],
        zoom: 16,
      }));
    }
  }, [centerTrigger, homePosition]);

  // Convert your mission data into GeoJSON format, which MapLibre and deck.gl love.
  const boundaryGeoJson = useMemo(() => {
    if (boundaryPoints.length < 2) return null;
    const coordinates = boundaryPoints.map((p) => [p.lon, p.lat]);
    coordinates.push([boundaryPoints[0].lon, boundaryPoints[0].lat]); // Close the loop
    return { type: "Feature", geometry: { type: "LineString", coordinates } };
  }, [boundaryPoints]);

  const flightPathGeoJson = useMemo(() => {
    if (!missionGenerated || missionItems.length < 2) return null;
    const coordinates = missionItems.map((item) => [item.lon, item.lat]);
    return { type: "Feature", geometry: { type: "LineString", coordinates } };
  }, [missionItems, missionGenerated]);

  // Prevent rendering the map if the active layer isn't ready
  if (!activeMapLayer || !activeMapLayer.url) {
    return <div>Loading Map...</div>;
  }

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={activeMapLayer.url} // Use the style URL from our data file
    >
      {/* Home Marker */}
      {homePosition && (
        <Marker
          longitude={homePosition[1]}
          latitude={homePosition[0]}
          draggable
          onDragEnd={(evt) =>
            onHomePositionChange({ lat: evt.lngLat.lat, lng: evt.lngLat.lng })
          }
        >
          <div className="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg cursor-pointer">
            H
          </div>
        </Marker>
      )}

      {/* Waypoint Markers */}
      {missionItems.map((item, index) => (
        <Marker
          key={`waypoint-${item.id}`}
          longitude={item.lon}
          latitude={item.lat}
        >
          <div className="w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md">
            {index + 1}
          </div>
        </Marker>
      ))}

      {/* Boundary Polygon Line */}
      {boundaryGeoJson && (
        <Source id="boundary-source" type="geojson" data={boundaryGeoJson}>
          <Layer {...boundaryLayerStyle} />
        </Source>
      )}

      {/* Flight Path Polyline */}
      {flightPathGeoJson && (
        <Source id="flight-path-source" type="geojson" data={flightPathGeoJson}>
          <Layer {...flightPathLayerStyle} />
        </Source>
      )}
    </Map>
  );
};

export default MapLibrePlanner;
