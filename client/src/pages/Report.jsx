import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Camera, Image, Crosshair, MapPin, Sparkles, Check, AlertCircle } from 'lucide-react';

const DEMO_PRESETS = [
  {
    key: 'pothole',
    label: 'Pothole',
    icon: '🕳️',
    title: 'Severe Road Pothole',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Deep road surface crater causing commuter disruption and vehicular hazard.',
  },
  {
    key: 'garbage',
    label: 'Waste Dump',
    icon: '🗑️',
    title: 'Overflowing Waste Dump',
    image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    description: 'Municipal garbage dumpster overflowing onto public sidewalk.',
  },
  {
    key: 'water_leak',
    label: 'Water Leak',
    icon: '💧',
    title: 'Water Pipeline Burst',
    image: 'https://images.unsplash.com/photo-1585687508687-32127fa289fe?auto=format&fit=crop&w=800&q=80',
    description: 'Pressurized water pipe rupture with high volume water loss.',
  },
  {
    key: 'streetlight',
    label: 'Streetlight',
    icon: '💡',
    title: 'Broken Streetlight',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    description: 'Public streetlight non-functional creating dangerous dark zone.',
  },
  {
    key: 'drainage',
    label: 'Clogged Drain',
    icon: '🌊',
    title: 'Clogged Storm Drain',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
    description: 'Drain inlet blocked with plastic silt causing stormwater pooling.',
  },
];

export const Report = () => {
  const navigate = useNavigate();
  const { userLocation, detectLocation, runAiAnalysis } = useCivic();

  const [selectedImage, setSelectedImage] = useState(DEMO_PRESETS[0].image);
  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0].key);
  const [description, setDescription] = useState(DEMO_PRESETS[0].description);
  const [isLockingGps, setIsLockingGps] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const fileInputRef = useRef(null);

  // Handle local camera or gallery file upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target.result);
        setSelectedPreset(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select demo preset (SRS FR-1.3)
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.key);
    setSelectedImage(preset.image);
    setDescription(preset.description);
  };

  // Re-detect GPS lock
  const handleRelockGps = async () => {
    setIsLockingGps(true);
    await detectLocation();
    setTimeout(() => setIsLockingGps(false), 800);
  };

  // Submit to AI Sentinel analysis and proceed
  const handleAnalyzeAndProceed = async () => {
    setAnalyzing(true);
    try {
      const result = await runAiAnalysis({
        image: selectedImage,
        location: userLocation,
        description,
        presetKey: selectedPreset,
      });

      // Pass report draft to AI Analysis screen via navigation state
      navigate('/ai-analysis', {
        state: {
          draft: {
            imageUrl: selectedImage,
            location: userLocation,
            description,
            presetKey: selectedPreset,
          },
          aiResult: result,
        },
      });
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Camera Intake HUD</h2>
          <p className="text-xs text-slate-500">Optical capture & municipal ward lock</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
          HUD Active
        </div>
      </div>

      {/* 1. Camera Viewport with Reticle Overlay (SRS FR-1.1) */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-xl group">
        <img
          src={selectedImage}
          alt="Defect Viewport"
          className="w-full h-full object-cover opacity-90"
        />

        {/* Simulated Camera HUD Reticle & Corner Brackets */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          {/* Top Reticle */}
          <div className="flex justify-between items-start">
            <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
            <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 tracking-wider border border-emerald-500/40">
              OPTICAL_SCAN // READY
            </div>
            <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
          </div>

          {/* Center Crosshair Target */}
          <div className="self-center flex items-center justify-center">
            <div className="w-14 h-14 border border-emerald-400/60 rounded-full flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-emerald-400 opacity-80 animate-pulse" />
            </div>
          </div>

          {/* Bottom Reticle */}
          <div className="flex justify-between items-end">
            <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
            <div className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700">
              {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
            </div>
            <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />
          </div>
        </div>

        {/* Capture / Upload overlay triggers */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-900/90 text-white rounded-xl hover:bg-slate-800 backdrop-blur-md border border-slate-700 active:scale-95 transition-transform"
            aria-label="Upload from gallery"
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

      {/* 2. Diagnostic Demo Presets (SRS FR-1.3) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Diagnostic Test Presets (1-Tap Demo)</span>
          <span className="text-slate-400 font-normal">SRS FR-1.3</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                selectedPreset === preset.key
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

      {/* 3. Geolocation Auto-Lock Card (SRS FR-2.1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Municipal Ward Resolution</span>
          </div>
          <button
            onClick={handleRelockGps}
            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLockingGps ? 'animate-spin' : ''}`} />
            <span>Re-lock</span>
          </button>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-900">{userLocation.ward}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
            GPS Locked
          </span>
        </div>
      </div>

      {/* 4. Description input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700">Citizen Observation Notes</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe defect context or street landmark..."
          className="w-full text-xs p-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
        />
      </div>

      {/* 5. Trigger AI Sentinel Triage CTA */}
      <button
        onClick={handleAnalyzeAndProceed}
        disabled={analyzing}
        className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[48px]"
      >
        <Sparkles className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
        <span>{analyzing ? 'AI Sentinel Analyzing...' : 'Analyze with AI Sentinel'}</span>
      </button>
    </div>
  );
};
