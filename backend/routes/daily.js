const express = require("express");
const Flashcard = require("../models/Flashcard");
const Folder = require("../models/Folder");
const auth = require("../middleware/auth");
const { nextSchedule, todayBounds, MAX_REVIEW, MAX_NEW } = require("../lib/schedule");

const router = express.Router();

router.get("/daily", auth, async (req, res) => {
  try {
    const scheduled = await Folder.find({ user: req.user._id, schedule: true })
      .select("_id name")
      .sort({ name: 1 })
      .lean();
    const folderIds = scheduled.map((f) => f._id);
    const { end: endOfToday } = todayBounds();
    const baseMatch = { user: req.user._id };
    if (folderIds.length) baseMatch.folder = { $in: folderIds };

    const review = await Flashcard.find({
      ...baseMatch,
      due: { $lte: endOfToday },
      reps: { $gte: 0 },
    })
      .select("_id question answer folder ease interval reps lapses due")
      .sort({ due: 1, _id: 1 })
      .limit(MAX_REVIEW)
      .lean();

    const news = await Flashcard.find({ ...baseMatch, reps: 0 })
      .select("_id question answer folder ease interval reps lapses due")
      .limit(MAX_NEW)
      .lean();

    res.json({ review, news });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/review", auth, async (req, res) => {
  try {
    const { cardId, grade } = req.body || {};
    if (!cardId || ![0, 1, 2, 3].includes(grade)) {
      return res.status(400).json({ error: "cardId and grade (0..3) required" });
    }

    const card = await Flashcard.findOne(
      { _id: cardId, user: req.user._id },
      "ease interval reps lapses due"
    );
    if (!card) return res.status(404).json({ error: "not found" });

    Object.assign(card, nextSchedule(card, grade, new Date()));
    await card.save();

    res.json({
      _id: card._id,
      ease: card.ease,
      interval: card.interval,
      reps: card.reps,
      lapses: card.lapses,
      due: card.due,
      lastReviewedAt: card.lastReviewedAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
