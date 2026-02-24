// frontend/src/context/TelemetryContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";

const TelemetryContext = createContext();

export const TelemetryProvider = ({ children }) => {
  // We use the REST API endpoint because it is confirmed to work in your HTML setup
  const API_URL = "http://localhost:8088/v1/mavlink";

  const [isStale, setIsStale] = useState(true);
  const [hasInitialPosition, setHasInitialPosition] = useState(false);
  const staleTimerRef = useRef(null);

  const [telemetryData, setTelemetryData] = useState({
    roll: 0,
    pitch: 0,
    heading: 0,
    altitude: 0,
    groundSpeed: 0,
    climbRate: 0,
    battery: 0,
    voltage: 0,
    satellites: 0,
    droneState: "DISARMED",
    flightMode: "UNKNOWN",
    position: [0, 0], // [Lat, Lon]
    connected: false,
  });

  const fetchTelemetry = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      // Access the nested structure: vehicles -> 1 -> components -> 1 -> messages
      // We use optional chaining (?.) to prevent crashes if data isn't ready
      const vehicle = data?.vehicles?.["1"];
      const component = vehicle?.components?.["1"];
      const messages = component?.messages;

      if (!messages) return;

      // If we got data, we are connected
      setIsStale(false);

      // Reset the stale timer
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      staleTimerRef.current = setTimeout(() => setIsStale(true), 2000);

      setTelemetryData((prev) => {
        const newState = { ...prev };
        newState.connected = true;

        // 1. ATTITUDE (Roll/Pitch/Yaw)
        if (messages.ATTITUDE?.message) {
          const att = messages.ATTITUDE.message;
          // Convert Radians to Degrees
          newState.roll = att.roll * (180 / Math.PI);
          newState.pitch = att.pitch * (180 / Math.PI);
          let yaw = att.yaw * (180 / Math.PI);
          if (yaw < 0) yaw += 360;
          newState.heading = yaw;
        }

        // 2. VFR_HUD (Speed, Altitude, Climb)
        if (messages.VFR_HUD?.message) {
          const vfr = messages.VFR_HUD.message;
          newState.altitude = vfr.alt;
          newState.groundSpeed = vfr.groundspeed;
          newState.climbRate = vfr.climb;
          // Use VFR heading as backup
          if (!messages.ATTITUDE) newState.heading = vfr.heading;
        }

        // 3. SYS_STATUS (Battery)
        if (messages.SYS_STATUS?.message) {
          const sys = messages.SYS_STATUS.message;
          newState.voltage = sys.voltage_battery / 1000; // mV to V
          newState.battery = sys.battery_remaining;
        }

        // 4. GPS_RAW_INT (Position & Satellites)
        if (messages.GPS_RAW_INT?.message) {
          const gps = messages.GPS_RAW_INT.message;
          newState.satellites = gps.satellites_visible;

          const lat = gps.lat / 1e7;
          const lon = gps.lon / 1e7;

          if (lat !== 0 && lon !== 0) {
            newState.position = [lat, lon];
            if (!hasInitialPosition) setHasInitialPosition(true);
          }
        }

        // 5. GLOBAL_POSITION_INT (Alternative Position)
        if (messages.GLOBAL_POSITION_INT?.message) {
          const gpos = messages.GLOBAL_POSITION_INT.message;
          if (gpos.relative_alt) {
            newState.altitude = gpos.relative_alt / 1000; // mm to m
          }
        }

        // 6. HEARTBEAT (Armed Status & Mode)
        if (messages.HEARTBEAT?.message) {
          const hb = messages.HEARTBEAT.message;

          // Check if armed (Bitmask 128)
          const baseMode = hb.base_mode?.bits || hb.base_mode;
          const isArmed = (baseMode & 128) === 128;
          newState.droneState = isArmed ? "ARMED" : "DISARMED";

          // Mapping ArduPilot Modes
          const customMode = hb.custom_mode;
          const modes = {
            0: "STABILIZE",
            3: "AUTO",
            4: "GUIDED",
            5: "LOITER",
            6: "RTL",
            9: "LAND",
          };
          if (modes[customMode]) {
            newState.flightMode = modes[customMode];
          }
        }

        return newState;
      });
    } catch (err) {
      // console.error("Telemetry fetch error:", err);
      // Don't clutter console if connection drops, just mark stale
      setIsStale(true);
    }
  };

  useEffect(() => {
    // Poll the API every 200ms (5 times per second)
    const intervalId = setInterval(fetchTelemetry, 200);

    return () => {
      clearInterval(intervalId);
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    };
  }, [hasInitialPosition]); // Dependency ensures state updates correctly

  const contextValue = {
    ...telemetryData,
    isStale,
    hasInitialPosition,
    connected: !isStale,
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  return useContext(TelemetryContext);
};
