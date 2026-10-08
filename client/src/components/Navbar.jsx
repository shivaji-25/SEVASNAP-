import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MapPin, Camera, ClipboardList, ShieldAlert } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 max-w-md mx-auto shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Home</span>
        </NavLink>

        {/* Map */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'
            }`
          }
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Map</span>
        </NavLink>

        {/* Center Elevated SNAP Camera Button */}
        <div className="relative -top-5 flex-1 flex justify-center">
          <NavLink
            to="/report"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40 ring-4 ring-slate-900 transition-transform active:scale-95"
            aria-label="Snap Defect Photo"
          >
            <Camera className="w-7 h-7 stroke-[2.2]" />
          </NavLink>
        </div>

        {/* Tracking */}
        <NavLink
          to="/tracking"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'
            }`
          }
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Tracking</span>
        </NavLink>

        {/* Authority */}
        <NavLink
          to="/authority"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'
            }`
          }
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Authority</span>
        </NavLink>
      </div>
    </nav>
  );
};
