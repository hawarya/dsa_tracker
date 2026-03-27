const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');
const DSADaily = require('../models/DSADaily');
const AptitudeLog = require('../models/AptitudeLog');
const AptitudeCycle = require('../models/AptitudeCycle');
const User = require('../models/User');

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const streak = await Streak.findOne({ userId });
    
    // Total stats
    const dsaLogs = await DSADaily.find({ userId });
    let totalDsaProblems = 0;
    
    // Aggregate pattern counts
    const patternCounts = {};
    dsaLogs.forEach(log => {
      totalDsaProblems += log.totalCount;
      log.problems.forEach(p => {
        patternCounts[p.pattern] = (patternCounts[p.pattern] || 0) + 1;
      });
    });

    const aptiLogs = await AptitudeLog.find({ userId });
    const aptitudeCycle = await AptitudeCycle.findOne({ userId });
    
    // Today's DSA Solved
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayDsaLog = await DSADaily.findOne({ userId, date: { $gte: todayStart } });
    const dsaSolvedToday = todayDsaLog ? todayDsaLog.totalCount : 0;
    
    res.json({
      user: {
        dsaDailyTarget: user.dsaDailyTarget,
        isFirstLogin: user.isFirstLogin,
        name: user.name
      },
      streak: streak || { dsaStreak: 0, aptitudeStreak: 0 },
      dsaSolvedToday,
      totalDsaProblems,
      totalAptitudeTopics: aptiLogs.length,
      aptitudeCycle: aptitudeCycle || null,
      patternCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
