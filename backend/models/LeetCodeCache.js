const mongoose = require('mongoose');

const recentSubmissionSchema = new mongoose.Schema({
  title: String,
  titleSlug: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  timestamp: Number, // unix epoch
  statusDisplay: String,
}, { _id: false });

const leetCodeCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true },
  // Solved counts
  easySolved:   { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved:   { type: Number, default: 0 },
  totalSolved:  { type: Number, default: 0 },
  // LeetCode global stats
  ranking:        { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  easyTotal:      { type: Number, default: 0 },
  mediumTotal:    { type: Number, default: 0 },
  hardTotal:      { type: Number, default: 0 },
  // Activity heatmap — stored as stringified JSON { "timestamp": count }
  submissionCalendar: { type: String, default: '{}' },
  // Last ~20 accepted submissions
  recentSubmissions: [recentSubmissionSchema],
  // Timestamps of accepted submissions already auto-logged to DSADaily
  syncedTimestamps: [{ type: Number }],
  lastSyncedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('LeetCodeCache', leetCodeCacheSchema);
