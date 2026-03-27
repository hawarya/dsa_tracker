const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dsaStreak: { type: Number, default: 0 },
  dsaLastActive: { type: Date },
  aptitudeStreak: { type: Number, default: 0 },
  aptitudeLastActive: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Streak', streakSchema);
