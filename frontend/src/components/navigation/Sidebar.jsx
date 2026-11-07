import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  SendHorizontal,
  PiggyBank,
  ArrowUpRight,
  History,
  FileSpreadsheet,
  UserCheck,
  SlidersHorizontal,
  LogOut,
  Landmark,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Accounts', path: '/accounts', icon: Wallet },
    { name: 'Transfer Money', path: '/transfer', icon: SendHorizontal },
    { name: 'Deposit', path: '/deposit', icon: PiggyBank },
    { name: 'Withdraw', path: '/withdraw', icon: ArrowUpRight },
    { name: 'Transactions', path: '/transactions', icon: History },
    { name: 'Statements', path: '/statements', icon: FileSpreadsheet },
    { name: 'Profile', path: '/profile', icon: UserCheck },
    { name: 'Settings', path: '/settings', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 glass-panel border-r border-slate-800/80 bg-slate-950/95 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/60">
          <NavLink
            to="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center space-x-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-white tracking-tight">FINORA</span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">ONLINE BANKING</span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
              <span className="text-xs text-slate-400 truncate">{user?.email || ''}</span>
              {user?.systemUser && (
                <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 border border-amber-500/20 w-max">
                  <ShieldAlert className="w-3 h-3 mr-1" /> Admin
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.name}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center ${
                    collapsed ? 'justify-center' : 'space-x-3'
                  } px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center' : 'space-x-3'
            } px-3.5 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>
    </>
  );
};
