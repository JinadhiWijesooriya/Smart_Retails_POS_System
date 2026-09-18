import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  Plus,
  CheckCircle,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  X,
  Trash2,
  ShoppingCart,
  ChevronDown,
  AlertCircle,
  Percent,
  Tag,
  Hash,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  FileText,
  RefreshCw,
  Calendar,
  Building2,
  Phone,
  Mail,
  Star,
  Zap,
} from 'lucide-react';
import { Purchase, Supplier, Product } from '../../types';
import { api } from '../../services/api';

interface PoLineItem {
  product_id: number;
  quantity: number;
  unit_cost: string;
  retail_price: string;
  selling_price: string;
  tax_rate: string;
}

const emptyItem = (products: Product[]): PoLineItem => ({
  product_id: products.length > 0 ? products[0].id : 0,
  quantity: 1,
  unit_cost: products.length > 0 ? products[0].cost_price : '0',
  retail_price: products.length > 0 ? products[0].selling_price : '0',
  selling_price: products.length > 0 ? products[0].selling_price : '0',
  tax_rate: products.length > 0 ? products[0].tax_rate : '0',
});

const calcMargin = (cost: string, selling: string): number => {
  const c = parseFloat(cost) || 0;
  const s = parseFloat(selling) || 0;
  if (c <= 0) return 0;
  return ((s - c) / c) * 100;
};

const marginColor = (margin: number) => {
  if (margin < 0) return 'text-rose-600 bg-rose-50 border-rose-200';
  if (margin < 10) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (margin < 25) return 'text-sky-600 bg-sky-50 border-sky-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
};

const marginBarColor = (margin: number) => {
  if (margin < 0) return 'bg-rose-500';
  if (margin < 10) return 'bg-amber-500';
  if (margin < 25) return 'bg-sky-500';
  return 'bg-emerald-500';
};

const statusConfig: Record<string, { label: string; dot: string; badge: string; row: (idx: number) => string }> = {
  received: {
    label: 'âœ… Received',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    row: (idx) => idx % 2 === 0
      ? 'bg-emerald-50 border-l-[5px] border-emerald-500'
      : 'bg-emerald-50/40 border-l-[5px] border-emerald-300',
  },
  cancelled: {
    label: 'âŒ Cancelled',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
    row: (idx) => idx % 2 === 0
      ? 'bg-rose-50 border-l-[5px] border-rose-500'
      : 'bg-rose-50/40 border-l-[5px] border-rose-300',
  },
  pending: {
    label: 'â³ Pending',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
    row: (idx) => idx % 2 === 0
      ? 'bg-amber-50 border-l-[5px] border-amber-500'
      : 'bg-amber-50/40 border-l-[5px] border-amber-300',
  },
};

const getStatus = (s: string) => statusConfig[s] ?? statusConfig.pending;

