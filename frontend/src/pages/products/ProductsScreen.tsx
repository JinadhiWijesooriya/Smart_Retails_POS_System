import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, Edit2, Barcode, Check, X, Layers, 
  LayoutGrid, Table as TableIcon, Tag, AlertCircle, 
  DollarSign, Package, TrendingUp, Sparkles, Filter
} from 'lucide-react';
import { Product, Category, Supplier } from '../../types';
import { api } from '../../services/api';

export const ProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    brand: '',
    category_id: '',
    supplier_id: '',
    cost_price: '',
    selling_price: '',
    tax_rate: '5.00',
    min_stock: '5',
    image_url: '',
  });

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
        api.get('/suppliers/'),
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setSuppliers(sRes.data);
    } catch (err) {
      console.error('Failed fetching products', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: '',
      brand: '',
      category_id: categories[0]?.id?.toString() || '',
      supplier_id: suppliers[0]?.id?.toString() || '',
      cost_price: '0.00',
      selling_price: '0.00',
      tax_rate: '5.00',
      min_stock: '5',
      image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      brand: p.brand,
      category_id: p.category?.id?.toString() || '',
      supplier_id: p.supplier?.id?.toString() || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      tax_rate: p.tax_rate,
      min_stock: p.min_stock.toString(),
      image_url: p.image_url,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}/`, formData);
      } else {
        await api.post('/products/', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save product');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === null || p.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCatalogValue = products.reduce((acc, p) => acc + (parseFloat(p.selling_price) * p.stock), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-display">Product Catalog & Inventory</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage product attributes, barcodes, retail margins, and visual representations</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-3d flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-indigo-500/25 transition tracking-wide font-display"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Catalog Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 perspective-deep">
        <div className="card-3d-floating bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Inventory Value</p>
            <h3 className="text-xl font-black text-slate-900 font-display mt-0.5">${totalCatalogValue.toFixed(2)}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Retail Valuation
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="card-3d-floating bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available Stock</p>
            <h3 className="text-xl font-black text-slate-900 font-display mt-0.5">{totalStockUnits} Units</h3>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Across all product lines</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="card-3d-floating bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock Health</p>
            <h3 className={`text-xl font-black font-display mt-0.5 ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockCount} Critical
            </h3>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              {lowStockCount === 0 ? 'All items in safe threshold' : 'Require inventory restock'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            lowStockCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter, Search & Layout View Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by product name, brand, SKU or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-400 font-medium mr-1">
            Showing <strong className="text-slate-700">{filtered.length}</strong> items
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              title="3D Visual Grid View"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Compact Table View"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          All Categories ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
              selectedCategory === c.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Display: 3D Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 perspective-container">
          {filtered.map((p) => {
            const cost = parseFloat(p.cost_price);
            const selling = parseFloat(p.selling_price);
            const profit = selling - cost;
            const marginPct = selling > 0 ? ((profit / selling) * 100).toFixed(0) : '0';
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.min_stock;

            return (
              <div
                key={p.id}
                className="card-3d group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:border-indigo-400 transition duration-300"
              >
                {/* Visual Header & Image */}
                <div className="relative h-40 bg-gradient-to-b from-slate-100 to-slate-200/50 overflow-hidden">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                  
                  {/* Stock Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md ${
                        isOutOfStock
                          ? 'bg-rose-500 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white font-extrabold'
                          : 'bg-white/95 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {p.stock} in stock
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/70 text-white backdrop-blur-sm">
                      {p.category?.name || 'Retail'}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{p.sku}</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Barcode className="w-3 h-3" /> {p.barcode}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mt-1 group-hover:text-indigo-600 transition">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{p.brand || 'General Retail'}</p>
                  </div>

                  {/* Financial & Margin Metrics */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Selling Price</span>
                        <span className="text-lg font-black text-indigo-600 font-display">
                          ${selling.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Gross Margin</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{marginPct}% (${profit.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Cost: ${cost.toFixed(2)}</span>
                      <span>Tax: {parseFloat(p.tax_rate)}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Supplier: <strong className="text-slate-700">{p.supplier?.company_name || 'Direct'}</strong>
                  </span>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-bold shadow-sm transition"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Products Display: Compact Table Mode */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Margin</th>
                <th className="py-3 px-4 text-center">Tax %</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const cost = parseFloat(p.cost_price);
                const selling = parseFloat(p.selling_price);
                const profit = selling - cost;
                const marginPct = selling > 0 ? ((profit / selling) * 100).toFixed(0) : '0';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300'}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shadow-sm"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.brand || 'General Brand'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-slate-800 block font-medium">{p.sku}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-slate-400" /> {p.barcode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500">
                      ${cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-indigo-600 font-display">
                      ${selling.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{marginPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {parseFloat(p.tax_rate)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : p.stock <= p.min_stock
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display">
                {editingProduct ? 'Edit Product' : 'Register New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Barcode *</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-indigo-600 font-bold focus:outline-none focus:border-indigo-500 font-display"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
