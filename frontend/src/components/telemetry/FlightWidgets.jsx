import React from "react";
import TelemetryReadout from "./TelemetryReadout";
import PrimaryFlightDisplay from "./PrimaryFlightDisplay";

const FlightWidgets = () => {
  return (
    <div className="absolute top-4 left-4 z-50 flex flex-col gap-3">
      {/* <PrimaryFlightDisplay /> */}
      <TelemetryReadout />
    </div>
  );
};

export default FlightWidgets;
