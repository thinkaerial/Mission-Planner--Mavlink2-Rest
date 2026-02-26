import React, { useState } from "react";
import { FaCamera, FaCalculator, FaChevronDown } from "react-icons/fa";
import { cameraData } from "../../data/cameraData";

const SpecRow = ({ label, value, unit }) => (
  <div className="flex justify-between items-center text-xs mb-1.5 border-b border-gray-700/30 pb-1">
    <span className="text-gray-400">{label}</span>
    <div className="text-right font-mono text-gray-200">
      <span>{value || 0}</span>
      <span className="ml-1.5 text-gray-500 w-6 inline-block text-right">
        {unit}
      </span>
    </div>
  </div>
);

const CalculatedField = ({ label, value, unit, highlight = false }) => (
  <div className="flex justify-between items-center text-[11px] mb-1.5 border-b border-gray-700/50 pb-1">
    <span className="text-gray-400">{label}</span>
    <div
      className={`text-right font-mono ${highlight ? "text-green-400 font-bold" : "text-gray-200"}`}
    >
      <span>{value || 0}</span>
      {unit && (
        <span className="ml-1 text-gray-500 inline-block text-left w-auto">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const MissionSettingsPanel = ({
  missionOptions,
  setMissionOptions,
  missionCalcs,
}) => {
  const { selectedCamera } = missionOptions;
  const [isCameraConfigOpen, setIsCameraConfigOpen] = useState(false);
  const [isCalcsOpen, setIsCalcsOpen] = useState(true);

  const handleCameraChange = (e) => {
    const newCamera = cameraData.find((c) => c.name === e.target.value);
    if (newCamera) {
      setMissionOptions((prev) => ({ ...prev, selectedCamera: newCamera }));
    }
  };

  return (
    <div className="bg-transparent text-white text-sm">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-3 text-gray-300 font-semibold">
          <FaCamera className="text-gray-400" />
          <h3>Planning Camera</h3>
        </div>

        <select
          value={selectedCamera.name}
          onChange={handleCameraChange}
          className="bg-[#0f172a] w-full p-2.5 rounded-md text-white text-xs outline-none border border-gray-600 focus:border-blue-500 mb-2"
        >
          {cameraData.map((cam) => (
            <option key={cam.name} value={cam.name}>
              {cam.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsCameraConfigOpen(!isCameraConfigOpen)}
          className="w-full flex items-center justify-between p-2 rounded bg-[#1e293b]/50 border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Hardware Specs
          </span>
          <FaChevronDown
            className={`text-gray-400 text-xs transition-transform duration-300 ${isCameraConfigOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`transition-all duration-300 overflow-hidden ${isCameraConfigOpen ? "max-h-[200px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          <div className="p-3 bg-[#1e293b]/50 rounded-md border border-gray-700">
            <SpecRow
              label="Focal Length"
              value={selectedCamera.focalLength}
              unit="mm"
            />
            <SpecRow
              label="Sensor Width"
              value={selectedCamera.sensorWidth}
              unit="mm"
            />
            <SpecRow
              label="Sensor Height"
              value={selectedCamera.sensorHeight}
              unit="mm"
            />
            <SpecRow
              label="Resolution"
              value={`${selectedCamera.imageWidth}x${selectedCamera.imageHeight}`}
              unit="px"
            />
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={() => setIsCalcsOpen(!isCalcsOpen)}
          className="w-full flex items-center justify-between p-2 rounded bg-[#1e293b]/50 border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-2">
            <FaCalculator className="text-gray-400" /> Calculated Values
          </span>
          <FaChevronDown
            className={`text-gray-400 text-xs transition-transform duration-300 ${isCalcsOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`transition-all duration-300 overflow-hidden ${isCalcsOpen ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          <div className="p-3 bg-[#1e293b]/50 rounded-md border border-gray-700 grid grid-cols-2 gap-x-4">
            <div className="col-span-1">
              <CalculatedField
                label="Area:"
                value={
                  missionCalcs.areaSqMeters
                    ? missionCalcs.areaSqMeters.toFixed(2)
                    : "0.00"
                }
                unit="m²"
              />
              <CalculatedField
                label="Distance:"
                value={
                  missionCalcs.distanceKm
                    ? missionCalcs.distanceKm.toFixed(2)
                    : "0.00"
                }
                unit="km"
              />
              <CalculatedField
                label="Dist between images:"
                value={
                  missionCalcs.triggerDistance
                    ? missionCalcs.triggerDistance.toFixed(2)
                    : "0.00"
                }
                unit="m"
              />
              <CalculatedField
                label="Ground Resolution:"
                value={missionCalcs.gsd ? missionCalcs.gsd.toFixed(2) : "0.00"}
                unit="cm/px"
              />
              <CalculatedField
                label="Flight Time (est):"
                value={missionCalcs.flightTimeString || "0:00"}
                unit="Minutes"
              />
              <CalculatedField
                label="Photo every (est):"
                value={
                  missionCalcs.photoEvery
                    ? missionCalcs.photoEvery.toFixed(2)
                    : "0.00"
                }
                unit="Seconds"
              />
            </div>
            <div className="col-span-1">
              <CalculatedField
                label="Pictures:"
                value={missionCalcs.imageCount || "0"}
                unit=""
              />
              <CalculatedField
                label="No of Strips:"
                value={missionCalcs.numStrips || "0"}
                unit=""
              />
              <CalculatedField
                label="Footprint:"
                value={
                  missionCalcs.imageFootprintWidth
                    ? `${missionCalcs.imageFootprintWidth.toFixed(2)}x${missionCalcs.imageFootprintHeight.toFixed(2)}`
                    : "0.00x0.00"
                }
                unit="m"
              />
              <CalculatedField
                label="Dist between lines:"
                value={
                  missionCalcs.lineSpacing
                    ? missionCalcs.lineSpacing.toFixed(2)
                    : "0.00"
                }
                unit="m"
              />
              <CalculatedField
                label="Turn Dia (at 45d):"
                value={missionCalcs.turnDia || "0"}
                unit="m"
              />
              <CalculatedField
                label="Ground Elevation:"
                value={missionCalcs.groundElevation || "0"}
                unit="m"
              />
            </div>
            <div className="col-span-2 mt-2">
              <CalculatedField
                label="Min Shutter Speed:"
                value={missionCalcs.minShutterSpeed || "0"}
                unit=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionSettingsPanel;
