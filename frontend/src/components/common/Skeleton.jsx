import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-slate-800 rounded w-24"></div>
      <div className="w-8 h-8 bg-slate-800 rounded-full"></div>
    </div>
    <div className="h-8 bg-slate-800 rounded w-40 mb-3"></div>
    <div className="h-3 bg-slate-800 rounded w-32"></div>
  </div>
);

export const SkeletonTable = () => (
  <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 animate-pulse space-y-4">
    <div className="h-6 bg-slate-800 rounded w-48 mb-6"></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-36"></div>
            <div className="h-3 bg-slate-800 rounded w-24"></div>
          </div>
        </div>
        <div className="h-5 bg-slate-800 rounded w-20"></div>
      </div>
    ))}
  </div>
);
