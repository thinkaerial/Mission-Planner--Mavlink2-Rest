// src/api/droneApi.js
import axios from "axios";
import { toast } from "react-toastify";

// Point directly to mavlink2rest URL
const mavlinkApi = axios.create({
  baseURL: "http://localhost:8088",
});

const sendCommand = async (
  commandName,
  p1 = 0,
  p2 = 0,
  p3 = 0,
  p4 = 0,
  p5 = 0,
  p6 = 0,
  p7 = 0,
) => {
  const payload = {
    header: { system_id: 255, component_id: 0, sequence: 0 },
    message: {
      type: "COMMAND_LONG",
      target_system: 1,
      target_component: 1,
      command: { type: commandName },
      confirmation: 0,
      param1: p1,
      param2: p2,
      param3: p3,
      param4: p4,
      param5: p5,
      param6: p6,
      param7: p7,
    },
  };

  try {
    await mavlinkApi.post("/mavlink", payload);
    return true;
  } catch (error) {
    console.error(`Error sending ${commandName}:`, error);
    return false;
  }
};

export const armDrone = () => sendCommand("MAV_CMD_COMPONENT_ARM_DISARM", 1);
export const disarmDrone = () => sendCommand("MAV_CMD_COMPONENT_ARM_DISARM", 0);
export const setAutoMode = () => sendCommand("MAV_CMD_DO_SET_MODE", 1, 3);
export const takeoffDrone = (alt = 10) =>
  sendCommand("MAV_CMD_NAV_TAKEOFF", 0, 0, 0, 0, 0, 0, alt);
export const landDrone = () => sendCommand("MAV_CMD_NAV_LAND");
export const rtlDrone = () => sendCommand("MAV_CMD_NAV_RETURN_TO_LAUNCH");
export const triggerCamera = () =>
  sendCommand("MAV_CMD_IMAGE_START_CAPTURE", 0, 0, 1, 0, 0, 0, 0); // Takes 1 picture

// CLEAR MISSION
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
    return true;
  } catch (e) {
    return false;
  }
};

// DOWNLOAD MISSION FROM DRONE (Fixed Packet Loss)
export const downloadMissionFromDrone = async (onProgress) => {
  try {
    if (onProgress)
      onProgress(0, 100, "Requesting mission count from drone...");

    let missionCount = -1;
    let requestListTime = 0;

    // Request count with 1-second auto-retry if packet drops
    for (let i = 0; i < 40; i++) {
      if (Date.now() - requestListTime > 1000) {
        await mavlinkApi.post("/mavlink", {
          header: { system_id: 255, component_id: 0, sequence: 0 },
          message: {
            type: "MISSION_REQUEST_LIST",
            target_system: 1,
            target_component: 1,
            mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
          },
        });
        requestListTime = Date.now();
      }

      await new Promise((r) => setTimeout(r, 100));
      const res = await mavlinkApi
        .get(
          `/v1/mavlink/vehicles/1/components/1/messages/MISSION_COUNT?_cb=${Date.now()}`,
        )
        .catch(() => null);

      if (res?.data?.message) {
        missionCount = res.data.message.count;
        break;
      }
    }

    if (missionCount <= 0) return [];
    const downloadedItems = [];

    // Download Waypoints 1 by 1 with 1-second auto-retry
    for (let i = 0; i < missionCount; i++) {
      if (onProgress)
        onProgress(
          i,
          missionCount,
          `Downloading Waypoint ${i + 1} of ${missionCount}...`,
        );

      let gotWaypoint = false;
      let requestTime = 0;

      for (let retries = 0; retries < 100 && !gotWaypoint; retries++) {
        // Max 10 seconds per waypoint
        if (Date.now() - requestTime > 1000) {
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
          requestTime = Date.now();
        }

        await new Promise((r) => setTimeout(r, 100));
        const res = await mavlinkApi
          .get(
            `/v1/mavlink/vehicles/1/components/1/messages/MISSION_ITEM_INT?_cb=${Date.now()}`,
          )
          .catch(() => null);

        if (res?.data?.message?.seq === i) {
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
      }
      if (!gotWaypoint) throw new Error("Timeout getting waypoint " + i);
    }

    // Acknowledge Download Complete
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

    if (onProgress)
      onProgress(missionCount, missionCount, "Download Complete!");
    return downloadedItems;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to download mission.");
  }
};

// UPLOAD MISSION TO DRONE (Fixed Packet Loss)
export const uploadMissionToDrone = async (
  missionItems,
  homePosition,
  onProgress,
) => {
  try {
    const totalItems = missionItems.length + 1;
    const COMMAND_MAP = {
      16: "MAV_CMD_NAV_WAYPOINT",
      20: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
      22: "MAV_CMD_NAV_TAKEOFF",
      178: "MAV_CMD_DO_CHANGE_SPEED",
      206: "MAV_CMD_DO_SET_CAM_TRIGG_DIST",
    };

    if (onProgress)
      onProgress(0, totalItems, "Clearing old mission from drone...");
    await clearDroneMission();
    await new Promise((r) => setTimeout(r, 1000));

    if (onProgress)
      onProgress(0, totalItems, "Sending total waypoint count...");
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

    let lastHandledSeq = -1;
    let lastHandledTime = Date.now();
    let sequenceRetries = 0;

    while (sequenceRetries < 200) {
      const res = await mavlinkApi
        .get(
          `/v1/mavlink/vehicles/1/components/1/messages/MISSION_REQUEST?_cb=${Date.now()}`,
        )
        .catch(() => null);

      if (res?.data?.message) {
        const requestedSeq = res.data.message.seq;

        // If drone asks for a new sequence OR 1 sec has passed (packet dropped)
        if (
          requestedSeq !== lastHandledSeq ||
          Date.now() - lastHandledTime > 1000
        ) {
          sequenceRetries = 0;
          if (onProgress)
            onProgress(
              requestedSeq,
              totalItems,
              `Uploading Waypoint ${requestedSeq + 1} of ${totalItems}...`,
            );

          let item =
            requestedSeq === 0
              ? {
                  lat: homePosition[0],
                  lon: homePosition[1],
                  alt: 0,
                  command: 16,
                }
              : missionItems[requestedSeq - 1];

          if (item) {
            await mavlinkApi.post("/mavlink", {
              header: { system_id: 255, component_id: 0, sequence: 0 },
              message: {
                type: "MISSION_ITEM_INT",
                target_system: 1,
                target_component: 1,
                seq: requestedSeq,
                frame: { type: "MAV_FRAME_GLOBAL_RELATIVE_ALT" },
                command: {
                  type: COMMAND_MAP[item.command] || "MAV_CMD_NAV_WAYPOINT",
                },
                current: requestedSeq === 0 ? 1 : 0,
                autocontinue: 1,
                x: Math.round(item.lat * 1e7),
                y: Math.round(item.lon * 1e7),
                z: item.alt || 0,
                param1: item.param1 || 0,
                param2: item.param2 || 0,
                param3: item.param3 || 0,
                param4: item.param4 || 0,
                mission_type: { type: "MAV_MISSION_TYPE_MISSION" },
              },
            });

            lastHandledSeq = requestedSeq;
            lastHandledTime = Date.now();

            if (requestedSeq === totalItems - 1) {
              if (onProgress)
                onProgress(
                  totalItems,
                  totalItems,
                  "Mission Uploaded Successfully!",
                );
              return true;
            }
          }
        } else {
          sequenceRetries++;
        }
      } else {
        sequenceRetries++;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  } catch (e) {
    return false;
  }
};
