const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    ease: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 }, // in days
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    due: { type: Date, default: () => new Date() },
    lastReviewedAt: { type: Date},
});

flashcardSchema.index({ user: 1, due: 1 });
flashcardSchema.index({ user: 1, reps: 1 });
flashcardSchema.index({ user: 1, folder: 1, due: 1 });
module.exports = mongoose.model('Flashcard', flashcardSchema);

