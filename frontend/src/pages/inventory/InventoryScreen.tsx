import React, { useEffect, useState } from 'react';
import { 
  Layers, Plus, Minus, Search, ArrowUpDown, History, ShieldAlert,
  AlertTriangle, CheckCircle2, XCircle, Package, ArrowDownRight, ArrowUpRight, Filter
} from 'lucide-react';
import { InventoryItem, InventoryTransaction, Product } from '../../types';
import { api } from '../../services/api';

export const InventoryScreen: React.FC = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'levels' | 'history'>('levels');
  const [search, setSearch] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustNote, setAdjustNote] = useState('');

  const fetchInventoryData = async () => {
    try {
      const [invRes, txnRes, prodRes] = await Promise.all([
        api.get('/inventory/'),
        api.get('/inventory/transactions/'),
        api.get('/products/'),
      ]);
      setInventories(invRes.data);
      setTransactions(txnRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed fetching inventory', err);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.post('/inventory/adjust/', {
        product_id: selectedProduct.id,
        type: adjustType,
        quantity: parseInt(adjustQty),
        note: adjustNote,
      });
      setIsAdjustModalOpen(false);
      setAdjustNote('');
      fetchInventoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  const filteredInventories = inventories.filter((inv) => {
    const matchesSearch =
      inv.product.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.product.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'out_of_stock') return inv.quantity === 0;
    if (statusFilter === 'low_stock') return inv.quantity > 0 && inv.quantity <= inv.product.min_stock;
    if (statusFilter === 'in_stock') return inv.quantity > inv.product.min_stock;
    return true;
  });

  const totalUnits = inventories.reduce((acc, i) => acc + i.quantity, 0);
  const outOfStockCount = inventories.filter((i) => i.quantity === 0).length;
  const lowStockCount = inventories.filter((i) => i.quantity > 0 && i.quantity <= i.product.min_stock).length;
  const healthyStockCount = inventories.filter((i) => i.quantity > i.product.min_stock).length;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-display">Stock & Inventory Management</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {inventories.length} Tracked SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time branch inventory levels, threshold alerts, and reconciliation logs</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'levels'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Current Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Movement History
          </button>
        </div>
      </div>

      {/* Stock Health Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 perspective-deep">
        <div
          onClick={() => setStatusFilter('all')}
          className={`card-3d-floating rounded-2xl p-4 border cursor-pointer transition ${
            statusFilter === 'all'
              ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Units</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-display mt-1">{totalUnits}</h3>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">All registered products</span>
        </div>

        <div
          onClick={() => setStatusFilter('in_stock')}
          className={`card-3d-floating rounded-2xl p-4 border cursor-pointer transition ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Adequate Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-display mt-1">{healthyStockCount}</h3>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Above minimum reorder level</span>
        </div>

        <div
          onClick={() => setStatusFilter('low_stock')}
          className={`card-3d-floating rounded-2xl p-4 border cursor-pointer transition ${
            statusFilter === 'low_stock'
              ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Low Stock Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-amber-700 font-display mt-1">{lowStockCount}</h3>
          <span className="text-[10px] text-amber-600 font-medium mt-1 block">At or below reorder threshold</span>
        </div>

        <div
          onClick={() => setStatusFilter('out_of_stock')}
          className={`card-3d-floating rounded-2xl p-4 border cursor-pointer transition ${
            statusFilter === 'out_of_stock'
              ? 'bg-rose-50/60 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-rose-700 font-display mt-1">{outOfStockCount}</h3>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">Zero inventory available</span>
        </div>
      </div>

      {activeTab === 'levels' ? (
        <>
          {/* Search bar & Filter Indicator */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory by product name, SKU or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition shrink-0"
              >
                Clear Filter ({statusFilter.replace('_', ' ')}) &times;
              </button>
            )}
          </div>

          {/* High-Contrast Colored Row-by-Row Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 uppercase tracking-wider text-[11px] text-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Branch Location</th>
                  <th className="py-3.5 px-4 text-center">Threshold Alert</th>
                  <th className="py-3.5 px-4 text-center">In-Stock Quantity</th>
                  <th className="py-3.5 px-4 text-center">Live Status</th>
                  <th className="py-3.5 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInventories.map((inv, idx) => {
                  const isOutOfStock = inv.quantity === 0;
                  const isLow = inv.quantity > 0 && inv.quantity <= inv.product.min_stock;
                  const isHealthy = inv.quantity > inv.product.min_stock;

                  // Row background styling: Alternating colored rows based on stock severity
                  let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80';
                  let borderAccent = 'border-l-4 border-l-emerald-500';
                  let hoverEffect = 'table-row-healthy';

                  if (isOutOfStock) {
                    rowBg = idx % 2 === 0 ? 'bg-rose-50/50' : 'bg-rose-50/80';
                    borderAccent = 'border-l-4 border-l-rose-500';
                    hoverEffect = 'table-row-out-of-stock';
                  } else if (isLow) {
                    rowBg = idx % 2 === 0 ? 'bg-amber-50/50' : 'bg-amber-50/80';
                    borderAccent = 'border-l-4 border-l-amber-500';
                    hoverEffect = 'table-row-low-stock';
                  }

                  return (
                    <tr
                      key={inv.id}
                      className={`${rowBg} ${borderAccent} ${hoverEffect} table-row-interactive transition-all duration-200 cursor-pointer`}
                    >
                      {/* Product Thumbnail & Names */}
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={inv.product.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300'}
                          alt={inv.product.name}
                          className="w-10 h-10 rounded-xl object-cover bg-white border border-slate-200 shadow-sm shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{inv.product.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            SKU: <strong className="text-slate-700">{inv.product.sku}</strong>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{inv.product.brand || 'Retail Item'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Branch Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-[11px] shadow-2xs">
                          {inv.branch_name}
                        </span>
                      </td>

                      {/* Threshold Minimum */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          {inv.product.min_stock} units
                        </span>
                      </td>

                      {/* Available Stock with colored gauge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-base font-black font-display tracking-tight ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {inv.quantity}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                            Units available
                          </span>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white shadow-rose-500/20'
                              : isLow
                              ? 'bg-amber-500 text-white shadow-amber-500/20'
                              : 'bg-emerald-600 text-white shadow-emerald-500/20'
                          }`}
                        >
                          {isOutOfStock && <XCircle className="w-3.5 h-3.5" />}
                          {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                          {isHealthy && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{isOutOfStock ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}</span>
                        </span>
                      </td>

                      {/* Adjustment Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedProduct(inv.product);
                            setAdjustQty('10');
                            setIsAdjustModalOpen(true);
                          }}
                          className="btn-3d-slate px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reconcile / Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Movement History Table: Colored Rows */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 uppercase tracking-wider text-[11px] text-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4 text-center">Qty Change</th>
                <th className="py-3.5 px-4 text-center">Stock Audit Path</th>
                <th className="py-3.5 px-4">Reference / Reason</th>
                <th className="py-3.5 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.map((tx, idx) => {
                const isPositive = tx.quantity > 0;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
                const borderAccent = isPositive
                  ? 'border-l-4 border-l-emerald-500'
                  : 'border-l-4 border-l-rose-500';
                const hoverEffect = isPositive ? 'table-row-healthy' : 'table-row-out-of-stock';

                return (
                  <tr key={tx.id} className={`${rowBg} ${borderAccent} ${hoverEffect} table-row-interactive transition-all duration-200 cursor-pointer`}>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tx.product_name}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-black ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600 font-medium">
                      <span className="text-slate-400">{tx.previous_quantity}</span> &rarr;{' '}
                      <strong className="text-indigo-600 text-sm font-bold font-display">{tx.new_quantity}</strong>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">{tx.note || tx.reference_id || 'Direct Adjustment'}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{tx.created_by_name || 'System'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 font-display">Adjust Stock: {selectedProduct.name}</h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                {(['add', 'subtract', 'set'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdjustType(t)}
                    className={`py-2 rounded-xl uppercase font-bold text-[11px] border transition ${
                      adjustType === t
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'add' ? '+ Add Stock' : t === 'subtract' ? '- Deduct' : 'Set Exact'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g., Audit count, damaged goods, supplier return"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
