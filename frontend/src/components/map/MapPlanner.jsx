import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Tooltip,
  Popup,
  FeatureGroup,
  useMap,
  CircleMarker,
  Circle,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet-draw/dist/leaflet.draw.css";
import * as turf from "@turf/turf";
import { FaLocationArrow } from "react-icons/fa";

const hiddenDrawToolbarStyle = `
  /* Hide the toolbar icons but keep the container for logic */
  .leaflet-draw-toolbar {
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }
  /* Force the Save/Cancel buttons to be visible and clickable */
  .leaflet-draw-actions {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }
`;

const MAV_CMD = { WAYPOINT: 16 };

const ChangeView = ({ center, zoom, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, trigger, map]);
  return null;
};

const homeIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
      H
    </div>,
  ),
  className: "bg-transparent border-0",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const createWaypointIcon = (number, type = "waypoint") => {
  let bgColor = "bg-[#00FF00]";
  let borderColor = "border-black";
  let textColor = "text-black";

  if (type === "start") bgColor = "bg-green-500";
  if (type === "end") bgColor = "bg-red-500";

  if (type === "boundary")
    return L.divIcon({
      html: renderToStaticMarkup(
        <div className="w-3 h-3 bg-red-500 border border-white rounded-full shadow-sm"></div>,
      ),
      className: "bg-transparent border-0",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

  return L.divIcon({
    html: renderToStaticMarkup(
      <div
        className={`w-6 h-6 ${bgColor} border-2 ${borderColor} rounded-full flex items-center justify-center font-bold ${textColor} text-xs shadow-md`}
      >
        {number}
      </div>,
    ),
    className: "bg-transparent border-0",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createArrowIcon = (rotation) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div style={{ transform: `rotate(${rotation - 45}deg)` }}>
        <FaLocationArrow className="text-yellow-400 text-lg drop-shadow-md stroke-black stroke-1" />
      </div>,
    ),
    className: "bg-transparent border-0",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapPlanner = ({
  homePosition,
  missionItems,
  boundaryPoints,
  onPolygonCreated,
  onPolygonEdited,
  onHomePositionChange,
  missionGenerated,
  mapRef,
  onDrawControlReady,
  centerTrigger,
  clearTrigger,
  activeMapLayer,
  displaySettings,
  missionCalcs,
  surveyOptions,
  missionOptions,
  isLocked,
}) => {
  const featureGroupRef = React.useRef();

  const settings = displaySettings || {
    showBoundary: true,
    showMarkers: true,
    showGrid: true,
    showInternals: false,
    showFootprints: false,
  };

  useEffect(() => {
    if (clearTrigger > 0 && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
  }, [clearTrigger]);

  const homeMarkerHandlers = useMemo(
    () => ({
      dragend(event) {
        const marker = event.target;
        const newPosition = marker.getLatLng();
        if (onHomePositionChange) {
          onHomePositionChange(newPosition);
        }
      },
    }),
    [onHomePositionChange],
  );

  const handleCreated = (e) => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(e.layer);
    }
    onPolygonCreated(e);
  };

  const handleEdited = (e) => {
    onPolygonEdited(e);
  };

  const { flightPathCoords, arrowMarkers } = React.useMemo(() => {
    if (!missionGenerated || !homePosition || missionItems.length === 0) {
      return { flightPathCoords: [], arrowMarkers: [] };
    }

    const surveyWaypoints = missionItems
      .filter((item) => item.command === MAV_CMD.WAYPOINT)
      .map((item) => ({ lat: item.lat, lon: item.lon, id: item.id }));

    if (surveyWaypoints.length === 0) {
      return { flightPathCoords: [], arrowMarkers: [] };
    }

    const coords = [
      [homePosition[0], homePosition[1]],
      ...surveyWaypoints.map((wp) => [wp.lat, wp.lon]),
      [homePosition[0], homePosition[1]],
    ];

    const arrows = [];
    for (let i = 0; i < surveyWaypoints.length - 1; i++) {
      const start = surveyWaypoints[i];
      const end = surveyWaypoints[i + 1];

      const point1 = turf.point([start.lon, start.lat]);
      const point2 = turf.point([end.lon, end.lat]);

      const bearing = turf.bearing(point1, point2);
      const midpoint = turf.midpoint(point1, point2);

      arrows.push({
        lat: midpoint.geometry.coordinates[1],
        lon: midpoint.geometry.coordinates[0],
        bearing: bearing,
      });
    }

    return { flightPathCoords: coords, arrowMarkers: arrows };
  }, [missionGenerated, missionItems, homePosition]);

  const boundaryPathCoords = boundaryPoints.map((item) => [item.lat, item.lon]);

  const { internalPoints, footprints } = React.useMemo(() => {
    if (
      (!settings.showFootprints && !settings.showInternals) ||
      !missionGenerated ||
      !missionCalcs ||
      !surveyOptions
    ) {
      return { internalPoints: [], footprints: [] };
    }

    const width = missionCalcs.imageFootprintWidth;
    const height = missionCalcs.imageFootprintHeight;
    const angle = surveyOptions.angle;
    const dist = missionCalcs.triggerDistance;

    if (!width || !height || !dist || dist <= 0)
      return { internalPoints: [], footprints: [] };

    const surveyWaypoints = missionItems.filter(
      (item) => item.command === MAV_CMD.WAYPOINT,
    );
    if (surveyWaypoints.length < 2)
      return { internalPoints: [], footprints: [] };

    const pathCoords = surveyWaypoints.map((wp) => [wp.lon, wp.lat]);
    const line = turf.lineString(pathCoords);
    const lineLength = turf.length(line, { units: "meters" });

    const calculatedFootprints = [];
    const calculatedInternals = [];

    const options = { units: "meters" };
    const diagonal = Math.sqrt(
      Math.pow(width / 2, 2) + Math.pow(height / 2, 2),
    );
    const angleRad = Math.atan2(height, width);
    const angleDeg = (angleRad * 180) / Math.PI;

    for (let d = 0; d <= lineLength; d += dist) {
      const pointOnLine = turf.along(line, d, { units: "meters" });
      const center = pointOnLine.geometry.coordinates;

      if (settings.showInternals)
        calculatedInternals.push([center[1], center[0]]);

      if (settings.showFootprints) {
        const pt = pointOnLine;
        const bearing = angle;
        const p1 = turf.destination(pt, diagonal, bearing + angleDeg, options)
          .geometry.coordinates;
        const p2 = turf.destination(
          pt,
          diagonal,
          bearing + (180 - angleDeg),
          options,
        ).geometry.coordinates;
        const p3 = turf.destination(
          pt,
          diagonal,
          bearing + (180 + angleDeg),
          options,
        ).geometry.coordinates;
        const p4 = turf.destination(pt, diagonal, bearing - angleDeg, options)
          .geometry.coordinates;

        calculatedFootprints.push([
          [p1[1], p1[0]],
          [p2[1], p2[0]],
          [p3[1], p3[0]],
          [p4[1], p4[0]],
        ]);
      }
    }

    return {
      internalPoints: calculatedInternals,
      footprints: calculatedFootprints,
    };
  }, [
    settings.showFootprints,
    settings.showInternals,
    missionGenerated,
    missionItems,
    missionCalcs,
    surveyOptions,
  ]);

  const safeActiveLayer = activeMapLayer || {
    name: "Default",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "",
    options: { maxZoom: 19 },
  };

  const waypointRadius = missionOptions?.waypointRadius || 2;

  return (
    <>
      <style>{hiddenDrawToolbarStyle}</style>
      <div className="h-full w-full relative">
        <MapContainer
          center={homePosition || [18.9863, 72.8183]}
          zoom={18}
          minZoom={2}
          maxZoom={safeActiveLayer.options.maxZoom || 21}
          zoomControl={false}
          dragging={!isLocked}
          scrollWheelZoom={!isLocked}
          doubleClickZoom={!isLocked}
          className="absolute inset-0 z-10"
          ref={mapRef}
        >
          <ChangeView center={homePosition} zoom={18} trigger={centerTrigger} />

          <TileLayer
            key={safeActiveLayer.name}
            url={safeActiveLayer.url}
            attribution={safeActiveLayer.attribution}
            {...safeActiveLayer.options}
          />

          <div className="leaflet-draw-toolbar-hidden">
            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                ref={(ref) => {
                  if (ref) onDrawControlReady && onDrawControlReady(ref);
                }}
                position="topleft"
                onCreated={handleCreated}
                onEdited={handleEdited}
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: isLocked
                    ? false
                    : {
                        allowIntersection: false,
                        shapeOptions: {
                          color: "#FF0055",
                          weight: 2,
                        },
                      },
                }}
                edit={{
                  featureGroup: featureGroupRef.current,
                  remove: false,
                  // Disable editing points if locked
                  allowEdit: !isLocked,
                }}
              />
            </FeatureGroup>
          </div>

          {homePosition && (
            <Marker
              position={homePosition}
              icon={homeIcon}
              zIndexOffset={1000}
              draggable={true}
              eventHandlers={homeMarkerHandlers}
            >
              <Popup>
                <b>Home Location</b> <br /> Lat: {homePosition[0].toFixed(7)}{" "}
                <br /> Lon: {homePosition[1].toFixed(7)}
              </Popup>
            </Marker>
          )}

          {settings.showBoundary && boundaryPathCoords.length > 1 && (
            <>
              <Polygon
                positions={boundaryPathCoords}
                color="#FF0055"
                weight={2}
                fillOpacity={0.1}
              />
              {boundaryPathCoords.map((pos, idx) => (
                <Marker
                  key={`bnd-${idx}`}
                  position={pos}
                  icon={createWaypointIcon(idx, "boundary")}
                >
                  <Popup>
                    <b>Boundary Point {idx + 1}</b>
                    <br />
                    Lat: {pos[0].toFixed(7)}
                    <br />
                    Lon: {pos[1].toFixed(7)}
                  </Popup>
                </Marker>
              ))}
            </>
          )}

          {settings.showGrid && flightPathCoords.length > 1 && (
            <Polyline positions={flightPathCoords} color="#FFFF00" weight={3}>
              <Tooltip sticky>Flight Path</Tooltip>
            </Polyline>
          )}

          {settings.showGrid &&
            arrowMarkers.map((arrow, idx) => (
              <Marker
                key={`arrow-${idx}`}
                position={[arrow.lat, arrow.lon]}
                icon={createArrowIcon(arrow.bearing)}
                interactive={false}
              />
            ))}

          {settings.showFootprints &&
            footprints.map((coords, i) => (
              <Polygon
                key={`fp-${i}`}
                positions={coords}
                color="#00FF00"
                weight={1}
                fillOpacity={0.0}
              />
            ))}

          {settings.showInternals &&
            internalPoints.map((pos, i) => (
              <CircleMarker
                key={`int-${i}`}
                center={pos}
                radius={3}
                color="#FFFF00"
                fillColor="#000000"
                fillOpacity={1}
                weight={1.5}
              />
            ))}

          {/* --- ONLY SHOW WAYPOINT MARKERS (HIDES NULL ISLAND TAKEOFF) --- */}
          {settings.showMarkers &&
            missionItems.map((item, index) => {
              if (item.command !== MAV_CMD.WAYPOINT) return null;

              const displayId = index + 1;

              return (
                <React.Fragment key={item.id}>
                  <Circle
                    center={[item.lat, item.lon]}
                    radius={waypointRadius}
                    pathOptions={{
                      color: "#FFFF00",
                      weight: 1,
                      fillOpacity: 0.1,
                      dashArray: "4, 4",
                    }}
                  />
                  <Marker
                    position={[item.lat, item.lon]}
                    icon={createWaypointIcon(displayId, "waypoint")}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -10]}
                    >{`Index ${displayId}`}</Tooltip>
                    <Popup>
                      <div className="text-center">
                        <b className="text-blue-600">
                          Command Index {displayId}
                        </b>
                        <br />
                        Alt: {item.alt}m <br />
                        Radius: {waypointRadius}m
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
        </MapContainer>
      </div>
    </>
  );
};

export default MapPlanner;
