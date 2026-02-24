// src/data/mapLayers.js

// This line reads the API key securely from your .env file.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export const mapLayers = [
  {
    name: "Google Satellite",
    type: "leaflet",
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "Map data &copy; Google",
    options: { maxZoom: 21, subdomains: ["mt0", "mt1", "mt2", "mt3"] },
  },
  {
    name: "Google Hybrid",
    type: "leaflet",
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    attribution: "Map data &copy; Google",
    options: { maxZoom: 21, subdomains: ["mt0", "mt1", "mt2", "mt3"] },
  },
  {
    name: "OpenStreetMap",
    type: "leaflet",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    options: { maxZoom: 19 },
  },
  {
    name: "Esri World Imagery",
    type: "leaflet",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    options: { maxZoom: 22 },
  },

  // --- MAPLIBRE VECTOR TILES (Corrected URLs) ---
  {
    name: "MapTiler Streets",
    type: "maplibre",
    // THE FIX: Use backticks (`) and ${} to correctly insert the API key
    url: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  {
    name: "MapTiler Satellite",
    type: "maplibre",
    // THE FIX: Use backticks (`) and ${} to correctly insert the API key
    url: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`,
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  {
    name: "MapTiler Topo",
    type: "maplibre",
    // THE FIX: Use backticks (`) and ${} to correctly insert the API key
    url: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
];
