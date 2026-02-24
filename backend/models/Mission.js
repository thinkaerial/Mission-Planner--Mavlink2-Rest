// backend/models/Mission.js
const mongoose = require("mongoose");

const MissionItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    command: { type: Number, required: true },
    param1: { type: Number, default: 0 },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    alt: { type: Number, required: true },
  },
  { _id: false },
);

const MissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    plan: [MissionItemSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Mission", MissionSchema);
