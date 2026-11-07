import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Menu, Bell, Shield, Search, RefreshCw, SendHorizontal, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derive header title from current route path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Overview Dashboard', subtitle: 'Real-time financial activity and liquidity management' };
      case '/accounts':
        return { title: 'Account Portfolio', subtitle: 'Manage your active accounts and balances' };
      case '/transfer':
        return { title: 'Money Transfer', subtitle: 'Instant double-entry ledger fund transfer' };
      case '/money-management':
        return { title: 'Money Management', subtitle: 'Deposit, withdraw, and initial funding operations' };
      case '/transactions':
        return { title: 'Transaction History', subtitle: 'Audit ledger history and search records' };
      case '/statements':
        return { title: 'Financial Statements', subtitle: 'Generate and download official PDF statements' };
      case '/profile':
        return { title: 'User Profile & Settings', subtitle: 'Account security and preferences' };
      default:
        return { title: 'Digital Banking', subtitle: 'Finora Banking Management System' };
    }
  };

  const { title, subtitle } = getPageTitle();

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    toast.success('Refreshing account balances & transactions...');
    setTimeout(() => {
      setIsRefreshing(false);
      window.dispatchEvent(new CustomEvent('finora-refresh-data'));
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-20 glass-panel border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{title}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Refresh Button */}
            <button
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Refresh financial data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Quick Action Button */}
            <Link
              to="/transfer"
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Quick Send</span>
            </Link>

            {/* User Profile Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
                <span className="text-[10px] text-emerald-400 font-medium">Online</span>
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};
