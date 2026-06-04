import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, RefreshCw, Trophy, Flame, Target, CheckCircle2,
  Clock, Link2, Unlink2, AlertCircle, Loader2, ExternalLink,
  Star, Zap, Shield, Award, TrendingUp
} from 'lucide-react';

const API = 'https://dsa-tracker-oteb.onrender.com';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calcStreaks(calendar) {
  const days = Object.entries(calendar)
    .filter(([, v]) => v > 0)
    .map(([k]) => {
      const d = new Date(parseInt(k) * 1000);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .sort((a, b) => a - b);

  const uniqueDays = [...new Set(days)];
  let longest = 0, current = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  for (let i = 0; i < uniqueDays.length; i++) {
    if (i === 0) { current = 1; }
    else {
      const diff = (uniqueDays[i] - uniqueDays[i - 1]) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  }

  // Current streak
  let streak = 0;
  let check = today.getTime();
  const daySet = new Set(uniqueDays);
  while (daySet.has(check)) { streak++; check -= 86400000; }
  if (streak === 0 && daySet.has(yesterday.getTime())) {
    check = yesterday.getTime();
    while (daySet.has(check)) { streak++; check -= 86400000; }
  }

  return { current: streak, longest };
}

// ── Sub-components ──────────────────────────────────────────────────────────

const DifficultyRing = ({ label, solved, total, color, delay = 0 }) => {
  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;
  const r = 36, cx = 44, cy = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 120 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative w-24 h-24">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{solved}</span>
          <span className="text-xs text-slate-400">/{total}</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </motion.div>
  );
};

const DiffBadge = ({ diff }) => {
  const styles = {
    Easy:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    Hard:   'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[diff] || styles.Medium}`}>
      {diff}
    </span>
  );
};

const ActivityHeatmap = ({ calendar }) => {
  const weeks = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 52 * 7 + 1);

  // Align to Sunday
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const entries = new Set(
    Object.entries(calendar)
      .filter(([, v]) => v > 0)
      .map(([k]) => {
        const d = new Date(parseInt(k) * 1000);
        d.setHours(0, 0, 0, 0);
        return d.toDateString();
      })
  );

  let week = [];
  let d = new Date(startDate);
  while (d <= today) {
    const key = d.toDateString();
    const ts = parseInt(calendar[Math.floor(d.getTime() / 1000)] || 0);
    const count = Object.entries(calendar).find(([k]) => {
      const cd = new Date(parseInt(k) * 1000); cd.setHours(0, 0, 0, 0);
      return cd.toDateString() === key;
    })?.[1] || 0;

    week.push({ date: new Date(d), count: parseInt(count), key });
    if (week.length === 7) { weeks.push(week); week = []; }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const months = [];
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    const m = w[0].date.getMonth();
    if (m !== lastMonth) { months.push({ label: w[0].date.toLocaleString('default', { month: 'short' }), col: wi }); lastMonth = m; }
  });

  const cellColor = (count) => {
    if (!count) return 'bg-slate-800';
    if (count >= 6) return 'bg-violet-500';
    if (count >= 4) return 'bg-violet-400';
    if (count >= 2) return 'bg-violet-300';
    return 'bg-violet-200/70';
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative" style={{ minWidth: `${weeks.length * 14}px` }}>
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: '18px' }}>
          {months.map((m, i) => (
            <div key={i} className="text-xs text-slate-500 absolute" style={{ left: `${m.col * 14 + 18}px` }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 mt-4">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-xs text-slate-600 w-3 h-3 flex items-center justify-center">{i % 2 === 1 ? d : ''}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date.toDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                  className={`w-3 h-3 rounded-sm ${cellColor(day.count)} transition-colors cursor-default`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end">
          <span className="text-xs text-slate-500">Less</span>
          {['bg-slate-800','bg-violet-200/70','bg-violet-300','bg-violet-400','bg-violet-500'].map((c,i)=>(
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`}/>
          ))}
          <span className="text-xs text-slate-500">More</span>
        </div>
      </div>
    </div>
  );
};

const AchievementBadge = ({ icon: Icon, title, desc, unlocked, color }) => (
  <motion.div
    whileHover={{ scale: unlocked ? 1.05 : 1 }}
    className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
      unlocked
        ? `border-${color}-500/40 bg-${color}-500/10`
        : 'border-slate-700 bg-slate-900/40 opacity-40 grayscale'
    }`}
  >
    <div className={`p-3 rounded-full mb-2 ${unlocked ? `bg-${color}-500/20` : 'bg-slate-800'}`}>
      <Icon className={`w-6 h-6 ${unlocked ? `text-${color}-400` : 'text-slate-500'}`} />
    </div>
    <p className="text-xs font-bold text-white">{title}</p>
    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
  </motion.div>
);

// ── Connect Panel ─────────────────────────────────────────────────────────────
const ConnectPanel = ({ onConnected }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = getUser();
      await axios.post(`${API}/api/leetcode/connect`, { userId: user.id, username: username.trim() });
      // Update localStorage user
      const updated = { ...user, leetcodeConnected: true, leetcodeUsername: username.trim() };
      localStorage.setItem('user', JSON.stringify(updated));
      onConnected(username.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect. Check your username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto mt-16"
    >
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
            <Code2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Connect LeetCode</h2>
          <p className="text-slate-400">Enter your public LeetCode username to enable auto-sync. No password needed.</p>
        </div>
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">leetcode.com/</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your-username"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-32 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              required
            />
          </div>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Connecting…</> : <><Link2 className="w-4 h-4" />Connect Profile</>}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const LeetCodeTracker = () => {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState(null);
  const [calendar, setCalendar] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const user = getUser();

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/api/leetcode/stats/${user.id}`);
      if (res.data.connected && res.data.synced) {
        setConnected(true);
        setStats(res.data);
        const calRes = await axios.get(`${API}/api/leetcode/calendar/${user.id}`);
        setCalendar(calRes.data.calendar || {});
      } else if (res.data.connected) {
        setConnected(true);
      }
    } catch { }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await axios.get(`${API}/api/leetcode/sync/${user.id}`);
      const n = res.data.newProblemsAutoLogged;
      setSyncMsg(n > 0 ? `✨ ${n} new problem${n > 1 ? 's' : ''} auto-logged!` : '✅ Already up to date');
      await loadStats();
    } catch (err) {
      setSyncMsg(err.response?.data?.error || '❌ Sync failed. Try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await axios.delete(`${API}/api/leetcode/disconnect/${user.id}`);
      setConnected(false);
      setStats(null);
      setCalendar({});
      const updated = { ...user, leetcodeConnected: false, leetcodeUsername: null };
      localStorage.setItem('user', JSON.stringify(updated));
    } catch { }
    finally { setDisconnecting(false); }
  };

  const handleConnected = async (username) => {
    setConnected(true);
    setSyncing(true);
    try {
      const res = await axios.get(`${API}/api/leetcode/sync/${user.id}`);
      setSyncMsg(`✨ Synced! ${res.data.newProblemsAutoLogged} problems loaded.`);
      await loadStats();
    } catch { }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 4000); }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-400">Please <a href="/login" className="text-violet-400 underline">sign in</a> to view LeetCode analytics.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  if (!connected) return <ConnectPanel onConnected={handleConnected} />;

  if (!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Code2 className="w-16 h-16 text-violet-400 animate-pulse" />
      <p className="text-slate-300 text-lg font-medium">Fetching your LeetCode data…</p>
      <button onClick={handleSync} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />Sync Now
      </button>
    </div>
  );

  const streaks = calcStreaks(calendar);
  const achievements = [
    { icon: Star,      title: '10 Solved',    desc: 'First 10 problems',   unlocked: stats.totalSolved >= 10,   color: 'yellow'  },
    { icon: Zap,       title: '50 Solved',    desc: 'Half century',         unlocked: stats.totalSolved >= 50,   color: 'orange'  },
    { icon: Trophy,    title: '100 Solved',   desc: 'Century club',         unlocked: stats.totalSolved >= 100,  color: 'amber'   },
    { icon: Shield,    title: 'Hard Breaker', desc: 'Solved a Hard problem',unlocked: stats.hardSolved >= 1,     color: 'red'     },
    { icon: Flame,     title: '7-Day Streak', desc: 'Active 7 days',        unlocked: streaks.current >= 7,      color: 'orange'  },
    { icon: Award,     title: '30-Day Streak',desc: 'Active 30 days',       unlocked: streaks.current >= 30,     color: 'violet'  },
    { icon: TrendingUp,title: '250 Solved',   desc: 'Elite solver',         unlocked: stats.totalSolved >= 250,  color: 'emerald' },
    { icon: CheckCircle2,title: 'Consistency',desc: 'Longest streak 14+',   unlocked: streaks.longest >= 14,     color: 'blue'    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">LeetCode Analytics</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <a href={`https://leetcode.com/${stats.username}`} target="_blank" rel="noreferrer"
                className="text-slate-400 text-sm hover:text-violet-400 transition-colors flex items-center gap-1">
                {stats.username} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Synced {timeAgo(stats.lastSyncedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {syncMsg && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-sm font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg">
                {syncMsg}
              </motion.span>
            )}
          </AnimatePresence>
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow hover:shadow-violet-500/25 disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button onClick={handleDisconnect} disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-sm font-medium rounded-xl transition-all border border-slate-600 hover:border-red-500/30">
            <Unlink2 className="w-4 h-4" />Disconnect
          </button>
        </div>
      </motion.div>

      {/* ── Stat Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Solved', value: stats.totalSolved, icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Global Rank',  value: stats.ranking ? `#${stats.ranking.toLocaleString()}` : 'N/A', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Current Streak', value: `${streaks.current}d`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Longest Streak', value: `${streaks.longest}d`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`border rounded-2xl p-5 flex flex-col gap-2 ${s.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <span className={`text-3xl font-extrabold ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Difficulty Rings + Progress Bars ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-8">Difficulty Breakdown</h2>
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Rings */}
          <div className="flex gap-8">
            <DifficultyRing label="Easy"   solved={stats.easySolved}   total={stats.easyTotal}   color="#34d399" delay={0.2} />
            <DifficultyRing label="Medium" solved={stats.mediumSolved} total={stats.mediumTotal} color="#fbbf24" delay={0.35} />
            <DifficultyRing label="Hard"   solved={stats.hardSolved}   total={stats.hardTotal}   color="#f87171" delay={0.5} />
          </div>
          {/* Bar breakdown */}
          <div className="flex-1 space-y-4 w-full">
            {[
              { label: 'Easy',   solved: stats.easySolved,   total: stats.easyTotal,   color: 'bg-emerald-400' },
              { label: 'Medium', solved: stats.mediumSolved, total: stats.mediumTotal, color: 'bg-amber-400'   },
              { label: 'Hard',   solved: stats.hardSolved,   total: stats.hardTotal,   color: 'bg-red-400'     },
            ].map((item, i) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="text-slate-400">{item.solved} <span className="text-slate-600">/ {item.total}</span></span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5">
                  <motion.div
                    className={`h-2.5 rounded-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.total > 0 ? (item.solved / item.total) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Activity Heatmap ── */}
      {Object.keys(calendar).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Activity Calendar</h2>
          <ActivityHeatmap calendar={calendar} />
        </motion.div>
      )}

      {/* ── Recent Submissions ── */}
      {stats.recentSubmissions?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />Recent Accepted
          </h2>
          <div className="space-y-3">
            {stats.recentSubmissions.map((sub, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-slate-900/60 rounded-xl p-4 hover:bg-slate-900 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <a href={`https://leetcode.com/problems/${sub.titleSlug}`} target="_blank" rel="noreferrer"
                    className="text-slate-200 font-medium group-hover:text-violet-400 transition-colors flex items-center gap-1">
                    {sub.title}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <DiffBadge diff={sub.difficulty} />
                  <span className="text-xs text-slate-500">{formatDate(sub.timestamp)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Achievements ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {achievements.map((a, i) => (
            <AchievementBadge key={i} {...a} />
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default LeetCodeTracker;
