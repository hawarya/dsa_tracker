import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DSATracker = () => {
  const [problems, setProblems] = useState([
    { pattern: '', problemName: '', difficulty: 'Easy' }
  ]);
  const [message, setMessage] = useState('');
  const [dailyTarget, setDailyTarget] = useState(5);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        const res = await axios.get(`http://localhost:5000/api/dashboard/${user.id}`);
        setDailyTarget(res.data.user.dsaDailyTarget || 5);
      } catch (err) {
        console.error('Failed to fetch user target', err);
      }
    };
    fetchTarget();
  }, []);

  const handleAddProblem = () => {
    setProblems([...problems, { pattern: '', problemName: '', difficulty: 'Easy' }]);
  };

  const handleChange = (index, field, value) => {
    const newProblems = [...problems];
    newProblems[index][field] = value;
    setProblems(newProblems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      
      const res = await axios.post('http://localhost:5000/api/dsa', {
        userId: user.id,
        problems
      });
      setMessage(res.data.message);
      setProblems([{ pattern: '', problemName: '', difficulty: 'Easy' }]);
    } catch (err) {
      setMessage('Error logging practice.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Log DSA Practice</h1>
        <p className="text-slate-400 mt-2">Solve {dailyTarget} problems to maintain your daily streak!</p>
      </div>

      {message && <div className="bg-emerald-500/20 text-emerald-400 px-4 py-3 border border-emerald-500 rounded">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
        <div className="space-y-4">
          {problems.map((prob, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-slate-900 p-4 rounded-lg">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Pattern</label>
                <input 
                  type="text" required
                  placeholder="e.g. Sliding Window"
                  className="w-full bg-slate-800 border-none rounded px-3 py-2 text-white"
                  value={prob.pattern} onChange={(e) => handleChange(idx, 'pattern', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Problem Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Longest Substring"
                  className="w-full bg-slate-800 border-none rounded px-3 py-2 text-white"
                  value={prob.problemName} onChange={(e) => handleChange(idx, 'problemName', e.target.value)}
                />
              </div>
              <div className="w-full md:w-32">
                <label className="text-xs text-slate-400 block mb-1">Difficulty</label>
                <select 
                  className="w-full bg-slate-800 border-none rounded px-3 py-2 text-white"
                  value={prob.difficulty} onChange={(e) => handleChange(idx, 'difficulty', e.target.value)}
                >
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => setProblems(problems.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-300 p-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <button type="button" onClick={handleAddProblem} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
            + Add Another Problem
          </button>
          
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Log Practice ({problems.length}/{dailyTarget} For Streak)
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DSATracker;
