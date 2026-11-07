import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-center">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Landmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-emerald-400">404</span>
          <h2 className="text-xl font-bold text-white">Page Not Found</h2>
          <p className="text-xs text-slate-400">The requested banking portal route does not exist or has been relocated.</p>
        </div>
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="gradient-btn text-slate-950 font-bold px-6 py-3.5 rounded-xl text-sm inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isAuthenticated ? 'Return to Dashboard' : 'Return to Home Page'}</span>
        </Link>
      </div>
    </div>
  );
};
