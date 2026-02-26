// src/utils/exportUtils.js

// Function to format for ArduPilot's .waypoints file
export const toArduPilotFormat = (missionItems, homePosition) => {
  let output = "QGC WPL 110\n";

  // Index 0: Home Position (ArduPilot requirement)
  output += `0\t1\t0\t16\t0\t0\t0\t0\t${homePosition[0].toFixed(8)}\t${homePosition[1].toFixed(8)}\t0.000000\t1\n`;

  missionItems.forEach((item, index) => {
    const lat = item.lat.toFixed(8);
    const lon = item.lon.toFixed(8);
    const alt = item.alt.toFixed(6);
    const p1 = (item.param1 || 0).toFixed(8);
    const p2 = (item.param2 || 0).toFixed(8);
    const p3 = (item.param3 || 0).toFixed(8);
    const p4 = (item.param4 || 0).toFixed(8);

    // INDEX | CURRENT | FRAME | COMMAND | P1 | P2 | P3 | P4 | LAT | LON | ALT | AUTO
    output += `${index + 1}\t0\t3\t${item.command}\t${p1}\t${p2}\t${p3}\t${p4}\t${lat}\t${lon}\t${alt}\t1\n`;
  });

  return output;
};

export const toKMLFormat = (missionItems, missionName) => {
  const waypoints = missionItems
    .filter((item) => item.command === 16)
    .map(
      (item, index) => `
      <Placemark>
        <name>WP ${index + 1}</name>
        <Point>
          <coordinates>${item.lon},${item.lat},${item.alt}</coordinates>
        </Point>
      </Placemark>
    `,
    )
    .join("");

  const flightPathCoords = missionItems
    .filter((item) => item.command === 16)
    .map((item) => `${item.lon},${item.lat},${item.alt}`)
    .join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/ns/kml/2.2">
  <Document>
    <name>${missionName}</name>
    <Style id="flightPath">
      <LineStyle>
        <color>ff00ff00</color>
        <width>2</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Flight Path</name>
      <styleUrl>#flightPath</styleUrl>
      <LineString>
        <coordinates>${flightPathCoords}</coordinates>
      </LineString>
    </Placemark>
    ${waypoints}
  </Document>
</kml>`;
};
