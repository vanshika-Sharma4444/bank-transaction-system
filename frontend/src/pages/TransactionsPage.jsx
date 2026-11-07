import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { formatCurrency, formatDate, maskAccountId } from '../utils/formatters';
import { StatusBadge, TypeBadge } from '../components/common/Badge';
import { SkeletonTable } from '../components/common/Skeleton';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TransactionsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CREDIT, DEBIT
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, success, pending, failed
  const [sortOrder, setSortOrder] = useState('NEWEST'); // NEWEST, OLDEST

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected for Receipt Modal
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const accs = await accountService.getUserAccounts();
      setAccounts(accs);
      const txs = await transactionService.getUserTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setLoadError(
        err?.response?.data?.message ||
        'Could not load transaction history. Check your connection and try again.'
      );
      toast.error('Failed to load transaction history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => String(a._id))), [accounts]);

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
        const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
        const isCredit = userAccountIds.has(toId);

        // Search match
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          (tx._id && tx._id.toLowerCase().includes(query)) ||
          fromId.toLowerCase().includes(query) ||
          toId.toLowerCase().includes(query) ||
          (tx.idempotencyKey && tx.idempotencyKey.toLowerCase().includes(query));

        // Type filter match
        const matchesType =
          typeFilter === 'ALL' ||
          (typeFilter === 'CREDIT' && isCredit) ||
          (typeFilter === 'DEBIT' && !isCredit);

        // Status filter match
        const matchesStatus =
          statusFilter === 'ALL' || String(tx.status).toLowerCase() === statusFilter.toLowerCase();

        return matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, searchQuery, typeFilter, statusFilter, sortOrder, userAccountIds]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Transaction History</h2>
          <p className="text-xs text-slate-400">Audit logs and double-entry ledger records</p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors w-max"
          title="Refresh transaction history"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Ref, ID, or Key..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Types (Credit & Debit)</option>
            <option value="CREDIT">Credits (+ Incoming)</option>
            <option value="DEBIT">Debits (- Outgoing)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="OLDEST">Sort: Oldest First</option>
          </select>
        </div>

      </div>

      {/* Main Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : loadError ? (
        <div role="alert" className="glass-panel rounded-2xl p-12 text-center text-slate-400 space-y-4">
          <History className="w-10 h-10 mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-white">Transaction history could not be loaded</p>
          <p className="text-xs max-w-sm mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <History className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-white">
            {transactions.length === 0 ? 'No transactions for your accounts yet' : 'No Matching Transactions Found'}
          </p>
          <p className="text-xs max-w-sm mx-auto">
            {transactions.length === 0
              ? 'Only completed backend transactions involving your accounts appear here. After a transfer succeeds, refresh this page to load the saved history.'
              : 'Try clearing search or status filters to see your transactions.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Source Account</th>
                  <th className="py-3.5 px-4">Recipient Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedTransactions.map((tx) => {
                  const fromId = typeof tx.fromAccount === 'object' ? String(tx.fromAccount._id) : String(tx.fromAccount);
                  const toId = typeof tx.toAccount === 'object' ? String(tx.toAccount._id) : String(tx.toAccount);
                  const isCredit = userAccountIds.has(toId);

                  return (
                    <tr key={tx._id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-200 font-medium">
                        {tx._id}
                      </td>
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="py-4 px-4">
                        <TypeBadge type={isCredit ? 'CREDIT' : 'DEBIT'} />
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">{maskAccountId(fromId)}</td>
                      <td className="py-4 px-4 font-mono text-emerald-400 font-medium">{maskAccountId(toId)}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className={`py-4 px-4 text-right font-extrabold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({filteredTransactions.length} items)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />

    </div>
  );
};
