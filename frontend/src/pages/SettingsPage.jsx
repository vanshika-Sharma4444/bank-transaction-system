import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Bell,
  Lock,
  Moon,
  Sun,
  ShieldCheck,
  Key,
  Mail,
  Smartphone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Theme updated to ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated.');
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-extrabold text-white">Application Settings</h2>
        <p className="text-xs text-slate-400">Configure interface preferences, security alerts, and notification behavior</p>
      </div>

      {/* Theme Settings */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Interface Appearance</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white block">Theme Mode</span>
            <p className="text-[11px] text-slate-400">Select interface background contrast</p>
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

      {/* Notification Settings */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Bell className="w-4 h-4 text-sky-400" />
          <span>Email & System Alerts</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">Transaction Receipts via Email</span>
              <p className="text-[11px] text-slate-400">Send automatic Nodemailer emails when money is debited or credited</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">Session & Security Alerts</span>
              <p className="text-[11px] text-slate-400">Notify on login from new devices or token blacklisting</p>
            </div>
            <input
              type="checkbox"
              checked={securityAlerts}
              onChange={(e) => setSecurityAlerts(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleSaveNotifications}
          className="px-5 py-2.5 rounded-xl gradient-btn text-slate-950 font-bold text-xs flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Notification Preferences</span>
        </button>
      </div>

      {/* Security Credentials */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Password & Security</span>
        </h3>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Password Hashing</span>
            <span className="text-emerald-400 font-semibold">bcrypt (10 Salt Rounds)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">JWT Token Secret</span>
            <span className="text-slate-300 font-mono">Managed Server-Side (.env)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Token Storage</span>
            <span className="text-sky-400 font-semibold">HTTP-Only Cookie + Local Bearer Session</span>
          </div>
        </div>
      </div>

    </div>
  );
};
