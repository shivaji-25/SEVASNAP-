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
  const { issues, currentIssue, setCurrentIssue, advanceIssueStatus } = useCivic();

  const ticketParam = searchParams.get('ticket');
  const [advancing, setAdvancing] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState('split'); // 'split' | 'before' | 'after'

  // Active tracked issue
  const activeIssue =
    (ticketParam ? issues.find((i) => i.ticketId === ticketParam) : null) ||
    currentIssue ||
    issues[0];

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
        resolvedImageUrl:
          'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
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
          <div className="flex items-center text-xs text-slate-300 space-x-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeIssue.location?.ward || 'Ward 151, Koramangala'}</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">
              {activeIssue.location?.lat ? `${activeIssue.location.lat.toFixed(4)}°, ${activeIssue.location.lng.toFixed(4)}°` : ''}
            </span>
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

      {/* 5. Chronological Immutable Audit Trail */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Immutable Audit Timeline</span>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            AUDIT_VERIFIED
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

      {/* 6. Lifecycle Progression Simulator */}
      {currentStageIndex < STAGES.length - 1 && (
        <button
          onClick={handleAdvanceSimulator}
          disabled={advancing}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px] text-xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>
            {advancing
              ? 'Updating Audit Trail...'
              : `Advance to "${STAGES[currentStageIndex + 1].label}"`}
          </span>
        </button>
      )}
    </div>
  );
};
