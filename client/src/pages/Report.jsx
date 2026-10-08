import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import {
  Camera,
  Image,
  Crosshair,
  MapPin,
  Sparkles,
  Sun,
  Compass,
  Check,
  AlertTriangle,
  ArrowRight,
  Send,
} from 'lucide-react';

const DIAGNOSTIC_PRESETS = [
  {
    key: 'pothole',
    label: 'Pothole',
    icon: '🕳️',
    title: 'Asphalt Pothole Crater',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Pothole',
    severity: 'High',
    confidence: 97.4,
    department: 'Roads & Infrastructure Department',
    description: 'Dangerous road crater with exposed aggregate causing vehicular axle shock.',
  },
  {
    key: 'garbage',
    label: 'Waste Dump',
    icon: '🗑️',
    title: 'Overflowing Waste Dump',
    image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Solid Waste Dump',
    severity: 'Medium',
    confidence: 96.2,
    department: 'Solid Waste Management (SWM)',
    description: 'Municipal garbage dumpster overflowing onto public footway.',
  },
  {
    key: 'water_leak',
    label: 'Water Leak',
    icon: '💧',
    title: 'Pressurized Pipe Rupture',
    image: 'https://images.unsplash.com/photo-1585687508687-32127fa289fe?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Water Main Burst',
    severity: 'High',
    confidence: 98.7,
    department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
    description: 'Pressurized drinking water pipeline burst eroding surface tarmac.',
  },
  {
    key: 'streetlight',
    label: 'Streetlight',
    icon: '💡',
    title: 'Defective Streetlight Pole',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Damaged Streetlight',
    severity: 'Low',
    confidence: 94.1,
    department: 'Electricity Supply Company (BESCOM)',
    description: 'Overhead luminaire failure creating dark pedestrian vulnerability.',
  },
  {
    key: 'drainage',
    label: 'Clogged Drain',
    icon: '🌊',
    title: 'Clogged Stormwater Drain',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Clogged Storm Drain',
    severity: 'High',
    confidence: 95.8,
    department: 'Stormwater Drain Department',
    description: 'Debris blockage preventing active monsoon surface drainage.',
  },
];

export const Report = () => {
  const navigate = useNavigate();
  const { userLocation, detectLocation, submitIssue } = useCivic();

  const [selectedPreset, setSelectedPreset] = useState(DIAGNOSTIC_PRESETS[0]);
  const [selectedImage, setSelectedImage] = useState(DIAGNOSTIC_PRESETS[0].image);
  const [isLockingGps, setIsLockingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Handle local camera or gallery upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setSelectedImage(preset.image);
  };

  // Re-detect GPS lock
  const handleRelockGps = async () => {
    setIsLockingGps(true);
    await detectLocation();
    setTimeout(() => setIsLockingGps(false), 600);
  };

  // Zero-Form 1-Tap Submission
  const handleOneTapSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: selectedPreset.title,
        category: selectedPreset.key,
        categoryName: selectedPreset.categoryName,
        description: selectedPreset.description,
        imageUrl: selectedImage,
        location: {
          address: userLocation.address,
          ward: userLocation.ward,
          lat: userLocation.lat,
          lng: userLocation.lng,
          distance: 'At Reporting Location',
        },
        priority: selectedPreset.severity,
        confidence: selectedPreset.confidence,
        department: selectedPreset.department,
      };

      const res = await submitIssue(payload);
      navigate(`/tracking?ticket=${res.issue.ticketId}`);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 1. Header with Zero-Form Pill */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Smart Viewfinder</h2>
          <p className="text-[11px] text-slate-500">Augmented Capture & AI Context Lock</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Zero-Form Mode</span>
        </span>
      </div>

      {/* 2. Smart Viewfinder with Frame Assistance & Sensor Overlays (View B) */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl group">
        <img
          src={selectedImage}
          alt="Smart Viewfinder Defect"
          className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Augmented Framing Overlay & Reticles */}
        <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between">
          {/* Top telemetry: Lighting Meter & HUD mode */}
          <div className="flex items-center justify-between">
            {/* Optimal Lighting Sensor HUD */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center space-x-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Optimal Lux 820</span>
            </div>

            {/* Target Area Framing Reticle Badge */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/40">
              FRAME_LOCK // OK
            </div>

            {/* Gyro Level Sensor */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700 flex items-center space-x-1">
              <Compass className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>0.2° Horizon</span>
            </div>
          </div>

          {/* Augmented Center Bounding Box Target */}
          <div className="self-center flex flex-col items-center justify-center">
            <div className="w-48 h-32 border-2 border-dashed border-emerald-400/80 rounded-2xl flex flex-col items-center justify-center relative bg-emerald-500/5">
              <Crosshair className="w-8 h-8 text-emerald-400 animate-pulse stroke-[1.5]" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 mt-1 uppercase tracking-wider bg-slate-950/70 px-2 py-0.5 rounded">
                Defect Target Centered
              </span>
            </div>
          </div>

          {/* Bottom GPS Micro-Location Overlay */}
          <div className="flex items-center justify-between">
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-200 border border-slate-700 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>
                {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
              </span>
            </div>

            <span className="text-[9px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
              GPS SUB-METER LOCK
            </span>
          </div>
        </div>

        {/* Gallery / Camera input button */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-900/90 text-white rounded-xl hover:bg-slate-800 backdrop-blur-md border border-slate-700 active:scale-95 transition-transform"
            aria-label="Upload custom image"
          >
            <Image className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* 3. Diagnostic Test Presets (Instant 1-Tap Demo) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Target Category Presets</span>
          <span className="text-slate-400 font-normal text-[11px]">Instant Context Tag</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {DIAGNOSTIC_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                selectedPreset.key === preset.key
                  ? 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-md font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{preset.icon}</span>
              <span className="text-[10px] mt-1 leading-tight truncate w-full">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Real-Time Auto-Populated Context Card (Zero Manual Typing) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">
            Real-Time AI Verification Metadata
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {selectedPreset.confidence}% Confidence
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Category</span>
            <span className="font-bold text-slate-900">{selectedPreset.categoryName}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Severity Score</span>
            <span
              className={`font-black ${
                selectedPreset.severity === 'High' ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              {selectedPreset.severity} Priority
            </span>
          </div>
        </div>

        {/* Display-verified street address */}
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Display-Verified Location
            </span>
            <div className="font-bold text-slate-900 mt-0.5">{userLocation.ward}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
            </div>
          </div>
          <button
            onClick={handleRelockGps}
            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 p-2"
          >
            {isLockingGps ? 'Locking...' : 'Re-lock'}
          </button>
        </div>

        <div className="text-[11px] text-slate-500">
          Target Authority: <span className="font-semibold text-slate-700">{selectedPreset.department}</span>
        </div>
      </div>

      {/* 5. One-Tap Confirmation Action (Zero-Form Reporting) */}
      <button
        onClick={handleOneTapSubmit}
        disabled={isSubmitting}
        className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[52px] text-sm"
      >
        <Send className="w-5 h-5 stroke-[2.2]" />
        <span>{isSubmitting ? 'Dispatching Ticket...' : '1-Tap Submit Report'}</span>
      </button>
    </div>
  );
};
