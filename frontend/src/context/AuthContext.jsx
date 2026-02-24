// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/config";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthResponse = (response) => {
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    setUser(user);
    navigate("/dashboard"); // Navigate to a protected page
  };

  const handleError = (error, type) => {
    const message =
      error.response?.data?.msg || `An unknown ${type} error occurred.`;
    toast.error(message);
    throw new Error(message);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      handleAuthResponse(response);
      toast.success("Logged in successfully!");
    } catch (error) {
      handleError(error, "login");
    }
  };

  // --- UPDATED: The signup function now accepts and sends the username ---
  const signup = async (username, email, password) => {
    try {
      const response = await api.post("/auth/signup", {
        username,
        email,
        password,
      });
      handleAuthResponse(response);
      toast.success("Account created successfully!");
    } catch (error) {
      handleError(error, "signup");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
    toast.info("You have been logged out.");
  };

  const value = { user, login, signup, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
