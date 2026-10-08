import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Sparkles, Shield, Clock, AlertTriangle, CheckCircle, ArrowLeft, Send } from 'lucide-react';

export const AiAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submitIssue } = useCivic();

  const draft = location.state?.draft;
  const aiResult = location.state?.aiResult;

  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // If no draft is loaded, fallback redirect
  if (!draft || !aiResult) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <p className="text-sm text-slate-600">No active AI scan data found.</p>
        <button
          onClick={() => navigate('/report')}
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Return to Camera HUD
        </button>
      </div>
    );
  }

  const handleConfirmAndDispatch = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: `${aiResult.categoryName} Detected`,
        category: aiResult.category,
        categoryName: aiResult.categoryName,
        description: draft.description || aiResult.description,
        imageUrl: draft.imageUrl,
        location: draft.location,
        priority: aiResult.severity,
        confidence: aiResult.confidence,
        department: aiResult.department,
      };

      const res = await submitIssue(payload);

      if (res.duplicateWarning) {
        setDuplicateWarning(res.duplicateWarning);
      }

      // Navigate to tracking for this new ticket
      navigate(`/tracking?ticket=${res.issue.ticketId}`);
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/report')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Vision Sentinel Triaged</span>
        </div>
      </div>

      {/* Scanned Image Preview with Neural Overlay */}
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
        <img
          src={draft.imageUrl}
          alt="Scanned Defect"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
          <div className="text-white">
            <span className="text-[10px] font-mono uppercase bg-emerald-500/80 text-slate-950 font-bold px-2 py-0.5 rounded-md">
              NEURAL TENSOR VERIFIED
            </span>
            <h3 className="text-base font-black mt-1">{aiResult.categoryName}</h3>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (SRS SCR-03) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Metric 1: Defect Category */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Defect Category
          </span>
          <div className="font-bold text-slate-900 text-sm">{aiResult.categoryName}</div>
        </div>

        {/* Metric 2: Hazard Severity */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Hazard Severity
          </span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                aiResult.severity === 'High'
                  ? 'bg-red-500 animate-ping'
                  : aiResult.severity === 'Medium'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
            />
            <span className="font-bold text-slate-900 text-sm">{aiResult.severity} Risk</span>
          </div>
        </div>

        {/* Metric 3: Certainty Score */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Certainty Score
          </span>
          <div className="font-bold text-emerald-600 text-sm font-mono">
            {aiResult.confidence}% Confidence
          </div>
        </div>

        {/* Metric 4: Resolution SLA */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Target SLA Window
          </span>
          <div className="font-bold text-slate-900 text-sm flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{aiResult.sla || 'Under 4 hours'}</span>
          </div>
        </div>
      </div>

      {/* Target Municipal Authority Routing Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Assigned Municipal Authority</span>
        </div>
        <div className="text-sm font-bold text-emerald-400">{aiResult.department}</div>
        <div className="text-[11px] text-slate-400">
          Dispatches directly to Zonal Quick-Response Field Engineering Unit ({draft.location.ward}).
        </div>
      </div>

      {/* Duplicate detection warning banner if present */}
      {duplicateWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <div className="font-bold">Nearby Duplicate Flagged</div>
            <div className="text-[11px] mt-0.5">{duplicateWarning.message}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleConfirmAndDispatch}
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px]"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Dispatching Ticket...' : 'Confirm & Dispatch Ticket'}</span>
        </button>

        <button
          onClick={() => navigate('/report')}
          className="w-full py-2.5 px-4 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold rounded-2xl text-xs"
        >
          Retake Photo / Cancel
        </button>
      </div>
    </div>
  );
};
