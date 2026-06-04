import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckSquare, Target, LogOut, Home, Code2 } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-indigo-400 font-bold text-xl">
            <Target className="w-6 h-6" />
            <span>DSA & Apti Tracker</span>
          </Link>

          {token ? (
            <div className="flex space-x-6">
              <Link to="/" className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors">
                <Home className="w-4 h-4" /><span>Dashboard</span>
              </Link>
              <Link to="/dsa" className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors">
                <CheckSquare className="w-4 h-4" /><span>DSA</span>
              </Link>
              <Link to="/aptitude" className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors">
                <BookOpen className="w-4 h-4" /><span>Aptitude</span>
              </Link>
              <Link to="/revision" className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors">
                <Target className="w-4 h-4" /><span>Revisions</span>
              </Link>
              <Link to="/leetcode" className="flex items-center space-x-1 text-violet-400 hover:text-violet-300 transition-colors font-medium">
                <Code2 className="w-4 h-4" /><span>LeetCode</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors ml-4">
                <LogOut className="w-4 h-4" /><span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
