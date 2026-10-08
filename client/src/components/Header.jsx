import React from 'react';
import { useCivic } from '../context/CivicContext';
import { Shield, Navigation, Wifi } from 'lucide-react';

export const Header = () => {
  const { userLocation } = useCivic();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 shadow-md max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black tracking-wider text-base shadow-sm shadow-emerald-500/20">
            SS
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              SEVASNAP
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                AI CIVIC
              </span>
            </h1>
          </div>
        </div>

        {/* Live GPS Lock Indicator */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-xs">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium text-[11px] truncate max-w-[120px]">
            {userLocation.ward || 'Ward 151'}
          </span>
        </div>
      </div>
    </header>
  );
};
