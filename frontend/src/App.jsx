// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import MissionPlannerPage from "./pages/MissionPlannerPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white">
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white">
        Loading...
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mission-planner"
          element={
            <PrivateRoute>
              <MissionPlannerPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
