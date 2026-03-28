import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Check, X } from 'lucide-react';

const AptitudeTracker = () => {
  const [topicCovered, setTopicCovered] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [message, setMessage] = useState('');
  const [activeCycle, setActiveCycle] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTopic, setEditTopic] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const fetchCycle = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      
      const res = await axios.get(`http://localhost:5000/api/dashboard/${user.id}`);
      if (res.data.aptitudeCycle) {
        setActiveCycle(res.data.aptitudeCycle);
        if (!topicCovered) setTopicCovered(res.data.aptitudeCycle.currentTopic);
      }
    } catch (err) {
      console.error('Error fetching cycle', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      
      const res = await axios.get(`http://localhost:5000/api/aptitude/${user.id}`);
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching aptitude history', err);
    }
  };

  useEffect(() => {
    fetchCycle();
    fetchHistory();
    // eslint-disable-next-line
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
      if (!activeCycle || res.data.cycle?.currentDay === 1) {
         setTopicCovered('');
      }
      setDurationMinutes('');
      setTimeout(() => setMessage(''), 3000);
      fetchHistory();
      fetchCycle();
    } catch (err) {
      setMessage('Error logging aptitude practice.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (log) => {
     setEditingId(log._id);
     setEditTopic(log.topicCovered);
     setEditDuration(log.durationMinutes || '');
  };

  const handleUpdate = async (logId) => {
      try {
          await axios.put(`http://localhost:5000/api/aptitude/${logId}`, {
             topicCovered: editTopic,
             durationMinutes: parseInt(editDuration) || 0
          });
          setEditingId(null);
          fetchHistory();
      } catch (err) {
          console.error("Failed to update", err);
      }
  };

  const handleDelete = async (logId) => {
      if (!window.confirm("Delete this record?")) return;
      try {
          await axios.delete(`http://localhost:5000/api/aptitude/${logId}`);
          fetchHistory();
      } catch (err) {
          console.error("Failed to delete", err);
      }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Log Aptitude Practice</h1>
        <p className="text-slate-400 mt-2">Cover a new topic every 3 days to maintain your streak!</p>
      </div>

      {message && <motion.div initial={{y: -10, opacity: 0}} animate={{y: 0, opacity: 1}} className="bg-emerald-500/20 text-emerald-400 px-4 py-3 border border-emerald-500 rounded">{message}</motion.div>}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8">
        
        {/* Form Column */}
        <div className="space-y-6">
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
        </div>

        {/* History Column */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-fit max-h-[600px] overflow-y-auto custom-scrollbar">
           <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Recent Topics</h3>
           <div className="space-y-4">
              {history.length === 0 ? (
                 <p className="text-slate-400 text-sm text-center py-4">No records found. Start practicing!</p>
              ) : (
                 history.slice(0, 50).map((log) => (
                    <div key={log._id} className="bg-slate-900 p-4 rounded-lg flex flex-col group border border-slate-800 hover:border-slate-600 transition-colors">
                        {editingId === log._id ? (
                           <div className="space-y-3 relative">
                              <input 
                                value={editTopic} 
                                onChange={(e) => setEditTopic(e.target.value)} 
                                className="w-full bg-slate-800 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-indigo-500" 
                              />
                              <input 
                                type="number"
                                value={editDuration} 
                                onChange={(e) => setEditDuration(e.target.value)} 
                                placeholder="Mins"
                                className="w-full bg-slate-800 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-indigo-500" 
                              />
                              <div className="flex gap-2 justify-end mt-2">
                                <button type="button" onClick={() => setEditingId(null)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                                <button type="button" onClick={() => handleUpdate(log._id)} className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-500 transition-colors"><Check className="w-4 h-4" /></button>
                              </div>
                           </div>
                        ) : (
                           <>
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="text-slate-200 font-semibold">{log.topicCovered}</h4>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => handleEdit(log)} className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                   <button onClick={() => handleDelete(log._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                             </div>
                             <div className="flex justify-between text-xs text-slate-400">
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                <span>{log.durationMinutes ? `${log.durationMinutes} min` : '--'}</span>
                             </div>
                           </>
                        )}
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AptitudeTracker;
