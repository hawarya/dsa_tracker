import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AptitudeTracker = () => {
  const [topicCovered, setTopicCovered] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [message, setMessage] = useState('');
  const [activeCycle, setActiveCycle] = useState(null);

  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        const res = await axios.get(`http://localhost:5000/api/dashboard/${user.id}`);
        if (res.data.aptitudeCycle) {
          setActiveCycle(res.data.aptitudeCycle);
          setTopicCovered(res.data.aptitudeCycle.currentTopic);
        }
      } catch (err) {
        console.error('Error fetching cycle', err);
      }
    };
    fetchCycle();
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const res = await axios.post('http://localhost:5000/api/aptitude', {
        userId: user.id,
        topicCovered,
        durationMinutes: parseInt(durationMinutes) || 0
      });
      setMessage(res.data.message);
      if (!activeCycle) {
         setTopicCovered('');
      }
      setDurationMinutes('');
    } catch (err) {
      setMessage('Error logging aptitude practice.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Log Aptitude Practice</h1>
        <p className="text-slate-400 mt-2">Cover a new topic every 3 days to maintain your streak!</p>
      </div>

      {message && <div className="bg-emerald-500/20 text-emerald-400 px-4 py-3 border border-emerald-500 rounded">{message}</div>}

      {activeCycle && activeCycle.currentDay < 3 && (
        <div className="bg-indigo-500/10 border border-indigo-500/50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-indigo-400 text-sm font-bold uppercase tracking-wider block mb-1">Current Active Cycle</span>
            <span className="text-white font-medium">{activeCycle.currentTopic}</span>
          </div>
          <div className="text-right">
            <span className="text-indigo-400 text-sm font-bold block mb-1">Progress</span>
            <span className="text-white font-medium">Day {activeCycle.currentDay}/3</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Topic Covered</label>
          <input 
            type="text" 
            value={topicCovered}
            onChange={(e) => setTopicCovered(e.target.value)}
            placeholder="e.g. Time and Work, Profit & Loss"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            required 
          />
          {activeCycle && activeCycle.currentDay < 3 && (
             <p className="text-xs text-slate-400 mt-2">Finish your active 3-day cycle before switching topics to avoid breaking it.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Minutes) <span className="text-slate-500 text-xs font-normal">Optional</span></label>
          <input 
            type="number" 
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="45"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">
          Log Practice
        </button>
      </form>
    </motion.div>
  );
};

export default AptitudeTracker;
