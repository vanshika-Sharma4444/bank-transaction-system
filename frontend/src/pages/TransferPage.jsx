import React, { useEffect, useState, useCallback } from 'react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import {
  formatCurrency,
  generateIdempotencyKey,
  maskAccountId,
  parseAmountInMinorUnits
} from '../utils/formatters';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  SendHorizontal,
  Wallet,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Key
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export const TransferPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [balanceError, setBalanceError] = useState('');

  // Form State
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [formError, setFormError] = useState('');

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal State
  const [completedTx, setCompletedTx] = useState(null);

  // Fetch user accounts
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);
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
      setFromAccount((current) =>
        userAccounts.some((account) => account._id === current)
          ? current
          : userAccounts[0]?._id || ''
      );
    } catch (err) {
      console.error('Failed to load accounts for transfer:', err);
      setBalances({});
      setBalanceError(
        err?.response?.data?.message || 'Could not verify account balances. Refresh and try again.'
      );
      toast.error('Could not fetch accounts.');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const selectedBalance = balances[fromAccount] || 0;

  const handleRegenerateKey = () => {
    setIdempotencyKey(generateIdempotencyKey());
  };

  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    setFormError('');

    if (!fromAccount) {
      setFormError('Please select a source account.');
      return;
    }

    if (!toAccount.trim()) {
      setFormError('Recipient Account ID is required.');
      return;
    }

    if (toAccount.trim().length !== 24) {
      setFormError('Recipient Account ID must be a valid 24-character hexadecimal MongoDB ID.');
      return;
    }

    if (fromAccount === toAccount.trim()) {
      setFormError('Source account and Recipient account cannot be the same.');
      return;
    }

    const amountInMinorUnits = parseAmountInMinorUnits(amount);
    if (amountInMinorUnits === null || amountInMinorUnits <= 0) {
      setFormError('Enter a positive amount with no more than two decimal places.');
      return;
    }

    const balanceInMinorUnits = parseAmountInMinorUnits(selectedBalance);
    if (balanceInMinorUnits === null || amountInMinorUnits > balanceInMinorUnits) {
      setFormError(`Insufficient balance. Selected account balance is ${formatCurrency(selectedBalance)}.`);
      return;
    }

    if (!idempotencyKey.trim()) {
      setFormError('Idempotency key is required to prevent duplicate transfers.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteTransfer = async () => {
    try {
      setIsSubmitting(true);
      const response = await transactionService.createTransaction({
        fromAccount,
        toAccount: toAccount.trim(),
        amount: amount.trim(),
        idempotencyKey,
      });

      if (response.transaction?.status !== 'success') {
        throw new Error('The server did not confirm that this transfer succeeded.');
      }

      setIsConfirmOpen(false);

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#38bdf8']
      });

      toast.success(response.message || 'Transaction executed successfully!');
      
      if (response.transaction) {
        setCompletedTx(response.transaction);
      }

      // Reset Form fields
      setAmount('');
      setToAccount('');
      setIdempotencyKey(generateIdempotencyKey());

      // Refresh balances
      await loadAccounts();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Transaction failed to process.';
      toast.error(msg);
      setFormError(msg);
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <SendHorizontal className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Instant Money Transfer</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Transfer funds securely across Finora accounts with double-entry ledger verification and duplicate payment protection.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">

        {balanceError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {balanceError}
          </div>
        )}
        
        {formError && (
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleOpenConfirmation} className="space-y-6">
          
          {/* Source Account Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Source Account</label>
              <span className="text-xs text-slate-400">
                Available: <strong className="text-emerald-400">{formatCurrency(selectedBalance)}</strong>
              </span>
            </div>
            <div className="relative">
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                required
                className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id} className="bg-slate-900 text-white font-mono">
                    Checking - {acc._id} ({formatCurrency(balances[acc._id] || 0)})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Recipient Account ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Recipient Account ID (MongoDB ObjectId)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                placeholder="e.g. 6750abc1234567890def1234"
                className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Enter destination account 24-character hexadecimal ID</p>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Transfer Amount (INR)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 font-bold">
                ₹
              </div>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-extrabold text-lg placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Idempotency Key Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Idempotency Reference Key
              </label>
              <button
                type="button"
                onClick={handleRegenerateKey}
                className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Key</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={idempotencyKey}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs focus:outline-none cursor-not-allowed"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Prevents accidental double charges in network lag</p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={accounts.length === 0 || isLoadingAccounts || Boolean(balanceError)}
            className="w-full gradient-btn text-slate-950 font-bold py-4 rounded-xl text-base flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/25"
          >
            <span>Review & Authorize Transfer</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteTransfer}
        isLoading={isSubmitting}
        details={{
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: parseAmountInMinorUnits(amount) / 100,
          idempotencyKey,
        }}
      />

      {/* Success Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedTx}
        onClose={() => setCompletedTx(null)}
        transaction={completedTx}
      />

    </div>
  );
};
