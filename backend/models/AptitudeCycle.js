const mongoose = require('mongoose');

const aptitudeCycleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentTopic: { type: String, required: true },
  currentDay: { type: Number, default: 1, min: 1, max: 3 },
  lastActiveDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('AptitudeCycle', aptitudeCycleSchema);
