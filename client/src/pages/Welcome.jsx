import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Shield, User, Building2, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();
  const { setUserRole } = useCivic();

  const handleSelectRole = (role) => {
    setUserRole(role);
    if (role === 'citizen') {
      navigate('/auth/citizen');
    } else {
      navigate('/auth/authority');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between p-4 max-w-md mx-auto space-y-6">
      {/* 1. Official Government Header */}
      <div className="text-center space-y-3 pt-4">
        {/* State/Municipal Emblem Placeholder */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-black text-xl shadow-md">
          SS
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            MUNICIPAL CIVIC INTELLIGENCE PLATFORM
          </span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5">
            SEVASNAP
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 leading-relaxed">
            AI-powered public defect intake, automated departmental triage, and certified resolution tracking.
          </p>
        </div>
      </div>

      {/* 2. Role Selection Architecture (Citizen vs Authority) */}
      <div className="space-y-3.5">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Select Your Role to Continue
          </span>
        </div>

        {/* Option A: Continue as Citizen */}
        <div
          onClick={() => handleSelectRole('citizen')}
          className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group active:scale-[0.99]"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              Citizen Portal
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
              Continue as Citizen
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Report public problems (potholes, garbage, water leaks), follow real-time progress, and endorse local civic fixes.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Enter Citizen Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Option B: Continue as Authority */}
        <div
          onClick={() => handleSelectRole('authority')}
          className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group active:scale-[0.99]"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
              🏛 Municipal Authority
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors">
              Continue as Authority
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              For designated municipal officers & field squads. Triage complaints, deploy maintenance units, and certify repairs.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Enter Official Workstation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Government Security & Trust Footer */}
      <div className="pt-4 border-t border-slate-200 text-center space-y-1">
        <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Government-Grade Secure Role Verification</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Bruhat Bengaluru Mahanagara Palike (BBMP) & Civic Intelligence Network
        </p>
      </div>
    </div>
  );
};
