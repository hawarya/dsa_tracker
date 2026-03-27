import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Target, CheckSquare, BookOpen, Flame, Award, List } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex items-center space-x-4"
  >
    <div className={`p-4 rounded-lg bg-slate-900 ${colorClass}`}>
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupTarget, setSetupTarget] = useState(5);

  const fetchStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      const res = await axios.get(`http://localhost:5000/api/dashboard/${user.id}`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.put('http://localhost:5000/api/auth/setup', {
        userId: user.id,
        dsaDailyTarget: setupTarget
      });
      // Refresh dashboard data
      fetchStats();
    } catch (err) {
      console.error('Setup failed', err);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!stats) return <div className="text-white text-center mt-20">Please log in.</div>;

  // First time setup check
  if (stats.user.isFirstLogin) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-20 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700"
      >
        <div className="text-center mb-6">
          <Target className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Welcome, {stats.user.name}!</h2>
          <p className="text-slate-400 mt-2">Let's set your daily goal for DSA problems.</p>
        </div>
        <form onSubmit={handleSetupSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Daily DSA Target</label>
            <input 
              type="number" 
              min="1"
              max="50"
              value={setupTarget}
              onChange={(e) => setSetupTarget(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              required 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">
            Start My Journey
          </button>
        </form>
      </motion.div>
    );
  }

  const dsaProgress = Math.min((stats.dsaSolvedToday / stats.user.dsaDailyTarget) * 100, 100) || 0;
  const aptiProgress = stats.aptitudeCycle ? (stats.aptitudeCycle.currentDay / 3) * 100 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back, {stats.user.name}</h1>
          <p className="text-slate-400 mt-1">Keep up the great work and maintain your streaks!</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Today's DSA Goal</h3>
              <p className="text-slate-400 text-sm">{stats.dsaSolvedToday} of {stats.user.dsaDailyTarget} problems solved</p>
            </div>
            <span className="text-2xl font-bold text-indigo-400">{Math.round(dsaProgress)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3">
            <div className="bg-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${dsaProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Aptitude Cycle</h3>
              {stats.aptitudeCycle ? (
                 <p className="text-slate-400 text-sm">{stats.aptitudeCycle.currentTopic} - Day {stats.aptitudeCycle.currentDay}/3</p>
              ) : (
                 <p className="text-slate-400 text-sm">No active topic</p>
              )}
            </div>
            <span className="text-2xl font-bold text-orange-400">{Math.round(aptiProgress)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3">
            <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: `${aptiProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="DSA Streak" 
          value={`${stats.streak.dsaStreak} Days`} 
          icon={Flame} 
          colorClass="text-orange-500" 
        />
        <StatCard 
          title="Total DSA Solved" 
          value={stats.totalDsaProblems} 
          icon={CheckSquare} 
          colorClass="text-indigo-500" 
        />
        <StatCard 
          title="Apti Streak" 
          value={`${stats.streak.aptitudeStreak} 3-Day Runs`} 
          icon={Flame} 
          colorClass="text-orange-500" 
        />
        <StatCard 
          title="Total Apti Topics" 
          value={stats.totalAptitudeTopics} 
          icon={BookOpen} 
          colorClass="text-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Milestones / Badges */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-yellow-400"/> Streak Badges</h3>
            <div className="flex gap-4 flex-wrap">
               <div className={`p-4 rounded border ${stats.streak.dsaStreak >= 7 ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-900/50 opacity-50'} text-center w-28`}>
                  <Flame className={`w-8 h-8 mx-auto mb-2 ${stats.streak.dsaStreak >= 7 ? 'text-yellow-500' : 'text-slate-500'}`} />
                  <p className="text-xs font-medium text-slate-300">7-Day DSA</p>
               </div>
               <div className={`p-4 rounded border ${stats.streak.dsaStreak >= 30 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 opacity-50'} text-center w-28`}>
                  <Award className={`w-8 h-8 mx-auto mb-2 ${stats.streak.dsaStreak >= 30 ? 'text-blue-500' : 'text-slate-500'}`} />
                  <p className="text-xs font-medium text-slate-300">30-Day DSA</p>
               </div>
               <div className={`p-4 rounded border ${stats.streak.aptitudeStreak >= 7 ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-900/50 opacity-50'} text-center w-28`}>
                  <Flame className={`w-8 h-8 mx-auto mb-2 ${stats.streak.aptitudeStreak >= 7 ? 'text-orange-500' : 'text-slate-500'}`} />
                  <p className="text-xs font-medium text-slate-300">7-Cycle Apti</p>
               </div>
            </div>
         </div>

         {/* Patterns Solved */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><List className="w-5 h-5 mr-2 text-indigo-400"/> Patterns Solved</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
               {Object.entries(stats.patternCounts).length === 0 ? (
                  <p className="text-slate-400 text-sm">No patterns solved yet.</p>
               ) : (
                  Object.entries(stats.patternCounts).map(([pattern, count]) => (
                     <div key={pattern} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg">
                        <span className="text-slate-300 font-medium">{pattern}</span>
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