export const PurchasesScreen: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPO, setExpandedPO] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'received'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PoLineItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases/'),
        api.get('/suppliers/'),
        api.get('/products/'),
      ]);
      setPurchases(purRes.data);
      setSuppliers(supRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed fetching purchases', err);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenAddPO = () => {
    if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id.toString());
    setPoItems([emptyItem(products)]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleAddItem = () => setPoItems((p) => [...p, emptyItem(products)]);
  const handleRemoveItem = (idx: number) => setPoItems((p) => p.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: keyof PoLineItem, value: string | number) => {
    setPoItems((prev) => {
      const updated = [...prev];
      if (field === 'product_id') {
        const pid = parseInt(value as string);
        const pr = products.find((x) => x.id === pid);
        updated[idx] = {
          ...updated[idx],
          product_id: pid,
          unit_cost: pr ? pr.cost_price : '0',
          retail_price: pr ? pr.selling_price : '0',
          selling_price: pr ? pr.selling_price : '0',
          tax_rate: pr ? pr.tax_rate : '0',
        };
      } else {
        (updated[idx] as any)[field] = value;
      }
      return updated;
    });
  };

  const poTotal = poItems.reduce((sum, i) => sum + (parseFloat(i.unit_cost) || 0) * (i.quantity || 0), 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchases/', {
        supplier_id: parseInt(selectedSupplierId),
        notes,
        items: poItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          retail_price: i.retail_price,
          selling_price: i.selling_price,
          tax_rate: i.tax_rate,
        })),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create PO');
    }
  };

  const handleReceivePO = async (purchase: Purchase) => {
    if (!confirm(`Confirm receipt for PO ${purchase.purchase_no}?\n\nThis will add stock to inventory and update product pricing.`)) return;
    try {
      await api.post(`/purchases/${purchase.id}/receive/`);
      alert(`âœ… ${purchase.purchase_no} received! Inventory updated.`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to receive PO');
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id.toString() === selectedSupplierId);

  const pending = purchases.filter((p) => p.status !== 'received').length;
  const received = purchases.filter((p) => p.status === 'received').length;
  const totalSpent = purchases.filter((p) => p.status === 'received').reduce((s, p) => s + parseFloat(p.total), 0);
  const avgOrderValue = received > 0 ? totalSpent / received : 0;

  const filteredPurchases = purchases.filter((p) => {
    if (activeTab === 'pending') return p.status !== 'received';
    if (activeTab === 'received') return p.status === 'received';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 text-slate-800">

      {/* â”€â”€ Hero Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900 px-8 pt-8 pb-16">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Truck className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Procurement Center</p>
                <h1 className="text-2xl font-extrabold text-white font-display">Purchase Orders</h1>
              </div>
            </div>
            <p className="text-indigo-200/80 text-sm max-w-md mt-1">
              Manage distributor orders, set retail pricing & track supplier performance all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white/70 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddPO}
              className="flex items-center gap-2 bg-white text-indigo-700 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          </div>
        </div>

        {/* Stats cards floating in banner */}
        <div className="relative grid grid-cols-4 gap-4 mt-8">
          {[
            {
              icon: <Clock className="w-4 h-4" />,
              label: 'Pending',
              value: pending,
              sub: 'awaiting receipt',
              color: 'from-amber-400 to-orange-500',
              glow: 'shadow-amber-500/30',
            },
            {
              icon: <CheckCircle className="w-4 h-4" />,
              label: 'Received',
              value: received,
              sub: 'completed orders',
              color: 'from-emerald-400 to-teal-500',
              glow: 'shadow-emerald-500/30',
            },
            {
              icon: <DollarSign className="w-4 h-4" />,
              label: 'Total Spent',
              value: `$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              sub: 'on received orders',
              color: 'from-indigo-400 to-violet-500',
              glow: 'shadow-indigo-500/30',
            },
            {
              icon: <BarChart3 className="w-4 h-4" />,
              label: 'Avg. Order',
              value: `$${avgOrderValue.toFixed(0)}`,
              sub: 'per PO',
              color: 'from-pink-400 to-rose-500',
              glow: 'shadow-pink-500/30',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/15 transition-all"
            >
              <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shadow-lg ${s.glow} text-white flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-white font-extrabold text-lg font-display leading-none mt-0.5">{s.value}</p>
                <p className="text-white/40 text-[9px] mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Supplier Quick Panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-8 -mt-6 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {suppliers.slice(0, 3).map((s, i) => {
            const poCount = purchases.filter((p) => p.supplier?.id === s.id).length;
            const spent = purchases
              .filter((p) => p.supplier?.id === s.id && p.status === 'received')
              .reduce((sum, p) => sum + parseFloat(p.total), 0);
            const colors = [
              'from-indigo-500 to-violet-600',
              'from-emerald-500 to-teal-600',
              'from-amber-500 to-orange-600',
            ];
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[i % 3]} flex items-center justify-center text-white font-extrabold text-base shadow-md flex-shrink-0`}
                >
                  {s.company_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-xs truncate">{s.company_name}</p>
                  <p className="text-slate-400 text-[10px] truncate">{s.contact_person}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {poCount} orders
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      ${spent.toFixed(0)} spent
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ PO Table Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-8 pb-8 space-y-4">

        {/* Tab bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            {(['all', 'pending', 'received'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab === 'all' ? `All (${purchases.length})` : tab === 'pending' ? `â³ Pending (${pending})` : `âœ… Received (${received})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Click any row to expand line items</span>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Purchase Order History</span>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredPurchases.length}
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="py-3 px-5">
                  <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> PO Number</span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Supplier</span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Date</span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> Items</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="flex items-center gap-1.5 justify-end"><DollarSign className="w-3 h-3" /> Amount</span>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Truck className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-semibold text-sm">No purchase orders found</p>
                      <p className="text-slate-300 text-xs">Click "New Purchase Order" to get started</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredPurchases.map((p, idx) => {
                const sc = getStatus(p.status);
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`${sc.row(idx)} transition-all duration-200 hover:brightness-[0.97] cursor-pointer group`}
                      onClick={() => setExpandedPO(expandedPO === p.id ? null : p.id)}
                    >
                      {/* PO Number */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${sc.dot} flex-shrink-0`} />
                          <span className="font-mono font-extrabold text-slate-900 tracking-wide text-[11px]">
                            {p.purchase_no}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xs flex-shrink-0">
                            {p.supplier?.company_name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{p.supplier?.company_name}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{p.supplier?.contact_person}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div>
                          <p>{new Date(p.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          {p.received_at && (
                            <p className="text-[10px] text-emerald-600 font-bold">
                              Rcvd: {new Date(p.received_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-full">
                          <Package className="w-3 h-3" />
                          {p.items?.length || 0} items
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-extrabold text-slate-900 font-display text-sm">
                          ${parseFloat(p.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.items?.length > 0
                            ? `$${(parseFloat(p.total) / (p.items?.length || 1)).toFixed(2)} / item`
                            : ''}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${sc.badge}`}>
                          {sc.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {p.status !== 'received' && (
                            <button
                              onClick={() => handleReceivePO(p)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 shadow-md shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
                            >
                              <CheckCircle className="w-3 h-3" /> Receive
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedPO(expandedPO === p.id ? null : p.id)}
                            className={`p-1.5 rounded-lg transition-all ${expandedPO === p.id ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedPO === p.id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* â”€â”€ Expanded line items â”€â”€ */}
                    {expandedPO === p.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={7} className="px-8 py-5">
                          <div className="max-w-4xl">
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="w-3.5 h-3.5 text-indigo-500" />
                              <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
                                Line Items â€” {p.purchase_no}
                              </p>
                            </div>
                            <div className="grid gap-2">
                              {(p.items || []).map((it, iidx) => (
                                <div
                                  key={it.id}
                                  className="flex items-center bg-white rounded-xl border border-slate-200 px-4 py-3 gap-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0">
                                    {iidx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 text-xs truncate">{it.product_name}</p>
                                    <p className="text-slate-400 text-[10px] font-mono">{it.product_sku}</p>
                                  </div>
                                  <div className="text-center px-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Qty</p>
                                    <p className="font-extrabold text-slate-800 text-sm">{it.quantity}</p>
                                  </div>
                                  <div className="text-center px-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Cost</p>
                                    <p className="font-extrabold text-rose-600">${parseFloat(it.unit_cost).toFixed(2)}</p>
                                  </div>
                                  <div className="text-center px-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Line Total</p>
                                    <p className="font-extrabold text-indigo-700">${parseFloat(it.line_total).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {p.notes && (
                              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                                <span className="text-amber-500 mt-0.5">ðŸ“</span>
                                <p className="text-xs text-amber-700 italic">{p.notes}</p>
                              </div>
                            )}
                            {/* Summary footer */}
                            <div className="mt-3 flex items-center justify-end gap-6 bg-indigo-50 rounded-xl px-4 py-2.5 border border-indigo-100">
                              <span className="text-xs text-indigo-500 font-bold">
                                {p.items?.length || 0} products Â· {p.items?.reduce((s, i) => s + i.quantity, 0) || 0} units
                              </span>
                              <span className="text-sm font-extrabold text-indigo-700 font-display">
                                Total: ${parseFloat(p.total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl my-6 overflow-hidden border border-slate-200/60">

            {/* Modal gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-8 py-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                    <ShoppingCart className="w-6 h-6 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-xl font-display">New Purchase Order</h3>
                    <p className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Set cost Â· retail Â· selling Â· tax Â· see live margin per product
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition border border-white/10 hover:border-white/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePO} className="p-8 space-y-6 text-xs">

              {/* Supplier & Notes */}
              <div className="grid grid-cols-5 gap-5">
                {/* Supplier picker */}
                <div className="col-span-2 space-y-3">
                  <label className="block text-slate-700 font-extrabold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-500" /> Supplier / Distributor
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-bold transition"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.company_name}</option>
                    ))}
                  </select>

                  {/* Supplier card */}
                  {selectedSupplier && (
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                          {selectedSupplier.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{selectedSupplier.company_name}</p>
                          <span className="inline-flex items-center gap-1 text-[9px] text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full mt-0.5">
                            <Star className="w-2.5 h-2.5" /> Verified Supplier
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-indigo-100">
                        <p className="flex items-center gap-2 text-[10px] text-slate-600">
                          <span className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            ðŸ‘¤
                          </span>
                          {selectedSupplier.contact_person}
                        </p>
                        {selectedSupplier.phone && (
                          <p className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-3 h-3 text-indigo-600" />
                            </span>
                            {selectedSupplier.phone}
                          </p>
                        )}
                        {selectedSupplier.email && (
                          <p className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <Mail className="w-3 h-3 text-indigo-600" />
                            </span>
                            {selectedSupplier.email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="col-span-3 space-y-2">
                  <label className="block text-slate-700 font-extrabold">ðŸ“ Order Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={selectedSupplier ? 7 : 4}
                    placeholder="e.g. Rush delivery, payment terms, special handling instructions..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 resize-none transition"
                  />
                </div>
              </div>

              {/* Field legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-2xl px-5 py-3 border border-slate-200 text-[10px] font-extrabold">
                <span className="text-slate-400 uppercase tracking-wider">Fields:</span>
                <span className="flex items-center gap-1 text-slate-600"><Hash className="w-3 h-3" /> Product</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-slate-600"><ShoppingCart className="w-3 h-3" /> Qty</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-rose-600"><DollarSign className="w-3 h-3" /> Cost/Unit</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-violet-600"><Tag className="w-3 h-3" /> Retail MRP</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-3 h-3" /> Selling Price</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-amber-600"><Percent className="w-3 h-3" /> Tax %</span>
                <span className="text-slate-300">Â·</span>
                <span className="flex items-center gap-1 text-indigo-600"><BarChart3 className="w-3 h-3" /> Live Margin</span>
              </div>

              {/* Product line items */}
              <div className="space-y-3">
                {poItems.map((item, idx) => {
                  const margin = calcMargin(item.unit_cost, item.selling_price);
                  const mc = marginColor(margin);
                  const mbc = marginBarColor(margin);
                  const lineTotal = (parseFloat(item.unit_cost) || 0) * item.quantity;
                  const marginClamped = Math.min(Math.max(margin, 0), 100);

                  return (
                    <div
                      key={idx}
                      className="relative bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      {/* Item # badge */}
                      <div className="absolute -top-3 left-4">
                        <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-sm shadow-indigo-500/30">
                          Item {idx + 1}
                        </span>
                      </div>

                      {/* Row 1 */}
                      <div className="grid grid-cols-12 gap-3 items-end pt-1">
                        {/* Product */}
                        <div className="col-span-5">
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">
                            Product
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                          >
                            {products.map((pr) => (
                              <option key={pr.id} value={pr.id}>{pr.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">
                            Qty
                          </label>
                          <div className="relative">
                            <ShoppingCart className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full pl-7 pr-2 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                          </div>
                        </div>

                        {/* Cost */}
                        <div className="col-span-2">
                          <label className="block text-[10px] font-extrabold text-rose-500 mb-1.5 uppercase tracking-wider">
                            Cost/Unit
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-400 font-extrabold text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                              className="w-full pl-5 pr-2 py-2.5 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-700 font-extrabold focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
                            />
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2">
                          <label className="block text-[10px] font-extrabold text-indigo-500 mb-1.5 uppercase tracking-wider">
                            Line Total
                          </label>
                          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-right">
                            <p className="font-extrabold text-indigo-700 text-sm">${lineTotal.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 flex justify-center pb-0.5">
                          {poItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition border-2 border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Pricing */}
                      <div className="grid grid-cols-4 gap-3 border-t-2 border-dashed border-slate-100 pt-4">
                        {/* Retail MRP */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-violet-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Retail / MRP
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-400 font-extrabold text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.retail_price}
                              onChange={(e) => handleItemChange(idx, 'retail_price', e.target.value)}
                              className="w-full pl-5 pr-2 py-2.5 bg-violet-50 border-2 border-violet-200 rounded-xl text-violet-700 font-extrabold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">Max retail price (MRP)</p>
                        </div>

                        {/* Selling Price */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-emerald-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Selling Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 font-extrabold text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.selling_price}
                              onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                              className="w-full pl-5 pr-2 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-700 font-extrabold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">Actual POS sale price</p>
                        </div>

                        {/* Tax Rate */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-amber-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Tax Rate
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.tax_rate}
                              onChange={(e) => handleItemChange(idx, 'tax_rate', e.target.value)}
                              className="w-full pr-7 pl-3 py-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 font-extrabold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 font-extrabold text-xs">%</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">Applied at checkout</p>
                        </div>

                        {/* Margin */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> Gross Margin
                          </label>
                          <div className={`flex items-center justify-center py-2.5 rounded-xl font-extrabold text-base border-2 ${mc}`}>
                            {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
                          </div>
                          {/* Margin bar */}
                          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${mbc}`}
                              style={{ width: `${marginClamped}%` }}
                            />
                          </div>
                          <p className={`text-[9px] mt-0.5 font-bold ${
                            margin < 0 ? 'text-rose-500' :
                            margin < 10 ? 'text-amber-500' :
                            margin >= 25 ? 'text-emerald-600' : 'text-sky-600'
                          }`}>
                            {margin < 0 ? 'âš  Below cost!' : margin < 10 ? 'Low margin' : margin >= 25 ? 'âœ“ Healthy' : 'Moderate'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add product button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-500 text-indigo-400 hover:text-indigo-600 rounded-2xl font-extrabold transition-all hover:bg-indigo-50 flex items-center justify-center gap-2 group"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                Add Another Product
              </button>

              {/* Summary footer */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 rounded-2xl p-5">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />
                <div className="relative flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-indigo-200 text-[10px] font-extrabold uppercase tracking-widest">Order Summary</p>
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full">
                        {poItems.length} product{poItems.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-white/70 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full">
                        {poItems.reduce((s, i) => s + (i.quantity || 0), 0)} units
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-200 text-[10px] font-extrabold uppercase tracking-widest">Total Cost to Distributor</p>
                    <p className="text-white text-3xl font-extrabold font-display mt-0.5">
                      ${poTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal actions */}
              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
