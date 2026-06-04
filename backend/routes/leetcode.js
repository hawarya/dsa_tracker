const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LeetCodeCache = require('../models/LeetCodeCache');
const DSADaily = require('../models/DSADaily');
const Streak = require('../models/Streak');
const Revision = require('../models/Revision');
const leetcodeService = require('../services/leetcodeService');

// ─── Helper: update DSA streak after auto-logging ───────────────────────────
async function updateDsaStreak(userId) {
  let streak = await Streak.findOne({ userId });
  if (!streak) streak = new Streak({ userId });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastActive = streak.dsaLastActive ? new Date(streak.dsaLastActive) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  const diffDays = lastActive
    ? Math.floor(Math.abs(today - lastActive) / (1000 * 60 * 60 * 24))
    : -1;

  if (diffDays === 1) {
    streak.dsaStreak += 1;
  } else if (diffDays > 1 || diffDays === -1) {
    streak.dsaStreak = 1;
  }
  // diffDays === 0 → already updated today, don't double-count
  if (diffDays !== 0) {
    streak.dsaLastActive = new Date();
    await streak.save();
  }
}

// ─── Helper: auto-log new LeetCode submissions to DSADaily ──────────────────
async function autoLogSubmissions(userId, newSubs) {
  if (!newSubs.length) return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const sub of newSubs) {
    const subDate = new Date(sub.timestamp * 1000);
    const logDateStart = new Date(subDate);
    logDateStart.setHours(0, 0, 0, 0);
    const logDateEnd = new Date(logDateStart);
    logDateEnd.setDate(logDateEnd.getDate() + 1);

    const problem = {
      pattern: 'LeetCode',
      problemName: sub.title,
      difficulty: sub.difficulty || 'Medium',
    };

    let dsaLog = await DSADaily.findOne({
      userId,
      date: { $gte: logDateStart, $lt: logDateEnd },
    });

    if (dsaLog) {
      // Avoid duplicate entries for the same problem
      const alreadyLogged = dsaLog.problems.some(p => p.problemName === sub.title);
      if (!alreadyLogged) {
        dsaLog.problems.push(problem);
        dsaLog.totalCount = dsaLog.problems.length;
        await dsaLog.save();
      }
    } else {
      dsaLog = new DSADaily({ userId, date: logDateStart, problems: [problem], totalCount: 1 });
      await dsaLog.save();
    }

    // Schedule revision for tomorrow if it's today's submission
    if (subDate >= todayStart) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await new Revision({
        userId, type: 'DSA', topicOrProblem: sub.title, scheduledDate: tomorrow,
      }).save();
    }
  }

  // Update streak for today's new submissions
  const todayNewSubs = newSubs.filter(s => new Date(s.timestamp * 1000) >= todayStart);
  if (todayNewSubs.length > 0) {
    await updateDsaStreak(userId);
  }
}

// ─── POST /api/leetcode/connect ─────────────────────────────────────────────
// Save username, validate it exists, create initial cache
router.post('/connect', async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'userId and username required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validate username exists on LeetCode
    let profile;
    try {
      profile = await leetcodeService.getUserProfile(username.trim());
    } catch (err) {
      return res.status(400).json({ error: `LeetCode user "${username}" not found. Please check your username.` });
    }

    user.leetcodeUsername = profile.username;
    user.leetcodeConnected = true;
    await user.save();

    // Create or reset cache
    await LeetCodeCache.findOneAndUpdate(
      { userId },
      { userId, username: profile.username, lastSyncedAt: null },
      { upsert: true, new: true }
    );

    res.json({ message: 'LeetCode connected successfully', username: profile.username });
  } catch (err) {
    console.error('LeetCode connect error:', err.message);
    res.status(500).json({ error: 'Server error connecting LeetCode profile' });
  }
});

// ─── DELETE /api/leetcode/disconnect/:userId ─────────────────────────────────
router.delete('/disconnect/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.leetcodeUsername = null;
    user.leetcodeConnected = false;
    await user.save();
    res.json({ message: 'LeetCode disconnected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/leetcode/sync/:userId ─────────────────────────────────────────
// Main sync endpoint: fetch fresh data, detect new submissions, auto-log them
router.get('/sync/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.leetcodeConnected || !user.leetcodeUsername) {
      return res.status(400).json({ error: 'LeetCode not connected' });
    }

    const { profile, calendar, recentAC } = await leetcodeService.fullSync(user.leetcodeUsername);

    let cache = await LeetCodeCache.findOne({ userId: user._id });
    if (!cache) {
      cache = new LeetCodeCache({ userId: user._id, username: user.leetcodeUsername });
    }

    // Delta detection — find submissions not yet synced
    const syncedSet = new Set(cache.syncedTimestamps || []);
    const newSubs = recentAC.filter(s => !syncedSet.has(s.timestamp));

    // Auto-log new submissions to DSADaily
    await autoLogSubmissions(user._id, newSubs);

    // Update cache
    cache.username = profile.username;
    cache.easySolved = profile.easySolved;
    cache.mediumSolved = profile.mediumSolved;
    cache.hardSolved = profile.hardSolved;
    cache.totalSolved = profile.totalSolved;
    cache.ranking = profile.ranking;
    cache.easyTotal = profile.easyTotal;
    cache.mediumTotal = profile.mediumTotal;
    cache.hardTotal = profile.hardTotal;
    cache.totalQuestions = profile.totalQuestions;
    cache.submissionCalendar = calendar;
    cache.recentSubmissions = recentAC.map(s => ({
      title: s.title,
      titleSlug: s.titleSlug,
      difficulty: s.difficulty,
      timestamp: s.timestamp,
      statusDisplay: 'Accepted',
    }));
    cache.syncedTimestamps = [
      ...new Set([...(cache.syncedTimestamps || []), ...recentAC.map(s => s.timestamp)])
    ].slice(-200); // keep last 200
    cache.lastSyncedAt = new Date();
    await cache.save();

    res.json({
      synced: true,
      newProblemsAutoLogged: newSubs.length,
      profile,
      calendar,
      recentSubmissions: cache.recentSubmissions,
      lastSyncedAt: cache.lastSyncedAt,
    });
  } catch (err) {
    console.error('LeetCode sync error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to sync LeetCode data' });
  }
});

// ─── GET /api/leetcode/stats/:userId ────────────────────────────────────────
// Return cached stats (no fresh fetch)
router.get('/stats/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.leetcodeConnected) {
      return res.json({ connected: false });
    }
    const cache = await LeetCodeCache.findOne({ userId: req.params.userId });
    if (!cache) return res.json({ connected: true, synced: false });

    res.json({
      connected: true,
      synced: true,
      username: cache.username,
      easySolved: cache.easySolved,
      mediumSolved: cache.mediumSolved,
      hardSolved: cache.hardSolved,
      totalSolved: cache.totalSolved,
      ranking: cache.ranking,
      easyTotal: cache.easyTotal,
      mediumTotal: cache.mediumTotal,
      hardTotal: cache.hardTotal,
      totalQuestions: cache.totalQuestions,
      recentSubmissions: cache.recentSubmissions,
      lastSyncedAt: cache.lastSyncedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/leetcode/calendar/:userId ─────────────────────────────────────
router.get('/calendar/:userId', async (req, res) => {
  try {
    const cache = await LeetCodeCache.findOne({ userId: req.params.userId });
    if (!cache) return res.json({ calendar: {} });
    res.json({ calendar: JSON.parse(cache.submissionCalendar || '{}') });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
