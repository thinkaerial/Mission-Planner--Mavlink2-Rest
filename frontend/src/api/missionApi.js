// src/api/missionApi.js
import api from "./config";
import { toast } from "react-toastify";

export const getMissions = async () => {
  try {
    const res = await api.get("/missions");
    return res.data;
  } catch (err) {
    console.error("Could not fetch missions", err);
    toast.error("Failed to load missions.");
    return [];
  }
};

export const saveMission = async (missionToSave) => {
  const promise = api.post("/missions", missionToSave).then((res) => res.data);
  toast.promise(promise, {
    loading: "Saving mission...",
    success: `Mission '${missionToSave.name}' saved!`,
    error: "Could not save mission.",
  });
  return promise;
};

export const createNewMission = async (newMission) => {
  try {
    const res = await api.post("/missions", newMission);
    toast.success(`Mission '${newMission.name}' created.`);
    return res.data;
  } catch (err) {
    toast.error("Failed to create mission.");
    return null;
  }
};

export const deleteMission = async (missionId) => {
  try {
    // This calls the DELETE route on the backend
    await api.delete(`/missions/${missionId}`);
    toast.success("Mission deleted successfully.");
    return true; // Return true to indicate success
  } catch (err) {
    console.error("Delete error:", err);
    toast.error("Failed to delete mission.");
    return false; // Return false to indicate failure
  }
};
