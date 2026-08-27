import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BuildItem, TargetPlatform, BuildStatus } from '../types';
import { Box, Plus, Search, Filter, Trash2, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const BuildsPage: React.FC = () => {
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Form state
  const [gameTitle, setGameTitle] = useState('CyberArena: Legacy');
  const [version, setVersion] = useState('v1.4.0');
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('WINDOWS');
  const [branch, setBranch] = useState('main');
  const [commitHash, setCommitHash] = useState('9a8d4f3b');
  const [artifactUrl, setArtifactUrl] = useState('https://cdn.studioforge.dev/builds/cyberarena-v1.4.0.zip');
  const [changelog, setChangelog] = useState('Added high-refresh rate support and fixed netcode jitter.');

  const loadBuilds = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedPlatform) params.targetPlatform = selectedPlatform;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getBuilds(params);
      setBuilds(res.items);
    } catch (err) {
      console.error('Failed to load builds', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuilds();
  }, [search, selectedPlatform, selectedStatus]);

  const handleCreateBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBuild({
        gameTitle,
        version,
        targetPlatform,
        branch,
        commitHash,
        artifactUrl,
        changelog,
        status: 'SUCCESS',
        buildDurationSeconds: 320,
      });
      setShowModal(false);
      loadBuilds();
    } catch (err: any) {
      alert(err.message || 'Failed to create build');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this build record?')) return;
    try {
      await api.deleteBuild(id);
      loadBuilds();
    } catch (err: any) {
      alert(err.message || 'Failed to delete build');
    }
  };

  const getStatusBadge = (status: BuildStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Building</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">
            <span>{status}</span>
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
            <Box className="w-7 h-7 text-indigo-400" />
            <span>Build Pipelines & Artifacts</span>
          </h1>
          <p className="text-sm text-slate-400">
            Game client compilation history, target platforms, commit hashes, and cloud artifact distributions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>Register Build</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search version, commit, branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Platforms</option>
            <option value="WINDOWS">Windows</option>
            <option value="MAC">Mac</option>
            <option value="LINUX">Linux</option>
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
            <option value="PLAYSTATION">PlayStation</option>
            <option value="XBOX">Xbox</option>
            <option value="NINTENDO_SWITCH">Nintendo Switch</option>
            <option value="WEBGL">WebGL</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="BUILDING">Building</option>
            <option value="FAILED">Failed</option>
            <option value="QUEUED">Queued</option>
          </select>
        </div>
      </div>

      {/* Builds Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Game & Version</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Git Commit / Branch</th>
                <th className="py-3.5 px-4">Artifact</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {builds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No builds found. Click "Register Build" to record a pipeline run.
                  </td>
                </tr>
              ) : (
                builds.map((build) => (
                  <tr key={build.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{build.gameTitle}</div>
                      <div className="text-xs text-indigo-400 font-mono font-medium">{build.version}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-medium text-slate-300">
                        {build.targetPlatform}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(build.status)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-cyan-400">{build.commitHash || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{build.branch}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {build.artifactUrl ? (
                        <a
                          href={build.artifactUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                        >
                          <span>Download</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(build.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(build.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Register Game Build Run</h2>
            <form onSubmit={handleCreateBuild} className="space-y-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Version</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Platform</label>
                  <select
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value as TargetPlatform)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="WINDOWS">Windows</option>
                    <option value="MAC">Mac</option>
                    <option value="LINUX">Linux</option>
                    <option value="ANDROID">Android</option>
                    <option value="IOS">iOS</option>
                    <option value="PLAYSTATION">PlayStation</option>
                    <option value="XBOX">Xbox</option>
                    <option value="NINTENDO_SWITCH">Nintendo Switch</option>
                    <option value="WEBGL">WebGL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Git Commit SHA</label>
                  <input
                    type="text"
                    value={commitHash}
                    onChange={(e) => setCommitHash(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Artifact URL</label>
                <input
                  type="url"
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Release Notes / Changelog</label>
                <textarea
                  rows={2}
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
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
                  Save Build
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
