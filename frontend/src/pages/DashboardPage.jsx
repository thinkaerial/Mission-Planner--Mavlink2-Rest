import React from "react";
import { TelemetryProvider } from "../context/TelemetryContext";
import AppLayout from "../pages/AppLayoutPage";
import FlightWidgets from "../components/telemetry/FlightWidgets";
import MapDisplay from "../components/map/MapDisplay";
import TelemetryHUD from "../components/telemetry/TelemetryHUD";

const MainContent = () => {
  return (
    <AppLayout>
      <MapDisplay />
      <FlightWidgets />
      <TelemetryHUD />
    </AppLayout>
  );
};

function DashboardPage() {
  return (
    <TelemetryProvider>
      <MainContent />
    </TelemetryProvider>
  );
}

export default DashboardPage;
