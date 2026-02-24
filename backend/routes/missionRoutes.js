// backend/routes/missionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMissions,
  saveMission,
  deleteMission,
} = require("../controllers/missionController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes here are protected
router.use(authMiddleware);

router.route("/").get(getMissions).post(saveMission);
router.route("/:id").delete(deleteMission);

module.exports = router;
