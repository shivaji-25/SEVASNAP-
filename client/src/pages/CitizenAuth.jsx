import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft, Shield, AlertCircle } from 'lucide-react';

export const CitizenAuth = () => {
  const navigate = useNavigate();
  const { loginCitizenUser, registerCitizenUser } = useCivic();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form fields (pre-filled with verified test credentials)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('citizen@sevasnap.gov');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('password123');
  const [profilePicture, setProfilePicture] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginCitizenUser(email, password);
      } else {
        await registerCitizenUser({
          name,
          email,
          phoneNumber,
          password,
          profilePicture,
        });
      }
      // Redirect to citizen home dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] p-4 max-w-md mx-auto space-y-5">
      {/* Back button & Role Pill */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/welcome')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Roles</span>
        </button>

        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-emerald-400 px-3 py-1 rounded-full shadow-sm">
          Citizen Portal
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Citizen Sign In' : 'Citizen Registration'}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === 'login'
            ? 'Access your reported issues and community civic feed.'
            : 'Register to report defects and endorse neighborhood improvements.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
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
          Sign In
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
          New Citizen Account
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start space-x-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* Demo Citizen Credentials Helper */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Citizen Login</span>
          </div>
          <div className="text-[10px] text-emerald-800 font-mono mt-0.5">
            citizen@sevasnap.gov &bull; password123
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setEmail('citizen@sevasnap.gov');
            setPassword('password123');
          }}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          Auto Fill
        </button>
      </div>

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
                placeholder="e.g., Arvind Kumar"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 block">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., citizen@example.com"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              required
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., +91 98765 43210"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>
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
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              required
            />
          </div>
        </div>

        {/* Profile Badge Preview */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Assigned Badge:</span>
          <span className="font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
            Citizen
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[46px] text-xs"
        >
          <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In as Citizen' : 'Create Citizen Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Guest / Demo shortcut */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
        >
          Continue as Guest Citizen (Read-Only)
        </button>
      </div>
    </div>
  );
};
