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
  Building2,
  Check,
  Award,
} from 'lucide-react';

const DEPARTMENTS = [
  { name: 'Roads Department', icon: '🛣️', filterKey: 'pothole', defaultSla: '98.5%' },
  { name: 'Sanitation Department', icon: '🗑️', filterKey: 'garbage', defaultSla: '99.1%' },
  { name: 'Water Supply Department', icon: '💧', filterKey: 'water_leak', defaultSla: '97.2%' },
  { name: 'Electrical Department', icon: '💡', filterKey: 'streetlight', defaultSla: '96.8%' },
  { name: 'Municipal Administration', icon: '🏛️', filterKey: 'admin', defaultSla: '98.9%' },
  { name: 'Emergency Response Unit', icon: '🚨', filterKey: 'drainage', defaultSla: '99.5%' },
];

export const GovDashboard = () => {
  const navigate = useNavigate();
  const { issues, advanceIssueStatus, user, logout, refreshIssues } = useCivic();
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionPending, setActionPending] = useState(null);

  // Authority profile defaults if not logged in with custom user
  const authorityUser = user && user.role === 'authority' ? user : {
    name: 'Er. Rajeshwar Rao',
    employeeId: 'BBMP-1042',
    officialEmail: 'r.rao@bbmp.gov.in',
    department: 'Roads Department',
    designation: 'Assistant Executive Engineer',
    wardRegion: 'Ward 151, Koramangala / South Zone',
    isVerifiedAuthority: true,
    badge: '🏛 Municipal Authority',
  };

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
    if (refreshIssues) refreshIssues();
    fetchStats();
  }, [refreshIssues]);

  // Key Counts for Authority Dashboard (SRS & Prompt requirements):
  // - Pending Issues
  // - Assigned Issues
  // - Resolved Issues
  // - Department Statistics
  const pendingIssues = issues.filter((i) => i.status === 'reported').length;
  const assignedIssues = issues.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length;
  const resolvedIssues = issues.filter((i) => i.status === 'resolved').length;
  const totalWorkload = issues.length;

  // AI-Prioritized Smart Triaging Queue
  const triageQueue = [...issues]
    .filter((i) => i.status !== 'resolved')
    .sort((a, b) => {
      const severityOrder = { High: 3, Medium: 2, Low: 1 };
      return (severityOrder[b.priority] || 1) - (severityOrder[a.priority] || 1);
    });

  // 1-Tap Quick Dispatch Action
  const handleQuickDispatch = async (issue, targetStatus) => {
    setActionPending(issue._id);
    try {
      const meta = {
        assigned: {
          title: 'Squad Dispatched via Gov Dashboard',
          detail: `Assigned under ${authorityUser.department} field unit.`,
          badge: 'Crew Dispatched',
        },
        in_progress: {
          title: 'Repair In Progress',
          detail: 'Field crew active on location with repair equipment.',
          badge: 'Crew Active',
        },
        resolved: {
          title: 'Resolution Certified by Zonal Officer',
          detail: `Photographic quality certified by ${authorityUser.name} (${authorityUser.employeeId}).`,
          badge: 'Official Certified',
          resolvedImageUrl:
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
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
      {/* 1. TOP: Official Verified Authority Profile Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-4.5 border border-slate-800 shadow-xl space-y-3.5 relative overflow-hidden">
        {/* Verification Banner */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span>🏛 Municipal Authority</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            {authorityUser.employeeId}
          </span>
        </div>

        {/* Official Details */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-black text-sm flex-shrink-0">
            {authorityUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-tight truncate">
              {authorityUser.name}
            </h2>
            <div className="text-xs font-bold text-amber-300 mt-0.5 truncate">
              {authorityUser.designation}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 truncate">
              {authorityUser.department}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Assigned Region: <span className="text-white font-medium">{authorityUser.wardRegion}</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Workstation CTA */}
        <button
          onClick={() => navigate('/authority')}
          className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all min-h-[42px]"
        >
          <span>Open Full Diagnostic & Dispatch Workstation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Key Status Counts (Pending, Assigned, Resolved, Total) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Pending Issues */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Pending</span>
          </div>
          <div className="text-xl font-black text-amber-600">{pendingIssues}</div>
          <div className="text-[9px] text-slate-500">Awaiting Triage</div>
        </div>

        {/* Assigned Issues */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase">
            <Truck className="w-3 h-3 text-blue-500" />
            <span>Assigned</span>
          </div>
          <div className="text-xl font-black text-blue-600">{assignedIssues}</div>
          <div className="text-[9px] text-slate-500">In Field Ops</div>
        </div>

        {/* Resolved Issues */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Resolved</span>
          </div>
          <div className="text-xl font-black text-emerald-600">{resolvedIssues}</div>
          <div className="text-[9px] text-slate-500">Proof Verified</div>
        </div>
      </div>

      {/* 3. Department Statistics */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span>Official Department Statistics</span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            98.4% Average SLA
          </span>
        </div>

        <div className="space-y-2">
          {DEPARTMENTS.map((dept, idx) => {
            const count = issues.filter((i) => i.category === dept.filterKey).length;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-base">{dept.icon}</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate max-w-[190px]">
                    {dept.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-500">
                    {count} open
                  </span>
                  <span className="font-mono text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {dept.defaultSla}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. AI-Prioritized Smart Triaging Queue with 1-Tap Field Dispatch */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span>Priority Triage Queue ({triageQueue.length})</span>
          <span className="text-[10px] font-bold text-slate-500">
            1-Tap Officer Action
          </span>
        </div>

        <div className="space-y-2.5">
          {triageQueue.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center text-xs text-emerald-800 font-bold">
              🎉 All regional complaints are certified resolved!
            </div>
          ) : (
            triageQueue.map((item) => (
              <div
                key={item._id || item.ticketId}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5"
              >
                {/* Public safety auto-escalation alert */}
                {item.priority === 'High' && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 p-1.5 rounded-xl border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Auto-Escalated: High Public Hazard</span>
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
