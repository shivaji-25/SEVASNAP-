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
  Info,
  X,
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
  const [showBanner, setShowBanner] = useState(true);

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
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-500/25">
              CP
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm font-black text-slate-900 leading-tight">
                  Citizen Portal
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {userLocation.ward || 'Ward 151, Koramangala'}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200/70 flex items-center gap-1 shadow-xs">
            <Shield className="w-3 h-3 text-blue-600" />
            <span>Civic Sentinel</span>
          </span>
        </div>

        {/* Citizen Impact Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70">
            <div className="text-lg font-black text-blue-600">{myIssues ? myIssues.length : 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">
              My Reports
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70">
            <div className="text-lg font-black text-slate-800">{upvotedCount || 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">
              Endorsements
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70">
            <div className="text-lg font-black text-emerald-600">{myResolvedCount}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">
              Fixed in Ward
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Info Alert Toast (Matching Figma UI Kit in Image 2) */}
      {showBanner && (
        <div className="bg-white rounded-2xl p-3.5 border border-blue-200/80 shadow-xs flex items-start space-x-3 text-slate-800 animate-in fade-in duration-200">
          <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              AI Vision Sentinel Connected
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Snap street defects with zero manual forms. AI routes coordinates directly to municipal maintenance crews.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Primary Action Hero: Snap Civic Defect */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-600/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white backdrop-blur-sm">
            Zero-Form Camera Capture
          </span>
          <span className="text-[10px] font-mono text-blue-100">
            AI Triage in 1.2s
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black tracking-tight leading-tight">
            Spot a Defect on Your Street?
          </h3>
          <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
            Snap optical photo & lock GPS. AI routes directly to the municipal maintenance squad.
          </p>
        </div>

        <button
          onClick={() => navigate('/report')}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-blue-700 font-black rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px] text-xs cursor-pointer"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span>Launch Smart Viewfinder</span>
        </button>
      </div>

      {/* 4. Civic Defect Ledger */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Civic Defect Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500">Track community & personal issues</p>
          </div>

          <button
            onClick={() => refreshIssues()}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs active:scale-95 transition-transform cursor-pointer"
            aria-label="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Scope Switcher: My Complaints vs Neighborhood Feed */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full border border-slate-200/80">
          <button
            onClick={() => setScopeFilter('my')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              scopeFilter === 'my'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Complaints ({myIssues ? myIssues.length : 0})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ward Public Feed ({issues.length})
          </button>
        </div>

        {/* Dual Tab Switcher: Active Tracking vs Resolved History */}
        <div className="flex bg-slate-100/70 p-1 rounded-2xl w-full border border-slate-200/80">
          <button
            onClick={() => setLedgerTab('active')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              ledgerTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
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
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved ({resolvedIssues.length})</span>
          </button>
        </div>
      </div>

      {/* 5. Category Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 6. Visual Status Cards Feed */}
      <div className="space-y-3.5">
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
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
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
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
