import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { formatCurrency, formatDate, maskAccountId } from '../utils/formatters';
import { StatusBadge, TypeBadge } from '../components/common/Badge';
import { SkeletonCard, SkeletonTable } from '../components/common/Skeleton';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  Wallet,
  SendHorizontal,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import toast from 'react-hot-toast';

export const DashboardPage = () => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Receipt Modal State
  const [selectedTx, setSelectedTx] = useState(null);

  // Fetch accounts & balances
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setBalanceError('');
      const userAccounts = await accountService.getUserAccounts();
      setAccounts(userAccounts);

      const balanceEntries = await Promise.all(
        userAccounts.map(async (acc) => [
          acc._id,
          await accountService.getAccountBalance(acc._id)
        ])
      );
      const balMap = Object.fromEntries(balanceEntries);
      setBalances(balMap);

      // Fetch user transactions
      const txs = await transactionService.getUserTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setBalances({});
      setBalanceError(
        err?.response?.data?.message || 'Could not verify your persisted account balance. Refresh to try again.'
      );
      toast.error('Could not load account details from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleRefresh = () => loadDashboardData();
    window.addEventListener('finora-refresh-data', handleRefresh);
    return () => window.removeEventListener('finora-refresh-data', handleRefresh);
  }, [loadDashboardData]);

  // Handle Quick Create Account
  const handleCreateAccount = async () => {
    try {
      setIsCreatingAccount(true);
      const newAcc = await accountService.createAccount();
      toast.success('New bank account created successfully!');
      await loadDashboardData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create account.';
      toast.error(msg);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Calculations
  const totalBalance = Object.values(balances).reduce((sum, b) => sum + (Number(b) || 0), 0);
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  // Credit / Debit Metrics calculation based on real transaction records
  let totalCredits = 0;
  let totalDebits = 0;

  const userAccountIds = new Set(accounts.map((a) => String(a._id)));
  const completedTransactions = transactions.filter((tx) => tx.status === 'success');

  completedTransactions.forEach((tx) => {
    const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
    const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
    const amt = Number(tx.amount) || 0;

    if (userAccountIds.has(toId)) {
      totalCredits += amt;
    }
    if (userAccountIds.has(fromId)) {
      totalDebits += amt;
    }
  });

  // Chart Data preparation
  const chartData = completedTransactions.slice(0, 7).reverse().map((tx, idx) => {
    const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
    const isCredit = userAccountIds.has(toId);
    return {
      name: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `T${idx+1}`,
      amount: tx.amount,
      credit: isCredit ? tx.amount : 0,
      debit: !isCredit ? tx.amount : 0,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {balanceError && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {balanceError}
        </div>
      )}
      
      {/* Welcome Hero Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Finora Banking Portal</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Welcome back, {user?.name || 'Valued Member'}!
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Real-time ledger session active. Your accounts are protected with 256-bit JWT authentication.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/transfer"
              className="gradient-btn text-slate-950 font-bold px-5 py-3 rounded-xl text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Transfer Money</span>
            </Link>
            <button
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
              className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 hover:text-white font-semibold text-sm flex items-center space-x-2 hover:bg-slate-800 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{isCreatingAccount ? 'Creating...' : 'New Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Liquidity */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
            <span>TOTAL LIQUIDITY</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {balanceError ? 'Unavailable' : formatCurrency(totalBalance)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Primary Account:</span>
            <span className="font-mono text-emerald-400">
              {primaryAccount ? maskAccountId(primaryAccount._id) : 'No Account'}
            </span>
          </div>
        </div>

        {/* Total Credited */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
            <span>TOTAL CREDITS RECEIVED</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mb-1">
            + {formatCurrency(totalCredits)}
          </div>
          <p className="text-xs text-slate-400">Aggregated credit ledger history</p>
        </div>

        {/* Total Debited */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
            <span>TOTAL DEBITS SENT</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight mb-1">
            - {formatCurrency(totalDebits)}
          </div>
          <p className="text-xs text-slate-400">Aggregated debit ledger history</p>
        </div>

      </div>

      {/* Account Warning / Empty State */}
      {accounts.length === 0 && (
        <div className="glass-card rounded-2xl p-8 border border-amber-500/30 bg-amber-500/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Bank Account Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You do not currently have an active bank account. Click below to initialize your primary bank account and begin transfers.
          </p>
          <button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
            className="gradient-btn text-slate-950 font-bold px-6 py-3 rounded-xl text-sm inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Open First Bank Account</span>
          </button>
        </div>
      )}

      {/* Charts Section */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area Chart */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Transaction Flow Activity</h3>
                <p className="text-xs text-slate-400">Credit & Debit volume trend</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Live Sync</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`₹${val}`, 'Amount']}
                  />
                  <Area type="monotone" dataKey="credit" stroke="#10b981" fillOpacity={1} fill="url(#colorCredit)" strokeWidth={2} name="Credit" />
                  <Area type="monotone" dataKey="debit" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDebit)" strokeWidth={2} name="Debit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Account Summary Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Your Accounts</h3>
              <Link to="/accounts" className="text-xs text-emerald-400 hover:underline">View All</Link>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-slate-200 font-semibold">{maskAccountId(acc._id)}</span>
                      <StatusBadge status={acc.status} />
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{acc.currency || 'INR'} · Checking</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">
                      {balanceError
                        ? 'Unavailable'
                        : balances[acc._id] === undefined
                          ? '—'
                          : formatCurrency(balances[acc._id], acc.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Recent Transactions Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest double-entry ledger records</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Full History</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <p className="text-sm">No transactions found for your accounts yet.</p>
            <Link to="/transfer" className="text-xs text-emerald-400 hover:underline inline-block">
              Make your first money transfer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.slice(0, 5).map((tx) => {
                  const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
                  const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
                  const isCredit = userAccountIds.has(toId);

                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                        {tx._id ? tx._id.slice(-8) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(tx.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <TypeBadge type={isCredit ? 'CREDIT' : 'DEBIT'} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{maskAccountId(fromId)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{maskAccountId(toId)}</td>
                      <td className={`py-3.5 px-4 text-right font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />

    </div>
  );
};
