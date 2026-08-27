import React from 'react';
import {
  LayoutDashboard,
  Box,
  Bug,
  LineChart,
  Radio,
  CreditCard,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'builds', label: 'Build Pipelines', icon: Box },
    { id: 'qa', label: 'QA & Bug Tracking', icon: Bug },
    { id: 'analytics', label: 'Player Analytics', icon: LineChart },
    { id: 'liveops', label: 'Live-Ops Console', icon: Radio },
    { id: 'billing', label: 'Billing & Seats', icon: CreditCard },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Studio Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-xl border border-indigo-900/40 text-xs text-slate-400">
        <div className="font-semibold text-slate-200 mb-1">StudioForge v1.0</div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Multi-tenant enterprise cloud running on PostgreSQL & Redis.
        </p>
      </div>
    </aside>
  );
};
