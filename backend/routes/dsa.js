const express = require('express');
const router = express.Router();
const DSADaily = require('../models/DSADaily');
const Streak = require('../models/Streak');
const Revision = require('../models/Revision');
const User = require('../models/User');
const Pattern = require('../models/Pattern');

router.post('/', async (req, res) => {
  try {
    const { userId, problems } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    let dsaLog = await DSADaily.findOne({
      userId,
      date: { $gte: todayStart }
    });

    if (dsaLog) {
      dsaLog.problems.push(...problems);
      dsaLog.totalCount = dsaLog.problems.length;
      await dsaLog.save();
    } else {
      dsaLog = new DSADaily({
        userId,
        problems,
        totalCount: problems.length
      });
      await dsaLog.save();
    }

    if (dsaLog.totalCount >= user.dsaDailyTarget && user.dsaDailyTarget > 0) {
      let streak = await Streak.findOne({ userId });
      if (!streak) streak = new Streak({ userId });
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let lastActive = streak.dsaLastActive ? new Date(streak.dsaLastActive) : null;
      if (lastActive) lastActive.setHours(0,0,0,0);
      
      const diffTime = lastActive ? Math.abs(today - lastActive) : -1;
      const diffDays = lastActive ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : -1;
      
      if (diffDays === 1) {
        streak.dsaStreak += 1;
        streak.dsaLastActive = new Date();
        await streak.save();
      } else if (diffDays > 1 || diffDays === -1) {
        streak.dsaStreak = 1;
        streak.dsaLastActive = new Date();
        await streak.save();
      }
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    for (let p of problems) {
      const rev = new Revision({
        userId,
        type: 'DSA',
        topicOrProblem: p.problemName,
        scheduledDate: tomorrow
      });
      await rev.save();
    }

    res.status(201).json({ message: 'DSA practice logged successfully', dsaLog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const logs = await DSADaily.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:logId/problem/:problemId', async (req, res) => {
  try {
    const { pattern, problemName, difficulty } = req.body;
    const dsaLog = await DSADaily.findById(req.params.logId);
    if (!dsaLog) return res.status(404).json({ error: 'Log not found' });
    
    const problem = dsaLog.problems.id(req.params.problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    
    if (pattern) problem.pattern = pattern;
    if (problemName) problem.problemName = problemName;
    if (difficulty) problem.difficulty = difficulty;
    
    await dsaLog.save();
    res.json({ message: 'Problem updated successfully', dsaLog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:logId/problem/:problemId', async (req, res) => {
  try {
    const dsaLog = await DSADaily.findById(req.params.logId);
    if (!dsaLog) return res.status(404).json({ error: 'Log not found' });
    
    const problemIndex = dsaLog.problems.findIndex(p => p._id.toString() === req.params.problemId);
    if (problemIndex === -1) return res.status(404).json({ error: 'Problem not found' });
    
    dsaLog.problems.splice(problemIndex, 1);
    dsaLog.totalCount = dsaLog.problems.length;
    await dsaLog.save();
    
    res.json({ message: 'Problem deleted successfully', dsaLog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/patterns', async (req, res) => {
  try {
    const { userId, name } = req.body;
    let pattern = await Pattern.findOne({ userId, name });
    if (!pattern) {
      pattern = new Pattern({ userId, name });
      await pattern.save();
    }
    res.status(201).json(pattern);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/patterns/:userId', async (req, res) => {
  try {
    const patterns = await Pattern.find({ userId: req.params.userId });
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
