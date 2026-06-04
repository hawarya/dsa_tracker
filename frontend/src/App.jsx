import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DSATracker from './pages/DSATracker';
import AptitudeTracker from './pages/AptitudeTracker';
import RevisionSchedule from './pages/RevisionSchedule';
import LeetCodeTracker from './pages/LeetCodeTracker';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dsa" element={<DSATracker />} />
            <Route path="/aptitude" element={<AptitudeTracker />} />
            <Route path="/revision" element={<RevisionSchedule />} />
            <Route path="/leetcode" element={<LeetCodeTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
