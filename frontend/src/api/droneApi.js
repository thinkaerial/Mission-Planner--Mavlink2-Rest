// src/api/droneApi.js
import axios from "axios";
import { toast } from "react-toastify";

// Point directly to mavlink2rest URL (default is localhost:8088)
const mavlinkApi = axios.create({
  baseURL: "http://localhost:8088",
});

// Helper function to format the JSON payload exactly how mavlink2rest expects it
// We use COMMAND_LONG (MAVLink Command #76) for most actions
const sendCommand = async (
  commandName,
  param1 = 0,
  param2 = 0,
  param3 = 0,
  param4 = 0,
  param5 = 0,
  param6 = 0,
  param7 = 0,
) => {
  const payload = {
    header: {
      system_id: 255, // GCS System ID
      component_id: 0,
      sequence: 0,
    },
    message: {
      type: "COMMAND_LONG",
      target_system: 1, // Drone System ID (usually 1)
      target_component: 1, // Drone Component ID (usually 1 for autopilot)
      command: {
        type: commandName, // e.g. "MAV_CMD_NAV_TAKEOFF"
      },
      confirmation: 0,
      param1: param1,
      param2: param2,
      param3: param3,
      param4: param4,
      param5: param5,
      param6: param6,
      param7: param7,
    },
  };

  try {
    // mavlink2rest endpoint for sending messages
    await mavlinkApi.post("/mavlink", payload);
    return true;
  } catch (error) {
    console.error(`Error sending ${commandName}:`, error);
    toast.error(`Command failed: ${commandName}`);
    return false;
  }
};

export const armDrone = () => {
  // MAV_CMD_COMPONENT_ARM_DISARM (400): param1=1 (Arm)
  return sendCommand("MAV_CMD_COMPONENT_ARM_DISARM", 1);
};

export const disarmDrone = () => {
  // MAV_CMD_COMPONENT_ARM_DISARM (400): param1=0 (Disarm)
  return sendCommand("MAV_CMD_COMPONENT_ARM_DISARM", 0);
};

export const takeoffDrone = (altitudeMeters = 10) => {
  // MAV_CMD_NAV_TAKEOFF (22): param7 is altitude
  return sendCommand("MAV_CMD_NAV_TAKEOFF", 0, 0, 0, 0, 0, 0, altitudeMeters);
};

export const landDrone = () => {
  // MAV_CMD_NAV_LAND (21)
  return sendCommand("MAV_CMD_NAV_LAND");
};

export const rtlDrone = () => {
  // MAV_CMD_NAV_RETURN_TO_LAUNCH (20)
  return sendCommand("MAV_CMD_NAV_RETURN_TO_LAUNCH");
};

export const setFlightMode = async (modeName) => {
  // Setting flight modes in MAVLink is complex (requires MAV_CMD_DO_SET_MODE).
  // For standard ArduPilot/PX4, it's often easier to use mavlink2rest helper or
  // strictly map Custom Modes. This is a placeholder for advanced implementation.
  // For now, rely on Arm/Takeoff/RTL.
  console.log(
    "Mode switching implementation required specific to Autopilot type",
  );
};
