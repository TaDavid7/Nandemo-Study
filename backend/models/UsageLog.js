const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // UTC day
  count: { type: Number, default: 1 },
});

usageLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UsageLog', usageLogSchema);
