// src/components/mission/SurveyPatternPanel.jsx
import React from "react";
import { FaPlay, FaRedo, FaPlane, FaCube, FaInfoCircle } from "react-icons/fa";
import { convertToMeters, convertFromMeters } from "../../utils/unitConversion";

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={onChange}
    />
    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
);

const SurveyPatternPanel = ({
  onGenerateMission,
  missionGenerated,
  defaultAltitude,
  setDefaultAltitude,
  gsdInches,
  boundaryPoints,
  altitudeUnit,
  setAltitudeUnit,
  surveyOptions,
  setSurveyOptions,
}) => {
  const altitudeInDisplayUnits = Math.round(
    convertFromMeters(defaultAltitude, altitudeUnit),
  );

  const handleAltitudeChange = (valueInDisplayUnits) => {
    const valueInMeters = convertToMeters(
      parseFloat(valueInDisplayUnits) || 0,
      altitudeUnit,
    );
    setDefaultAltitude(valueInMeters);
  };

  const handleEnhanced3DChange = (e) => {
    setSurveyOptions((prev) => ({ ...prev, enhanced3D: e.target.checked }));
  };

  return (
    <div>
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400">
            <FaPlane />
          </span>
          <h3 className="font-semibold text-gray-300 flex-grow">
            Flight Altitude
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={altitudeUnit === "ft" ? 30 : 10}
            max={altitudeUnit === "ft" ? 500 : 150}
            value={altitudeInDisplayUnits}
            onChange={(e) => handleAltitudeChange(e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-md">
            <input
              type="number"
              value={altitudeInDisplayUnits}
              onChange={(e) => handleAltitudeChange(e.target.value)}
              className="w-16 p-1.5 bg-transparent text-white outline-none text-center"
            />
            <select
              value={altitudeUnit}
              onChange={(e) => setAltitudeUnit(e.target.value)}
              className="pr-2 bg-transparent text-gray-400 text-xs outline-none"
            >
              <option value="m">m</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>
        {gsdInches > 0 && (
          <p className="text-center text-gray-400 text-xs mt-2">
            Resolution:{" "}
            <span className="text-white font-bold">{gsdInches} in / px</span>
          </p>
        )}
      </div>

      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCube className="text-gray-400" />
          <span className="font-semibold text-gray-300">Crosshatch 3D</span>
          <FaInfoCircle
            className="text-gray-500 cursor-pointer"
            title="Generates a crosshatch flight pattern for improved 3D model quality."
          />
        </div>
        <ToggleSwitch
          checked={surveyOptions.enhanced3D}
          onChange={handleEnhanced3DChange}
        />
      </div>

      <div className="p-3">
        <button
          onClick={onGenerateMission}
          disabled={!boundaryPoints || boundaryPoints.length < 3}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-white bg-blue-600 border border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)] rounded-md hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {missionGenerated ? <FaRedo /> : <FaPlay />}
          {missionGenerated ? "Re-Generate Mission" : "Generate Mission"}
        </button>
      </div>
    </div>
  );
};

export default SurveyPatternPanel;
