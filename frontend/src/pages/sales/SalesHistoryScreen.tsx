import React, { useEffect, useState } from 'react';
import { Search, Eye, RotateCcw, XCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Sale } from '../../types';
import { api } from '../../services/api';
import { ReceiptModal } from '../../components/ReceiptModal';

export const SalesHistoryScreen: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItemSelection, setReturnItemSelection] = useState<{ [key: number]: number }>({});
  const [returnReason, setReturnReason] = useState('');

  const fetchSales = async () => {
    try {
      const res = await api.get('/sales/');
      setSales(res.data);
    } catch (err) {
      console.error('Failed fetching sales history', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleCancelSale = async (sale: Sale) => {
    if (!confirm(`Are you sure you want to cancel invoice ${sale.invoice_no}? All product quantities will be restored to stock.`)) {
      return;
    }
    try {
      await api.post(`/sales/${sale.id}/cancel/`);
      alert(`Sale ${sale.invoice_no} has been cancelled.`);
      fetchSales();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel sale');
    }
  };

  const handleOpenReturn = (sale: Sale) => {
    setSelectedSale(sale);
    const initial: { [key: number]: number } = {};
    sale.items.forEach((it) => {
      initial[it.id] = 0;
    });
    setReturnItemSelection(initial);
    setIsReturnModalOpen(true);
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    const itemsToReturn = Object.entries(returnItemSelection)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        sale_item_id: parseInt(itemId),
        quantity: qty,
      }));

    if (itemsToReturn.length === 0) {
      alert('Please select at least 1 item to return');
      return;
    }

    try {
      await api.post(`/sales/${selectedSale.id}/return_sale/`, {
        items: itemsToReturn,
        reason: returnReason,
      });
      setIsReturnModalOpen(false);
      setReturnReason('');
      alert('Return processed successfully! Stock has been replenished.');
      fetchSales();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process return');
    }
  };

  const filtered = sales.filter(
    (s) =>
      s.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      s.cashier_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Sales & Invoice History</h1>
          <p className="text-xs text-slate-500 font-medium">All registered checkout transactions, receipts, and returns</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by invoice number, customer name, or cashier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Sales List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.invoice_no}</td>
                <td className="py-3 px-4 text-slate-500">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{s.customer?.name || 'Walk-in'}</td>
                <td className="py-3 px-4 text-slate-700">{s.cashier_name}</td>
                <td className="py-3 px-4 text-right font-extrabold text-indigo-600 font-display">
                  ${parseFloat(s.total).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : s.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedSale(s);
                        setIsReceiptOpen(true);
                      }}
                      title="View & Print Receipt"
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {s.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleOpenReturn(s)}
                          title="Process Return / Refund"
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelSale(s)}
                          title="Cancel Transaction"
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Return Modal */}
      {isReturnModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Process Return for Invoice: <span className="font-mono text-indigo-600">{selectedSale.invoice_no}</span>
            </h3>

            <form onSubmit={submitReturn} className="space-y-4 text-xs">
              <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <p className="text-slate-700 font-semibold">Select item quantities to return:</p>
                {selectedSale.items.map((it) => {
                  const maxReturnable = it.quantity - it.returned_quantity;
                  return (
                    <div key={it.id} className="flex items-center justify-between py-2 border-b border-slate-200/80 last:border-none">
                      <div>
                        <span className="font-semibold text-slate-800">{it.product_name}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Sold: {it.quantity} | Already Returned: {it.returned_quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">Return Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          value={returnItemSelection[it.id] || 0}
                          onChange={(e) =>
                            setReturnItemSelection({
                              ...returnItemSelection,
                              [it.id]: Math.min(maxReturnable, Math.max(0, parseInt(e.target.value) || 0)),
                            })
                          }
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reason for Return</label>
                <input
                  type="text"
                  placeholder="e.g., Customer changed mind, wrong size, expired packaging"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/25"
                >
                  Confirm Return & Restore Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      <ReceiptModal
        sale={selectedSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
