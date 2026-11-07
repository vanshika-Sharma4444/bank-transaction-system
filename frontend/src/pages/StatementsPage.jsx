import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { formatCurrency, formatDate, maskAccountId } from '../utils/formatters';
import { FileSpreadsheet, Download, Calendar, Landmark, CheckCircle, Shield } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const StatementsPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [period, setPeriod] = useState('30'); // 30, 90, 365, ALL
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const accs = await accountService.getUserAccounts();
      setAccounts(accs);
      const txs = await transactionService.getUserTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching statement data:', err);
      toast.error('Failed to load transaction statement data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => String(a._id))), [accounts]);

  // Filtered transactions for statement
  const filteredTxs = useMemo(() => {
    const now = Date.now();
    const days = Number(period);

    return transactions.filter((tx) => {
      const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
      const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);

      // Account filter
      if (selectedAccountId !== 'ALL') {
        if (fromId !== selectedAccountId && toId !== selectedAccountId) return false;
      }

      // Date range filter
      if (days > 0) {
        const txDate = new Date(tx.createdAt || 0).getTime();
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        if (txDate < cutoff) return false;
      }

      return true;
    });
  }, [transactions, period, selectedAccountId]);

  // Calculations
  let periodCredits = 0;
  let periodDebits = 0;

  filteredTxs.forEach((tx) => {
    const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
    const amt = Number(tx.amount) || 0;
    if (userAccountIds.has(toId)) {
      periodCredits += amt;
    } else {
      periodDebits += amt;
    }
  });

  // Export PDF Statement
  const handleExportPDFStatement = () => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 45, 'F');

      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FINORA BANKING', 14, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text('ACCOUNT STATEMENT', 14, 30);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Account Holder: ${user?.name || 'Valued User'} (${user?.email || ''})`, 14, 38);

      // Statement Summary Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 52, 182, 28, 3, 3, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Statement Period:', 20, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(period === 'ALL' ? 'All Time' : `Last ${period} Days`, 60, 62);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Credits:', 20, 72);
      doc.setTextColor(16, 185, 129);
      doc.text(`+ ${formatCurrency(periodCredits)}`, 60, 72);

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Debits:', 110, 72);
      doc.setTextColor(225, 29, 72);
      doc.text(`- ${formatCurrency(periodDebits)}`, 140, 72);

      // Table Rows Data
      const tableRows = filteredTxs.map((tx) => {
        const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
        const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
        const isCredit = userAccountIds.has(toId);

        return [
          formatDate(tx.createdAt),
          tx._id ? tx._id.slice(-8) : 'N/A',
          isCredit ? 'CREDIT (+)' : 'DEBIT (-)',
          maskAccountId(fromId),
          maskAccountId(toId),
          String(tx.status).toUpperCase(),
          `${isCredit ? '+' : '-'} ₹${Number(tx.amount).toFixed(2)}`,
        ];
      });

      // AutoTable Plugin
      autoTable(doc, {
        startY: 88,
        head: [['Date & Time', 'Ref ID', 'Type', 'From Acc', 'To Acc', 'Status', 'Amount']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Footer
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Finora Banking digital ledger statement record.', 14, finalY);

      doc.save(`Finora_Statement_${user?.name ? user.name.replace(/\s+/g, '_') : 'Account'}.pdf`);
      toast.success('Official PDF Statement downloaded!');
    } catch (err) {
      console.error('Statement PDF error:', err);
      toast.error('Failed to generate statement PDF.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Financial Statements</h2>
          <p className="text-xs text-slate-400">Generate and download official PDF ledger statements</p>
        </div>

        <button
          onClick={handleExportPDFStatement}
          disabled={filteredTxs.length === 0}
          className="gradient-btn text-slate-950 font-bold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20 w-max"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Statement</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Statement Filter Controls</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last 1 Year</option>
              <option value="0">All Time Records</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Account Filter</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All User Accounts</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  Checking ({acc._id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statement Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Transactions Included</span>
          <div className="text-2xl font-extrabold text-white mt-1">{filteredTxs.length} records</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Period Credits</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">+ {formatCurrency(periodCredits)}</div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Period Debits</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">- {formatCurrency(periodDebits)}</div>
        </div>
      </div>

      {/* Statement Preview Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Statement Preview</h3>

        {filteredTxs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No transactions match the selected statement date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTxs.map((tx) => {
                  const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
                  const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
                  const isCredit = userAccountIds.has(toId);

                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-slate-300">{formatDate(tx.createdAt)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{tx._id ? tx._id.slice(-8) : 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">{isCredit ? 'CREDIT' : 'DEBIT'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{maskAccountId(fromId)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{maskAccountId(toId)}</td>
                      <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
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
