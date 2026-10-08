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
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'pothole', name: 'Pothole' },
  { id: 'garbage', name: 'Garbage Dump' },
  { id: 'water_leak', name: 'Water Leak' },
  { id: 'streetlight', name: 'Streetlight' },
  { id: 'drainage', name: 'Clogged Drain' },
];

export const Home = () => {
  const navigate = useNavigate();
  const {
    issues,
    selectedCategory,
    setSelectedCategory,
    refreshIssues,
    loading,
    setCurrentIssue,
    userRole,
  } = useCivic();

  // Dual-Tab Architecture (View A: Executive Issue Ledger)
  const [ledgerTab, setLedgerTab] = useState('active'); // 'active' (Active Tracking) | 'resolved' (Resolved History)

  // Split into Active Tracking vs Resolved History
  const activeIssues = issues.filter((iss) => iss.status !== 'resolved');
  const resolvedIssues = issues.filter((iss) => iss.status === 'resolved');

  const displayedList = (ledgerTab === 'active' ? activeIssues : resolvedIssues).filter((iss) => {
    if (selectedCategory === 'all') return true;
    return iss.category === selectedCategory;
  });

  // Spotlight latest active issue
  const latestActive = activeIssues.length > 0 ? activeIssues[0] : null;

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Quick-Action Hero Banner: Primary "Report Civic Issue" with camera icon for effortless thumb reach */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-5 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Snap • Verify • Resolve
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
              Ward 151
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight leading-tight">
              Report Civic Issue
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Optical capture & real-time AI Sentinel verification. No tedious forms.
            </p>
          </div>

          <button
            onClick={() => navigate('/report')}
            className="flex items-center justify-center space-x-2.5 w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all min-h-[50px] text-sm"
          >
            <Camera className="w-5 h-5 stroke-[2.5]" />
            <span>Snap Defect with Smart Viewfinder</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Admin Command Link Banner (only when Gov Admin role is active) */}
      {userRole === 'admin' && (
        <div className="bg-gradient-to-r from-amber-950 to-slate-900 text-white rounded-3xl p-4 border border-amber-500/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase text-amber-400">
                Municipal Command Workstation
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
              Zonal Operator
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Access side-by-side computer-vision analysis, GIS proximity dispatch, and verification loop.
          </p>
          <button
            onClick={() => navigate('/authority')}
            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>Open AI-Prioritized Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Executive Issue Ledger Header & Dual-Tab Architecture */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Executive Issue Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500">Live civic defect lifecycle tracking</p>
          </div>

          <button
            onClick={() => refreshIssues()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
            aria-label="Refresh ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Dual-Tab Segmented Control (Active Tracking vs Resolved History) */}
        <div className="flex bg-slate-200/90 p-1 rounded-2xl w-full">
          <button
            onClick={() => setLedgerTab('active')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              ledgerTab === 'active'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Tracking ({activeIssues.length})</span>
          </button>

          <button
            onClick={() => setLedgerTab('resolved')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              ledgerTab === 'resolved'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved History ({resolvedIssues.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Swipeable Category Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
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
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">
              {ledgerTab === 'active' ? 'No active civic defects pending' : 'No resolved records in this category'}
            </h4>
            <p className="text-xs text-slate-400">
              {ledgerTab === 'active'
                ? 'All logged complaints in this sector are currently resolved.'
                : 'Resolved complaints will appear here with certified before/after photographic proof.'}
            </p>
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
