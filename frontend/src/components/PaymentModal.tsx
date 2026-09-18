import React, { useState } from 'react';
import { CreditCard, Banknote, Building2, Check, X, AlertCircle } from 'lucide-react';
import { Customer } from '../types';

interface PaymentModalProps {
  total: number;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card' | 'bank_transfer' | 'credit', amount: number, tendered: number) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, customer, isOpen, onClose, onConfirm }) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>(total.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tendered = parseFloat(tenderedInput) || 0;
  const changeDue = Math.max(0, tendered - total);
  const isInsufficient = tendered < total;

  const quickAmounts = [10, 20, 50, 100];

  const handleQuickAdd = (amt: number) => {
    setTenderedInput(amt.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'cash' && isInsufficient) {
      setError('Tendered amount must equal or exceed total.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(method, total, method === 'cash' ? tendered : total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in text-slate-800">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
            <span>Process Payment</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
              ${total.toFixed(2)}
            </span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector in 3D */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'bank_transfer', label: 'UPI / Bank', icon: Building2 },
              { id: 'credit', label: 'Credit', icon: Check, disabled: !customer },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  disabled={m.disabled}
                  onClick={() => {
                    setMethod(m.id as any);
                    if (m.id !== 'cash') {
                      setTenderedInput(total.toFixed(2));
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition transform active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md shadow-indigo-500/15 -translate-y-1'
                      : m.disabled
                      ? 'opacity-40 border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5 shadow-sm'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Input & Quick Tender options */}
          {method === 'cash' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
              <label className="text-xs font-bold text-slate-700">Tendered Cash ($)</label>
              <input
                type="number"
                step="0.01"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-emerald-600 focus:outline-none focus:border-indigo-500 text-right shadow-sm font-display"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTenderedInput(total.toFixed(2))}
                  className="tender-3d px-3 py-1.5 text-xs rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-semibold"
                >
                  Exact (${total.toFixed(2)})
                </button>
                {quickAmounts.filter(a => a >= total).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="tender-3d flex-1 py-1.5 text-xs rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Change Due:</span>
                <span className={`text-xl font-black font-display ${changeDue > 0 ? 'text-teal-600' : 'text-slate-500'}`}>
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {customer && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between shadow-sm">
              <span>Customer: <strong className="text-slate-800">{customer.name}</strong></span>
              <span>Points Earned: <strong className="text-amber-600">+{Math.floor(total / 10)} pts</strong></span>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-3d-slate px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (method === 'cash' && isInsufficient)}
              className="btn-3d flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition text-sm flex items-center justify-center gap-2 font-display"
            >
              {isSubmitting ? 'Processing...' : `Confirm & Pay $${total.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
