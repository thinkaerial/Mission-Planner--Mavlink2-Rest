import * as turf from "@turf/turf";

export const calculateSurveyStats = (
  altitude,
  camera,
  sideOverlap,
  frontOverlap,
) => {
  if (!camera) return { gsd: 0, lineSpacing: 0, triggerDistance: 0 };

  const { sensorWidth, sensorHeight, imageWidth, imageHeight, focalLength } =
    camera;

  const gsdH = ((altitude * sensorWidth) / (focalLength * imageWidth)) * 100;
  const gsdV = ((altitude * sensorHeight) / (focalLength * imageHeight)) * 100;
  const gsd = Math.max(gsdH, gsdV);

  const imageFootprintWidth = (gsdH * imageWidth) / 100;
  const imageFootprintHeight = (gsdV * imageHeight) / 100;

  const lineSpacing = imageFootprintWidth * (1 - sideOverlap / 100);
  const triggerDistance = imageFootprintHeight * (1 - frontOverlap / 100);

  return {
    gsd,
    imageFootprintWidth,
    imageFootprintHeight,
    lineSpacing,
    triggerDistance,
  };
};

export function generateSurveyGrid(
  polygonCoords,
  lineSpacing,
  angle,
  leadIn = 0,
  overshoot = 0,
) {
  if (
    !polygonCoords ||
    polygonCoords.length < 3 ||
    !lineSpacing ||
    lineSpacing <= 0
  )
    return [];

  const closedCoords = [...polygonCoords, polygonCoords[0]];
  const polygon = turf.polygon([closedCoords]);
  const center = turf.centerOfMass(polygon);
  const rotatedPolygon = turf.transformRotate(polygon, -angle, {
    pivot: center.geometry.coordinates,
  });
  const bbox = turf.bbox(rotatedPolygon);
  const [minX, minY, maxX, maxY] = bbox;

  const lines = [];
  const spacingDeg = lineSpacing / 111139;

  for (let y = minY; y <= maxY; y += spacingDeg) {
    const line = turf.lineString([
      [minX, y],
      [maxX, y],
    ]);
    const intersect = turf.lineIntersect(rotatedPolygon, line);
    if (intersect.features.length >= 2) {
      const sorted = intersect.features.sort(
        (a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0],
      );
      const p1 = sorted[0].geometry.coordinates;
      const p2 = sorted[sorted.length - 1].geometry.coordinates;
      lines.push([p1, p2]);
    }
  }

  let points = [];
  lines.forEach((line, i) => {
    let p1 = i % 2 === 0 ? line[0] : line[1];
    let p2 = i % 2 === 0 ? line[1] : line[0];

    const wp1 = turf.transformRotate(turf.point(p1), angle, {
      pivot: center.geometry.coordinates,
    }).geometry.coordinates;
    const wp2 = turf.transformRotate(turf.point(p2), angle, {
      pivot: center.geometry.coordinates,
    }).geometry.coordinates;

    const bearing = turf.bearing(turf.point(wp1), turf.point(wp2));

    let finalStart = wp1;
    if (leadIn > 0) {
      finalStart = turf.destination(
        turf.point(wp1),
        leadIn / 1000,
        bearing - 180,
      ).geometry.coordinates;
    }

    let finalEnd = wp2;
    if (overshoot > 0) {
      finalEnd = turf.destination(turf.point(wp2), overshoot / 1000, bearing)
        .geometry.coordinates;
    }

    points.push({ lat: finalStart[1], lon: finalStart[0] });
    points.push({ lat: finalEnd[1], lon: finalEnd[0] });
  });

  return points;
}
