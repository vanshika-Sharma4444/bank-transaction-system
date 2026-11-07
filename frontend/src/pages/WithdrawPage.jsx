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
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  ArrowUpRight,
  Wallet,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export const WithdrawPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form State
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [formError, setFormError] = useState('');

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTx, setCompletedTx] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const accs = await accountService.getUserAccounts();
      setAccounts(accs);

      const [balanceEntries, txs] = await Promise.all([
        Promise.all(
          accs.map(async (acc) => [
            acc._id,
            await accountService.getAccountBalance(acc._id)
          ])
        ),
        transactionService.getUserTransactions()
      ]);
      const balMap = Object.fromEntries(balanceEntries);
      setBalances(balMap);
      setTransactions(txs);
      setFromAccount((current) =>
        accs.some((account) => account._id === current)
          ? current
          : accs[0]?._id || ''
      );
    } catch (err) {
      console.error('Error loading withdrawal data:', err);
      setBalances({});
      setLoadError(
        err?.response?.data?.message || 'Could not verify account balances. Refresh and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userAccountIds = new Set(accounts.map((a) => String(a._id)));
  const selectedBalance = balances[fromAccount] || 0;

  // Filter debited transactions
  const withdrawTxs = transactions.filter((tx) => {
    const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
    return userAccountIds.has(fromId);
  });

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setFormError('');

    if (!fromAccount) {
      setFormError('Please select a source account.');
      return;
    }

    if (!toAccount.trim()) {
      setFormError('Destination Account ID is required.');
      return;
    }

    if (toAccount.trim().length !== 24) {
      setFormError('Destination Account ID must be a valid 24-character hexadecimal MongoDB ID.');
      return;
    }

    if (fromAccount === toAccount.trim()) {
      setFormError('Source and Destination accounts cannot be identical.');
      return;
    }

    const amountInMinorUnits = parseAmountInMinorUnits(amount);
    if (amountInMinorUnits === null || amountInMinorUnits <= 0) {
      setFormError('Enter a positive amount with no more than two decimal places.');
      return;
    }

    const balanceInMinorUnits = parseAmountInMinorUnits(selectedBalance);
    if (balanceInMinorUnits === null || amountInMinorUnits > balanceInMinorUnits) {
      setFormError(`Insufficient balance. Current balance is ${formatCurrency(selectedBalance)}.`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteWithdrawal = async () => {
    try {
      setIsSubmitting(true);
      const res = await transactionService.createTransaction({
        fromAccount,
        toAccount: toAccount.trim(),
        amount: amount.trim(),
        idempotencyKey,
      });

      if (res.transaction?.status !== 'success') {
        throw new Error('The server did not confirm that this withdrawal transaction succeeded.');
      }

      setIsConfirmOpen(false);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      toast.success(res.message || 'Withdrawal transaction executed successfully!');

      if (res.transaction) setCompletedTx(res.transaction);

      setAmount('');
      setToAccount('');
      setIdempotencyKey(generateIdempotencyKey());
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Withdrawal transaction failed.';
      toast.error(msg);
      setFormError(msg);
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-2xl font-extrabold text-white">Withdrawal & Debit Management</h2>
        <p className="text-xs text-slate-400">Execute outgoing transfers and review debited ledger records</p>
      </div>

      {/* Withdrawal Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        
        {formError && (
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
        {loadError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {loadError}
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Account */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Source Checking Account</label>
                <span className="text-xs text-slate-400 font-medium text-emerald-400">{formatCurrency(selectedBalance)}</span>
              </div>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    Checking ({acc._id})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Destination Account ID</label>
              <input
                type="text"
                required
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                placeholder="24-char Destination Account ID"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Withdrawal Amount (INR)</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-extrabold text-lg placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(loadError) || isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Authorize Outgoing Withdrawal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Debit Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Debited Withdrawal History</h3>

        {withdrawTxs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No debited withdrawal transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Destination Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount Debited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawTxs.map((tx) => {
                  const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-mono text-slate-200">{tx._id ? tx._id.slice(-8) : 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(tx.createdAt)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{maskAccountId(toId)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={tx.status} /></td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400">- {formatCurrency(tx.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteWithdrawal}
        isLoading={isSubmitting}
        details={{
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: parseAmountInMinorUnits(amount) / 100,
          idempotencyKey,
        }}
      />

      <ReceiptModal
        isOpen={!!completedTx}
        onClose={() => setCompletedTx(null)}
        transaction={completedTx}
      />

    </div>
  );
};
