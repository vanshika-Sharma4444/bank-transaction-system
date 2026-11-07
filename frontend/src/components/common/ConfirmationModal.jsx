import React from 'react';
import { ShieldCheck, AlertCircle, ArrowRight, Loader2, X } from 'lucide-react';
import { formatCurrency, maskAccountId } from '../../utils/formatters';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, details, isLoading }) => {
  if (!isOpen || !details) return null;

  const { fromAccountId, toAccountId, amount, idempotencyKey } = details;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-md w-full rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Transfer</h3>
              <p className="text-xs text-slate-400">Review payment details carefully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Amount Highlight */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Amount</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {formatCurrency(amount)}
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-400">Source Account</span>
            <span className="font-mono text-slate-200 font-medium">{maskAccountId(fromAccountId)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-400">Recipient Account</span>
            <span className="font-mono text-emerald-400 font-medium">{maskAccountId(toAccountId)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-slate-400">Idempotency Reference</span>
            <span className="font-mono text-xs text-slate-400 truncate max-w-[180px]">{idempotencyKey}</span>
          </div>
        </div>

        {/* Security Warning */}
        <div className="flex items-start space-x-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            This action will immediately execute a double-entry ledger debit from your balance. Double check recipient ID.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-1/2 py-3 px-4 rounded-xl border border-slate-800 text-slate-300 font-medium hover:bg-slate-900 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-1/2 py-3 px-4 rounded-xl gradient-btn text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Confirm & Send</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
