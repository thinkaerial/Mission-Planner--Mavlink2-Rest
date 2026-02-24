// backend/controllers/missionController.js
const Mission = require("../models/Mission");

// @desc    Get all missions for a user
// @route   GET /api/missions
exports.getMissions = async (req, res) => {
  try {
    const missions = await Mission.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(missions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create or update a mission
// @route   POST /api/missions
exports.saveMission = async (req, res) => {
  const { name, plan, id } = req.body;

  try {
    // If an ID is provided, update the existing mission
    if (id) {
      let mission = await Mission.findById(id);
      if (!mission) return res.status(404).json({ msg: "Mission not found" });
      if (mission.user.toString() !== req.user.id)
        return res.status(401).json({ msg: "User not authorized" });

      mission = await Mission.findByIdAndUpdate(
        id,
        { name, plan },
        { new: true },
      );
      return res.json(mission);
    }

    // Otherwise, create a new mission
    const newMission = new Mission({
      name,
      plan,
      user: req.user.id,
    });
    const mission = await newMission.save();
    res.json(mission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a mission
// @route   DELETE /api/missions/:id
exports.deleteMission = async (req, res) => {
  try {
    // 1. Find the mission by ID
    let mission = await Mission.findById(req.params.id);

    // 2. Check if mission exists
    if (!mission) {
      return res.status(404).json({ msg: "Mission not found" });
    }

    // 3. Security Check: Ensure the logged-in user owns this mission
    if (mission.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "User not authorized to delete this mission" });
    }

    // 4. Delete from MongoDB
    await Mission.findByIdAndDelete(req.params.id);

    res.json({ msg: "Mission removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
