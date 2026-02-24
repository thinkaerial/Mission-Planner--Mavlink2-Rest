// frontend/src/api/config.jsx
import axios from "axios";

// Create an Axios instance to communicate with the backend
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Your backend server URL
  headers: {
    "Content-Type": "application/json",
  },
});

/*
  This is an Axios Interceptor. It runs before every request is sent.
  Its job is to check if a token exists in localStorage.
  If it does, it automatically adds the 'Authorization' header to the request.
  This is crucial for accessing protected routes on your backend.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Configure the header to match what the backend expects (e.g., 'Bearer Token')
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle any errors that occur during request setup
    return Promise.reject(error);
  }
);

export default api;
