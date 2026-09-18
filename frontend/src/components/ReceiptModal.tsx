import React, { useRef } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Sale } from '../types';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold text-white">Payment Confirmed</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900 font-mono text-xs select-text" id="printable-receipt">
          <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
            <h2 className="text-base font-bold tracking-wider text-black">SMART RETAIL POS</h2>
            <p className="text-[11px] text-slate-600">{sale.branch_name || 'Flagship Store #01'}</p>
            <p className="text-[10px] text-slate-500">Invoice: {sale.invoice_no}</p>
            <p className="text-[10px] text-slate-500">
              Date: {new Date(sale.created_at).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">Cashier: {sale.cashier_name || 'Staff'}</p>
            {sale.customer && (
              <p className="text-[10px] text-slate-600 font-sans mt-1">Customer: <b>{sale.customer.name}</b></p>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items?.map((it) => (
                <tr key={it.id}>
                  <td className="py-1.5 pr-1 font-sans">{it.product_name}</td>
                  <td className="py-1.5 text-center">{it.quantity}</td>
                  <td className="py-1.5 text-right">${parseFloat(it.unit_price).toFixed(2)}</td>
                  <td className="py-1.5 text-right font-semibold">${parseFloat(it.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${parseFloat(sale.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(sale.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-${parseFloat(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (VAT):</span>
              <span>${parseFloat(sale.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-1 text-black">
              <span>TOTAL:</span>
              <span>${parseFloat(sale.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Paid:</span>
              <span>${parseFloat(sale.paid_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Change Due:</span>
              <span>${parseFloat(sale.change_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-600">
            <p className="font-semibold mb-0.5">Payment Method:</p>
            {sale.payments?.map((pm) => (
              <div key={pm.id} className="flex justify-between capitalize">
                <span>{pm.method}:</span>
                <span>${parseFloat(pm.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-4 pt-3 border-t border-slate-300 text-[10px] text-slate-500">
            <p>Thank you for shopping with us!</p>
            <p>Goods sold are returnable within 7 days with valid receipt.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
