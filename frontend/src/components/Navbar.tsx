import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-white tracking-tight">StudioForge</span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400">Game Operations Cloud</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-200">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {user.role}
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{user.tenantName || 'Studio Org'}</span>
            </span>
          </div>

          <button
            onClick={logout}
            title="Log out of StudioForge"
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-slate-700 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
