import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AnalyticsSummary, AnalyticsEventItem } from '../types';
import { LineChart, Activity, Users, Radio, Send, RefreshCw, BarChart3, Database } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Test Ingestion Simulator form
  const [testGame, setTestGame] = useState('CyberArena: Legacy');
  const [testPlayer, setTestPlayer] = useState('plyr_9988');
  const [testEventType, setTestEventType] = useState('match_finished');
  const [testCategory, setTestCategory] = useState('GAMEPLAY');
  const [isEmitting, setIsEmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsEvents({ limit: 20 }),
      ]);
      setSummary(s);
      setEvents(e.items);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsEmitting(true);
      await api.ingestEvent({
        gameTitle: testGame,
        playerId: testPlayer,
        eventType: testEventType,
        eventCategory: testCategory,
        clientTimestamp: new Date().toISOString(),
        properties: { simulated: true, latencyMs: 14 },
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to ingest telemetry');
    } finally {
      setIsEmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <LineChart className="w-7 h-7 text-cyan-400" />
            <span>Player Telemetry & Ingestion Stream</span>
          </h1>
          <p className="text-sm text-slate-400">
            High-throughput event aggregation, unique player retention metrics, and real-time telemetry stream.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Daily Active Players (DAU)</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {summary?.uniquePlayers ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Unique player IDs identified in telemetry stream</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Total Events Ingested</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {summary?.totalEvents ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Stored in PostgreSQL with indexed partitioning</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Active Game Sessions</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {summary?.uniqueSessions ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Concurrent client game sessions tracked</p>
        </div>
      </div>

      {/* Ingestion Simulator + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Simulator */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>SDK Event Ingestion Simulator</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Simulate high-speed game engine telemetry emission to the `/api/v1/analytics/events` endpoint.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Player ID</label>
                <input
                  type="text"
                  value={testPlayer}
                  onChange={(e) => setTestPlayer(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Event Type</label>
                  <input
                    type="text"
                    value={testEventType}
                    onChange={(e) => setTestEventType(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Category</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="GAMEPLAY">Gameplay</option>
                    <option value="ECONOMY">Economy</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="PROGRESSION">Progression</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isEmitting}
                className="w-full mt-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEmitting ? 'Ingesting...' : 'Emit Telemetry Event'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Category Breakdown</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Distribution of player telemetry across game modules</p>

          <div className="space-y-3">
            {summary?.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0 ? (
              Object.entries(summary.categoryBreakdown).map(([cat, count]) => {
                const total = summary.totalEvents || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-cyan-400">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No telemetry data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Telemetry Feed (Recent 20)</span>
          <span className="text-xs text-slate-500">Real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/30">
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Player ID</th>
                <th className="py-2.5 px-4">Game</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No recent telemetry events found. Emit a test event above!
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 text-cyan-400 font-semibold">{evt.eventType}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-sans font-medium">
                        {evt.eventCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-indigo-300">{evt.playerId}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{evt.gameTitle}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      {new Date(evt.clientTimestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
