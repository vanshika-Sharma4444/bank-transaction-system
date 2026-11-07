import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          {normalized === 'ACTIVE' ? 'Active' : 'Successful'}
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
          Pending
        </span>
      );
    case 'FROZEN':
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
          {normalized === 'FROZEN' ? 'Frozen' : 'Failed'}
        </span>
      );
    case 'REVERSED':
    case 'CLOSED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          {normalized === 'CLOSED' ? 'Closed' : 'Reversed'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {status || 'Unknown'}
        </span>
      );
  }
};

export const TypeBadge = ({ type }) => {
  const normalized = String(type || '').toUpperCase();

  if (normalized === 'CREDIT' || normalized === 'DEPOSIT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        + CREDIT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
      - DEBIT
    </span>
  );
};
