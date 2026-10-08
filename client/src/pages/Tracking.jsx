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
} from 'lucide-react';

const STAGES = [
  { key: 'reported', label: 'Reported', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: Truck },
  { key: 'in_progress', label: 'In Progress', icon: Sparkles },
  { key: 'resolved', label: 'Resolved', icon: ShieldCheck },
];

export const Tracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { issues, currentIssue, setCurrentIssue, advanceIssueStatus } = useCivic();

  const ticketParam = searchParams.get('ticket');
  const [advancing, setAdvancing] = useState(false);

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

  // Simulate next stage forward progression (SRS FR-4.2)
  const handleAdvanceSimulator = async () => {
    if (currentStageIndex >= STAGES.length - 1) return;
    setAdvancing(true);

    const nextStage = STAGES[currentStageIndex + 1].key;
    const metaConfig = {
      assigned: {
        title: 'Squad Dispatched',
        detail: 'Municipal Field Squad KA-01-EA-1904 dispatched to site with tarmac patcher.',
        badge: 'Crew Dispatched',
      },
      in_progress: {
        title: 'Asphalt Compaction In Progress',
        detail: 'Active engineering crew operating high-pressure surface compaction roller.',
        badge: 'Crew Active',
      },
      resolved: {
        title: 'Photographic Quality Certified',
        detail: 'Zonal Inspector certified surface integrity & released municipal clearance.',
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
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
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
          </div>
        </div>

        {/* Quick Ticket Dropdown Switcher */}
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

      {/* 2. 4-Stage Civic Stepper (SRS FR-4.2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Lifecycle Progress</span>
          <span className="text-emerald-600">Stage {currentStageIndex + 1} of 4</span>
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
                  className={`text-[10px] leading-tight font-semibold ${
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

      {/* 3. Before & After Photo Comparison (SRS FR-4.4) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2 shadow-sm">
        <span className="text-xs font-bold text-slate-800 block">
          Photographic Audit Comparison
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Initial Defect Photo */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Citizen Intake
            </span>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={activeIssue.imageUrl}
                alt="Intake"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Post-Repair Certified Photo */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              2. Certified Repair
            </span>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-center p-2">
              {activeIssue.resolvedImageUrl ? (
                <img
                  src={activeIssue.resolvedImageUrl}
                  alt="Post-Repair"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[10px] text-slate-400 space-y-1">
                  <Camera className="w-5 h-5 mx-auto opacity-40" />
                  <span>Awaiting Field Squad Resolution</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chronological Immutable Audit Trail (SRS FR-4.3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Immutable Audit Timeline</span>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
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
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 z-10">
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

      {/* 5. Advance Lifecycle Simulator Trigger (for demonstration & field simulation) */}
      {currentStageIndex < STAGES.length - 1 && (
        <button
          onClick={handleAdvanceSimulator}
          disabled={advancing}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px] text-xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>
            {advancing
              ? 'Dispatching Squad...'
              : `Simulate Next Stage: Advance to "${STAGES[currentStageIndex + 1].label}"`}
          </span>
        </button>
      )}
    </div>
  );
};
