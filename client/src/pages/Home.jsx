import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { IssueCard } from '../components/IssueCard';
import { Camera, SlidersHorizontal, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

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
  const { issues, selectedCategory, setSelectedCategory, refreshIssues, loading } = useCivic();
  const [viewMode, setViewMode] = useState('nearby'); // 'nearby' | 'recent'

  // Filter issues based on category
  const filteredIssues = issues.filter((iss) => {
    if (selectedCategory === 'all') return true;
    return iss.category === selectedCategory;
  });

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Uber-style Quick Report Hero Banner (SRS SCR-01) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-5 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Live Civic Sentinel
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight leading-tight">
              Spot a public defect?
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Snap photo & lock GPS. AI Sentinel instantly triages to the municipal squad.
            </p>
          </div>

          <button
            onClick={() => navigate('/report')}
            className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all min-h-[48px]"
          >
            <Camera className="w-5 h-5" />
            <span className="text-sm">Snap Defect Now</span>
          </button>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Nearby (<500m) vs Recent toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full max-w-[240px]">
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
          <button
            onClick={() => setViewMode('recent')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'recent'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Active
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

      {/* 3. Swipeable Category Filter Chips */}
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

      {/* 4. Issue Feed Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>{filteredIssues.length} Reported Incidents</span>
        <span>Ward 151 Koramangala</span>
      </div>

      {/* 5. Issue Feed List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No defects in this category</h4>
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
