import React, { useState, useEffect } from 'react';
import { useCivic } from '../context/CivicContext';
import * as api from '../services/api';
import {
  ShieldAlert,
  Users,
  Clock,
  CheckCircle,
  Truck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Crosshair,
  Sliders,
  Check,
  X,
  Layers,
  Wrench,
  Camera,
} from 'lucide-react';

const MAINTENANCE_UNITS = [
  { id: 'unit-4', name: 'Unit 4: Road Patch Tarmac Squad', distance: '180m away', eta: '20 mins', squadLeader: 'Eng. Ramesh K.' },
  { id: 'unit-2', name: 'Unit 2: BWSSB Rapid Valve Unit', distance: '340m away', eta: '35 mins', squadLeader: 'Eng. Suresh M.' },
  { id: 'unit-5', name: 'Unit 5: SWM Sanitation Compactor', distance: '500m away', eta: '45 mins', squadLeader: 'Lead Anand V.' },
];

export const Authority = () => {
  const { issues, advanceIssueStatus } = useCivic();
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionPending, setActionPending] = useState(null);

  // Active view mode: 'command' (View A: Prioritized Command Center) | 'workstation' (View B: Diagnostic & Dispatch Workstation)
  const [activeView, setActiveView] = useState('command');
  const [inspectedTicket, setInspectedTicket] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(MAINTENANCE_UNITS[0]);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Fetch telemetry from backend
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getAuthorityStats();
      setStatsData(data);
    } catch (err) {
      console.warn('Authority stats fallback:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [issues]);

  // Derived counts
  const totalWorkload = issues.length;
  const pendingIntake = issues.filter((i) => i.status === 'reported').length;
  const activeSquads = issues.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length;
  const certifiedClosed = issues.filter((i) => i.status === 'resolved').length;

  // AI-Prioritized Smart Triaging Queue (Ranked: High severity & safety hazards auto-escalate to top)
  const triageQueue = [...issues]
    .filter((i) => i.status !== 'resolved')
    .sort((a, b) => {
      const severityOrder = { High: 3, Medium: 2, Low: 1 };
      return (severityOrder[b.priority] || 1) - (severityOrder[a.priority] || 1);
    });

  // Open Diagnostic Workstation for an issue
  const openWorkstation = (issue) => {
    setInspectedTicket(issue);
    setActiveView('workstation');
    setVerificationSuccess(false);
  };

  // 1-Tap Field Dispatch Execution
  const handleDispatchUnit = async (issue, targetStatus) => {
    setActionPending(issue._id);
    try {
      const meta = {
        assigned: {
          title: `Dispatched ${selectedUnit.name}`,
          detail: `Assigned ${selectedUnit.squadLeader} (${selectedUnit.distance}). Estimated fix time: 2 hrs.`,
          badge: 'Unit Deployed',
        },
        in_progress: {
          title: 'Field Squad on Site',
          detail: 'Crew actively operating repair machinery at verified coordinates.',
          badge: 'Crew Active',
        },
        resolved: {
          title: 'AI Verification Loop Passed',
          detail: 'Before/after photographic proof validated. Citizen notified & record certified closed.',
          badge: 'Official Certified',
          resolvedImageUrl:
            'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
        },
      };

      await advanceIssueStatus(issue._id, targetStatus, meta[targetStatus]);
      fetchStats();

      if (targetStatus === 'resolved') {
        setVerificationSuccess(true);
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Header with Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>Authority Workstation</span>
          </h2>
          <p className="text-[11px] text-slate-500">BBMP Zonal Engineering Operations</p>
        </div>

        {/* View Switcher: Command Center vs Diagnostic Workstation */}
        <div className="flex bg-slate-200/90 p-0.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveView('command')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeView === 'command'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Command
          </button>
          <button
            onClick={() => {
              if (!inspectedTicket && triageQueue.length > 0) {
                setInspectedTicket(triageQueue[0]);
              }
              setActiveView('workstation');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeView === 'workstation'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workstation
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW A: AI-PRIORITIZED COMMAND CENTER                    */}
      {/* ======================================================== */}
      {activeView === 'command' && (
        <div className="space-y-4">
          {/* Telemetry Stat Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Total Workload</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black">{totalWorkload}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Active Sector Queue</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Pending Intake</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{pendingIntake}</div>
              <div className="text-[10px] text-amber-600 font-semibold">Awaiting Field Action</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Active Squads</span>
                <Truck className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{activeSquads}</div>
              <div className="text-[10px] text-blue-600 font-semibold">Deployed on Location</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Certified Closed</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{certifiedClosed}</div>
              <div className="text-[10px] text-emerald-700 font-semibold">Visual Proof Verified</div>
            </div>
          </div>

          {/* 7-Day Velocity Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800">
                7-Day Velocity: Reports vs Closures
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                98.2% SLA Compliance
              </span>
            </div>

            <div className="flex items-end justify-between h-24 pt-3 pb-1 px-1 border-b border-slate-100">
              {(
                statsData?.velocityChart || [
                  { day: 'Mon', reported: 8, resolved: 7 },
                  { day: 'Tue', reported: 12, resolved: 11 },
                  { day: 'Wed', reported: 9, resolved: 9 },
                  { day: 'Thu', reported: 15, resolved: 14 },
                  { day: 'Fri', reported: 11, resolved: 10 },
                  { day: 'Sat', reported: 6, resolved: 5 },
                  { day: 'Sun', reported: 4, resolved: 4 },
                ]
              ).map((item, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-1 flex-1">
                  <div className="flex items-end space-x-1 h-16">
                    <div
                      style={{ height: `${Math.max(20, item.reported * 4)}%` }}
                      className="w-2.5 bg-slate-300 rounded-t-sm"
                    />
                    <div
                      style={{ height: `${Math.max(20, item.resolved * 4)}%` }}
                      className="w-2.5 bg-emerald-500 rounded-t-sm"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-slate-300 rounded-sm" />
                <span>Reports</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                <span>Closures</span>
              </div>
            </div>
          </div>

          {/* Smart Triaging Queue with Auto-Escalation */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-900">
              <span>Smart Triaging Queue ({triageQueue.length})</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                AI Auto-Ranked
              </span>
            </div>

            <div className="space-y-2.5">
              {triageQueue.map((item) => {
                const isHighHazard = item.priority === 'High';

                return (
                  <div
                    key={item._id || item.ticketId}
                    onClick={() => openWorkstation(item)}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2.5"
                  >
                    {/* Safety Auto-Escalation Badge */}
                    {isHighHazard && (
                      <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 p-1.5 rounded-xl border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        <span>Public Safety Auto-Escalated (Priority 1)</span>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.ticketId}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 font-mono">
                        {item.location?.ward || 'Ward 151'}
                      </span>
                      <span className="font-bold text-emerald-600 flex items-center space-x-1">
                        <span>Launch Diagnostic Workstation</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW B: DIAGNOSTIC & DISPATCH WORKSTATION                */}
      {/* ======================================================== */}
      {activeView === 'workstation' && (
        <div className="space-y-4">
          {!inspectedTicket ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              Select an issue from the queue to launch the Diagnostic Workstation.
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Ticket Header & Back Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('command')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Return to Command Queue</span>
                </button>
                <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-md">
                  {inspectedTicket.ticketId}
                </span>
              </div>

              {/* Side-by-Side Analysis Panel (View B) */}
              {/* Panel 1: Original Media with Computer-Vision Bounding Overlay */}
              <div className="bg-slate-950 text-white rounded-3xl p-4 border border-slate-800 shadow-md space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    [1] AI COMPUTER-VISION OVERLAY
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    {inspectedTicket.confidence}% Confidence
                  </span>
                </div>

                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700">
                  <img
                    src={inspectedTicket.imageUrl}
                    alt="Citizen Media"
                    className="w-full h-full object-cover"
                  />
                  {/* Augmented Damage Boundary Box */}
                  <div className="absolute inset-8 border-2 border-red-500 bg-red-500/10 rounded-lg flex items-start justify-between p-1.5 pointer-events-none">
                    <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                      DEFECT_BOUND: {inspectedTicket.category.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-slate-950/80 text-red-400 px-1 py-0.5 rounded">
                      SEVERITY: {inspectedTicket.priority}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  <span className="font-bold text-white">Target Authority:</span>{' '}
                  {inspectedTicket.department}
                </div>
              </div>

              {/* Panel 2: Sub-Meter GIS Telemetry & Nearest Maintenance Units */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span>[2] GIS Sub-Meter Proximity Units</span>
                  <span className="text-emerald-600 font-mono text-[10px]">
                    {inspectedTicket.location?.lat?.toFixed(5)}° N, {inspectedTicket.location?.lng?.toFixed(5)}° E
                  </span>
                </div>

                <div className="space-y-2">
                  {MAINTENANCE_UNITS.map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedUnit.id === unit.id
                          ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{unit.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Lead: {unit.squadLeader} • ETA: {unit.eta}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {unit.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3: Automated Action Recommendation Engine */}
              <div className="bg-slate-900 text-white rounded-3xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-amber-400 font-black uppercase">
                    [3] ACTION RECOMMENDATION ENGINE
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    RECOMMENDED
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-1">
                  <div className="font-bold text-xs text-amber-300">
                    Deploy {selectedUnit.name}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Estimated fix time: <span className="font-bold text-white">2.0 Hours</span>. Unit is closest with matched equipment specs.
                  </p>
                </div>

                {/* 1-Tap Field Dispatch Action */}
                {inspectedTicket.status === 'reported' && (
                  <button
                    onClick={() => handleDispatchUnit(inspectedTicket, 'assigned')}
                    disabled={actionPending === inspectedTicket._id}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all min-h-[46px]"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {actionPending ? 'Deploying...' : `Confirm & Dispatch ${selectedUnit.name}`}
                    </span>
                  </button>
                )}

                {inspectedTicket.status === 'assigned' && (
                  <button
                    onClick={() => handleDispatchUnit(inspectedTicket, 'in_progress')}
                    disabled={actionPending === inspectedTicket._id}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all min-h-[46px]"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Mark Unit Active on Site (In Progress)</span>
                  </button>
                )}

                {inspectedTicket.status === 'in_progress' && (
                  <button
                    onClick={() => handleDispatchUnit(inspectedTicket, 'resolved')}
                    disabled={actionPending === inspectedTicket._id}
                    className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all min-h-[46px]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Field Proof & Certify Closure</span>
                  </button>
                )}

                {verificationSuccess && (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 text-xs font-bold text-center">
                    ✅ Resolution Verified! Visual proof-of-work sent to citizen.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
