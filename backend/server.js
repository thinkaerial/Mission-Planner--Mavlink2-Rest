// backend/server.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

connectDB();

// --- Route Imports ---
const authRoutes = require("./routes/auth");
const missionRoutes = require("./routes/missionRoutes");

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/missions", missionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Node Backend] Server running on port ${PORT}`);
});
