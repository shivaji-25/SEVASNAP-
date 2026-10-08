import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { ThumbsUp, MapPin, Clock, ArrowRight } from 'lucide-react';

export const IssueCard = ({ issue }) => {
  const navigate = useNavigate();
  const { toggleUpvote, upvotedTickets, setCurrentIssue } = useCivic();

  const isUpvoted = Boolean(upvotedTickets[issue.ticketId]);

  const priorityStyles = {
    High: 'bg-red-500/10 text-red-600 border-red-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const statusStyles = {
    reported: 'bg-slate-100 text-slate-700',
    assigned: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  };

  const formatStatus = (s) => {
    if (s === 'in_progress') return 'In Progress';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

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
      className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] cursor-pointer flex flex-col space-y-3"
    >
      {/* Top Meta: Ticket ID & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
            {issue.ticketId}
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              priorityStyles[issue.priority] || priorityStyles.Medium
            }`}
          >
            {issue.priority} Priority
          </span>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            statusStyles[issue.status] || statusStyles.reported
          }`}
        >
          {formatStatus(issue.status)}
        </span>
      </div>

      {/* Main Content: Thumbnail + Info */}
      <div className="flex space-x-3">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
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
        </div>

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
              {issue.title}
            </h3>
            <p className="text-slate-500 text-xs line-clamp-2 mt-0.5 leading-relaxed">
              {issue.description || 'Civic infrastructure defect flagged by citizen report.'}
            </p>
          </div>

          <div className="flex items-center text-slate-400 text-[11px] space-x-1 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{issue.location?.ward || 'Ward 151'}</span>
            <span>•</span>
            <span className="font-medium text-emerald-600 flex-shrink-0">
              {issue.location?.distance || 'Nearby'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Upvote action & View Tracking */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={handleUpvote}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[38px] ${
            isUpvoted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-emerald-600 text-emerald-600' : ''}`} />
          <span>{issue.upvotes || 0}</span>
          <span className="font-normal text-[11px] text-slate-500">Endorsements</span>
        </button>

        <span className="text-xs font-medium text-slate-500 flex items-center space-x-1 group-hover:text-emerald-600">
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
