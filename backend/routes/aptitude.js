const express = require('express');
const router = express.Router();
const AptitudeLog = require('../models/AptitudeLog');
const Streak = require('../models/Streak');
const Revision = require('../models/Revision');
const AptitudeCycle = require('../models/AptitudeCycle');

router.post('/', async (req, res) => {
  try {
    const { userId, topicCovered, durationMinutes } = req.body;
    
    const aptiLog = new AptitudeLog({
      userId,
      topicCovered,
      durationMinutes
    });
    await aptiLog.save();

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    let cycle = await AptitudeCycle.findOne({ userId });
    let streak = await Streak.findOne({ userId });
    if (!streak) streak = new Streak({ userId });

    let lastCycleActive = cycle && cycle.lastActiveDate ? new Date(cycle.lastActiveDate) : null;
    if (lastCycleActive) lastCycleActive.setHours(0,0,0,0);
    
    const diffTimeCycle = lastCycleActive ? Math.abs(todayStart - lastCycleActive) : -1;
    const diffDaysCycle = lastCycleActive ? Math.floor(diffTimeCycle / (1000 * 60 * 60 * 24)) : -1;

    let cycleCompleted = false;

    if (!cycle) {
      cycle = new AptitudeCycle({
        userId,
        currentTopic: topicCovered,
        currentDay: 1,
        lastActiveDate: new Date()
      });
      streak.aptitudeStreak = 0;
    } else {
      if (diffDaysCycle === 1) {
        if (cycle.currentDay >= 3) {
          cycle.currentTopic = topicCovered;
          cycle.currentDay = 1;
        } else {
          if (cycle.currentTopic === topicCovered) {
             cycle.currentDay += 1;
             if (cycle.currentDay === 3) {
               cycleCompleted = true;
             }
          } else {
             cycle.currentTopic = topicCovered;
             cycle.currentDay = 1;
             streak.aptitudeStreak = 0;
          }
        }
      } else if (diffDaysCycle === 0) {
        // Logged multiple times today, do nothing to currentDay but save log
      } else {
        // Missed a day / broken streak
        cycle.currentTopic = topicCovered;
        cycle.currentDay = 1;
        streak.aptitudeStreak = 0;
      }
      
      if (diffDaysCycle !== 0) {
        cycle.lastActiveDate = new Date();
      }
    }
    
    await cycle.save();

    if (cycleCompleted) {
      streak.aptitudeStreak += 1;
    }
    
    if (diffDaysCycle !== 0) {
       streak.aptitudeLastActive = new Date();
       await streak.save();
    }

    const revDate = new Date();
    revDate.setDate(revDate.getDate() + 3);
    
    const rev = new Revision({
      userId,
      type: 'Aptitude',
      topicOrProblem: topicCovered,
      scheduledDate: revDate
    });
    await rev.save();

    res.status(201).json({ message: 'Aptitude practice logged', aptiLog, cycle });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const logs = await AptitudeLog.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { topicCovered, durationMinutes } = req.body;
    const log = await AptitudeLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    
    if (topicCovered) log.topicCovered = topicCovered;
    if (durationMinutes !== undefined) log.durationMinutes = durationMinutes;
    
    await log.save();
    res.json({ message: 'Log updated successfully', log });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const log = await AptitudeLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
