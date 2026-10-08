import React from 'react';
import { useCivic } from '../context/CivicContext';
import { Shield, Navigation, UserCheck, ShieldAlert } from 'lucide-react';

export const Header = () => {
  const { userLocation, userRole, setUserRole } = useCivic();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 shadow-md max-w-md mx-auto">
      {/* Top Row: Brand & Live GPS */}
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black tracking-wider text-base shadow-sm shadow-emerald-500/20">
            SS
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              SEVASNAP
              <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                AI CIVIC
              </span>
            </h1>
          </div>
        </div>

        {/* Live GPS Lock Indicator */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-xs">
          <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium text-[10px] truncate max-w-[110px]">
            {userLocation.ward || 'Ward 151'}
          </span>
        </div>
      </div>

      {/* Role Switcher (Citizen vs Government Admin) */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          User Role:
        </span>

        {/* Segmented Switcher */}
        <div className="flex bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 text-[11px] font-bold">
          {/* Role 1: Citizen (Raise & Track) */}
          <button
            onClick={() => setUserRole('citizen')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all ${
              userRole === 'citizen'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👤 Citizen (Raise)</span>
          </button>

          {/* Role 2: Government Admin (Manage & Triage) */}
          <button
            onClick={() => setUserRole('admin')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all ${
              userRole === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏛️ Gov Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
