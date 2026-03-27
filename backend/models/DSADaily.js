const mongoose = require('mongoose');

const dsaDailySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  problems: [{
    pattern: { type: String, required: true },
    problemName: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] }
  }],
  totalCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('DSADaily', dsaDailySchema);
