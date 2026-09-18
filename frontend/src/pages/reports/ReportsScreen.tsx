import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, PieChart, Layers, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';

export const ReportsScreen: React.FC = () => {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sRes, pRes, iRes] = await Promise.all([
          api.get('/reports/sales/'),
          api.get('/reports/profit/'),
          api.get('/reports/inventory/'),
        ]);
        setSalesReport(sRes.data);
        setProfitReport(pRes.data);
        setInventoryReport(iRes.data);
      } catch (err) {
        console.error('Failed fetching reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Loading comprehensive analytics...</div>;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-display">Financial & Profit Analytics</h1>
        <p className="text-xs text-slate-500 font-medium">Authoritative revenue, cost of goods sold (COGS), margins, and valuation</p>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Total Revenue
          </span>
          <h2 className="text-3xl font-black text-slate-900 font-display">
            ${parseFloat(profitReport?.total_revenue || 0).toFixed(2)}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Gross sales before expenses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Gross Profit
          </span>
          <h2 className="text-3xl font-black text-indigo-600 font-display">
            ${parseFloat(profitReport?.gross_profit || 0).toFixed(2)}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Margin:</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{profitReport?.margin_percent}%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" /> Warehouse Valuation
          </span>
          <h2 className="text-3xl font-black text-purple-600 font-display">
            ${parseFloat(inventoryReport?.total_valuation_retail || 0).toFixed(2)}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Cost Base: ${parseFloat(inventoryReport?.total_valuation_cost || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Inventory & Breakdown metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 font-display">Sales Breakdown</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Completed Transactions:</span>
              <span className="font-bold text-slate-900">{salesReport?.metrics?.orders_count || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-bold text-slate-900">
                ${parseFloat(salesReport?.metrics?.total_subtotal || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Tax Collected:</span>
              <span className="font-bold text-indigo-600">
                ${parseFloat(salesReport?.metrics?.total_tax || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Discounts Given:</span>
              <span className="font-bold text-rose-600">
                -${parseFloat(salesReport?.metrics?.total_discount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 font-display">Inventory Valuation & Margin</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Units in Stock:</span>
              <span className="font-bold text-slate-900">{inventoryReport?.total_items_in_stock || 0} units</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Purchase Cost:</span>
              <span className="font-bold text-slate-700">
                ${parseFloat(inventoryReport?.total_valuation_cost || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Potential Retail Revenue:</span>
              <span className="font-bold text-emerald-600 font-display">
                ${parseFloat(inventoryReport?.total_valuation_retail || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Expected Gross Margin:</span>
              <span className="font-bold text-indigo-600 font-display">
                ${parseFloat(inventoryReport?.potential_profit || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
