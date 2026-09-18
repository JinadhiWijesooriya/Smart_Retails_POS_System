import React from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Layers, 
  Users, Truck, History, TrendingUp, ShieldAlert, LogOut, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const roleName = user?.role?.name || 'Staff';
  const isSuperOrAdmin = roleName === 'Super Admin' || roleName === 'Admin';
  const isManager = isSuperOrAdmin || roleName === 'Manager';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', emoji: '🏠', icon: LayoutDashboard, show: true },
    { id: 'pos', label: 'POS', emoji: '🛒', icon: ShoppingCart, show: true, badge: 'Live' },
    { id: 'products', label: 'Products', emoji: '📦', icon: Package, show: true },
    { id: 'inventory', label: 'Inventory', emoji: '📊', icon: Layers, show: isManager || roleName === 'Inventory Officer' },
    { id: 'purchases', label: 'Purchases', emoji: '📥', icon: Truck, show: isManager },
    { id: 'customers', label: 'Customers', emoji: '👥', icon: Users, show: true },
    { id: 'reports', label: 'Reports', emoji: '📈', icon: TrendingUp, show: isManager },
    { id: 'sales', label: 'Sales', emoji: '🧾', icon: History, show: true },
    { id: 'audit', label: 'Settings & Audit', emoji: '⚙️', icon: ShieldAlert, show: isSuperOrAdmin },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              SmartRetail <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold">POS</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{user?.branch?.name || 'Flagship Store'}</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base select-none transition-transform group-hover:scale-115 duration-200">
                  {item.emoji}
                </span>
                <span className="tracking-wide font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {user?.username?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{roleName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
