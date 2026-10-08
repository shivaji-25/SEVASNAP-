import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import {
  Building2,
  BadgeCheck,
  Lock,
  Mail,
  User,
  MapPin,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
} from 'lucide-react';

const DEPARTMENTS = [
  'Roads Department',
  'Sanitation Department',
  'Water Supply Department',
  'Electrical Department',
  'Municipal Administration',
  'Emergency Response Unit',
];

export const AuthorityAuth = () => {
  const navigate = useNavigate();
  const { loginAuthorityUser, registerAuthorityUser } = useCivic();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [employeeId, setEmployeeId] = useState('BBMP-1042');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState('Assistant Executive Engineer');
  const [wardRegion, setWardRegion] = useState('Ward 151, Koramangala');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginAuthorityUser(employeeId, password);
      } else {
        await registerAuthorityUser({
          name,
          employeeId,
          officialEmail,
          department,
          designation,
          wardRegion,
          password,
        });
      }
      // Redirect to authority command dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Official authentication failed. Verify Employee ID and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] p-4 max-w-md mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/welcome')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Roles</span>
        </button>

        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <span>🏛 Municipal Authority</span>
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Authority Official Sign In' : 'Authority Registration'}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === 'login'
            ? 'Sign in with your designated Employee ID to access the Operations Workstation.'
            : 'Register your municipal official credentials for verified authority access.'}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-200/90 p-1 rounded-2xl">
        <button
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            mode === 'login'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Official Login
        </button>
        <button
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            mode === 'register'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Register Authority
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start space-x-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3.5">
        {mode === 'register' && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Full Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Er. Rajeshwar Rao"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-medium"
                required
              />
            </div>
          </div>
        )}

        {/* Employee ID (Required for both Login & Register) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 block">Municipal Employee ID</label>
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
              placeholder="e.g., BBMP-1042 or KA-BLR-8492"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-mono font-bold"
              required
            />
          </div>
        </div>

        {mode === 'register' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Official Department Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="e.g., officer@bbmp.gov.in"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Municipal Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 bg-white font-medium"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Official Designation</label>
              <div className="relative flex items-center">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., Assistant Executive Engineer (AEE)"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Assigned Ward / Region</label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={wardRegion}
                  onChange={(e) => setWardRegion(e.target.value)}
                  placeholder="e.g., Ward 151, Koramangala / South Zone"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 block">Password</label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
              required
            />
          </div>
        </div>

        {/* Verification Badge Preview */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Official Clearance:</span>
          <span className="font-extrabold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300">
            🏛 Municipal Authority
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[46px] text-xs"
        >
          <span>{loading ? 'Verifying Official Credentials...' : mode === 'login' ? 'Verify & Sign In as Authority' : 'Register Official Authority Profile'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Credentials Hint */}
      <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">Quick Demo Clearance</span>
        <div className="text-[11px] font-mono text-slate-700">
          Employee ID: <span className="font-bold text-slate-900">BBMP-1042</span> • Password: <span className="font-bold text-slate-900">admin123</span>
        </div>
      </div>
    </div>
  );
};
