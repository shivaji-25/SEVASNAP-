import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Shield, Navigation, UserCheck, ShieldAlert, Check, Edit2, X, LogIn, LogOut, ChevronDown } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const {
    userLocation,
    setUserLocation,
    detectLocation,
    forwardGeocode,
    userRole,
    setUserRole,
    user,
    logout,
  } = useCivic();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [customWard, setCustomWard] = useState(userLocation.ward || '');
  const [customAddress, setCustomAddress] = useState(userLocation.address || '');
  const [customLat, setCustomLat] = useState(userLocation.lat?.toString() || '12.9352');
  const [customLng, setCustomLng] = useState(userLocation.lng?.toString() || '77.6245');

  // Popular Location Presets for 1-Tap Quick Testing
  const LOCATION_PRESETS = [
    { name: 'Koramangala, Bengaluru', ward: 'Ward 151, Koramangala', address: '100ft Road, 4th Block', lat: 12.9352, lng: 77.6245 },
    { name: 'Indiranagar, Bengaluru', ward: 'Ward 112, Indiranagar', address: '12th Main Road, HAL 2nd Stage', lat: 12.9784, lng: 77.6408 },
    { name: 'Whitefield, Bengaluru', ward: 'Ward 84, Whitefield', address: 'ITPB Main Road, Whitefield', lat: 12.9698, lng: 77.7499 },
    { name: 'Sulur, Coimbatore', ward: 'Sulur Town Panchayat', address: 'Trichy Road, Sulur', lat: 11.0267, lng: 77.1264 },
    { name: 'MG Road / CBD', ward: 'Ward 111, Shantala Nagar', address: 'MG Road Metro Station', lat: 12.9756, lng: 77.6066 },
  ];

  const handleSelectPreset = (p) => {
    setCustomWard(p.ward);
    setCustomAddress(p.address);
    setCustomLat(p.lat.toString());
    setCustomLng(p.lng.toString());
    setUserLocation({
      lat: p.lat,
      lng: p.lng,
      ward: p.ward,
      address: p.address,
      accuracy: 'Preset Calibrated',
    });
    setShowLocationModal(false);
  };

  // Trigger browser GPS auto-lock or network IP resolution
  const handleDetectGPS = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectLocation();
      setCustomWard(loc.ward);
      setCustomAddress(loc.address);
      setCustomLat(loc.lat.toString());
      setCustomLng(loc.lng.toString());
    } catch (err) {
      console.warn('GPS detect note:', err);
    } finally {
      setTimeout(() => setIsDetecting(false), 800);
    }
  };

  const handleSaveCustomLocation = async (e) => {
    e.preventDefault();
    setIsGeocoding(true);

    try {
      let finalLat = parseFloat(customLat);
      let finalLng = parseFloat(customLng);

      // If user altered ward or address, search coordinates via OpenStreetMap Nominatim
      const searchTarget = `${customWard.trim()} ${customAddress.trim()}`.trim();
      if (searchTarget) {
        const geoResult = await forwardGeocode(searchTarget);
        if (geoResult) {
          finalLat = geoResult.lat;
          finalLng = geoResult.lng;
        }
      }

      if (isNaN(finalLat)) finalLat = userLocation.lat || 12.9352;
      if (isNaN(finalLng)) finalLng = userLocation.lng || 77.6245;

      const newLoc = {
        lat: +finalLat.toFixed(5),
        lng: +finalLng.toFixed(5),
        ward: customWard.trim() || 'Custom Ward',
        address: customAddress.trim() || customWard.trim(),
        accuracy: 'Custom Calibrated',
      };

      setUserLocation(newLoc);
      setShowLocationModal(false);
    } catch (err) {
      console.error('Location calibration error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const isGov = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  const handleQuickToggleRole = () => {
    setShowProfileMenu(false);
    if (isGov) {
      setUserRole('citizen');
      navigate('/');
    } else {
      setUserRole('authority');
      navigate('/authority');
    }
  };

  return (
    <>
      <header className="flex-shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 px-3.5 py-2.5 shadow-xs w-full transition-all duration-200">
        {/* Compact Single-Row Layout */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 cursor-pointer shrink-0 group select-none"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black tracking-wider text-xs shadow-md shadow-blue-500/25 group-hover:bg-blue-500 transition-colors">
              SS
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
                SEVASNAP
              </h1>
              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/70">
                AI CIVIC
              </span>
            </div>
          </div>

          {/* Right Action Cluster: Live GPS Pill + Role Pill */}
          <div className="flex items-center space-x-1.5 min-w-0">
            {/* Interactive Location Pill */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all px-2.5 py-1 rounded-full border border-slate-200 text-[10px] text-slate-700 font-bold shadow-xs cursor-pointer min-w-0"
              title="Click to view or calibrate location"
            >
              <Navigation
                className={`w-3 h-3 text-blue-600 shrink-0 ${
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
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              title="Tap to switch between Citizen and Authority Workstation"
            >
              <span>{isGov ? '🏛 Authority' : '👤 Citizen'}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Expandable Role & Account Quick Drawer */}
        {showProfileMenu && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
                {user ? user.name : (isGov ? 'Municipal Officer' : 'Active Citizen')}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {user?.employeeId ? `[${user.employeeId}]` : (user?.ward ? `[${user.ward}]` : '')}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleQuickToggleRole}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  isGov
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {isGov ? 'Switch to 👤 Citizen' : 'Switch to 🏛 Workstation'}
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/welcome');
                }}
                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                All Roles
              </button>
              {user && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 px-1.5 py-1 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Current Location</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Tap Browser GPS / IP auto-detect */}
            <button
              onClick={handleDetectGPS}
              disabled={isDetecting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting Real GPS / IP...' : 'Detect Live GPS / Network Location'}</span>
            </button>

            {/* Quick 1-Tap Location Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Quick Select Location
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2 py-1 rounded-lg text-slate-700 transition-all cursor-pointer"
                  >
                    📍 {p.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                Or Type Custom Location
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
                  placeholder="e.g., Sulur, Coimbatore or Indiranagar"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Street / Landmark Address</label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="e.g., Main Road, Near Bus Stand"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              {/* Precise Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeocoding}
                  className="flex-1 py-2.5 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isGeocoding ? (
                    <span>Calibrating...</span>
                  ) : (
                    <span>Set Location</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
