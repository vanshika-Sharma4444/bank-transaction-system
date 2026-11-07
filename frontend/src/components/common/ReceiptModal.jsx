import React from 'react';
import { Landmark, Printer, Download, X, CheckCircle2, Shield } from 'lucide-react';
import { formatCurrency, formatDate, maskAccountId } from '../../utils/formatters';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const { _id, fromAccount, toAccount, amount, status, idempotencyKey, createdAt } = transaction;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FINORA BANKING', 15, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('OFFICIAL TRANSACTION RECEIPT', 15, 32);

      // Status
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${String(status).toUpperCase()}`, 15, 55);

      // Amount Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, 62, 180, 25, 3, 3, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(18);
      doc.text(formatCurrency(amount), 25, 78);

      // Details Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      let y = 100;
      const addRow = (label, value) => {
        doc.text(label, 15, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), 90, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 3, 195, y + 3);
        y += 14;
      };

      addRow('Transaction ID:', _id || 'N/A');
      addRow('Idempotency Key:', idempotencyKey || 'N/A');
      addRow('Date & Time:', formatDate(createdAt));
      addRow('From Account:', typeof fromAccount === 'object' ? fromAccount._id : fromAccount || 'System Account');
      addRow('To Account:', typeof toAccount === 'object' ? toAccount._id : toAccount || 'N/A');
      addRow('Transfer Amount:', formatCurrency(amount));

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('This is an application-generated digital receipt from Finora Banking Platform.', 15, 260);
      doc.text('Secured with Double-Entry Ledger Verification.', 15, 266);

      doc.save(`Finora_Receipt_${_id ? _id.slice(-6) : 'Tx'}.pdf`);
      toast.success('PDF Receipt downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. You can use Print Receipt.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="glass-card max-w-lg w-full rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 print:border-slate-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Landmark className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white print:text-black">FINORA BANKING</h3>
              <p className="text-xs text-emerald-400 font-semibold print:text-emerald-700">Official Transaction Receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Icon & Amount */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold print:text-slate-600">
            {status === 'success' ? 'Payment Completed' : 'Transaction Status'}
          </span>
          <div className="text-3xl font-black text-white print:text-black">
            {formatCurrency(amount)}
          </div>
        </div>

        {/* Receipt Rows */}
        <div className="space-y-2.5 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 print:bg-slate-50 print:border-slate-300">
          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Transaction Ref:</span>
            <span className="font-mono text-slate-200 font-semibold truncate max-w-[200px]">{_id}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-200">{formatDate(createdAt)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">From Account:</span>
            <span className="font-mono text-slate-200">
              {typeof fromAccount === 'object' ? maskAccountId(fromAccount._id) : maskAccountId(fromAccount)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/40">
            <span className="text-slate-400">To Account:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {typeof toAccount === 'object' ? maskAccountId(toAccount._id) : maskAccountId(toAccount)}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-400">Idempotency Key:</span>
            <span className="font-mono text-slate-400 truncate max-w-[180px]">{idempotencyKey}</span>
          </div>
        </div>

        {/* Verification Note */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 justify-center">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Double-Entry Ledger Transaction Record</span>
        </div>

        {/* Buttons (Hidden during printing) */}
        <div className="flex items-center space-x-3 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 font-medium hover:bg-slate-900 text-xs flex items-center justify-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="w-1/2 py-2.5 px-4 rounded-xl gradient-btn text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
