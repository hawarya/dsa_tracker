import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';

const RevisionSchedule = () => {
  const [revisions, setRevisions] = useState([]);
  
  const fetchRevisions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      const res = await axios.get(`http://localhost:5000/api/revision/${user.id}`);
      setRevisions(res.data);
    } catch (err) {
      console.error('Failed to fetch revisions', err);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleComplete = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/revision/${id}/complete`);
      fetchRevisions();
    } catch (err) {
      console.error('Failed to complete revision', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Revision Schedule</h1>
        <p className="text-slate-400 mt-2">Topics scheduled for spaced-repetition review today.</p>
      </div>

      {revisions.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-slate-400">You have no pending revisions scheduled for today. Great job!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {revisions.map((rev) => (
            <motion.div 
              key={rev._id}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${rev.type === 'DSA' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500 bg-slate-900 px-2 py-1 rounded inline-block mb-1">
                    {rev.type} • Rev #{rev.revisionNumber}
                  </span>
                  <h3 className="text-xl font-bold text-white">{rev.topicOrProblem}</h3>
                  <p className="text-sm text-slate-400 mt-1">Scheduled: {new Date(rev.scheduledDate).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => handleComplete(rev._id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Done</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RevisionSchedule;
