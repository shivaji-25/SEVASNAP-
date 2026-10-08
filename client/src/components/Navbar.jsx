import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { LayoutDashboard, MapPin, Camera, ClipboardList, Wrench, User } from 'lucide-react';

export const Navbar = () => {
  const { userRole, user } = useCivic();
  const isAdmin = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 text-slate-400 max-w-md mx-auto shadow-xl shadow-slate-300/40">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all ${
              isActive
                ? 'text-blue-600 font-bold scale-[1.03]'
                : 'hover:text-slate-700'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight">
            {isAdmin ? 'Gov Dash' : 'Dashboard'}
          </span>
        </NavLink>

        {/* Map */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all ${
              isActive
                ? 'text-blue-600 font-bold scale-[1.03]'
                : 'hover:text-slate-700'
            }`
          }
        >
          <MapPin className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight">Map</span>
        </NavLink>

        {/* Center Elevated SNAP Camera FAB Button */}
        <div className="relative -top-5 flex-1 flex justify-center">
          <NavLink
            to="/report"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/35 ring-4 ring-white active:scale-95 transition-transform"
            aria-label="Snap Defect Photo"
          >
            <Camera className="w-6 h-6 stroke-[2.4]" />
          </NavLink>
        </div>

        {/* Tracking */}
        <NavLink
          to="/tracking"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all ${
              isActive
                ? 'text-blue-600 font-bold scale-[1.03]'
                : 'hover:text-slate-700'
            }`
          }
        >
          <ClipboardList className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight">
            {isAdmin ? 'Audit Log' : 'Track Issue'}
          </span>
        </NavLink>

        {/* Dynamic Profile / Workstation */}
        <NavLink
          to={isAdmin ? '/authority' : '/profile'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all ${
              isActive
                ? 'text-blue-600 font-bold scale-[1.03]'
                : 'hover:text-slate-700'
            }`
          }
        >
          {isAdmin ? (
            <Wrench className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          ) : (
            <User className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          )}
          <span className="text-[10px] tracking-tight">
            {isAdmin ? 'Workstation' : 'Profile'}
          </span>
        </NavLink>
      </div>
    </nav>
  );
};
