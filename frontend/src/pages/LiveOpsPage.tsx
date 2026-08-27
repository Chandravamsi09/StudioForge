import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { LiveOpsEventItem, LiveOpsEventType, LiveOpsStatus } from '../types';
import { Radio, Plus, Calendar, Clock, Sparkles, Trash2, Tag } from 'lucide-react';

export const LiveOpsPage: React.FC = () => {
  const [events, setEvents] = useState<LiveOpsEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [gameTitle, setGameTitle] = useState('CyberArena: Legacy');
  const [name, setName] = useState('Weekend Double XP Extravaganza');
  const [description, setDescription] = useState('200% match rewards for all ranked multiplayer matches.');
  const [type, setType] = useState<LiveOpsEventType>('DOUBLE_XP');
  const [startTime, setStartTime] = useState('2026-08-28T18:00');
  const [endTime, setEndTime] = useState('2026-08-31T06:00');
  const [configPayloadStr, setConfigPayloadStr] = useState('{\n  "xpMultiplier": 2.0,\n  "eligiblePlaylists": ["ranked", "brawl"]\n}');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getLiveOpsEvents();
      setEvents(res.items);
    } catch (err) {
      console.error('Failed to load live-ops events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let configPayload = {};
      try {
        configPayload = JSON.parse(configPayloadStr);
      } catch (err) {
        alert('Invalid JSON config payload');
        return;
      }

      await api.createLiveOpsEvent({
        gameTitle,
        name,
        description,
        type,
        status: 'SCHEDULED',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        configPayload,
      });

      setShowModal(false);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule live-ops event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel/delete this live-ops event?')) return;
    try {
      await api.deleteLiveOpsEvent(id);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Radio className="w-7 h-7 text-indigo-400" />
            <span>Live-Ops Scheduling & Feature Flags</span>
          </h1>
          <p className="text-sm text-slate-400">
            Schedule dynamic game events, player XP multipliers, flash sales, tournaments, and feature flag rollouts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No live-ops events scheduled. Click "Schedule Live Event" to create one.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{evt.gameTitle}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{evt.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {evt.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{evt.description}</p>

                <div className="mt-3 flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(evt.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(evt.endTime).toLocaleDateString()}</span>
                  </div>
                </div>

                {evt.configPayload && Object.keys(evt.configPayload).length > 0 && (
                  <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                    <pre>{JSON.stringify(evt.configPayload, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 font-medium text-slate-300 border border-slate-700">
                  {evt.status}
                </span>

                <button
                  onClick={() => handleDelete(evt.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Schedule In-Game Event</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Game Title</label>
                <input
                  type="text"
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Event Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LiveOpsEventType)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="DOUBLE_XP">Double XP</option>
                    <option value="HOLIDAY_EVENT">Holiday Event</option>
                    <option value="TOURNAMENT">Tournament</option>
                    <option value="FLASH_SALE">Flash Sale</option>
                    <option value="FEATURE_FLAG">Feature Flag</option>
                    <option value="ECONOMY_OVERRIDE">Economy Override</option>
                    <option value="CUSTOM">Custom Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Config Payload (JSON)</label>
                <textarea
                  rows={3}
                  value={configPayloadStr}
                  onChange={(e) => setConfigPayloadStr(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
