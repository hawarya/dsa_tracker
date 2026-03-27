const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Pattern', patternSchema);
