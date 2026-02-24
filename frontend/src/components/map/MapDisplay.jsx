// src/components/map/MapDisplay.jsx
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { TbDrone } from "react-icons/tb";
import { renderToStaticMarkup } from "react-dom/server";
import { useTelemetry } from "../../context/TelemetryContext";

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapDisplay = () => {
  const { position, heading } = useTelemetry();
  const defaultPosition = [28.6129, 77.2295];
  const satelliteMapUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const satelliteAttribution =
    "Tiles &copy; Esri &mdash; Source: Esri & others";

  const iconMarkup = renderToStaticMarkup(
    <div
      style={{
        transform: `rotate(${heading}deg)`,
        transition: "transform 0.2s ease-out",
      }}
    >
      <TbDrone className="text-5xl text-sky-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]" />
      <svg
        viewBox="-15 -25 30 30"
        className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-[120%]"
        style={{
          fill: "white",
          filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.8))",
        }}
      >
        <path d="M 0 -20 L 10 -5 L -10 -5 Z" />
      </svg>
    </div>
  );

  const droneIcon = L.divIcon({
    html: iconMarkup,
    className: "bg-transparent border-0",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

  const currentPosition = position[0] !== 0 ? position : defaultPosition;

  return (
    <MapContainer
      center={currentPosition}
      zoom={18}
      zoomControl={false}
      scrollWheelZoom={true}
      className="absolute inset-0 z-10"
    >
      <ChangeView center={currentPosition} zoom={18} />
      <TileLayer url={satelliteMapUrl} attribution={satelliteAttribution} />
      <Marker position={currentPosition} icon={droneIcon}>
        <Popup>
          Lat: {currentPosition[0].toFixed(5)}, Lng:{" "}
          {currentPosition[1].toFixed(5)} <br />
          Heading: {heading.toFixed(0)}°
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapDisplay;
