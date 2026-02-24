// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res
        .status(400)
        .json({ msg: "User with this email already exists" });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: "This username is already taken" });
    }

    user = new User({
      username,
      email,
      password,
    });

    await user.save();

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: { id: user.id, username: user.username, email: user.email },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, username: user.username, email: user.email },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
