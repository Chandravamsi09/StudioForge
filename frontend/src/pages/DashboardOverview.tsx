import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Bug,
  Users,
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [buildStats, setBuildStats] = useState<any>(null);
  const [qaStats, setQaStats] = useState<any>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAllMetrics = async () => {
    try {
      setLoading(true);
      const [b, q, a, s] = await Promise.all([
        api.getBuildMetrics().catch(() => null),
        api.getQAMetrics().catch(() => null),
        api.getAnalyticsSummary().catch(() => null),
        api.getSubscription().catch(() => null),
      ]);
      setBuildStats(b);
      setQaStats(q);
      setAnalyticsSummary(a);
      setSubscription(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMetrics();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-slate-400">
            Real-time telemetry and operational overview for <span className="text-indigo-400 font-semibold">{user?.tenantName || 'your studio'}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('builds')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Build</span>
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
          >
            <Bug className="w-4 h-4 text-amber-400" />
            <span>Log Bug</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Build Pipeline</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {buildStats?.totalBuilds ?? 0}
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs">
              <span className="text-emerald-400 font-semibold">{buildStats?.successRate ?? '100%'} success</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{buildStats?.activeBuilds ?? 0} building</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active QA Tickets</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bug className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {qaStats?.openTickets ?? 0}
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs">
              <span className="text-red-400 font-semibold">{qaStats?.blockerCount ?? 0} blockers</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{qaStats?.resolutionRate ?? '0%'} resolved</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Player Telemetry</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {analyticsSummary?.uniquePlayers ?? 0}
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs">
              <span className="text-cyan-400 font-semibold">{analyticsSummary?.totalEvents ?? 0} events</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{analyticsSummary?.uniqueSessions ?? 0} sessions</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Studio Seats</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {subscription?.seats?.usedSeats ?? 1} / {subscription?.seats?.maxSeats ?? 5}
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs">
              <span className="text-indigo-400 font-semibold">{subscription?.planTier || 'FREE'} Plan</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{subscription?.seats?.availableSeats ?? 4} available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Quick Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Build Pipelines</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Track multi-platform automated compilation artifacts, commit SHA hashes, duration benchmarks, and deployment packages.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('builds')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
          >
            Manage Build Artifacts →
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-600/10 text-amber-400">
                <Bug className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">QA / Bug Lifecycle</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Manage repro steps, severity levels, developer assignments, log attachments, and resolution rates across game milestones.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('qa')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
          >
            Open QA Board →
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-600/10 text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Live-Ops & Economy</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Schedule double XP events, in-game flash sales, tournaments, and dynamic feature flag configurations in real-time.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('liveops')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
          >
            Launch Live-Ops Console →
          </button>
        </div>
      </div>
    </div>
  );
};
