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
  Truck,
  CheckCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Defects' },
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

  const [viewMode, setViewMode] = useState('recent'); // Default to 'recent' for instant complaint visibility

  // The most recently logged complaint
  const latestComplaint = issues && issues.length > 0 ? issues[0] : null;

  // Sort and filter issues based on category & viewMode
  const filteredIssues = [...issues]
    .sort((a, b) => {
      if (viewMode === 'recent') {
        const dateA = new Date(a.createdAt || a.reportedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.reportedAt || 0).getTime();
        return dateB - dateA;
      }
      return 0; // default order
    })
    .filter((iss) => {
      if (selectedCategory === 'all') return true;
      return iss.category === selectedCategory;
    });

  const formatStatus = (s) => {
    if (!s) return 'Reported';
    if (s === 'in_progress') return 'In Progress';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const statusColor = (s) => {
    switch (s) {
      case 'assigned':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* ROLE BANNER: Differentiates Citizen (Raise) vs Government (Manage) */}
      {userRole === 'admin' ? (
        <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white rounded-3xl p-4 shadow-md border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Government Officer Portal
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              Admin Mode
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Review civic intake queue, dispatch zonal field engineering squads, and certify repairs.
          </p>

          <button
            onClick={() => navigate('/authority')}
            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all min-h-[42px]"
          >
            <span>Open Authority Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* 1. TOP SPOTLIGHT: Recently Logged Complaint Details */}
      {latestComplaint && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Latest Complaint Logged
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {latestComplaint.ticketId}
            </span>
          </div>

          {/* Defect Preview */}
          <div
            onClick={() => {
              setCurrentIssue(latestComplaint);
              navigate(`/tracking?ticket=${latestComplaint.ticketId}`);
            }}
            className="flex space-x-3 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              <img
                src={latestComplaint.imageUrl}
                alt={latestComplaint.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
                  {latestComplaint.title}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-2 mt-0.5 leading-relaxed">
                  {latestComplaint.description || 'Recent public defect reported by citizen.'}
                </p>
              </div>

              <div className="flex items-center text-slate-400 text-[11px] space-x-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{latestComplaint.location?.ward || 'Ward 151'}</span>
              </div>
            </div>
          </div>

          {/* Department & Status Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor(
                latestComplaint.status
              )}`}
            >
              {formatStatus(latestComplaint.status)}
            </span>

            <button
              onClick={() => {
                setCurrentIssue(latestComplaint);
                navigate(`/tracking?ticket=${latestComplaint.ticketId}`);
              }}
              className="flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 active:scale-95 transition-transform"
            >
              <span>{userRole === 'admin' ? 'Triage & Inspect' : 'Track Status'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. CITIZEN "RAISE COMPLAINT" HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-5 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Raise Civic Complaint
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight leading-tight">
              Report Public Problem
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Potholes, overflowing garbage, water leaks, or broken streetlights. Capture optical photo & lock GPS.
            </p>
          </div>

          <button
            onClick={() => navigate('/report')}
            className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all min-h-[48px]"
          >
            <Camera className="w-5 h-5" />
            <span className="text-sm">Snap & Raise Complaint</span>
          </button>
        </div>

        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Nearby vs Recent Toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full max-w-[240px]">
          <button
            onClick={() => setViewMode('recent')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'recent'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Complaints
          </button>
          <button
            onClick={() => setViewMode('nearby')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'nearby'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nearby (&lt;500m)
          </button>
        </div>

        <button
          onClick={() => refreshIssues()}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
          aria-label="Refresh feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* 4. Swipeable Category Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 5. Issue Feed Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>{filteredIssues.length} Complaints Registered</span>
        <span>Ward 151 Koramangala</span>
      </div>

      {/* 6. Complaint Cards Feed */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No complaints in this category</h4>
            <p className="text-xs text-slate-400">
              Be the first to report an issue in your ward using the camera.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => <IssueCard key={issue._id || issue.ticketId} issue={issue} />)
        )}
      </div>
    </div>
  );
};
