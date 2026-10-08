import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import * as api from '../services/api';
import {
  getProximityUnitsForCategory,
  getStageMetaForCategory,
  normalizeTimelineEvent,
} from '../utils/defectWorkflows';
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

export const Authority = () => {
  const navigate = useNavigate();
  const { issues, advanceIssueStatus, refreshIssues, userRole, setUserRole, user } = useCivic();
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionPending, setActionPending] = useState(null);

  // Active view mode: 'command' (View A: Prioritized Command Center) | 'workstation' (View B: Diagnostic & Dispatch Workstation)
  const [activeView, setActiveView] = useState('command');
  const [inspectedTicket, setInspectedTicket] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
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
    refreshIssues?.();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [issues]);

  // Keep inspected ticket in sync with context issues
  useEffect(() => {
    if (inspectedTicket) {
      const fresh = issues.find(
        (i) => (i._id && i._id === inspectedTicket._id) || (i.ticketId && i.ticketId === inspectedTicket.ticketId)
      );
      if (fresh && fresh.status !== inspectedTicket.status) {
        setInspectedTicket(fresh);
      }
    }
  }, [issues, inspectedTicket]);

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

  // Open Diagnostic Workstation for an issue with problem-tailored proximity units
  const openWorkstation = (issue) => {
    setInspectedTicket(issue);
    const units = getProximityUnitsForCategory(issue?.category);
    setSelectedUnit(units[0]);
    setActiveView('workstation');
    setVerificationSuccess(false);
  };

  // 1-Tap Field Dispatch Execution with Category-Specific Equipment and Problem Workflow
  const handleDispatchUnit = async (issue, targetStatus) => {
    setActionPending(issue._id || issue.ticketId);
    const availableUnits = getProximityUnitsForCategory(issue?.category);
    const unit =
      selectedUnit && availableUnits.some((u) => u.id === selectedUnit.id)
        ? selectedUnit
        : availableUnits[0];

    try {
      const categoryMeta = getStageMetaForCategory(issue.category, targetStatus, user);

      const meta = {
        assigned: {
          ...categoryMeta,
          title: `Dispatched ${unit.name}`,
          detail: `Assigned ${unit.squadLeader} (${unit.distance}). Estimated fix time: ${unit.fixTime || '1.5 Hours'}. ${unit.reason || ''}`,
          badge: 'Squad Deployed',
        },
        in_progress: {
          ...categoryMeta,
          title: `${unit.name} on Location`,
          detail: `Active engineering crew operating ${unit.equipment || 'specialized machinery'} at verified coordinates.`,
          badge: 'Crew Active',
        },
        resolved: {
          ...categoryMeta,
          title: categoryMeta.title || 'Visual Proof Certified',
          detail: categoryMeta.detail || 'Before/after photographic proof validated. Citizen notified & record certified closed.',
          badge: categoryMeta.badge || 'Official Certified',
          resolvedBy: unit.squadLeader || categoryMeta.resolvedBy || 'Zonal Engineering Unit',
          resolvedImageUrl: categoryMeta.resolvedImageUrl,
        },
      };

      await advanceIssueStatus(issue._id, targetStatus, meta[targetStatus]);
      setInspectedTicket((prev) => ({
        ...prev,
        status: targetStatus,
        timeline: [
          ...(prev?.timeline || []),
          {
            status: targetStatus,
            title: meta[targetStatus]?.title || 'Status Updated',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detail: meta[targetStatus]?.detail || '',
            badge: meta[targetStatus]?.badge || 'Updated',
          },
        ],
      }));
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
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-3.5">
      {/* 0. Operations Console Bar with Quick Switch to Citizen Portal */}
      <div className="flex items-center justify-between text-[11px] bg-slate-900 text-slate-200 px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">Authority Workstation</span>
          <span className="text-slate-400 text-[10px]">({triageQueue.length} Active)</span>
        </div>
        <button
          onClick={() => {
            setUserRole('citizen');
            navigate('/');
          }}
          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer text-[11px]"
        >
          <span>Citizen Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Header with Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>BBMP Zonal Operations</span>
          </h2>
          <p className="text-[11px] text-slate-500">Zonal Engineering & Field Dispatch</p>
        </div>

        {/* View Switcher: Command Center vs Diagnostic Workstation */}
        <div className="flex bg-slate-200/90 p-0.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveView('command')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'command'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Command ({triageQueue.length})
          </button>
          <button
            onClick={() => {
              if (!inspectedTicket && triageQueue.length > 0) {
                setInspectedTicket(triageQueue[0]);
              }
              setActiveView('workstation');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
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
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
                          }}
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
      {activeView === 'workstation' && (() => {
        const currentTicket = inspectedTicket || triageQueue[0] || issues[0];

        if (!currentTicket) {
          return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              No active civic tickets available to diagnose.
            </div>
          );
        }

        const currentUnits = getProximityUnitsForCategory(currentTicket?.category);
        const activeSelectedUnit =
          selectedUnit && currentUnits.some((u) => u.id === selectedUnit.id)
            ? selectedUnit
            : currentUnits[0];

        return (
          <div className="space-y-3.5">
            {/* Horizontal Ticket Carousel / Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Quick Select Issue ({issues.length} Total)</span>
                <span className="text-blue-600 font-mono font-bold">1-Tap Switch</span>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {issues.map((item) => {
                  const isSelected =
                    (currentTicket._id || currentTicket.ticketId) === (item._id || item.ticketId);
                  return (
                    <button
                      key={item._id || item.ticketId}
                      onClick={() => {
                        setInspectedTicket(item);
                        const nextUnits = getProximityUnitsForCategory(item?.category);
                        setSelectedUnit(nextUnits[0]);
                        setVerificationSuccess(false);
                      }}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-2xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-[11px]">{item.ticketId}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          item.priority === 'High'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ticket Header & Back Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setActiveView('command')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Return to Command Queue</span>
              </button>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-md">
                  {currentTicket.ticketId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    currentTicket.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentTicket.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Side-by-Side Analysis Panel (View B) */}
            {/* Panel 1: Original Media with Computer-Vision Bounding Overlay */}
            <div className="bg-slate-950 text-white rounded-3xl p-4 border border-slate-800 shadow-md space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  [1] AI COMPUTER-VISION OVERLAY
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {currentTicket.confidence}% Confidence
                </span>
              </div>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700">
                <img
                  src={currentTicket.imageUrl}
                  alt="Citizen Media"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {/* Augmented Damage Boundary Box */}
                <div className="absolute inset-8 border-2 border-red-500 bg-red-500/10 rounded-lg flex items-start justify-between p-1.5 pointer-events-none">
                  <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                    DEFECT_BOUND: {currentTicket.category.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-slate-950/80 text-red-400 px-1 py-0.5 rounded">
                    SEVERITY: {currentTicket.priority}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="font-bold text-white">Target Authority:</span>{' '}
                {currentTicket.department}
              </div>
            </div>

              {/* Panel 2: Sub-Meter GIS Telemetry & Nearest Maintenance Units (Category-Specific) */}
              <div className="bg-white rounded-3xl p-4.5 border border-slate-200/90 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span>[2] GIS Sub-Meter Proximity Units</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 uppercase">
                      {currentTicket.categoryName || currentTicket.category}
                    </span>
                  </div>
                  <span className="text-blue-600 font-mono text-[10px] font-bold">
                    {currentTicket.location?.lat?.toFixed(5)}° N, {currentTicket.location?.lng?.toFixed(5)}° E
                  </span>
                </div>

                <div className="space-y-2">
                  {currentUnits.map((unit) => {
                    const isUnitSelected = activeSelectedUnit.id === unit.id;
                    return (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isUnitSelected
                            ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`font-bold text-xs truncate ${isUnitSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {unit.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                            Lead: {unit.squadLeader} • ETA: {unit.eta}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate font-medium">
                            Specs: {unit.equipment}
                          </div>
                        </div>
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-xl border shrink-0 transition-colors ${
                            isUnitSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {unit.distance}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel 3: Automated Action Recommendation Engine (Tailored specifically to the problem) */}
              <div className="bg-white rounded-3xl p-4.5 border border-slate-200/90 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                    [3] ACTION RECOMMENDATION ENGINE
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 rounded-full font-bold">
                    RECOMMENDED
                  </span>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 space-y-1.5">
                  <div className="font-bold text-xs text-blue-900">
                    Deploy {activeSelectedUnit.name}
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    Estimated fix time:{' '}
                    <span className="font-bold text-slate-900">
                      {activeSelectedUnit.fixTime || '1.5 Hours'}
                    </span>
                    . {activeSelectedUnit.reason}
                  </p>
                  <div className="text-[10px] text-blue-800 bg-white/90 border border-blue-200/60 rounded-lg px-2.5 py-1 font-semibold mt-1 inline-block">
                    Matched Equipment: {activeSelectedUnit.equipment}
                  </div>
                </div>

                {/* 1-Tap Field Dispatch Action */}
                {currentTicket.status === 'reported' && (
                  <button
                    onClick={() => handleDispatchUnit(currentTicket, 'assigned')}
                    disabled={actionPending === (currentTicket._id || currentTicket.ticketId)}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-500/25 transition-all min-h-[48px] cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {actionPending
                        ? 'Deploying Squad...'
                        : `Confirm & Dispatch ${activeSelectedUnit.name}`}
                    </span>
                  </button>
                )}

                {currentTicket.status === 'assigned' && (
                  <button
                    onClick={() => handleDispatchUnit(currentTicket, 'in_progress')}
                    disabled={actionPending === (currentTicket._id || currentTicket.ticketId)}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all min-h-[48px] cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Mark Unit Active on Site (In Progress)</span>
                  </button>
                )}

                {currentTicket.status === 'in_progress' && (
                  <button
                    onClick={() => handleDispatchUnit(currentTicket, 'resolved')}
                    disabled={actionPending === (currentTicket._id || currentTicket.ticketId)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all min-h-[48px] cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Field Proof & Certify Closure</span>
                  </button>
                )}

                {verificationSuccess && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-blue-900 text-xs font-bold text-center">
                    ✅ Resolution Verified! Visual proof-of-work sent to citizen.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };
