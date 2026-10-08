import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import {
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  MapPin,
  Camera,
  Layers,
  Award,
} from 'lucide-react';

const STAGES = [
  { key: 'reported', label: 'Submitted & AI Verified', icon: Clock },
  { key: 'assigned', label: 'Squad Dispatched', icon: Truck },
  { key: 'in_progress', label: 'Repair Active', icon: Sparkles },
  { key: 'resolved', label: 'Visual Proof Resolved', icon: ShieldCheck },
];

export const Tracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    issues,
    currentIssue,
    setCurrentIssue,
    advanceIssueStatus,
    updateIssueLocation,
    forwardGeocode,
    detectLocation,
    userRole,
    user,
  } = useCivic();

  const isAdmin = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  const ticketParam = searchParams.get('ticket');
  const [advancing, setAdvancing] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState('split'); // 'split' | 'before' | 'after'

  // Location editor state
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [editWard, setEditWard] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isUpdatingLoc, setIsUpdatingLoc] = useState(false);

  // Popular Presets
  const LOCATION_PRESETS = [
    { name: 'Sulur, Coimbatore', ward: 'Sulur Town Panchayat', address: 'Trichy Road, Sulur', lat: 11.0267, lng: 77.1264 },
    { name: 'Indiranagar, Bengaluru', ward: 'Ward 112, Indiranagar', address: '12th Main Road, HAL 2nd Stage', lat: 12.9784, lng: 77.6408 },
    { name: 'Whitefield, Bengaluru', ward: 'Ward 84, Whitefield', address: 'ITPB Main Road, Whitefield', lat: 12.9698, lng: 77.7499 },
    { name: 'Koramangala, Bengaluru', ward: 'Ward 151, Koramangala', address: '100ft Road, 4th Block', lat: 12.9352, lng: 77.6245 },
    { name: 'MG Road / CBD', ward: 'Ward 111, Shantala Nagar', address: 'MG Road Metro Station', lat: 12.9756, lng: 77.6066 },
  ];

  // Active tracked issue
  const activeIssue =
    (ticketParam ? issues.find((i) => i.ticketId === ticketParam) : null) ||
    currentIssue ||
    issues[0];

  const openLocationEditor = () => {
    setEditWard(activeIssue?.location?.ward || 'Sulur, Coimbatore');
    setEditAddress(activeIssue?.location?.address || 'Main Road');
    setEditLat((activeIssue?.location?.lat || 11.0267).toString());
    setEditLng((activeIssue?.location?.lng || 77.1264).toString());
    setShowLocationEditor(true);
  };

  const handleSelectPreset = async (p) => {
    setEditWard(p.ward);
    setEditAddress(p.address);
    setEditLat(p.lat.toString());
    setEditLng(p.lng.toString());
    if (activeIssue) {
      await updateIssueLocation(activeIssue.ticketId, {
        lat: p.lat,
        lng: p.lng,
        ward: p.ward,
        address: p.address,
      });
      setShowLocationEditor(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setIsUpdatingLoc(true);
    try {
      let finalLat = parseFloat(editLat);
      let finalLng = parseFloat(editLng);

      const searchTarget = `${editWard.trim()} ${editAddress.trim()}`.trim();
      if (searchTarget) {
        const geoResult = await forwardGeocode(searchTarget);
        if (geoResult) {
          finalLat = geoResult.lat;
          finalLng = geoResult.lng;
        }
      }

      if (isNaN(finalLat)) finalLat = activeIssue?.location?.lat || 12.9352;
      if (isNaN(finalLng)) finalLng = activeIssue?.location?.lng || 77.6245;

      const newLoc = {
        lat: +finalLat.toFixed(5),
        lng: +finalLng.toFixed(5),
        ward: editWard.trim() || 'Custom Ward',
        address: editAddress.trim() || editWard.trim(),
      };

      if (activeIssue) {
        await updateIssueLocation(activeIssue.ticketId, newLoc);
      }
      setShowLocationEditor(false);
    } catch (err) {
      console.error('Update ticket location error:', err);
    } finally {
      setIsUpdatingLoc(false);
    }
  };

  const handleDetectGPS = async () => {
    try {
      const loc = await detectLocation();
      setEditWard(loc.ward);
      setEditAddress(loc.address);
      setEditLat(loc.lat.toString());
      setEditLng(loc.lng.toString());
      if (activeIssue) {
        await updateIssueLocation(activeIssue.ticketId, loc);
        setShowLocationEditor(false);
      }
    } catch (err) {
      console.warn('Detect GPS error:', err);
    }
  };

  useEffect(() => {
    if (activeIssue && activeIssue.ticketId !== ticketParam) {
      setSearchParams({ ticket: activeIssue.ticketId });
    }
  }, [activeIssue, ticketParam, setSearchParams]);

  if (!activeIssue) {
    return (
      <div className="p-8 text-center text-slate-500 max-w-md mx-auto">
        No active civic tickets available to track.
      </div>
    );
  }

  // Determine stage progression index (0 to 3)
  const currentStageIndex = STAGES.findIndex((s) => s.key === activeIssue.status);
  const isResolved = activeIssue.status === 'resolved';

  // Advance lifecycle simulator
  const handleAdvanceSimulator = async () => {
    if (currentStageIndex >= STAGES.length - 1) return;
    setAdvancing(true);

    const nextStage = STAGES[currentStageIndex + 1].key;
    const metaConfig = {
      assigned: {
        title: 'Road Maintenance Unit 4 Dispatched',
        detail: 'Dispatched Zonal Quick-Response Squad KA-01-EA-1904 to site with hot-mix tarmac.',
        badge: 'Squad Deployed',
      },
      in_progress: {
        title: 'Engineering Repair on Location',
        detail: 'Active engineering crew operating high-pressure surface compaction roller.',
        badge: 'Crew Active',
      },
      resolved: {
        title: 'Photographic Quality Verified',
        detail: 'Zonal Inspector certified surface integrity & approved before/after visual proof-of-work.',
        badge: 'Official Certified',
        resolvedBy: 'Zonal Municipal Inspector',
        resolvedImageUrl:
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      },
    };

    try {
      await advanceIssueStatus(activeIssue._id, nextStage, metaConfig[nextStage]);
    } catch (err) {
      console.error('Lifecycle advance error:', err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Ticket Selector & Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
            {activeIssue.ticketId}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {activeIssue.department}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black tracking-tight">{activeIssue.title}</h2>
          <div className="flex items-center justify-between mt-1 gap-2">
            <div className="flex items-center text-xs text-slate-300 space-x-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{activeIssue.location?.ward || 'Ward 151, Koramangala'}</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                {activeIssue.location?.lat ? `${activeIssue.location.lat.toFixed(4)}°, ${activeIssue.location.lng.toFixed(4)}°` : ''}
              </span>
            </div>
            <button
              onClick={openLocationEditor}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-slate-700 hover:border-emerald-500/50 flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Change Ticket Location"
            >
              <span>Change</span>
            </button>
          </div>
        </div>

        {/* Dropdown Switcher */}
        <div className="pt-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Switch Monitored Ticket
          </label>
          <select
            value={activeIssue.ticketId}
            onChange={(e) => setSearchParams({ ticket: e.target.value })}
            className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
          >
            {issues.map((iss) => (
              <option key={iss.ticketId} value={iss.ticketId}>
                {iss.ticketId} — {iss.categoryName} ({iss.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket Location Calibration Modal */}
      {showLocationEditor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Change Ticket Location</h3>
              </div>
              <button
                onClick={() => setShowLocationEditor(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Update GPS coordinates for ticket <span className="font-mono font-bold text-slate-900">{activeIssue.ticketId}</span>.
            </p>

            {/* 1-Tap Detect GPS */}
            <button
              type="button"
              onClick={handleDetectGPS}
              className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Use My Live GPS Location</span>
            </button>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Quick Select Place
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

            {/* Custom Location Form */}
            <form onSubmit={handleSaveLocation} className="space-y-2.5 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Area / Ward / City</label>
                <input
                  type="text"
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  placeholder="e.g. Sulur, Coimbatore or Indiranagar"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Street / Landmark</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Trichy Road, Sulur"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={editLng}
                    onChange={(e) => setEditLng(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLocationEditor(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingLoc}
                  className="flex-1 py-2 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1"
                >
                  {isUpdatingLoc ? 'Updating...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Visual Proof-of-Work Notification Banner (Upon Resolution) */}
      {isResolved && (
        <div className="bg-emerald-50 border border-emerald-300/80 rounded-3xl p-4 shadow-sm space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Visual Proof-of-Work Verified</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Civic defect resolved and photographic repair certified by the municipal engineering department.
          </p>
        </div>
      )}

      {/* 3. 4-Stage Civic Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Lifecycle Progress</span>
          <span className="text-emerald-600 font-extrabold">Stage {currentStageIndex + 1} of 4</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 relative">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[9px] leading-tight font-bold ${
                    isCompleted ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Visual Proof-of-Work: Side-by-Side Photo Comparison */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">
            Side-by-Side Visual Proof-of-Work
          </span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            Before vs After
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Initial Intake Defect Photo */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Before (Citizen Intake)
            </span>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img
                src={activeIssue.imageUrl}
                alt="Before Defect"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 left-1.5 bg-slate-950/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                INTAKE
              </span>
            </div>
          </div>

          {/* Post-Repair Certified Photo */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              2. After (Certified Fix)
            </span>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-center p-2 relative">
              {activeIssue.resolvedImageUrl ? (
                <>
                  <img
                    src={activeIssue.resolvedImageUrl}
                    alt="After Fix"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    CERTIFIED
                  </span>
                </>
              ) : (
                <div className="text-[10px] text-slate-400 space-y-1.5 p-2">
                  <Camera className="w-6 h-6 mx-auto opacity-40" />
                  <span>Awaiting Field Crew Resolution Photo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Resolution Progress & Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Live Resolution Timeline</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            REAL-TIME UPDATES
          </span>
        </div>

        <div className="space-y-4 pl-1">
          {activeIssue.timeline?.map((event, index) => (
            <div key={index} className="flex space-x-3 relative">
              {/* Connector line */}
              {index !== activeIssue.timeline.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-slate-200" />
              )}

              {/* Dot */}
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              {/* Event Content */}
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{event.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{event.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{event.detail}</p>
                {event.badge && (
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                    {event.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Official Lifecycle Actions (Visible to Authorities / Admins Only) */}
      {isAdmin && currentStageIndex < STAGES.length - 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <span>🏛 Authority Action Console</span>
          </div>
          <button
            onClick={handleAdvanceSimulator}
            disabled={advancing}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 active:scale-[0.98] transition-all text-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {advancing
                ? 'Updating Stage...'
                : `Official Action: Advance to "${STAGES[currentStageIndex + 1].label}"`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
