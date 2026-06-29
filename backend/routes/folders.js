const express = require("express");
const Folder = require("../models/Folder");
const Flashcard = require("../models/Flashcard");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user._id }).sort({ name: 1 }).lean();
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const folder = await Folder.create({ name, user: req.user._id });
    res.status(201).json(folder);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "folder exists" });
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const update = {};
    if (typeof req.body?.name === "string" && req.body.name.trim()) {
      update.name = req.body.name.trim();
    }
    if ("schedule" in req.body) {
      update.schedule = !!req.body.schedule;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const updated = await Folder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Flashcard.deleteMany({ folder: id, user: req.user._id });
    const del = await Folder.findOneAndDelete({ _id: id, user: req.user._id });
    if (!del) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
