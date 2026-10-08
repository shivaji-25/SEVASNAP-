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
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const Authority = () => {
  const { issues, advanceIssueStatus } = useCivic();
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionPending, setActionPending] = useState(null);

  // Fetch telemetry from backend
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getAuthorityStats();
      setStatsData(data);
    } catch (err) {
      console.warn('Authority stats fallback to live issues count:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [issues]);

  // Derived counts from current issues
  const totalWorkload = issues.length;
  const pendingIntake = issues.filter((i) => i.status === 'reported').length;
  const activeSquads = issues.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length;
  const certifiedClosed = issues.filter((i) => i.status === 'resolved').length;

  // Active triage queue (tickets needing field dispatch action)
  const triageQueue = issues.filter((i) => i.status !== 'resolved');

  // Handle 1-tap field dispatch action (SRS FR-6.4)
  const handleDispatchAction = async (issue, actionType) => {
    setActionPending(issue._id);
    try {
      if (actionType === 'assign') {
        await advanceIssueStatus(issue._id, 'assigned', {
          title: 'Squad Dispatched',
          detail: 'Municipal Field Squad KA-01-EA-1904 assigned to Koramangala sector.',
          badge: 'Crew Dispatched',
        });
      } else if (actionType === 'deploy') {
        await advanceIssueStatus(issue._id, 'in_progress', {
          title: 'Repair In Progress',
          detail: 'Field crew on site executing high-pressure road/waste repair.',
          badge: 'Crew Active',
        });
      } else if (actionType === 'certify') {
        await advanceIssueStatus(issue._id, 'resolved', {
          title: 'Resolution Certified',
          detail: 'Zonal Inspector verified repair quality & certified closure.',
          badge: 'Official Certified',
          resolvedImageUrl:
            'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
        });
      }
      fetchStats();
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <span>Authority Field Console</span>
          </h2>
          <p className="text-xs text-slate-500">BBMP / Municipal Operations Command</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. 4 Telemetry Stat Cards (SRS FR-6.1) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Workload</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black">{totalWorkload}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Active Ward Tickets</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Intake</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingIntake}</div>
          <div className="text-[10px] text-amber-600 font-semibold">Awaiting Field Triage</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Squads</span>
            <Truck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeSquads}</div>
          <div className="text-[10px] text-blue-600 font-semibold">In Field Operations</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 space-y-1 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Certified Closed</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{certifiedClosed}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Resolved with Evidence</div>
        </div>
      </div>

      {/* 3. 7-Day Velocity Chart (SRS FR-6.2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            7-Day Velocity: Reports vs Closures
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
            98.2% SLA Compliance
          </span>
        </div>

        {/* CSS Bar Chart */}
        <div className="flex items-end justify-between h-28 pt-4 pb-1 px-1 border-b border-slate-100">
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
            <div key={idx} className="flex flex-col items-center space-y-1.5 flex-1">
              <div className="flex items-end space-x-1 h-20">
                {/* Reported Bar */}
                <div
                  style={{ height: `${Math.max(15, item.reported * 4)}%` }}
                  className="w-2.5 bg-slate-300 rounded-t-sm"
                  title={`${item.reported} Reported`}
                />
                {/* Resolved Bar */}
                <div
                  style={{ height: `${Math.max(15, item.resolved * 4)}%` }}
                  className="w-2.5 bg-emerald-500 rounded-t-sm"
                  title={`${item.resolved} Resolved`}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{item.day}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-4 text-[10px] font-semibold text-slate-500 pt-1">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" />
            <span>Citizen Reports</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
            <span>Resolved Closures</span>
          </div>
        </div>
      </div>

      {/* 4. Rapid Triage Queue (SRS FR-6.4: 1-Tap Field Dispatch Actions) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Rapid Field Dispatch Queue ({triageQueue.length})</span>
          <span className="text-[10px] text-slate-500">1-Tap Deployment</span>
        </div>

        <div className="space-y-2.5">
          {triageQueue.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-xs text-emerald-800 font-bold">
              🎉 All civic reports in this ward are certified resolved!
            </div>
          ) : (
            triageQueue.map((item) => (
              <div
                key={item._id || item.ticketId}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                        {item.ticketId}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 truncate">
                        {item.categoryName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {item.department} • <span className="font-semibold text-slate-700">{item.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === 'High'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>

                {/* 1-Tap Action Buttons based on current status */}
                <div className="flex space-x-2 pt-1 border-t border-slate-100">
                  {item.status === 'reported' && (
                    <button
                      onClick={() => handleDispatchAction(item, 'assign')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Assign Squad</span>
                    </button>
                  )}

                  {item.status === 'assigned' && (
                    <button
                      onClick={() => handleDispatchAction(item, 'deploy')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Crew (In Progress)</span>
                    </button>
                  )}

                  {item.status === 'in_progress' && (
                    <button
                      onClick={() => handleDispatchAction(item, 'certify')}
                      disabled={actionPending === item._id}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-1 min-h-[40px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Certify & Close</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
