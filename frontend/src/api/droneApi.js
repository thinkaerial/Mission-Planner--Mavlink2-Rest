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

// 1. SET AUTO MODE (Starts the mission if armed)
export const setAutoMode = async () => {
  try {
    // MAV_CMD_DO_SET_MODE (176). Param1 = 1 (Custom Mode Enabled), Param2 = 3 (ArduCopter AUTO Mode)
    await sendCommand("MAV_CMD_DO_SET_MODE", 1, 3, 0, 0, 0, 0, 0);
    toast.success("Flight Mode set to AUTO. Mission will begin if armed.");
    return true;
  } catch (e) {
    toast.error("Failed to set AUTO mode.");
    return false;
  }
};

// 2. CLEAR MISSION ON DRONE
export const clearDroneMission = async () => {
  try {
    await mavlinkApi.post("/mavlink", {
      header: { system_id: 255, component_id: 0, sequence: 0 },
      message: {
        type: "MISSION_CLEAR_ALL",
        target_system: 1,
        target_component: 1,
        mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
      },
    });
    toast.success("Mission cleared from Pixhawk.");
    return true;
  } catch (e) {
    toast.error("Failed to clear mission.");
    return false;
  }
};

// 3. DOWNLOAD MISSION FROM DRONE
export const downloadMissionFromDrone = async () => {
  try {
    toast.info("Requesting mission list from drone...");

    // 1. Request the total count of waypoints
    await mavlinkApi.post("/mavlink", {
      header: { system_id: 255, component_id: 0, sequence: 0 },
      message: {
        type: "MISSION_REQUEST_LIST",
        target_system: 1,
        target_component: 1,
        mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
      },
    });

    // Wait for the drone to reply with MISSION_COUNT
    let missionCount = 0;
    let retries = 0;
    while (retries < 20) {
      await new Promise((r) => setTimeout(r, 100));
      const res = await mavlinkApi
        .get("/v1/mavlink/vehicles/1/components/1/messages/MISSION_COUNT")
        .catch(() => null);
      if (res && res.data && res.data.message) {
        missionCount = res.data.message.count;
        break;
      }
      retries++;
    }

    if (missionCount === 0) {
      toast.warning("Drone has no mission saved (Count is 0).");
      return [];
    }

    toast.info(`Downloading ${missionCount} waypoints...`);
    const downloadedItems = [];

    // 2. Request each waypoint one by one
    for (let i = 0; i < missionCount; i++) {
      // Ask for waypoint 'i'
      await mavlinkApi.post("/mavlink", {
        header: { system_id: 255, component_id: 0, sequence: 0 },
        message: {
          type: "MISSION_REQUEST_INT",
          target_system: 1,
          target_component: 1,
          seq: i,
          mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
        },
      });

      // Poll until we get the correct waypoint
      let wpRetries = 0;
      let gotWaypoint = false;
      while (wpRetries < 20 && !gotWaypoint) {
        await new Promise((r) => setTimeout(r, 100));
        const res = await mavlinkApi
          .get("/v1/mavlink/vehicles/1/components/1/messages/MISSION_ITEM_INT")
          .catch(() => null);

        if (res && res.data && res.data.message && res.data.message.seq === i) {
          const wp = res.data.message;
          downloadedItems.push({
            id: wp.seq,
            command:
              wp.command.type === "MAV_CMD_NAV_WAYPOINT"
                ? 16
                : wp.command.type === "MAV_CMD_NAV_TAKEOFF"
                  ? 22
                  : wp.command.type === "MAV_CMD_NAV_RETURN_TO_LAUNCH"
                    ? 20
                    : wp.command.type === "MAV_CMD_DO_CHANGE_SPEED"
                      ? 178
                      : wp.command.type === "MAV_CMD_DO_SET_CAM_TRIGG_DIST"
                        ? 206
                        : 16,
            param1: wp.param1,
            param2: wp.param2,
            param3: wp.param3,
            param4: wp.param4,
            lat: wp.x / 1e7,
            lon: wp.y / 1e7,
            alt: wp.z,
          });
          gotWaypoint = true;
        }
        wpRetries++;
      }
    }

    // 3. Send ACK to tell drone we are done
    await mavlinkApi.post("/mavlink", {
      header: { system_id: 255, component_id: 0, sequence: 0 },
      message: {
        type: "MISSION_ACK",
        target_system: 1,
        target_component: 1,
        type: { type: "MAV_MISSION_ACCEPTED" },
        mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
      },
    });

    toast.success("Mission downloaded successfully!");
    return downloadedItems;
  } catch (err) {
    console.error("Download failed:", err);
    toast.error("Failed to download mission from drone.");
    return [];
  }
};

