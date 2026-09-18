import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './pages/auth/LoginScreen';
import { PosScreen } from './pages/pos/PosScreen';
import { DashboardScreen } from './pages/dashboard/DashboardScreen';
import { ProductsScreen } from './pages/products/ProductsScreen';
import { InventoryScreen } from './pages/inventory/InventoryScreen';
import { SalesHistoryScreen } from './pages/sales/SalesHistoryScreen';
import { CustomersScreen } from './pages/customers/CustomersScreen';
import { PurchasesScreen } from './pages/purchases/PurchasesScreen';
import { ReportsScreen } from './pages/reports/ReportsScreen';
import { AuditScreen } from './pages/audit/AuditScreen';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('pos');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
        Connecting to Smart Retail POS...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'pos':
        return <PosScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'sales':
        return <SalesHistoryScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'purchases':
        return <PurchasesScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'audit':
        return <AuditScreen />;
      default:
        return <PosScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {renderActiveScreen()}
      </main>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
