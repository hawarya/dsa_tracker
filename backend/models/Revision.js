const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['DSA', 'Aptitude'], required: true },
  topicOrProblem: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  revisionNumber: { type: Number, default: 1 }, 
}, { timestamps: true });

module.exports = mongoose.model('Revision', revisionSchema);
