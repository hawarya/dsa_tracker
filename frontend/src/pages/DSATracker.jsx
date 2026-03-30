import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Hash } from 'lucide-react';

const DSATracker = () => {
  const [problems, setProblems] = useState([{ pattern: '', problemName: '', difficulty: 'Easy' }]);
  const [message, setMessage] = useState('');
  const [dailyTarget, setDailyTarget] = useState(5);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [groupedPatterns, setGroupedPatterns] = useState({});
  const [expandedPatterns, setExpandedPatterns] = useState({});
  
  const [editingProblem, setEditingProblem] = useState(null); // { logId, problemId }
  const [editForm, setEditForm] = useState({ pattern: '', problemName: '', difficulty: '' });

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

  const fetchHistory = async () => {
     try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        const res = await axios.get(`http://localhost:5000/api/dsa/${user.id}`);
        setHistoryLogs(res.data);
        
        // Group by pattern
        const groups = {};
        res.data.forEach(log => {
           log.problems.forEach(prob => {
              if (!groups[prob.pattern]) groups[prob.pattern] = [];
              groups[prob.pattern].push({ ...prob, logId: log._id, date: log.date });
           });
        });
        setGroupedPatterns(groups);
     } catch (err) {
        console.error('Failed to fetch dsa history', err);
     }
  };

  useEffect(() => {
    fetchTarget();
    fetchHistory();
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
      fetchHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error logging practice.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const togglePattern = (pattern) => {
      setExpandedPatterns(prev => ({ ...prev, [pattern]: !prev[pattern] }));
  };

  const handleEditInit = (logId, prob) => {
      setEditingProblem({ logId, problemId: prob._id });
      setEditForm({ pattern: prob.pattern, problemName: prob.problemName, difficulty: prob.difficulty });
  };

  const handleEditSubmit = async () => {
      try {
          await axios.put(`http://localhost:5000/api/dsa/${editingProblem.logId}/problem/${editingProblem.problemId}`, editForm);
          setEditingProblem(null);
          fetchHistory();
      } catch (err) {
          console.error("Failed to update problem", err);
      }
  };

  const handleDelete = async (logId, problemId) => {
      if (!window.confirm("Delete this problem? This may affect your streaks!")) return;
      try {
          await axios.delete(`http://localhost:5000/api/dsa/${logId}/problem/${problemId}`);
          fetchHistory();
      } catch (err) {
          console.error("Failed to delete", err);
      }
  };

  const getDifficultyColor = (diff) => {
      switch(diff?.toLowerCase()) {
         case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
         case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
         case 'hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
         default: return 'text-slate-400 bg-slate-400/10';
      }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-bold text-white">Log DSA Practice</h1>
        <p className="text-slate-400 mt-2">Solve {dailyTarget} problems to maintain your daily streak!</p>
      </div>

      {message && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-emerald-500/20 text-emerald-400 px-4 py-3 border border-emerald-500 rounded">{message}</motion.div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
         {/* Form Section */}
         <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
           <div className="space-y-4">
             {problems.map((prob, idx) => (
               <div key={idx} className="flex flex-col gap-3 items-end bg-slate-900 p-4 rounded-lg border border-slate-800 focus-within:border-indigo-500/50 transition-colors">
                 <div className="flex gap-4 w-full flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Pattern</label>
                      <input 
                        type="text" required
                        placeholder="e.g. Sliding Window"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        value={prob.pattern} onChange={(e) => handleChange(idx, 'pattern', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Problem Name</label>
                      <input 
                        type="text" required
                        placeholder="e.g. Longest Substring"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        value={prob.problemName} onChange={(e) => handleChange(idx, 'problemName', e.target.value)}
                      />
                    </div>
                 </div>
                 <div className="flex gap-4 w-full items-end justify-between">
                    <div className="w-40">
                      <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Difficulty</label>
                      <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        value={prob.difficulty} onChange={(e) => handleChange(idx, 'difficulty', e.target.value)}
                      >
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                      </select>
                    </div>
                    {problems.length > 1 && (
                      <button type="button" onClick={() => setProblems(problems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-md transition-colors">
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    )}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="flex justify-between items-center pt-4 border-t border-slate-700">
             <button type="button" onClick={handleAddProblem} className="text-indigo-400 border border-indigo-400/30 hover:bg-indigo-400/10 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
               + Add Row
             </button>
             
             <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg text-white px-6 py-2 rounded-lg font-medium transition-all">
               Log Problems ({problems.length}/{dailyTarget})
             </button>
           </div>
         </form>

         {/* History / Patterns Section */}
         <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl max-h-[800px] flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><Hash className="w-6 h-6 mr-2 text-indigo-400"/> Problem Repository</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               {Object.keys(groupedPatterns).length === 0 ? (
                  <p className="text-slate-400 text-center py-10 border border-dashed border-slate-700 rounded-xl">No patterns recorded yet. Keep practicing!</p>
               ) : (
                  Object.keys(groupedPatterns).sort().map(pattern => (
                     <div key={pattern} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden transition-all">
                        <button 
                           onClick={() => togglePattern(pattern)}
                           className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700/80 transition-colors"
                        >
                           <span className="font-semibold text-white tracking-wide">{pattern}</span>
                           <div className="flex items-center space-x-3">
                              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">{groupedPatterns[pattern].length}</span>
                              {expandedPatterns[pattern] ? <ChevronDown className="w-5 h-5 text-slate-400"/> : <ChevronRight className="w-5 h-5 text-slate-400"/>}
                           </div>
                        </button>
                        
                        <AnimatePresence>
                           {expandedPatterns[pattern] && (
                              <motion.div 
                                 initial={{ height: 0, opacity: 0 }} 
                                 animate={{ height: 'auto', opacity: 1 }} 
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden bg-slate-900"
                              >
                                 <div className="p-4 space-y-3">
                                    {groupedPatterns[pattern].map((prob, idx) => (
                                       <div key={prob._id || idx} className="flex flex-col p-3 rounded bg-slate-800/50 border border-slate-800 group hover:border-slate-700 transition-colors">
                                          {editingProblem?.problemId === prob._id ? (
                                             <div className="space-y-3">
                                                <input value={editForm.problemName} onChange={e => setEditForm({...editForm, problemName: e.target.value})} className="w-full bg-slate-900 text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:border-indigo-500 border border-slate-600" />
                                                <div className="flex gap-2">
                                                   <input value={editForm.pattern} onChange={e => setEditForm({...editForm, pattern: e.target.value})} className="w-1/2 bg-slate-900 text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:border-indigo-500 border border-slate-600" />
                                                   <select value={editForm.difficulty} onChange={e => setEditForm({...editForm, difficulty: e.target.value})} className="w-1/2 bg-slate-900 text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:border-indigo-500 border border-slate-600">
                                                      <option>Easy</option><option>Medium</option><option>Hard</option>
                                                   </select>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                   <button onClick={() => setEditingProblem(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
                                                   <button onClick={() => handleEditSubmit()} className="p-1 px-3 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 font-medium text-xs flex items-center"><Check className="w-3 h-3 mr-1"/> Save</button>
                                                </div>
                                             </div>
                                          ) : (
                                             <div className="flex justify-between items-start">
                                                <div>
                                                   <h5 className="font-medium text-slate-200">{prob.problemName}</h5>
                                                   <p className="text-xs text-slate-500 mt-1">{new Date(prob.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                                   <div className="flex gap-2">
                                                      <button onClick={() => handleEditInit(prob.logId, prob)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                                                      <button onClick={() => handleDelete(prob.logId, prob._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                                   </div>
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default DSATracker;
