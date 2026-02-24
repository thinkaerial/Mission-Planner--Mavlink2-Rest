import * as turf from "@turf/turf";

/**
 * Generates a lawnmower survey grid pattern with optional LEAD-IN and OVERSHOOT.
 *
 * @param {Array<Array<number>>} polygonCoords - The coordinates of the survey polygon.
 * @param {number} lineSpacing - The distance between each flight line in meters.
 * @param {number} angle - The angle of the flight lines in degrees.
 * @param {number} waypointSpacing - (Unused) Distance between waypoints.
 * @param {boolean} crosshatch - If true, generates a second grid perpendicular to the first.
 * @param {number} leadIn - (NEW) Distance in meters to start BEFORE the boundary.
 * @param {number} overshoot - (NEW) Distance in meters to fly PAST the boundary.
 * @returns {Array<Object>} A list of generated mission items (waypoints).
 */
export function generateSurveyGrid(
  polygonCoords,
  lineSpacing,
  angle,
  waypointSpacing,
  crosshatch = false,
  leadIn = 0,
  overshoot = 0,
) {
  if (!polygonCoords || polygonCoords.length < 3) {
    return [];
  }

  const createGrid = (startAngle) => {
    // 1. Prepare Polygon
    const closedCoords = [...polygonCoords, polygonCoords[0]];
    const polygon = turf.polygon([closedCoords]);
    const center = turf.centerOfMass(polygon);

    // 2. Rotate Polygon to align with 0 degrees
    const rotatedPolygon = turf.transformRotate(polygon, -startAngle, {
      pivot: center.geometry.coordinates,
    });
    const rotatedBbox = turf.bbox(rotatedPolygon);
    const [minX, minY, maxX, maxY] = rotatedBbox;

    // 3. Generate Parallel Lines
    const lines = [];
    const lineSpacingInDegrees = lineSpacing / 111139;

    for (let y = minY; y <= maxY; y += lineSpacingInDegrees) {
      const line = turf.lineString([
        [minX, y],
        [maxX, y],
      ]);
      lines.push(line);
    }

    // 4. Intersect Lines with Polygon
    const intersectedLines = [];
    lines.forEach((line) => {
      const intersection = turf.lineIntersect(rotatedPolygon, line);
      if (intersection.features.length > 0) {
        const sortedPoints = intersection.features.sort(
          (a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0],
        );

        if (sortedPoints.length >= 2) {
          const start = sortedPoints[0].geometry.coordinates;
          const end =
            sortedPoints[sortedPoints.length - 1].geometry.coordinates;
          intersectedLines.push([start, end]);
        }
      }
    });

    if (intersectedLines.length === 0) return [];

    // 5. Generate Waypoints with Lead-In and Overshoot
    let waypoints = [];
    for (let i = 0; i < intersectedLines.length; i++) {
      const segment = intersectedLines[i]; // [Start, End] in rotated space

      // Determine flight direction (Zig-Zag)
      let p1 = segment[0]; // Start of line
      let p2 = segment[1]; // End of line

      // If odd row, reverse direction
      if (i % 2 !== 0) {
        p1 = segment[1];
        p2 = segment[0];
      }

      // Rotate points back to Real World coordinates
      const realP1 = turf.transformRotate(turf.point(p1), startAngle, {
        pivot: center.geometry.coordinates,
      }).geometry.coordinates;

      const realP2 = turf.transformRotate(turf.point(p2), startAngle, {
        pivot: center.geometry.coordinates,
      }).geometry.coordinates;

      // Calculate bearing for this specific line
      const bearing = turf.bearing(turf.point(realP1), turf.point(realP2));

      // --- LEAD-IN (Extend Start Backwards) ---
      let finalStart = realP1;
      if (leadIn > 0) {
        finalStart = turf.destination(
          turf.point(realP1),
          leadIn / 1000, // convert meters to km
          bearing - 180, // opposite direction
        ).geometry.coordinates;
      }

      // --- OVERSHOOT (Extend End Forwards) ---
      let finalEnd = realP2;
      if (overshoot > 0) {
        finalEnd = turf.destination(
          turf.point(realP2),
          overshoot / 1000, // convert meters to km
          bearing, // same direction
        ).geometry.coordinates;
      }

      waypoints.push({ lat: finalStart[1], lon: finalStart[0] });
      waypoints.push({ lat: finalEnd[1], lon: finalEnd[0] });
    }

    return waypoints;
  };

  const primaryWaypoints = createGrid(angle);
  let finalWaypoints = primaryWaypoints;

  if (crosshatch) {
    const secondaryWaypoints = createGrid(angle + 90);
    if (secondaryWaypoints.length > 0) {
      finalWaypoints.push(...secondaryWaypoints);
    }
  }

  return finalWaypoints.map((wp, index) => ({
    id: index + 1,
    command: 16,
    lat: wp.lat,
    lon: wp.lon,
    alt: 0,
  }));
}
