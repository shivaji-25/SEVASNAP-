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
  Search,
  Database,
  ChevronDown,
  ChevronUp,
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

  // Municipal Audit Trail search & status filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('all');
  const [expandedAuditId, setExpandedAuditId] = useState(null);

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

  // Filtered issues for Official Municipal Audit Trail
  const filteredAuditIssues = issues.filter((item) => {
    const query = auditSearch.toLowerCase().trim();
    const matchSearch =
      !query ||
      item.ticketId?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query) ||
      item.department?.toLowerCase().includes(query) ||
      item.categoryName?.toLowerCase().includes(query) ||
      item.location?.ward?.toLowerCase().includes(query);

    const matchStatus =
      auditStatusFilter === 'all' || item.status === auditStatusFilter;

    return matchSearch && matchStatus;
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
          resolvedBy: `${authorityUser.name} (${authorityUser.employeeId})`,
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

      {/* 5. Official Municipal Audit Trail & Compliance Ledger */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Official Municipal Audit Trail
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-widest rounded-full uppercase border border-emerald-300">
                  AUDIT_VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Immutable chronological event ledger & compliance record
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {filteredAuditIssues.length} Records
            </span>
          </div>
        </div>

        {/* Audit Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search Ticket ID (SEVA-...), Ward, Dept, or Issue..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'reported', label: 'Reported' },
              { id: 'assigned', label: 'Dispatched' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAuditStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all ${
                  auditStatusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Ledger Records */}
        <div className="space-y-2">
          {filteredAuditIssues.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 font-medium">
              No matching records found in municipal audit register.
            </div>
          ) : (
            filteredAuditIssues.map((issue) => {
              const isExpanded = expandedAuditId === (issue._id || issue.ticketId);
              const events = issue.timeline && issue.timeline.length > 0
                ? issue.timeline
                : [
                    {
                      status: 'reported',
                      title: 'Complaint Logged & Geotagged',
                      detail: `Citizens reported issue in ${issue.location?.ward || 'Koramangala Ward'}.`,
                      time: issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : 'Recent',
                      badge: 'CITIZEN_INTAKE',
                    },
                    ...(issue.status === 'assigned' || issue.status === 'in_progress' || issue.status === 'resolved'
                      ? [
                          {
                            status: 'assigned',
                            title: 'Zonal Unit Dispatched',
                            detail: `Routed to ${issue.department || 'Civic Operations'}.`,
                            time: issue.assignedAt ? new Date(issue.assignedAt).toLocaleString() : 'In Progress',
                            badge: 'SQUAD_ROUTED',
                          },
                        ]
                      : []),
                    ...(issue.status === 'in_progress' || issue.status === 'resolved'
                      ? [
                          {
                            status: 'in_progress',
                            title: 'Field Operations Active',
                            detail: 'Crews operating on-site.',
                            time: issue.workStartedAt ? new Date(issue.workStartedAt).toLocaleString() : 'Active',
                            badge: 'CREW_ACTIVE',
                          },
                        ]
                      : []),
                    ...(issue.status === 'resolved'
                      ? [
                          {
                            status: 'resolved',
                            title: 'Resolution Certified by Authority',
                            detail: issue.resolvedTimeReadable || issue.resolutionNotes || 'Visual proof validated.',
                            time: issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : 'Certified',
                            badge: 'CLOSED_VERIFIED',
                          },
                        ]
                      : []),
                  ];

              return (
                <div
                  key={issue._id || issue.ticketId}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {issue.ticketId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            issue.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : issue.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : issue.status === 'assigned'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {issue.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {issue.priority} Priority
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-800">
                        {issue.title || issue.categoryName || 'Civic Grievance'}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
                        <span>🏛️ {issue.department}</span>
                        <span>📍 {issue.location?.ward || 'Bangalore Urban'}</span>
                        {issue.resolvedTimeReadable && (
                          <span className="text-emerald-700 font-bold">
                            ⏱️ Resolved: {issue.resolvedTimeReadable}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() =>
                          setExpandedAuditId(
                            isExpanded ? null : (issue._id || issue.ticketId)
                          )
                        }
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Audit Log' : 'Inspect Audit Chain'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => navigate('/authority')}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                        title="Open in Authority Workstation"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Timeline Chain */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 space-y-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Chronological Immutable Event History</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {events.length} State Transitions Logged
                        </span>
                      </div>

                      <div className="space-y-2 border-l-2 border-slate-300 pl-3 ml-1.5">
                        {events.map((evt, idx) => (
                          <div key={idx} className="relative space-y-0.5">
                            <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white ring-1 ring-slate-300" />
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-800">
                                {evt.title}
                              </span>
                              {evt.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-bold">
                                  {evt.badge}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                {evt.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{evt.detail}</p>
                          </div>
                        ))}
                      </div>

                      {/* Evidence Photo Thumbnails */}
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-3">
                        {issue.imageUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Intake Photo
                            </span>
                            <img
                              src={issue.imageUrl}
                              alt="Intake"
                              className="w-20 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                            />
                          </div>
                        )}
                        {issue.resolvedImageUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                              Proof of Work (Resolved)
                            </span>
                            <img
                              src={issue.resolvedImageUrl}
                              alt="Proof of Work"
                              className="w-20 h-16 object-cover rounded-lg border border-emerald-300 shadow-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