export const uploadMissionToDrone = async (missionItems, homePosition) => {
  try {
    const totalItems = missionItems.length + 1; // +1 for the Home Waypoint (Index 0)

    // Map numerical commands to MAVLink string names for mavlink2rest
    const COMMAND_MAP = {
      16: "MAV_CMD_NAV_WAYPOINT",
      20: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
      22: "MAV_CMD_NAV_TAKEOFF",
      178: "MAV_CMD_DO_CHANGE_SPEED",
      206: "MAV_CMD_DO_SET_CAM_TRIGG_DIST",
    };

    toast.info("Clearing old mission from Pixhawk...");

    // 1. Clear existing mission
    await mavlinkApi.post("/mavlink", {
      header: { system_id: 255, component_id: 0, sequence: 0 },
      message: {
        type: "MISSION_CLEAR_ALL",
        target_system: 1,
        target_component: 1,
        mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
      },
    });

    await new Promise((r) => setTimeout(r, 500)); // Wait half a second

    toast.info("Initiating upload...");

    // 2. Tell the drone how many items we are sending
    await mavlinkApi.post("/mavlink", {
      header: { system_id: 255, component_id: 0, sequence: 0 },
      message: {
        type: "MISSION_COUNT",
        target_system: 1,
        target_component: 1,
        count: totalItems,
        mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
      },
    });

    // 3. Listen for requests from the drone and answer them
    let lastReqSeqId = -1;
    let retries = 0;
    let isComplete = false;

    // Poll rapidly (every 100ms) to answer drone requests
    while (retries < 150 && !isComplete) {
      await new Promise((r) => setTimeout(r, 100));

      try {
        const reqRes = await mavlinkApi.get(
          "/v1/mavlink/vehicles/1/components/1/messages/MISSION_REQUEST",
        );

        if (reqRes.data && reqRes.data.message) {
          const msgSeqId = reqRes.data.header.sequence; // Unique packet ID
          const requestedWpIndex = reqRes.data.message.seq; // Which waypoint drone wants

          // If the drone is asking for a waypoint we haven't sent yet
          if (msgSeqId !== lastReqSeqId) {
            lastReqSeqId = msgSeqId;

            let itemData;
            if (requestedWpIndex === 0) {
              // Index 0 is ALWAYS Home Position
              itemData = {
                command: 16,
                lat: homePosition[0],
                lon: homePosition[1],
                alt: 0,
                param1: 0,
                param2: 0,
                param3: 0,
                param4: 0,
              };
            } else {
              // Get the item from our list (offset by 1 because of Home)
              itemData = missionItems[requestedWpIndex - 1];
            }

            if (itemData) {
              // Send the exact requested waypoint
              await mavlinkApi.post("/mavlink", {
                header: { system_id: 255, component_id: 0, sequence: 0 },
                message: {
                  type: "MISSION_ITEM_INT",
                  target_system: 1,
                  target_component: 1,
                  seq: requestedWpIndex,
                  frame: { type: "MAV_FRAME_GLOBAL_RELATIVE_ALT" },
                  command: {
                    type:
                      COMMAND_MAP[itemData.command] || "MAV_CMD_NAV_WAYPOINT",
                  },
                  current: requestedWpIndex === 0 ? 1 : 0,
                  autocontinue: 1,
                  param1: itemData.param1 || 0,
                  param2: itemData.param2 || 0,
                  param3: itemData.param3 || 0,
                  param4: itemData.param4 || 0,
                  x: Math.round(itemData.lat * 1e7), // Lat * 10^7
                  y: Math.round(itemData.lon * 1e7), // Lon * 10^7
                  z: itemData.alt || 0, // Altitude
                  mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
                },
              });
            }

            // If the drone just asked for the very last item, we are done
            if (requestedWpIndex === totalItems - 1) {
              await new Promise((r) => setTimeout(r, 600)); // Wait for final ACK
              isComplete = true;
            }
          }
        }
      } catch (e) {
        // Ignore temporary network errors while polling
      }
      retries++;
    }

    if (isComplete) {
      toast.success(
        `Successfully uploaded ${missionItems.length} waypoints to Pixhawk!`,
      );
      return true;
    } else {
      toast.error("Upload timed out. Ensure drone is connected.");
      return false;
    }
  } catch (err) {
    console.error("Upload failed:", err);
    toast.error("Failed to communicate with mavlink2rest.");
    return false;
  }
};
