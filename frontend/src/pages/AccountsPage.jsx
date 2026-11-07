import React, { useEffect, useState, useCallback } from 'react';
import { accountService } from '../services/accountService';
import { formatCurrency, formatDate, maskAccountId } from '../utils/formatters';
import { StatusBadge } from '../components/common/Badge';
import { SkeletonCard } from '../components/common/Skeleton';
import {
  Wallet,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Landmark,
  CreditCard,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAccountsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userAccounts = await accountService.getUserAccounts();
      setAccounts(userAccounts);

      const balMap = {};
      for (const acc of userAccounts) {
        try {
          const bal = await accountService.getAccountBalance(acc._id);
          balMap[acc._id] = bal;
        } catch (e) {
          balMap[acc._id] = 0;
        }
      }
      setBalances(balMap);
    } catch (err) {
      console.error('Error loading accounts:', err);
      toast.error('Failed to load accounts from backend API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountsData();
  }, [fetchAccountsData]);

  const handleCreateAccount = async () => {
    try {
      setIsCreating(true);
      const newAcc = await accountService.createAccount();
      toast.success('Account created successfully!');
      await fetchAccountsData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not create account.';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Account ID copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Your Bank Accounts</h2>
          <p className="text-xs text-slate-400">View balances, status, and account identifiers</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAccountsData}
            disabled={isLoading}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="gradient-btn text-slate-950 font-bold px-5 py-3 rounded-xl text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'Open New Account'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 border border-slate-800 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <Landmark className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Bank Accounts Found</h3>
            <p className="text-sm text-slate-400">
              You do not have an active bank account associated with your profile. Create your first checking account now to receive and transfer funds.
            </p>
          </div>
          <button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="gradient-btn text-slate-950 font-bold px-8 py-3.5 rounded-xl text-sm inline-flex items-center space-x-2 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Open First Account Now</span>
          </button>
        </div>
      ) : (
        /* Accounts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className="glass-card rounded-3xl p-6 border border-slate-800/80 space-y-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Digital Checking Account</h3>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">{acc.currency || 'INR'} · Double-Entry Ledger</p>
                  </div>
                </div>
                <StatusBadge status={acc.status} />
              </div>

              {/* Balance Highlight */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Available Balance</span>
                <div className="text-3xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(balances[acc._id] || 0, acc.currency)}
                </div>
              </div>

              {/* Account ID Bar */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Account Identifier</span>
                  <span className="font-mono text-xs text-slate-200 truncate block">{acc._id}</span>
                </div>
                <button
                  onClick={() => handleCopyId(acc._id)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                  title="Copy Full ID"
                >
                  {copiedId === acc._id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {formatDate(acc.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ACID Protected</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
