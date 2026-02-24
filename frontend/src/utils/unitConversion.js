// src/utils/unitConversion.js
export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 0.3048;

// --- NEW: Speed Conversions ---
export const MPS_TO_MPH = 2.23694;
export const MPH_TO_MPS = 0.44704;

export const convertToMeters = (value, unit) => {
  return unit === "ft" ? value * FEET_TO_METERS : value;
};

export const convertFromMeters = (value, unit) => {
  return unit === "ft" ? value * METERS_TO_FEET : value;
};
