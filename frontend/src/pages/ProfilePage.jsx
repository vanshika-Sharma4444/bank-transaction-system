import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Mail,
  ShieldCheck,
  Key,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  Lock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      toast('Finora Banking is optimized for Dark Mode aesthetic.', { icon: '🌙' });
    } else {
      toast.success('Dark Mode theme enabled');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-extrabold text-white">Profile & Security Settings</h2>
        <p className="text-xs text-slate-400">Manage user identity, active session, and preferences</p>
      </div>

      {/* User Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <span>{user?.name || 'Bank Member'}</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
              <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                JWT Session Verified
              </span>
              {user?.systemUser && (
                <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <ShieldAlert className="w-3 h-3 mr-1" /> System Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">User Identifier</span>
            <span className="font-mono text-slate-200 font-semibold">{user?._id}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Authentication Method</span>
            <span className="text-emerald-400 font-semibold">JWT Cookie + Bearer Authorization</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">System Privileges</span>
            <span className={user?.systemUser ? 'text-amber-400 font-bold' : 'text-slate-300'}>
              {user?.systemUser ? 'Privileged System User' : 'Standard Bank Account Holder'}
            </span>
          </div>
        </div>

      </div>

      {/* Preferences Section */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Appearance & Theme</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white block">Visual Theme</span>
            <p className="text-[11px] text-slate-400">Select interface contrast mode</p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleToggleTheme('dark')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                theme === 'dark' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => handleToggleTheme('light')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                theme === 'light' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Account Security</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white block">Active Session</span>
            <p className="text-[11px] text-slate-400">Sign out across all devices and invalidate token</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

    </div>
  );
};
