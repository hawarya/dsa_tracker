const express = require('express');
const router = express.Router();
const Revision = require('../models/Revision');

router.get('/:userId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const revisions = await Revision.find({
      userId: req.params.userId,
      completed: false,
      scheduledDate: { $lte: today }
    }).sort({ scheduledDate: 1 });
    
    res.json(revisions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const rev = await Revision.findById(req.params.id);
    if (!rev) return res.status(404).json({ error: 'Not found' });
    
    rev.completed = true;
    await rev.save();
    
    const intervals = [1, 3, 7, 14, 30];
    const nextInterval = intervals[rev.revisionNumber] || 30; 
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    
    const nextRev = new Revision({
      userId: rev.userId,
      type: rev.type,
      topicOrProblem: rev.topicOrProblem,
      scheduledDate: nextDate,
      revisionNumber: rev.revisionNumber + 1
    });
    await nextRev.save();
    
    res.json({ message: 'Revision completed and next scheduled', nextRev });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
