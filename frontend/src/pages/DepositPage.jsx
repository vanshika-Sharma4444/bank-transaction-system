import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import {
  formatCurrency,
  formatDate,
  maskAccountId,
  generateIdempotencyKey,
  parseAmountInMinorUnits
} from '../utils/formatters';
import { StatusBadge } from '../components/common/Badge';
import {
  ShieldAlert,
  Coins,
  Info,
  Loader2,
  Building2,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const DepositPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [fundingAccountBalance, setFundingAccountBalance] = useState(null);
  const [eligibleAccounts, setEligibleAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // System Initial Funds Form State (for privileged systemUser)
  const [systemToAccount, setSystemToAccount] = useState('');
  const [systemAmount, setSystemAmount] = useState('');
  const [systemIdempKey, setSystemIdempKey] = useState(generateIdempotencyKey());
  const [isSubmittingSystem, setIsSubmittingSystem] = useState(false);
  const [systemFormError, setSystemFormError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const [accs, txs, fundingAccounts] = await Promise.all([
        accountService.getUserAccounts(),
        transactionService.getUserTransactions(),
        user?.systemUser ? transactionService.getEligibleFundingAccounts() : Promise.resolve([])
      ]);
      const fundingAccount = user?.systemUser
        ? accs.find((account) => account.status === 'ACTIVE')
        : null;
      const sourceBalance = fundingAccount
        ? await accountService.getAccountBalance(fundingAccount._id)
        : null;
      if (user?.systemUser && !fundingAccount) {
        setLoadError('An active system funding account is required to deposit funds.');
      }
      setAccounts(accs);
      setFundingAccountBalance(sourceBalance);
      setEligibleAccounts(fundingAccounts);
      setSystemToAccount((current) =>
        fundingAccounts.some((account) => account._id === current)
          ? current
          : fundingAccounts[0]?._id || ''
      );
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading deposit data:', err);
      setFundingAccountBalance(null);
      setLoadError(
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? 'Your session has expired. Sign in again to view deposit information.'
          : 'Could not load deposit information. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userAccountIds = new Set(accounts.map((a) => String(a._id)));

  // Filter credited/deposit transactions
  const depositTxs = transactions.filter((tx) => {
    const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
    return userAccountIds.has(toId);
  });

  const handleSystemFundsSubmit = async (e) => {
    e.preventDefault();
    const recipient = eligibleAccounts.find((account) => account._id === systemToAccount);
    const amountInMinorUnits = parseAmountInMinorUnits(systemAmount);

    if (!recipient) {
      setSystemFormError('Select an eligible recipient account.');
      return;
    }

    if (
      amountInMinorUnits === null ||
      amountInMinorUnits <= 0
    ) {
      setSystemFormError('Enter a positive amount with no more than two decimal places.');
      return;
    }

    if (fundingAccountBalance === null) {
      setSystemFormError('An active system funding account balance could not be verified.');
      return;
    }

    const availableInMinorUnits = parseAmountInMinorUnits(fundingAccountBalance);
    if (availableInMinorUnits === null) {
      setSystemFormError('The system funding account balance is invalid. Refresh and try again.');
      return;
    }

    if (amountInMinorUnits > availableInMinorUnits) {
      setSystemFormError(
        `Insufficient system funding balance. Available: ${formatCurrency(fundingAccountBalance, recipient.currency)}.`
      );
      return;
    }

    try {
      setIsSubmittingSystem(true);
      setSystemFormError('');
      const res = await transactionService.createInitialFunds({
        toAccount: recipient._id,
        amount: systemAmount.trim(),
        idempotencyKey: systemIdempKey,
      });

      if (res.transaction?.status !== 'success') {
        throw new Error('The server did not confirm that this funding transaction succeeded.');
      }

      toast.success(res.message || 'Initial funds added successfully.');
      setSystemAmount('');
      setSystemIdempKey(generateIdempotencyKey());
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        (err?.response?.status === 401
          ? 'Your session has expired. Sign in again to continue.'
          : err?.response?.status === 403
            ? 'Only an authorized system user can add initial funds.'
            : !err?.response
              ? 'Could not reach the banking server. Check your connection and try again.'
              : err.message || 'The deposit could not be completed. Please try again.');
      setSystemFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingSystem(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Deposit & Incoming Funds</h2>
          <p className="text-xs text-slate-400">View credited deposits and account funding channels</p>
        </div>

        <Link
          to="/transfer"
          className="gradient-btn text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 w-max"
        >
          <span>Receive Peer Transfer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* System Admin Privileged Deposit Panel */}
      {user?.systemUser ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-amber-500/5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Authorized Deposit Money</h3>
              <p className="text-xs text-amber-400">Privileged backend endpoint (/api/transaction/system/initial-funds)</p>
            </div>
          </div>

          <p className="text-sm text-slate-300">
            System funding account available balance:{' '}
            <strong className="text-emerald-400">
              {fundingAccountBalance === null ? 'Unavailable' : formatCurrency(fundingAccountBalance)}
            </strong>
          </p>

          {loadError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {eligibleAccounts.length === 0 && !isLoading && !loadError && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">No eligible recipient accounts found</p>
                <p className="mt-1 text-xs text-slate-400">
                  This list includes active accounts owned by other users only. Create an account while signed in as your regular test user, then return here and refresh. Accounts belonging to this system user are intentionally excluded.
                </p>
              </div>
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading || isSubmittingSystem}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh list
              </button>
            </div>
          )}

          <form onSubmit={handleSystemFundsSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Target User Account</label>
              <select
                required
                value={systemToAccount}
                disabled={isLoading || isSubmittingSystem || eligibleAccounts.length === 0}
                onChange={(e) => {
                  setSystemToAccount(e.target.value);
                  setSystemFormError('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="" disabled>
                  {isLoading ? 'Loading eligible accounts...' : 'Select a recipient account'}
                </option>
                {eligibleAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.user?.name || 'Unknown account holder'} · {maskAccountId(account._id)}
                  </option>
                ))}
              </select>
              {eligibleAccounts.find((account) => account._id === systemToAccount) && (
                <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                  Recipient ID: {systemToAccount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Deposit Amount (INR)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={systemAmount}
                disabled={isSubmittingSystem}
                onChange={(e) => {
                  setSystemAmount(e.target.value);
                  setSystemFormError('');
                }}
                placeholder="Enter deposit amount"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={
                  isSubmittingSystem ||
                  isLoading ||
                  fundingAccountBalance === null ||
                  eligibleAccounts.length === 0
                }
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
              >
                {isSubmittingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                <span>Deposit Funds</span>
              </button>
            </div>
          </form>

          {systemFormError && (
            <p role="alert" className="flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{systemFormError}</span>
            </p>
          )}

          {eligibleAccounts.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Account ID</th>
                    <th className="px-4 py-3 text-right">Current balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {eligibleAccounts.map((account) => (
                    <tr key={account._id} className="text-slate-300">
                      <td className="px-4 py-3">
                        <span className="block font-medium text-white">{account.user?.name || 'Unknown account holder'}</span>
                      </td>
                      <td className="break-all px-4 py-3 font-mono text-[10px]">{account._id}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {formatCurrency(account.balance, account.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Standard User Deposit Instructions */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Authorized deposits only</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your current sign-in is not authorized to fund accounts. To deposit money, sign in as an authorized system user. That user can fund a different user's active account only, using an active system funding account with enough available balance.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Receive a transfer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A different Finora user can send funds to your active account through Transfer Money. Share your account ID with the sender; successful transfers are recorded in your transaction history.
            </p>
            {accounts.length > 0 && (
              <div className="break-all rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400">
                Your account ID: {accounts[0]._id}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incoming Deposits Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Deposited Credit History</h3>

        {depositTxs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No incoming credit deposits found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Destination Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {depositTxs.map((tx) => {
                  const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-mono text-slate-200">{tx._id ? tx._id.slice(-8) : 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(tx.createdAt)}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">{maskAccountId(toId)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={tx.status} /></td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">+ {formatCurrency(tx.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
