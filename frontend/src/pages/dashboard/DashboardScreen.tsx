import React, { useEffect, useState } from "react";
import {
  DollarSign, ShoppingCart, AlertTriangle, Users,
  TrendingUp, ArrowUpRight, Package, Calendar,
  Zap, RefreshCw, BarChart3, CreditCard,
  ShoppingBag, Star, ArrowDownRight, Clock,
  Activity, Sparkles, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from "recharts";
import { api } from "../../services/api";

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  trend?: number;
}> = ({ label, value, sub, icon, gradient, iconBg, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${iconBg} rounded-xl backdrop-blur-sm`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-white/20 text-white" : "bg-white/20 text-white"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-white/70 text-[10px] font-extrabold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-extrabold font-display mt-0.5 leading-none">{value}</p>
      {sub && <p className="text-white/60 text-[10px] mt-1.5 font-medium">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-extrabold">
            {p.name}: ${parseFloat(p.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardScreen: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      const [sumRes, chartRes, topRes] = await Promise.all([
        api.get("/dashboard/summary/"),
        api.get("/dashboard/sales-chart/?days=7"),
        api.get("/dashboard/top-products/"),
      ]);
      setSummary(sumRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
    } catch (err) {
      console.error("Failed fetching dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setNow(new Date());
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    fetchDashboardData();
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 animate-pulse">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">Loading retail analytics...</p>
        </div>
      </div>
    );
  }

  const todayRevenue = parseFloat(summary?.today_revenue || 0);
  const weekRevenue = chartData.reduce((s: number, d: any) => s + parseFloat(d.revenue || 0), 0);
  const maxBar = Math.max(...topProducts.map((p: any) => parseFloat(p.total_sales_amount || 0)), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 text-slate-800">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-8 pt-8 pb-20">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)",
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-indigo-300 text-xs font-extrabold uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Dashboard
            </p>
            <h1 className="text-2xl font-extrabold text-white font-display">
              {greeting()}, Admin 👋
            </h1>
            <p className="text-white/50 text-sm mt-1 max-w-sm">
              Here&apos;s your store performance snapshot for today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white/60 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-bold text-white/80">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              {now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })}
              <span className="text-white/40">·</span>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Floating KPI cards */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatCard
            label="Today's Revenue"
            value={`$${todayRevenue.toFixed(2)}`}
            sub="Gross before tax"
            icon={<DollarSign className="w-5 h-5 text-emerald-200" />}
            iconBg="bg-white/15"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            trend={12}
          />
          <StatCard
            label="Orders Today"
            value={summary?.today_orders_count || 0}
            sub="Invoices settled"
            icon={<ShoppingCart className="w-5 h-5 text-blue-200" />}
            iconBg="bg-white/15"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            trend={8}
          />
          <StatCard
            label="Low Stock Alerts"
            value={summary?.low_stock_count || 0}
            sub="Products need reorder"
            icon={<AlertTriangle className="w-5 h-5 text-amber-200" />}
            iconBg="bg-white/15"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            label="Total Products"
            value={summary?.total_products || 0}
            sub="Active catalog items"
            icon={<Package className="w-5 h-5 text-violet-200" />}
            iconBg="bg-white/15"
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="px-8 -mt-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5 flex items-center gap-3 overflow-x-auto">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex-shrink-0 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" /> Quick Actions
          </span>
          <div className="w-px h-5 bg-slate-200 flex-shrink-0" />
          {[
            { label: "New Sale", icon: "🛒", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
            { label: "Add Product", icon: "📦", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
            { label: "Purchase Order", icon: "📥", color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
            { label: "View Reports", icon: "📊", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
            { label: "Customers", icon: "👥", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
          ].map((a) => (
            <button
              key={a.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold border flex-shrink-0 transition-all hover:scale-105 active:scale-95 ${a.color}`}
            >
              {a.icon} {a.label}
            </button>
          ))}
          <div className="ml-auto flex-shrink-0">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="px-8 pb-8 space-y-5">

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Revenue area chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  7-Day Revenue Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Total: <span className="font-extrabold text-indigo-600">${weekRevenue.toFixed(2)}</span> this week</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold">
                <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  <Activity className="w-3 h-3" /> Revenue
                </span>
              </div>
            </div>
            <div className="h-64 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradRevenue)"
                    dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#6366f1" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4">
              <h2 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Payment Methods
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Today's revenue by method</p>
            </div>
            <div className="px-6 pb-5 space-y-3">
              {(!summary?.payment_breakdown || summary.payment_breakdown.length === 0) ? (
                <div className="py-8 text-center">
                  <CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No payments today</p>
                </div>
              ) : (
                summary.payment_breakdown.map((pb: any, i: number) => {
                  const pct = todayRevenue > 0
                    ? (parseFloat(pb.total_amount) / todayRevenue) * 100
                    : 0;
                  const colors = [
                    "from-indigo-500 to-violet-500",
                    "from-emerald-500 to-teal-500",
                    "from-amber-500 to-orange-500",
                    "from-rose-500 to-pink-500",
                  ];
                  const iconEmojis: Record<string, string> = { cash: "💵", card: "💳", transfer: "🏦", credit: "💳" };
                  return (
                    <div key={pb.method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-700 capitalize flex items-center gap-1.5">
                          {iconEmojis[pb.method] || "💰"} {pb.method}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          ${parseFloat(pb.total_amount).toFixed(2)}
                          <span className="text-slate-400 font-medium ml-1">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Week summary mini */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-3.5 border border-indigo-100">
                  <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">7-Day Total</p>
                  <p className="text-xl font-extrabold text-indigo-700 font-display mt-0.5">
                    ${weekRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top Selling Products */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Top Selling Products
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Highest volume sold</p>
              </div>
              <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="px-6 pb-5 space-y-3">
              {topProducts.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingBag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No sales recorded yet</p>
                </div>
              ) : (
                topProducts.slice(0, 5).map((tp: any, idx: number) => {
                  const barPct = (parseFloat(tp.total_sales_amount) / maxBar) * 100;
                  const rankColors = ["bg-amber-500", "bg-slate-400", "bg-orange-500", "bg-indigo-400", "bg-violet-400"];
                  return (
                    <div key={tp.product_id} className="group">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`w-6 h-6 rounded-lg ${rankColors[idx]} flex items-center justify-center text-white font-extrabold text-[10px] flex-shrink-0 shadow-sm`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{tp.product__name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{tp.product__sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-extrabold text-indigo-600">{tp.total_qty_sold} <span className="text-slate-400 font-normal">units</span></p>
                          <p className="text-[10px] font-bold text-slate-600">${parseFloat(tp.total_sales_amount).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Revenue bar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  Daily Revenue Bars
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Per-day breakdown this week</p>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-1.5">
                <p className="text-[10px] font-extrabold text-violet-600">7 Days</p>
              </div>
            </div>
            <div className="h-60 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="url(#gradBar)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <defs>
                    <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary mini stat */}
            <div className="mx-6 mb-5 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              {[
                { label: "Avg/Day", value: `$${(weekRevenue / 7).toFixed(0)}` },
                { label: "Best Day", value: `$${Math.max(...chartData.map((d: any) => parseFloat(d.revenue || 0))).toFixed(0)}` },
                { label: "Orders", value: summary?.today_orders_count || 0 },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low stock alert strip */}
        {(summary?.low_stock_count || 0) > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md shadow-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-amber-800">
                ⚠️ {summary.low_stock_count} product{summary.low_stock_count !== 1 ? "s" : ""} running low on stock
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Review inventory and create purchase orders to replenish stock.</p>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> View Inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
