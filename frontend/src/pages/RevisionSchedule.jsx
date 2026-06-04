import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, BookOpen, Code, Edit2, Trash2, Check, X, Calendar } from 'lucide-react';

const RevisionSchedule = () => {
  const [activeTab, setActiveTab] = useState('due'); // 'due', 'dsa', 'aptitude'
  const [toast, setToast] = useState('');

  // Data states
  const [revisions, setRevisions] = useState([]);
  const [dsaHistory, setDsaHistory] = useState([]);
  const [aptiHistory, setAptiHistory] = useState([]);

  // Edit states for DSA
  const [editingDsa, setEditingDsa] = useState(null); // { logId, problemId }
  const [dsaEditForm, setDsaEditForm] = useState({ pattern: '', problemName: '', difficulty: '' });

  // Edit states for Aptitude
  const [editingApti, setEditingApti] = useState(null); // logId
  const [aptiEditForm, setAptiEditForm] = useState({ topicCovered: '', durationMinutes: '' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      
      const [revRes, dsaRes, aptiRes] = await Promise.all([
        axios.get(`https://dsa-tracker-mxj5.onrender.com/api/revision/${user.id}`),
        axios.get(`https://dsa-tracker-mxj5.onrender.com/api/dsa/${user.id}`),
        axios.get(`https://dsa-tracker-mxj5.onrender.com/api/aptitude/${user.id}`)
      ]);
      
      setRevisions(revRes.data);
      setDsaHistory(dsaRes.data);
      setAptiHistory(aptiRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Functions: Revisions ---
  const handleCompleteRevision = async (id) => {
    try {
      await axios.post(`https://dsa-tracker-mxj5.onrender.com/api/revision/${id}/complete`);
      fetchData();
      showToast('Revision marked complete!');
    } catch (err) {
      console.error('Failed to complete revision', err);
    }
  };

  // --- Functions: DSA CRUD ---
  const initDsaEdit = (logId, prob) => {
    setEditingDsa({ logId, problemId: prob._id });
    setDsaEditForm({ pattern: prob.pattern, problemName: prob.problemName, difficulty: prob.difficulty });
  };

  const saveDsaEdit = async () => {
    try {
      await axios.put(`https://dsa-tracker-mxj5.onrender.com/api/dsa/${editingDsa.logId}/problem/${editingDsa.problemId}`, dsaEditForm);
      setEditingDsa(null);
      fetchData();
      showToast('Problem updated!');
    } catch (err) {
      console.error("Failed to update problem", err);
    }
  };

  const deleteDsaProblem = async (logId, problemId) => {
    if (!window.confirm("Delete this problem completely?")) return;
    try {
      await axios.delete(`https://dsa-tracker-mxj5.onrender.com/api/dsa/${logId}/problem/${problemId}`);
      fetchData();
      showToast('Problem deleted!');
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // --- Functions: Aptitude CRUD ---
  const initAptiEdit = (log) => {
    setEditingApti(log._id);
    setAptiEditForm({ topicCovered: log.topicCovered, durationMinutes: log.durationMinutes || '' });
  };

  const saveAptiEdit = async () => {
    try {
      await axios.put(`https://dsa-tracker-mxj5.onrender.com/api/aptitude/${editingApti}`, {
        topicCovered: aptiEditForm.topicCovered,
        durationMinutes: parseInt(aptiEditForm.durationMinutes) || 0
      });
      setEditingApti(null);
      fetchData();
      showToast('Aptitude log updated!');
    } catch (err) {
      console.error("Failed to update logic", err);
    }
  };

  const deleteAptiLog = async (logId) => {
    if (!window.confirm("Delete this aptitude record completely?")) return;
    try {
      await axios.delete(`https://dsa-tracker-mxj5.onrender.com/api/aptitude/${logId}`);
      fetchData();
      showToast('Aptitude log deleted!');
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-700';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Centralized Log & Revisions</h1>
        <p className="text-slate-400">Manage your past practice data and tackle today's scheduled reviews.</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-emerald-500/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-lg border border-emerald-400/50 z-50 flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5"/>
            <span className="font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700 w-fit">
        <button 
          onClick={() => setActiveTab('due')} 
          className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'due' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
        >
          <Clock className="w-4 h-4 mr-2"/> Revisions Due
          {revisions.length > 0 && <span className="ml-2 bg-rose-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{revisions.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('dsa')} 
          className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'dsa' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
        >
          <Code className="w-4 h-4 mr-2"/> Full DSA Log
        </button>
        <button 
          onClick={() => setActiveTab('aptitude')} 
          className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'aptitude' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
        >
          <BookOpen className="w-4 h-4 mr-2"/> Full Apti Log
        </button>
      </div>

      {/* TAB CONTENT: DUE REVISIONS */}
      {activeTab === 'due' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {revisions.length === 0 ? (
            <div className="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center shadow-lg">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4 opacity-80" />
              <h2 className="text-3xl font-bold text-white mb-2">All caught up!</h2>
              <p className="text-slate-400 text-lg">You have no pending spaced-repetition revisions scheduled right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {revisions.map((rev) => (
                <div key={rev._id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-xl shadow-inner ${rev.type === 'DSA' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {rev.type === 'DSA' ? <Code className="w-8 h-8"/> : <BookOpen className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-300 bg-slate-900 border border-slate-600 px-2.5 py-1 rounded inline-block">
                          {rev.type}
                        </span>
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded inline-block">
                          Round #{rev.revisionNumber}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{rev.topicOrProblem}</h3>
                      <p className="text-sm text-slate-400 mt-1 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        Due: {new Date(rev.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCompleteRevision(rev._id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Done</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: DSA HISTORY */}
      {activeTab === 'dsa' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl max-h-[70vh] overflow-y-auto custom-scrollbar">
            {dsaHistory.length === 0 ? (
               <p className="text-slate-400 text-center py-10">No DSA logs found.</p>
            ) : (
               <div className="space-y-6">
                 {dsaHistory.map((log) => (
                    <div key={log._id} className="relative pl-6 border-l-2 border-slate-700 pb-4">
                      <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1"></div>
                      <h4 className="text-sm font-bold text-indigo-400 mb-3">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</h4>
                      
                      <div className="space-y-3">
                        {log.problems.map(prob => (
                           <div key={prob._id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 group hover:border-indigo-500/30 transition-colors">
                              {editingDsa?.problemId === prob._id ? (
                                <div className="space-y-3">
                                  <input value={dsaEditForm.problemName} onChange={e => setDsaEditForm({...dsaEditForm, problemName: e.target.value})} className="w-full bg-slate-800 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 border border-slate-600" />
                                  <div className="flex gap-3">
                                    <input value={dsaEditForm.pattern} onChange={e => setDsaEditForm({...dsaEditForm, pattern: e.target.value})} className="w-1/2 bg-slate-800 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 border border-slate-600" />
                                    <select value={dsaEditForm.difficulty} onChange={e => setDsaEditForm({...dsaEditForm, difficulty: e.target.value})} className="w-1/2 bg-slate-800 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 border border-slate-600">
                                        <option>Easy</option><option>Medium</option><option>Hard</option>
                                    </select>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                     <button onClick={() => setEditingDsa(null)} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                                     <button onClick={saveDsaEdit} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 font-medium flex items-center"><Check className="w-4 h-4 mr-2"/> Save</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-bold text-slate-200 text-lg">{prob.problemName}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{prob.pattern}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(prob.difficulty)}`}>{prob.difficulty}</span>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity transition-delay-150">
                                    <button onClick={() => initDsaEdit(log._id, prob)} className="p-2 bg-slate-800 text-slate-400 hover:text-indigo-400 rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={() => deleteDsaProblem(log._id, prob._id)} className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                                </div>
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: APTITUDE HISTORY */}
      {activeTab === 'aptitude' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl max-h-[70vh] overflow-y-auto custom-scrollbar">
            {aptiHistory.length === 0 ? (
               <p className="text-slate-400 text-center py-10">No Aptitude logs found.</p>
            ) : (
               <div className="space-y-4">
                 {aptiHistory.map((log) => (
                    <div key={log._id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl group hover:border-orange-500/30 transition-colors">
                       {editingApti === log._id ? (
                          <div className="space-y-3">
                             <input value={aptiEditForm.topicCovered} onChange={e => setAptiEditForm({...aptiEditForm, topicCovered: e.target.value})} className="w-full bg-slate-800 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 border border-slate-600" />
                             <input type="number" value={aptiEditForm.durationMinutes} onChange={e => setAptiEditForm({...aptiEditForm, durationMinutes: e.target.value})} placeholder="Duration (mins)" className="w-full bg-slate-800 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 border border-slate-600" />
                             <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setEditingApti(null)} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                                <button onClick={saveAptiEdit} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 font-medium flex items-center"><Check className="w-4 h-4 mr-2"/> Save</button>
                             </div>
                          </div>
                       ) : (
                          <div className="flex justify-between items-center">
                             <div>
                                <h4 className="text-lg font-bold text-slate-200">{log.topicCovered}</h4>
                                <div className="text-sm text-slate-500 mt-1 flex items-center space-x-3">
                                  <span>{new Date(log.date).toLocaleDateString()}</span>
                                  {log.durationMinutes && <span>• {log.durationMinutes} mins</span>}
                                </div>
                             </div>
                             <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                <button onClick={() => initAptiEdit(log)} className="p-2 bg-slate-800 text-slate-400 hover:text-orange-400 rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                                <button onClick={() => deleteAptiLog(log._id)} className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          </div>
                       )}
                    </div>
                 ))}
               </div>
            )}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default RevisionSchedule;
