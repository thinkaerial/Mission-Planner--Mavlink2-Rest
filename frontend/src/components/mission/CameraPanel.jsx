// src/components/mission/CameraPanel.jsx
import React from "react";
import { FaCamera, FaInfoCircle } from "react-icons/fa";
import { cameraData } from "../../data/cameraData";

const CameraPanel = ({ missionOptions, setMissionOptions }) => {
  const handleCameraChange = (e) => {
    const selectedCamera = cameraData.find((c) => c.name === e.target.value);
    setMissionOptions((prev) => ({ ...prev, selectedCamera }));
  };

  return (
    <div className="p-3 border-b border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-gray-400">
          <FaCamera />
        </span>
        <h3 className="font-semibold text-gray-300 flex-grow">
          Planning Camera
        </h3>
        <FaInfoCircle
          className="text-gray-500"
          title="The selected camera determines the survey grid calculations."
        />
      </div>
      <select
        value={missionOptions.selectedCamera.name}
        onChange={handleCameraChange}
        className="bg-gray-900 w-full p-2 rounded-md text-white outline-none border border-gray-600 focus:border-blue-500"
      >
        {cameraData.map((cam) => (
          <option key={cam.name} value={cam.name}>
            {cam.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CameraPanel;
