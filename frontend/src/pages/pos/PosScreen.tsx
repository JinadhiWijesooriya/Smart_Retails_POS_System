import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Barcode, Plus, Minus, Trash2, PauseCircle, 
  PlayCircle, UserPlus, ShoppingBag, Percent, Receipt, Sparkles, Zap
} from 'lucide-react';
import { Product, Category, Customer, CartItem, Sale } from '../../types';
import { api } from '../../services/api';
import { PaymentModal } from '../../components/PaymentModal';
import { ReceiptModal } from '../../components/ReceiptModal';

export const PosScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [heldCart, setHeldCart] = useState<{ cart: CartItem[]; customer: Customer | null; discount: number } | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [isBarcodeFocused, setIsBarcodeFocused] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products, categories, customers
  const loadInitialData = async () => {
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
        api.get('/customers/'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error("Failed loading POS data", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Keyboard shortcut for barcode scan focus (F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Barcode rapid scan handler
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeScanInput.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${barcodeScanInput.trim()}/`);
      addToCart(res.data);
      setBarcodeScanInput('');
    } catch {
      alert(`Product with barcode "${barcodeScanInput}" not found`);
      setBarcodeScanInput('');
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" is out of stock!`);
      return;
    }
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 500);

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more. Available stock: ${product.stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Cannot exceed available stock of ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomer(null);
  };

  // Hold / Resume
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    setHeldCart({ cart, customer: selectedCustomer, discount: cartDiscount });
    clearCart();
  };

  const handleResumeCart = () => {
    if (!heldCart) return;
    setCart(heldCart.cart);
    setSelectedCustomer(heldCart.customer);
    setCartDiscount(heldCart.discount);
    setHeldCart(null);
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = parseFloat(item.product.selling_price) * item.quantity - item.discount;
    return acc + Math.max(0, itemPrice);
  }, 0);

  const totalTax = cart.reduce((acc, item) => {
    const itemPrice = parseFloat(item.product.selling_price) * item.quantity - item.discount;
    const taxRate = parseFloat(item.product.tax_rate) / 100;
    return acc + Math.max(0, itemPrice * taxRate);
  }, 0);

  const finalTotal = Math.max(0, subtotal - cartDiscount + totalTax);

  // Complete Payment Call
  const handleConfirmPayment = async (
    method: 'cash' | 'card' | 'bank_transfer' | 'credit',
    amount: number,
    tendered: number
  ) => {
    const payload = {
      customer_id: selectedCustomer?.id || null,
      discount: cartDiscount.toFixed(2),
      notes: 'POS checkout',
      items: cart.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
        discount: it.discount.toFixed(2),
      })),
      payments: [
        {
          method,
          amount: tendered.toFixed(2),
        },
      ],
    };

    const res = await api.post('/sales/', payload);
    setCompletedSale(res.data);
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
    clearCart();
    loadInitialData(); // reload updated stock levels
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category?.id === selectedCategory : true;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex overflow-hidden h-screen bg-slate-50 text-slate-800">
      {/* Left: Products & Catalog Browser */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50">
        {/* Top bar: Barcode scan input & search with interactive laser effect */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm relative">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 max-w-xs">
            <Barcode className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition duration-200 ${isBarcodeFocused ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode (F2)..."
              value={barcodeScanInput}
              onFocus={() => setIsBarcodeFocused(true)}
              onBlur={() => setIsBarcodeFocused(false)}
              onChange={(e) => setBarcodeScanInput(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono ${
                isBarcodeFocused
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {isBarcodeFocused && <div className="scanner-laser" />}
          </form>

          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product by name, brand, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 shrink-0">
            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Fast Checkout Ready</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2.5 bg-white/70 border-b border-slate-200 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid with 3D perspective */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start perspective-container">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.min_stock;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`card-3d group relative bg-white border rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer select-none active:scale-95 ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 cursor-not-allowed'
                    : 'border-slate-200 hover:border-indigo-400/80'
                }`}
              >
                {/* Image & 3D floating Badge */}
                <div className="relative h-28 bg-gradient-to-b from-slate-100 to-slate-200/60 overflow-hidden">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 group-hover:-translate-y-1 transition duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md transform group-hover:translate-z-4 ${
                        isOutOfStock
                          ? 'bg-rose-500 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white font-extrabold shadow-amber-500/20'
                          : 'bg-white/95 text-indigo-700 border border-indigo-100 font-semibold'
                      }`}
                    >
                      {p.stock} in stock
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50/50">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">{p.barcode}</span>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-snug mt-0.5 group-hover:text-indigo-600 transition">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-black text-indigo-600 font-display tracking-tight group-hover:scale-105 transition origin-left">
                      ${parseFloat(p.selling_price).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">+{p.tax_rate}% tax</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Cart & Checkout Register */}
      <div className="w-96 bg-white flex flex-col h-screen select-none border-l border-slate-200 shadow-xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-sm text-slate-900">Current Order</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold shadow-sm">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {heldCart ? (
              <button
                onClick={handleResumeCart}
                title="Resume Held Cart"
                className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Resume
              </button>
            ) : (
              <button
                onClick={handleHoldCart}
                disabled={cart.length === 0}
                title="Hold Order"
                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-slate-100 disabled:opacity-30"
              >
                <PauseCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              title="Clear Order"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === parseInt(e.target.value));
              setSelectedCustomer(cust || null);
            }}
            className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-indigo-500 font-semibold shadow-sm"
          >
            <option value="">Walk-in Customer (General)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || 'No phone'}) - {c.points} pts
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/60">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-300 animate-pulse" />
              <p className="text-xs font-semibold">Scan barcode or click items to add</p>
            </div>
          ) : (
            cart.map((item) => {
              const isJustAdded = item.product.id === lastAddedId;
              return (
                <div
                  key={item.product.id}
                  className={`p-3 bg-white rounded-2xl border flex items-center justify-between gap-2 text-xs shadow-sm transition duration-200 ${
                    isJustAdded
                      ? 'border-indigo-400 ring-2 ring-indigo-500/20 shadow-md animate-pop-in bg-indigo-50/30'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">{item.product.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                      <span>${parseFloat(item.product.selling_price).toFixed(2)}</span>
                      <span>&times;</span>
                      <span className={`font-bold transition ${isJustAdded ? 'text-indigo-600 scale-125' : 'text-indigo-600'}`}>
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 transition flex items-center justify-center text-slate-700 font-black shadow-inner"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 transition flex items-center justify-center text-slate-700 font-black shadow-inner"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[55px]">
                    <span className="font-black text-indigo-600 block font-display">
                      ${(parseFloat(item.product.selling_price) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] text-slate-400 hover:text-rose-500 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary & Totals */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2.5 text-xs shadow-lg">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal</span>
            <span className="text-slate-800 font-bold">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-indigo-500" /> Order Discount ($)
            </span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={cartDiscount || ''}
              placeholder="0.00"
              onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
              className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono shadow-inner font-bold"
            />
          </div>

          <div className="flex justify-between text-slate-500 font-medium">
            <span>Estimated Tax</span>
            <span className="text-slate-800 font-bold">${totalTax.toFixed(2)}</span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-800 font-display">Total Amount</span>
            <span className="text-2xl font-black text-emerald-600 font-display tracking-tight">${finalTotal.toFixed(2)}</span>
          </div>

          {/* 3D Tactile Checkout Button with Shimmer & Glow */}
          <button
            onClick={() => setIsPaymentOpen(true)}
            disabled={cart.length === 0}
            className={`w-full mt-2 py-3.5 btn-3d bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition text-sm flex items-center justify-center gap-2 tracking-wide font-display ${
              cart.length > 0 ? 'shimmer-effect shadow-indigo-500/30' : ''
            }`}
          >
            {cart.length > 0 ? <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" /> : <Receipt className="w-4 h-4" />}
            Proceed to Payment (${finalTotal.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        total={finalTotal}
        customer={selectedCustomer}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <ReceiptModal
        sale={completedSale}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedSale(null);
        }}
      />
    </div>
  );
};
