import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './pages/DashboardOverview';
import { BuildsPage } from './pages/BuildsPage';
import { QAPage } from './pages/QAPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LiveOpsPage } from './pages/LiveOpsPage';
import { BillingPage } from './pages/BillingPage';
import { AuthModal } from './pages/AuthModal';

const DashboardContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Connecting to StudioForge Operations Cloud...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'builds':
        return <BuildsPage />;
      case 'qa':
        return <QAPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'liveops':
        return <LiveOpsPage />;
      case 'billing':
        return <BillingPage />;
      case 'dashboard':
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};
