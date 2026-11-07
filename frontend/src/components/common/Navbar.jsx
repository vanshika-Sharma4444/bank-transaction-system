import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Landmark className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FINORA <span className="text-emerald-400 font-medium text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">BANKING</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Digital Management</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
          <a href="#preview" className="hover:text-emerald-400 transition-colors">Dashboard</a>
          <a href="#about" className="hover:text-emerald-400 transition-colors">About Us</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="gradient-btn text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2"
            >
              <span>Go to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="gradient-btn text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                <span>Open Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-4 pb-6 space-y-4">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Features</a>
          <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Security</a>
          <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-emerald-400">Dashboard</a>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full text-center gradient-btn text-slate-950 font-bold py-3 rounded-xl"
              >
                Go to Portal
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 text-slate-300 border border-slate-800 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center gradient-btn text-slate-950 font-bold py-3 rounded-xl"
                >
                  Open Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
