import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Shield, Navigation, UserCheck, ShieldAlert, Check, Edit2, X } from 'lucide-react';

export const Header = () => {
  const { userLocation, setUserLocation, detectLocation, userRole, setUserRole } = useCivic();
  const [isDetecting, setIsDetecting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
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

  return (
    <>
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

          {/* Interactive Live GPS Button */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 transition-all px-2.5 py-1.5 rounded-full border border-slate-700 text-xs shadow-sm cursor-pointer"
            title="Click to change or refresh your location"
          >
            <Navigation
              className={`w-3.5 h-3.5 text-emerald-400 ${
                isDetecting ? 'animate-spin' : 'animate-pulse'
              }`}
            />
            <span className="text-slate-200 font-bold text-[10px] truncate max-w-[120px]">
              {userLocation.ward || 'My Location'}
            </span>
          </button>
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
              <span>👤 Citizen</span>
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
                  placeholder="e.g., Indiranagar, Bengaluru or Mumbai"
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
                  placeholder="e.g., 12th Main Road, Near Metro"
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
