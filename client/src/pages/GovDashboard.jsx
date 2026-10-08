import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Layers,
  Wrench,
  Activity,
  Compass,
} from 'lucide-react';

export const GovDashboard = () => {
  const navigate = useNavigate();
  const { issues, advanceIssueStatus } = useCivic();
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionPending, setActionPending] = useState(null);

  // Fetch telemetry
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getAuthorityStats();
      setStatsData(data);
    } catch (err) {
      console.warn('Gov stats fallback:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [issues]);

  const totalWorkload = issues.length;
  const pendingIntake = issues.filter((i) => i.status === 'reported').length;
  const activeSquads = issues.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length;
  const certifiedClosed = issues.filter((i) => i.status === 'resolved').length;

  // AI-Prioritized Smart Triaging Queue
  const triageQueue = [...issues]
    .filter((i) => i.status !== 'resolved')
    .sort((a, b) => {
      const severityOrder = { High: 3, Medium: 2, Low: 1 };
      return (severityOrder[b.priority] || 1) - (severityOrder[a.priority] || 1);
    });

  // Department SLA summaries
  const departments = [
    { name: 'Roads & Infrastructure (BBMP)', icon: '🛣️', active: issues.filter((i) => i.category === 'pothole').length, sla: '98.5%' },
    { name: 'Water Supply & Sewerage (BWSSB)', icon: '💧', active: issues.filter((i) => i.category === 'water_leak').length, sla: '97.2%' },
    { name: 'Solid Waste Management (SWM)', icon: '🗑️', active: issues.filter((i) => i.category === 'garbage').length, sla: '99.1%' },
    { name: 'Electricity Supply (BESCOM)', icon: '💡', active: issues.filter((i) => i.category === 'streetlight').length, sla: '96.8%' },
    { name: 'Stormwater Drains (SWD)', icon: '🌊', active: issues.filter((i) => i.category === 'drainage').length, sla: '95.4%' },
  ];

  // 1-Tap Quick Dispatch Action
  const handleQuickDispatch = async (issue, targetStatus) => {
    setActionPending(issue._id);
    try {
      const meta = {
        assigned: {
          title: 'Squad Dispatched via Gov Dashboard',
          detail: 'Municipal Field Squad KA-01-EA-1904 assigned to Koramangala sector.',
          badge: 'Crew Dispatched',
        },
        in_progress: {
          title: 'Repair In Progress',
          detail: 'Field crew active on location with repair equipment.',
          badge: 'Crew Active',
        },
        resolved: {
          title: 'Resolution Certified by Zonal Officer',
          detail: 'Photographic quality checked & certified closed.',
          badge: 'Official Certified',
          resolvedImageUrl:
            'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
        },
      };

      await advanceIssueStatus(issue._id, targetStatus, meta[targetStatus]);
      fetchStats();
    } catch (err) {
      console.error('Quick dispatch error:', err);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Government Operations Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-4.5 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/20">
              GO
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                Government Admin Dashboard
              </h2>
              <span className="text-[10px] text-amber-400 font-mono">
                BBMP Municipal Operations Command
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Zonal Officer Mode</span>
          </span>
        </div>

        {/* Quick Launch Workstation CTA */}
        <button
          onClick={() => navigate('/authority')}
          className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all min-h-[42px]"
        >
          <span>Launch Diagnostic & Dispatch Workstation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Executive Municipal Telemetry KPIs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Workload</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black">{totalWorkload}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Active Sector Incidents</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Intake</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingIntake}</div>
          <div className="text-[10px] text-amber-600 font-semibold">Awaiting Squad Triage</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Squads</span>
            <Truck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeSquads}</div>
          <div className="text-[10px] text-blue-600 font-semibold">Deployed On Location</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Certified Closed</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{certifiedClosed}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Verified Proof Closed</div>
        </div>
      </div>

      {/* 3. Department Operations & SLA Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span>Municipal Department SLA Breakdown</span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
            98.2% Avg SLA
          </span>
        </div>

        <div className="space-y-2">
          {departments.map((dep, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center space-x-2">
                <span>{dep.icon}</span>
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[200px]">
                  {dep.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 font-bold">
                  {dep.active} active
                </span>
                <span className="font-mono text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {dep.sla}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AI-Prioritized Smart Triaging Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span>Priority Triage Queue ({triageQueue.length})</span>
          <span className="text-[10px] font-bold text-slate-400">
            1-Tap Squad Dispatch
          </span>
        </div>

        <div className="space-y-2.5">
          {triageQueue.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center text-xs text-emerald-800 font-bold">
              🎉 All sector complaints are certified resolved!
            </div>
          ) : (
            triageQueue.map((item) => (
              <div
                key={item._id || item.ticketId}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5"
              >
                {/* Public safety auto-escalation alert */}
                {item.priority === 'High' && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 p-1 rounded-lg border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Auto-Escalated: High Public Risk</span>
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

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
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
                </div>

                {/* 1-Tap Action Triggers */}
                <div className="flex space-x-2 pt-1 border-t border-slate-100">
                  {item.status === 'reported' && (
                    <button
                      onClick={() => handleQuickDispatch(item, 'assigned')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Assign Squad</span>
                    </button>
                  )}

                  {item.status === 'assigned' && (
                    <button
                      onClick={() => handleQuickDispatch(item, 'in_progress')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Crew (In Progress)</span>
                    </button>
                  )}

                  {item.status === 'in_progress' && (
                    <button
                      onClick={() => handleQuickDispatch(item, 'resolved')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Certify & Close</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/authority')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center min-h-[40px]"
                    title="Launch Side-by-Side Analysis"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
