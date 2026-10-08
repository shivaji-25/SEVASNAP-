import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { getStageMetaForCategory, normalizeTimelineEvent } from '../utils/defectWorkflows';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    issues,
    myIssues,
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

  // For citizens: only show their reported complaints. For admin: show all issues
  const citizenTrackableIssues = isAdmin
    ? issues
    : myIssues && myIssues.length > 0
    ? myIssues
    : currentIssue
    ? [currentIssue]
    : [];

  // Active tracked issue: prioritize URL param or citizen's own reported issue
  const activeIssue =
    (ticketParam ? issues.find((i) => i.ticketId === ticketParam) : null) ||
    (citizenTrackableIssues.length > 0 ? citizenTrackableIssues[0] : null);

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
      <div className="pb-28 pt-8 px-4 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              No Reported Complaints Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              You haven't filed any civic complaints yet. When you snap and report a defect on your street, your live resolution tracker will appear here.
            </p>
          </div>
          <button
            onClick={() => navigate('/report')}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Snap & Report Civic Defect</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine stage progression index (0 to 3)
  const currentStageIndex = STAGES.findIndex((s) => s.key === activeIssue.status);
  const isResolved = activeIssue.status === 'resolved';

  // Advance lifecycle simulator with category-specific problem metadata
  const handleAdvanceSimulator = async () => {
    if (currentStageIndex >= STAGES.length - 1) return;
    setAdvancing(true);

    const nextStage = STAGES[currentStageIndex + 1].key;
    const metaConfig = getStageMetaForCategory(activeIssue.category, nextStage, user);

    try {
      await advanceIssueStatus(activeIssue._id, nextStage, metaConfig);
    } catch (err) {
      console.error('Lifecycle advance error:', err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Ticket Selector & Header (Clean Prototyping Kit Squircle) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/70">
            {activeIssue.ticketId}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {activeIssue.department}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {activeIssue.title}
          </h2>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div className="flex items-center text-xs text-slate-600 space-x-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate font-medium">{activeIssue.location?.ward || 'Ward 151, Koramangala'}</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-blue-600 font-semibold shrink-0">
                {activeIssue.location?.lat ? `${activeIssue.location.lat.toFixed(4)}°, ${activeIssue.location.lng.toFixed(4)}°` : ''}
              </span>
            </div>
            <button
              onClick={openLocationEditor}
              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200/70 flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Change Ticket Location"
            >
              <span>Change</span>
            </button>
          </div>
        </div>

        {/* Dropdown Switcher: only displays citizen's reported issues, or all if admin */}
        {citizenTrackableIssues.length > 1 && (
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">
              {isAdmin ? 'Switch Monitored Ticket (All Municipal Records)' : 'My Reported Complaints'}
            </label>
            <select
              value={activeIssue.ticketId}
              onChange={(e) => setSearchParams({ ticket: e.target.value })}
              className="w-full bg-slate-50 text-xs text-slate-800 font-medium border border-slate-200 rounded-2xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {citizenTrackableIssues.map((iss) => (
                <option key={iss.ticketId} value={iss.ticketId}>
                  {iss.ticketId} — {iss.categoryName} ({iss.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ticket Location Calibration Modal */}
      {showLocationEditor && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
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
              Update GPS coordinates for ticket <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">{activeIssue.ticketId}</span>.
            </p>

            {/* 1-Tap Detect GPS */}
            <button
              type="button"
              onClick={handleDetectGPS}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>Use My Live GPS Location</span>
            </button>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                Quick Select Place
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-[10px] font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-2.5 py-1 rounded-xl text-slate-700 transition-all cursor-pointer"
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
                  className="w-full text-xs p-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
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
                  className="w-full text-xs p-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
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
                  className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingLoc}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-1 active:scale-98 transition-all"
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
        <div className="bg-blue-50/80 border border-blue-200 rounded-3xl p-4 shadow-sm space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2 text-blue-800 font-black text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Visual Proof-of-Work Verified</span>
          </div>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            Civic defect resolved and photographic repair certified by the municipal engineering department.
          </p>
        </div>
      )}

      {/* 3. 4-Stage Civic Stepper (Connected Circular Design matching Image 4) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-900 block">Lifecycle Resolution</span>
            <span className="text-[10px] text-slate-400 font-medium">Verified by municipal telemetry</span>
          </div>
          <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/70">
            Stage {currentStageIndex + 1} of 4
          </span>
        </div>

        {/* Stepper with connecting horizontal line */}
        <div className="relative pt-1 pb-2">
          {/* Background horizontal connector line */}
          <div className="absolute top-[22px] left-[10%] right-[10%] h-[2.5px] bg-slate-200 -z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-500 rounded-full"
              style={{
                width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1 relative z-10">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center space-y-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    } ${isCurrent ? 'ring-4 ring-blue-500/20 scale-105' : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] leading-tight font-bold px-0.5 ${
                      isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Visual Proof-of-Work: Side-by-Side Photo Comparison */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">
            Side-by-Side Visual Proof-of-Work
          </span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
            Before vs After
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Initial Intake Defect Photo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              1. Before (Intake)
            </span>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 relative shadow-inner">
              <img
                src={activeIssue.imageUrl}
                alt="Before Defect"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-700">
                CITIZEN INTAKE
              </span>
            </div>
          </div>

          {/* Post-Repair Certified Photo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              2. After (Certified)
            </span>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 flex items-center justify-center text-center p-2 relative shadow-inner">
              {activeIssue.resolvedImageUrl ? (
                <>
                  <img
                    src={activeIssue.resolvedImageUrl}
                    alt="After Fix"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md shadow-blue-500/25">
                    CERTIFIED FIX
                  </span>
                </>
              ) : (
                <div className="text-[10px] text-slate-400 space-y-2 p-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-5 h-5 opacity-60" />
                  </div>
                  <span className="block font-medium">Awaiting Field Crew Resolution Photo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Resolution Progress & Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">Live Resolution Timeline</span>
          <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
            REAL-TIME LOGS
          </span>
        </div>

        <div className="space-y-4 pl-1">
          {activeIssue.timeline?.map((rawEvent, index) => {
            const event = normalizeTimelineEvent(rawEvent, activeIssue.category);
            return (
              <div key={index} className="flex space-x-3 relative">
                {/* Connector line */}
                {index !== activeIssue.timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-slate-200/80" />
                )}

                {/* Dot in vibrant royal blue */}
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 z-10 shadow-sm shadow-blue-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900">{event.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{event.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">{event.detail}</p>
                  {event.badge && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {event.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Official Lifecycle Actions (Visible to Authorities / Admins Only) */}
      {isAdmin && currentStageIndex < STAGES.length - 1 && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-4 space-y-2.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
            <span>🏛 Authority Action Console</span>
          </div>
          <button
            onClick={handleAdvanceSimulator}
            disabled={advancing}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-98 transition-all text-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
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
