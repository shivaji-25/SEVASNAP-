import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { IssueCard } from '../components/IssueCard';
import {
  Camera,
  RefreshCw,
  AlertCircle,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ThumbsUp,
  Shield,
  Activity,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'pothole', name: 'Pothole' },
  { id: 'garbage', name: 'Garbage Dump' },
  { id: 'water_leak', name: 'Water Leak' },
  { id: 'streetlight', name: 'Streetlight' },
  { id: 'drainage', name: 'Clogged Drain' },
];

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const {
    issues,
    myIssues,
    selectedCategory,
    setSelectedCategory,
    refreshIssues,
    loading,
    userLocation,
    upvotedTickets,
  } = useCivic();

  // Dual-Tab Architecture (Active Tracking vs Resolved History)
  const [ledgerTab, setLedgerTab] = useState('active');
  // Scope filter: defaults to 'my' so citizen sees only their reported complaints
  const [scopeFilter, setScopeFilter] = useState('my'); // 'my' | 'all'

  const scopedIssues = scopeFilter === 'my' ? (myIssues || []) : issues;

  const activeIssues = scopedIssues.filter((iss) => iss.status !== 'resolved');
  const resolvedIssues = scopedIssues.filter((iss) => iss.status === 'resolved');

  const displayedList = (ledgerTab === 'active' ? activeIssues : resolvedIssues).filter((iss) => {
    if (selectedCategory === 'all') return true;
    return iss.category === selectedCategory;
  });

  const upvotedCount = Object.values(upvotedTickets || {}).filter(Boolean).length;
  const myResolvedCount = (myIssues || []).filter((i) => i.status === 'resolved').length;

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Citizen Civic Passport & Impact Score Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-4.5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-emerald-500/20">
              CP
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                Citizen Portal
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono">
                {userLocation.ward || 'Ward 151, Koramangala'}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Civic Sentinel</span>
          </span>
        </div>

        {/* Citizen Impact Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-emerald-400">{myIssues ? myIssues.length : 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              My Reports
            </div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-amber-400">{upvotedCount || 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Endorsements
            </div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-blue-400">{myResolvedCount}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Fixed in Ward
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Thumb-Reach "Report Civic Defect" Action Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-4.5 text-white shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
            Zero-Form Camera Capture
          </span>
          <span className="text-[10px] font-mono text-emerald-100">
            AI Triage in 1.2s
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black tracking-tight leading-tight">
            Spot a Defect on Your Street?
          </h3>
          <p className="text-xs text-emerald-50 mt-0.5 leading-relaxed">
            Snap optical photo & lock GPS. AI routes directly to the municipal maintenance squad.
          </p>
        </div>

        <button
          onClick={() => navigate('/report')}
          className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 text-emerald-400 font-black rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px] text-xs"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span>Launch Smart Viewfinder</span>
        </button>
      </div>

      {/* 3. Executive Issue Ledger (Dual-Tab Architecture) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Civic Defect Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500">Track community & personal issues</p>
          </div>

          <button
            onClick={() => refreshIssues()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform cursor-pointer"
            aria-label="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Scope Switcher: My Complaints vs Neighborhood Feed */}
        <div className="flex bg-slate-200/90 p-1 rounded-2xl w-full">
          <button
            onClick={() => setScopeFilter('my')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              scopeFilter === 'my'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Complaints ({myIssues ? myIssues.length : 0})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ward Public Feed ({issues.length})
          </button>
        </div>

        {/* Dual Tab Switcher: Active Tracking vs Resolved History */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full border border-slate-200">
          <button
            onClick={() => setLedgerTab('active')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              ledgerTab === 'active'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Active ({activeIssues.length})</span>
          </button>

          <button
            onClick={() => setLedgerTab('resolved')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              ledgerTab === 'resolved'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved ({resolvedIssues.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Category Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 5. Visual Status Cards Feed */}
      <div className="space-y-3.5">
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">
                {scopeFilter === 'my'
                  ? 'No Complaints Reported Yet'
                  : ledgerTab === 'active'
                  ? 'No active civic defects pending'
                  : 'No resolved records in this category'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {scopeFilter === 'my'
                  ? 'You haven\'t filed any civic complaints yet. Tap "Launch Smart Viewfinder" to snap defect photos on your street.'
                  : 'All complaints in this category have been addressed.'}
              </p>
            </div>
            {scopeFilter === 'my' && (
              <button
                onClick={() => navigate('/report')}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Snap Defect Photo</span>
              </button>
            )}
          </div>
        ) : (
          displayedList.map((issue) => (
            <IssueCard key={issue._id || issue.ticketId} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
};
