import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { LayoutDashboard, MapPin, Camera, ClipboardList, ShieldAlert, Wrench } from 'lucide-react';

export const Navbar = () => {
  const { userRole, user } = useCivic();
  const isAdmin = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 max-w-md mx-auto shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Dashboard (Citizen Dashboard or Gov Command Dashboard) */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive
                ? isAdmin
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">
            {isAdmin ? 'Gov Dash' : 'Citizen Dash'}
          </span>
        </NavLink>

        {/* Map */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive
                ? isAdmin
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'hover:text-slate-200'
            }`
          }
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Map</span>
        </NavLink>

        {/* Center Elevated SNAP Camera Button */}
        <div className="relative -top-5 flex-1 flex justify-center">
          <NavLink
            to="/report"
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full text-slate-950 shadow-lg ring-4 ring-slate-900 transition-transform active:scale-95 ${
              isAdmin
                ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40'
            }`}
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
              isActive
                ? isAdmin
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'hover:text-slate-200'
            }`
          }
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Audit Trail</span>
        </NavLink>

        {/* Authority / Dispatch Workstation */}
        <NavLink
          to="/authority"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive
                ? isAdmin
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'hover:text-slate-200'
            }`
          }
        >
          {isAdmin ? (
            <Wrench className="w-5 h-5 mb-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px] tracking-tight">
            {isAdmin ? 'Workstation' : 'Authority'}
          </span>
        </NavLink>
      </div>
    </nav>
  );
};
