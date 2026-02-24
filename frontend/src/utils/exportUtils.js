// src/utils/exportUtils.js

// Function to format for ArduPilot's .waypoints file
export const toArduPilotFormat = (missionItems, homePosition) => {
  const header = "QGC WPL 110\n";
  const home = `0\t1\t0\t16\t0\t0\t0\t0\t${homePosition[0].toFixed(
    7,
  )}\t${homePosition[1].toFixed(7)}\t0.000000\t1\n`;

  const waypoints = missionItems
    .map((item, index) => {
      const command = item.command;
      const lat = item.lat.toFixed(7);
      const lon = item.lon.toFixed(7);
      const alt = item.alt.toFixed(6);

      // Safely grab parameters, default to 0.0
      const p1 =
        item.param1 !== undefined ? item.param1.toFixed(6) : "0.000000";
      const p2 =
        item.param2 !== undefined ? item.param2.toFixed(6) : "0.000000";
      const p3 =
        item.param3 !== undefined ? item.param3.toFixed(6) : "0.000000";
      const p4 =
        item.param4 !== undefined ? item.param4.toFixed(6) : "0.000000";

      // Structure: INDEX CURRENT COORD_FRAME COMMAND P1 P2 P3 P4 X/LAT Y/LON Z/ALT AUTOCONTINUE
      return `${index + 1}\t0\t3\t${command}\t${p1}\t${p2}\t${p3}\t${p4}\t${lat}\t${lon}\t${alt}\t1`;
    })
    .join("\n");

  return header + home + waypoints;
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
