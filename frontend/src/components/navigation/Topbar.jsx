import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Landmark,
  Menu,
  Bell,
  User,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Topbar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive breadcrumb & page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Overview Dashboard', subtitle: 'Real-time financial activity and liquidity' };
      case '/accounts':
        return { title: 'Account Portfolio', subtitle: 'Manage active accounts and balances' };
      case '/transfer':
        return { title: 'Money Transfer', subtitle: 'Instant double-entry ledger fund transfer' };
      case '/deposit':
        return { title: 'Deposit & Credited Funds', subtitle: 'Incoming funds and initial deposit injector' };
      case '/withdraw':
        return { title: 'Withdrawal Management', subtitle: 'Authorize outgoing transfers and debits' };
      case '/transactions':
        return { title: 'Transaction History', subtitle: 'Audit ledger history and search records' };
      case '/statements':
        return { title: 'Financial Statements', subtitle: 'Generate official PDF statements' };
      case '/profile':
        return { title: 'User Profile', subtitle: 'Account security and identity' };
      case '/settings':
        return { title: 'Application Settings', subtitle: 'Theme and alert preferences' };
      default:
        return { title: 'Digital Banking', subtitle: 'Finora Online Portal' };
    }
  };

  const { title, subtitle } = getPageTitle();

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    toast.success('Refreshing balances & ledger activity...');
    setTimeout(() => {
      setIsRefreshing(false);
      window.dispatchEvent(new CustomEvent('finora-refresh-data'));
    }, 600);
  };

  return (
    <header className="sticky top-0 z-30 h-20 glass-panel border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl">
      
      {/* Left: Mobile Toggle, Brand & Breadcrumb */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          title="Toggle Mobile Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo / Title */}
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2.5 group"
            title="Return to Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Landmark className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
          </Link>

          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">{title}</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Right Tools & Profile Dropdown */}
      <div className="flex items-center space-x-3">
        
        {/* Quick Refresh */}
        <button
          onClick={handleGlobalRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Quick Send CTA */}
        <Link
          to="/transfer"
          className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
          title="Transfer Money"
        >
          <SendHorizontal className="w-3.5 h-3.5" />
          <span>Quick Send</span>
        </Link>

        {/* Notifications Icon & Drawer */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl border border-slate-800 p-4 shadow-2xl space-y-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">System Notifications</span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Session Authenticated</p>
                    <p className="text-[10px] text-slate-400">JWT Token session active with double-entry protection.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Idempotency Guard Active</p>
                    <p className="text-[10px] text-slate-400">All transfer requests protect against duplicate billing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
            title="User Profile Menu"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                {user?.name || 'User'}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl border border-slate-800 p-2 shadow-2xl space-y-1 z-50 animate-fade-in text-xs">
              
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-1">
                <p className="font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>User Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                <span>Settings & Theme</span>
              </Link>

              <div className="border-t border-slate-800/80 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

            </div>
          )}
        </div>

      </div>

    </header>
  );
};
