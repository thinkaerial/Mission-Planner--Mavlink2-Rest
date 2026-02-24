// backend/config/db.js
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error("[DB ERROR] MONGO_URI is not defined in the .env file.");
      process.exit(1);
    }

    // REMOVED deprecated options: useNewUrlParser, useUnifiedTopology
    await mongoose.connect(mongoURI);

    console.log("[Node Backend] MongoDB successfully connected to Atlas!");
  } catch (err) {
    console.error("[DB ERROR] MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
