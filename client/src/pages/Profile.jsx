import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import {
  User,
  Shield,
  Award,
  ThumbsUp,
  Clock,
  CheckCircle2,
  LogOut,
  ArrowRight,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, userRole, setUserRole, logout, issues, myIssues, upvotedTickets, userLocation } = useCivic();

  const isGov = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  // Citizen profile fallback if not logged in
  const citizenUser = user && user.role === 'citizen' ? user : {
    name: user?.name || 'Aarav Sharma',
    phone: user?.phone || '+91 98450 12345',
    email: user?.email || 'citizen.aarav@sevasnap.in',
    ward: userLocation?.ward || 'Ward 151, Koramangala',
    karmaPoints: 340,
    badge: 'Civic Sentinel (Gold)',
  };

  const upvotedCount = Object.values(upvotedTickets || {}).filter(Boolean).length;
  const resolvedCount = (myIssues || []).filter((i) => i.status === 'resolved').length;

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Citizen Civic Passport Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Civic Passport</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
            ID: CIVIC-9921
          </span>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            {citizenUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-tight truncate">
              {citizenUser.name}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{citizenUser.ward}</span>
            </div>
            <div className="text-[10px] text-emerald-300 font-bold mt-1">
              🏆 {citizenUser.badge} • {citizenUser.karmaPoints} Civic Karma
            </div>
          </div>
        </div>

        {/* Civic Impact Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-emerald-400">{myIssues ? myIssues.length : 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Reports
            </div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-amber-400">{upvotedCount || 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Endorsed
            </div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60">
            <div className="text-base font-black text-blue-400">{resolvedCount}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Fixed in Ward
            </div>
          </div>
        </div>
      </div>



      {/* 3. My Recent Reported Civic Complaints */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            My Reported Issues
          </h3>
          <span className="text-[10px] font-bold text-slate-500">
            {myIssues ? myIssues.length : 0} Tickets
          </span>
        </div>

        <div className="space-y-2">
          {!myIssues || myIssues.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <p className="text-xs text-slate-500 font-medium">You haven't reported any civic complaints yet.</p>
              <button
                onClick={() => navigate('/report')}
                className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Report your first issue →
              </button>
            </div>
          ) : (
            myIssues.slice(0, 5).map((item) => (
              <div
                key={item._id || item.ticketId}
                onClick={() => navigate(`/tracking?ticket=${item.ticketId}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
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
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="text-[10px] font-mono text-slate-500">{item.ticketId} • {item.priority} Priority</div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Citizen Quick Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-2 text-xs font-bold">
        <button
          onClick={() => navigate('/report')}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-between active:scale-95 transition-all"
        >
          <span>📸 Snap a New Civic Issue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/map')}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl flex items-center justify-between active:scale-95 transition-all"
        >
          <span>🗺️ View Ward Defect Map</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {user && (
          <button
            onClick={() => {
              logout();
              navigate('/welcome');
            }}
            className="w-full py-2.5 px-4 text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center gap-1.5 transition-colors mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of SEVASNAP</span>
          </button>
        )}
      </div>
    </div>
  );
};
