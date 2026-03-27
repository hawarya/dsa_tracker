const mongoose = require('mongoose');

const aptitudeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  topicCovered: { type: String, required: true },
  durationMinutes: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('AptitudeLog', aptitudeLogSchema);
