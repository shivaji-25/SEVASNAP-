import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { ThumbsUp, MapPin, ArrowRight, CheckCircle2, Clock, Sparkles, Truck } from 'lucide-react';

export const IssueCard = ({ issue }) => {
  const navigate = useNavigate();
  const { toggleUpvote, upvotedTickets, setCurrentIssue } = useCivic();

  const isUpvoted = Boolean(upvotedTickets[issue.ticketId]);

  const priorityStyles = {
    High: 'bg-red-500/10 text-red-600 border-red-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  // Map 4 stages to micro-timeline step index:
  // 0: Submitted | 1: AI Verified | 2: Dispatched | 3: Resolved
  const getStepIndex = (status) => {
    switch (status) {
      case 'resolved':
        return 3;
      case 'in_progress':
      case 'assigned':
        return 2;
      case 'reported':
      default:
        return 1; // Submitted & AI Verified
    }
  };

  const currentStep = getStepIndex(issue.status);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolved', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'in_progress':
        return { label: 'Dispatched (In Progress)', class: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'assigned':
        return { label: 'Dispatched (Squad Assigned)', class: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'reported':
      default:
        return { label: 'AI Verified', class: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  const badge = getStatusBadge(issue.status);

  const handleCardClick = () => {
    setCurrentIssue(issue);
    navigate(`/tracking?ticket=${issue.ticketId}`);
  };

  const handleUpvote = (e) => {
    e.stopPropagation();
    toggleUpvote(issue._id, issue.ticketId);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col space-y-3.5"
    >
      {/* 1. Header: Ticket ID, Priority Pill & Live Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200/60 shadow-xs">
            {issue.ticketId}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              priorityStyles[issue.priority] || priorityStyles.Medium
            }`}
          >
            {issue.priority} Risk
          </span>
        </div>

        <span
          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.class}`}
        >
          {badge.label}
        </span>
      </div>

      {/* 2. Media & Details */}
      <div className="flex space-x-3.5">
        {/* High-Resolution Media Thumbnail */}
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-xs">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
            }}
          />
          {issue.confidence && (
            <span className="absolute bottom-1 right-1 bg-slate-950/80 backdrop-blur-sm text-[9px] font-mono font-bold text-blue-400 px-1 py-0.5 rounded">
              {issue.confidence}% AI
            </span>
          )}
        </div>

        {/* Content Info */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
              {issue.title}
            </h3>
            <p className="text-slate-500 text-xs line-clamp-2 mt-0.5 leading-relaxed">
              {issue.description || 'Public civic infrastructure defect verified by AI Sentinel.'}
            </p>
          </div>

          {/* Human-Readable Geocoded Location */}
          <div className="flex items-center text-slate-500 text-[11px] space-x-1.5 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate font-semibold text-slate-700">
              {issue.location_name || issue.location?.location_name || issue.location?.address || issue.location?.ward || 'Street Location'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Visual Micro-Timeline (Submitted -> AI Verified -> Dispatched -> Resolved) */}
      <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 px-0.5">
          <span className={currentStep >= 0 ? 'text-slate-900 font-black' : ''}>Submitted</span>
          <span className={currentStep >= 1 ? 'text-blue-700 font-black' : ''}>AI Verified</span>
          <span className={currentStep >= 2 ? 'text-amber-700 font-black' : ''}>Dispatched</span>
          <span className={currentStep >= 3 ? 'text-emerald-700 font-black' : ''}>Resolved</span>
        </div>

        {/* Stepper Dots & Track */}
        <div className="relative flex items-center justify-between">
          <div className="absolute left-1 right-1 h-1 bg-slate-200 rounded-full -z-0" />
          <div
            className="absolute left-1 h-1 bg-blue-600 rounded-full transition-all duration-300 -z-0"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />

          {[0, 1, 2, 3].map((step) => {
            const isDone = step <= currentStep;
            return (
              <div
                key={step}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all z-10 ${
                  isDone
                    ? 'bg-blue-600 border-white shadow-xs ring-1 ring-blue-600'
                    : 'bg-white border-slate-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Footer: 1-Tap Endorsements & Details CTA */}
      <div className="pt-1 flex items-center justify-between">
        <button
          onClick={handleUpvote}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[40px] active:scale-95 cursor-pointer ${
            isUpvoted
              ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-blue-600 text-blue-600' : ''}`} />
          <span className="font-bold">{issue.upvotes || 0}</span>
          <span className="text-[11px] font-normal text-slate-500">Endorsements</span>
        </button>

        <span className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors">
          <span>Inspect Trail</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
