import React from 'react';
import { Landmark, Shield, Lock, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">FINORA BANKING</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm">
            Enterprise-grade digital banking platform designed with security, real-time ledger accounting, and seamless financial intelligence.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5 mr-1" /> 256-Bit Encrypted
            </span>
            <span className="inline-flex items-center text-xs text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              <Lock className="w-3.5 h-3.5 mr-1" /> JWT Cookie Secured
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Core Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#features" className="hover:text-emerald-400 transition-colors">Double-Entry Ledger</a></li>
            <li><a href="#security" className="hover:text-emerald-400 transition-colors">Idempotent Transfers</a></li>
            <li><a href="#preview" className="hover:text-emerald-400 transition-colors">Analytics Engine</a></li>
            <li><a href="#security" className="hover:text-emerald-400 transition-colors">System Privilege Guard</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Project Information</h4>
          <ul className="space-y-2.5 text-sm">
            <li><span className="text-slate-400">Node.js + Express API</span></li>
            <li><span className="text-slate-400">MongoDB Transactional Sessions</span></li>
            <li><span className="text-slate-400">React + Tailwind UI</span></li>
            <li><span className="text-emerald-400 font-medium">Major Portfolio Project</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Finora Banking System. All rights reserved.</p>
        <p className="text-center md:text-right text-slate-500 max-w-md">
          Disclaimer: Finora Banking is a portfolio demonstration web application. It does not perform actual fiat monetary transactions.
        </p>
      </div>
    </footer>
  );
};
