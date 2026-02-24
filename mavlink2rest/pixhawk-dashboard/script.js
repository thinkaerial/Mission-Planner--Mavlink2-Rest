const API = "http://localhost:8088/v1/mavlink";

async function fetchTelemetry() {
  try {
    const response = await fetch(API);
    const data = await response.json();

    if (!data.vehicles) return;

    const vehicleId = Object.keys(data.vehicles)[0];
    const vehicle = data.vehicles[vehicleId];

    const componentId = Object.keys(vehicle.components)[0];
    const component = vehicle.components[componentId];

    const messages = component.messages;

    // ===== VFR_HUD =====
    if (messages.VFR_HUD?.message) {
      const vfr = messages.VFR_HUD.message;

      document.getElementById("altitude").innerText = vfr.alt.toFixed(2);

      document.getElementById("speed").innerText = vfr.groundspeed.toFixed(2);

      document.getElementById("yaw").innerText = vfr.heading;

      document.getElementById("climb").innerText = vfr.climb.toFixed(2);
    }

    // ===== Battery =====
    if (messages.SYS_STATUS?.message) {
      const battery = messages.SYS_STATUS.message;

      if (battery.battery_remaining >= 0) {
        document.getElementById("battery").innerText =
          battery.battery_remaining + " %";
      } else {
        document.getElementById("battery").innerText = "N/A";
      }
    }

    // ===== Artificial Horizon =====
    if (messages.ATTITUDE?.message) {
      const attitude = messages.ATTITUDE.message;

      const rollDeg = attitude.roll * 57.2958;
      const pitchDeg = attitude.pitch * 57.2958;

      document.getElementById("horizon").style.transform =
        `rotate(${rollDeg}deg) translateY(${pitchDeg * 4}px)`;
    }

    // ===== ARM / DISARM =====
    if (messages.HEARTBEAT?.message) {
      const baseMode = messages.HEARTBEAT.message.base_mode;

      const armed = baseMode.includes("ARMED");

      const statusEl = document.getElementById("armStatus");

      if (armed) {
        statusEl.innerText = "ARMED";
        statusEl.style.color = "lime";
      } else {
        statusEl.innerText = "DISARMED";
        statusEl.style.color = "red";
      }
    }
  } catch (err) {
    console.error("Telemetry Error:", err);
  }
}

setInterval(fetchTelemetry, 300);
