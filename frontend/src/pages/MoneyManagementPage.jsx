import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { formatCurrency, formatDate, maskAccountId, generateIdempotencyKey } from '../utils/formatters';
import { StatusBadge, TypeBadge } from '../components/common/Badge';
import {
  PiggyBank,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Loader2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MoneyManagementPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // System Initial Funds Form State (only for systemUser === true)
  const [systemToAccount, setSystemToAccount] = useState('');
  const [systemAmount, setSystemAmount] = useState('');
  const [systemIdempKey, setSystemIdempKey] = useState(generateIdempotencyKey());
  const [isSubmittingSystem, setIsSubmittingSystem] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const accs = await accountService.getUserAccounts();
      setAccounts(accs);
      const txs = await transactionService.getUserTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading money management data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userAccountIds = new Set(accounts.map((a) => String(a._id)));

  // Separate Credit and Debit transactions
  const credits = transactions.filter((tx) => {
    const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
    return userAccountIds.has(toId);
  });

  const debits = transactions.filter((tx) => {
    const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
    return userAccountIds.has(fromId);
  });

  // Handle System Initial Funds submission (privileged backend operation)
  const handleSystemFundsSubmit = async (e) => {
    e.preventDefault();
    if (!systemToAccount || !systemAmount) {
      toast.error('Please enter target account ID and deposit amount.');
      return;
    }

    try {
      setIsSubmittingSystem(true);
      const res = await transactionService.createInitialFunds({
        toAccount: systemToAccount.trim(),
        amount: Number(systemAmount),
        idempotencyKey: systemIdempKey,
      });

      toast.success(res.message || 'System initial funds deposited successfully!');
      setSystemAmount('');
      setSystemToAccount('');
      setSystemIdempKey(generateIdempotencyKey());
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'System initial funds operation failed.';
      toast.error(msg);
    } finally {
      setIsSubmittingSystem(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-extrabold text-white">Money & Liquidity Management</h2>
        <p className="text-xs text-slate-400">Classified credit/debit records and system initial funding controls</p>
      </div>

      {/* System Admin Privileged Panel */}
      {user?.systemUser ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-amber-500/5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Admin Initial Funds Injector</h3>
              <p className="text-xs text-amber-400">Privileged backend operation (/api/transaction/system/initial-funds)</p>
            </div>
          </div>

          <form onSubmit={handleSystemFundsSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Target Account ID</label>
              <input
                type="text"
                required
                value={systemToAccount}
                onChange={(e) => setSystemToAccount(e.target.value)}
                placeholder="24-char MongoDB ID"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Deposit Amount (INR)</label>
              <input
                type="number"
                min="1"
                required
                value={systemAmount}
                onChange={(e) => setSystemAmount(e.target.value)}
                placeholder="Amount to deposit"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmittingSystem}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
              >
                {isSubmittingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                <span>Inject Initial Funds</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Normal User Security Note */
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white block">Standard User Deposit Policy</span>
            <p className="text-slate-400">
              Account deposits in Finora Banking require verified peer-to-peer transfers or authorized bank wire operations. Unverified local client state mutations are prohibited.
            </p>
          </div>
        </div>
      )}

      {/* Credit & Debit Classification Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Credits Received */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Credits Received</h3>
                <p className="text-xs text-slate-400">{credits.length} total credited ledger entries</p>
              </div>
            </div>
          </div>

          {credits.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No incoming credit transactions recorded.</p>
          ) : (
            <div className="space-y-3">
              {credits.map((tx) => (
                <div key={tx._id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-slate-300 font-semibold">{tx._id ? tx._id.slice(-8) : 'N/A'}</span>
                    <p className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400">+ {formatCurrency(tx.amount)}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debits Sent */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Debits Sent</h3>
                <p className="text-xs text-slate-400">{debits.length} total debited ledger entries</p>
              </div>
            </div>
          </div>

          {debits.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No outgoing debit transactions recorded.</p>
          ) : (
            <div className="space-y-3">
              {debits.map((tx) => (
                <div key={tx._id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-slate-300 font-semibold">{tx._id ? tx._id.slice(-8) : 'N/A'}</span>
                    <p className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-400">- {formatCurrency(tx.amount)}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
