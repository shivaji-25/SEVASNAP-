import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Shield, Navigation, UserCheck, ShieldAlert, Check, Edit2, X, LogIn, LogOut, ChevronDown } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const { userLocation, setUserLocation, detectLocation, userRole, setUserRole, user, logout } = useCivic();
  const [isDetecting, setIsDetecting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [customWard, setCustomWard] = useState(userLocation.ward || '');
  const [customAddress, setCustomAddress] = useState(userLocation.address || '');

  // Trigger browser GPS auto-lock
  const handleDetectGPS = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectLocation();
      setCustomWard(loc.ward);
      setCustomAddress(loc.address);
    } catch (err) {
      console.warn('GPS detect note:', err);
    } finally {
      setTimeout(() => setIsDetecting(false), 800);
    }
  };

  const handleSaveCustomLocation = (e) => {
    e.preventDefault();
    if (customWard.trim()) {
      setUserLocation({
        ...userLocation,
        ward: customWard.trim(),
        address: customAddress.trim() || customWard.trim(),
        accuracy: 'Custom Calibrated',
      });
      setShowLocationModal(false);
    }
  };

  const isGov = user?.role === 'authority' || userRole === 'admin';

  return (
    <>
      <header className="flex-shrink-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 px-3.5 py-2.5 shadow-sm w-full transition-all duration-200">
        {/* Compact Single-Row Layout */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 cursor-pointer shrink-0 group select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black tracking-wider text-xs shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
              SS
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">
                SEVASNAP
              </h1>
              <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded-full border border-emerald-500/30">
                AI CIVIC
              </span>
            </div>
          </div>

          {/* Right Action Cluster: Live GPS Pill + Role Pill */}
          <div className="flex items-center space-x-1.5 min-w-0">
            {/* Interactive Location Pill */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center space-x-1 bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition-all px-2.5 py-1 rounded-full border border-slate-700/80 text-[10px] text-slate-200 shadow-sm cursor-pointer min-w-0"
              title="Click to view or calibrate location"
            >
              <Navigation
                className={`w-3 h-3 text-emerald-400 shrink-0 ${
                  isDetecting ? 'animate-spin' : 'animate-pulse'
                }`}
              />
              <span className="font-bold truncate max-w-[95px] sm:max-w-[125px]">
                {userLocation.ward || 'My Location'}
              </span>
            </button>

            {/* Role & Profile Pill (Click to toggle details/switch) */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all active:scale-95 cursor-pointer shrink-0 ${
                isGov
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
              title="Tap to view role details or switch"
            >
              <span>{isGov ? '🏛 Authority' : '👤 Citizen'}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Expandable Role & Account Quick Drawer */}
        {showProfileMenu && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="text-[11px] font-bold text-slate-200 truncate max-w-[140px]">
                {user ? user.name : (isGov ? 'Municipal Officer' : 'Active Citizen')}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {user?.employeeId ? `[${user.employeeId}]` : (user?.ward ? `[${user.ward}]` : '')}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/welcome');
                }}
                className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
              >
                Switch Role
              </button>
              {user && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 px-1.5 py-1"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Change Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Current Location</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Tap Browser GPS auto-detect */}
            <button
              onClick={handleDetectGPS}
              disabled={isDetecting}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting Live GPS...' : 'Use My Live GPS Location'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                Or Edit Manually
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSaveCustomLocation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Area / Ward / City</label>
                <input
                  type="text"
                  value={customWard}
                  onChange={(e) => setCustomWard(e.target.value)}
                  placeholder="e.g., Indiranagar, Bengaluru or Sulur"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Street Address</label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="e.g., KPR mill road, Near Sulur"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-2 rounded-xl">
                Coordinates: {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-md"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
