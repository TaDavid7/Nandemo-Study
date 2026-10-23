const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Username and password required" });
    }
    if (await User.findOne({ username })) {
      return res.status(409).json({ error: "That username is taken.", code: "taken" });
    }
    const user = new User({ username, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    // Register already reveals which usernames exist, so say which part was wrong.
    if (!user) {
      return res.status(401).json({ error: `There's no account called "${username}".`, code: "no_user" });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ error: "That password isn't right.", code: "wrong_password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
