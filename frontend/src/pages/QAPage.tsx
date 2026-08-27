import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TicketItem, TicketSeverity, TicketStatus } from '../types';
import { Bug, Plus, Search, CheckCircle, Clock, AlertCircle, AlertOctagon, Trash2 } from 'lucide-react';

export const QAPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [gameTitle, setGameTitle] = useState('CyberArena: Legacy');
  const [title, setTitle] = useState('Physics elevator collision pass-through');
  const [description, setDescription] = useState('Player slips through moving elevator platform when crouching.');
  const [reproductionSteps, setReproductionSteps] = useState('1. Stand on elevator in Sector B\n2. Trigger switch\n3. Hold crouch');
  const [severity, setSeverity] = useState<TicketSeverity>('HIGH');
  const [environment, setEnvironment] = useState('Windows 11 / RTX 4080 / DX12');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getTickets(params);
      setTickets(res.items);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [search, severityFilter, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket({
        gameTitle,
        title,
        description,
        reproductionSteps,
        severity,
        environment,
        status: 'OPEN',
      });
      setShowModal(false);
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit bug report');
    }
  };

  const handleStatusChange = async (id: string, newStatus: TicketStatus) => {
    try {
      await api.updateTicketStatus(id, newStatus);
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.deleteTicket(id);
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  const getSeverityBadge = (sev: TicketSeverity) => {
    switch (sev) {
      case 'BLOCKER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center space-x-1 w-fit">
            <AlertOctagon className="w-3 h-3" />
            <span>BLOCKER</span>
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center space-x-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
            HIGH
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600 w-fit">
            {sev}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Bug className="w-7 h-7 text-amber-400" />
            <span>QA & Bug Tracking Board</span>
          </h1>
          <p className="text-sm text-slate-400">
            Reproduction steps, severity classification, developer triage, and QA verification lifecycle.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Report Bug</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search bug title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="BLOCKER">Blocker</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No bug tickets found. Clean board! 🚀
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{t.gameTitle}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{t.title}</h3>
                  </div>
                  {getSeverityBadge(t.severity)}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                  {t.description}
                </p>

                {t.reproductionSteps && (
                  <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Repro Steps:</span>
                    {t.reproductionSteps}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <button
                  onClick={() => handleDelete(t.id)}
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
            <h2 className="text-lg font-bold text-white">Log QA Bug Report</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Game Project</label>
                <input
                  type="text"
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Bug Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="BLOCKER">Blocker</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Environment Specs</label>
                  <input
                    type="text"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Reproduction Steps</label>
                <textarea
                  rows={3}
                  value={reproductionSteps}
                  onChange={(e) => setReproductionSteps(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono text-xs"
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/25"
                >
                  Submit Bug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
