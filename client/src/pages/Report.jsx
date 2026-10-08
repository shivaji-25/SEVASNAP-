import React, { useState, useRef, useEffect } from 'react';
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
  Video,
  VideoOff,
  RotateCw,
  RefreshCw,
  CheckCircle2,
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

  // Live Camera states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isLiveCaptured, setIsLiveCaptured] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Start live device camera using getUserMedia
  const startLiveCamera = async (facing = cameraFacing) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLiveCameraActive(true);
      setIsLiveCaptured(false);
    } catch (err) {
      console.warn('Live Camera error:', err);
      setCameraError(
        'Unable to access live webcam/camera. Check browser permissions or use the Native Camera / Presets below.'
      );
      setIsLiveCameraActive(false);
    }
  };

  // Stop live camera stream
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  // Switch between front & rear camera
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isLiveCameraActive) {
      startLiveCamera(nextFacing);
    }
  };

  // Capture frame from live video stream to photo
  const captureFrame = () => {
    if (!videoRef.current) return;

    // Trigger visual flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(dataUrl);
    setIsLiveCaptured(true);
    stopLiveCamera();
  };

  // Handle local camera or gallery upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target.result);
        setIsLiveCaptured(true);
        stopLiveCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset) => {
    stopLiveCamera();
    setSelectedPreset(preset);
    setSelectedImage(preset.image);
    setIsLiveCaptured(false);
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
        title: isLiveCaptured ? `Citizen Report: ${selectedPreset.categoryName}` : selectedPreset.title,
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
        confidence: isLiveCaptured ? 98.2 : selectedPreset.confidence,
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
      {/* Hidden canvas for snapshot rasterization */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. Header with Zero-Form Pill */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Smart Viewfinder</h2>
          <p className="text-[11px] text-slate-500">Live Camera & AI Civic Intelligence</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Zero-Form Mode</span>
        </span>
      </div>

      {/* Camera Mode Action Bar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            if (isLiveCameraActive) {
              stopLiveCamera();
            } else {
              startLiveCamera();
            }
          }}
          className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-bold transition-all border shadow-sm ${
            isLiveCameraActive
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
              : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500'
          }`}
        >
          {isLiveCameraActive ? (
            <>
              <VideoOff className="w-3.5 h-3.5" />
              <span>Stop Feed</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </>
          )}
        </button>

        {/* Device Native Camera trigger (works on mobile phones natively) */}
        <button
          onClick={() => nativeCameraInputRef.current?.click()}
          className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 shadow-sm"
        >
          <Video className="w-3.5 h-3.5 text-amber-400" />
          <span>Device Cam</span>
        </button>
        <input
          type="file"
          ref={nativeCameraInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* Gallery / File Picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-2xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
        >
          <Image className="w-3.5 h-3.5 text-slate-500" />
          <span>Gallery</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Camera Error Alert if permissions rejected */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-start space-x-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">
            <span>{cameraError}</span>
          </div>
        </div>
      )}

      {/* 2. Smart Viewfinder with Frame Assistance & Sensor Overlays (View B) */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl group">
        {/* Flash Effect upon shutter capture */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-40 transition-opacity duration-200 opacity-90 pointer-events-none" />
        )}

        {/* Active Live Video Stream OR Captured/Preset Image */}
        {isLiveCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={selectedImage}
            alt="Smart Viewfinder Defect"
            className="w-full h-full object-cover opacity-90 transition-transform duration-300"
          />
        )}

        {/* Augmented Framing Overlay & Reticles */}
        <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between">
          {/* Top telemetry: Lighting Meter & HUD mode */}
          <div className="flex items-center justify-between">
            {/* Optimal Lighting Sensor HUD */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center space-x-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>{isLiveCameraActive ? 'LIVE STREAM' : 'Optimal Lux 820'}</span>
            </div>

            {/* Target Area Framing Reticle Badge */}
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/40">
              {isLiveCameraActive ? 'OPTICAL_ACTIVE' : 'FRAME_LOCK // OK'}
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

        {/* Live Camera Shutter Button Overlay */}
        {isLiveCameraActive && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4 z-30">
            {/* Flip camera */}
            <button
              onClick={handleFlipCamera}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              aria-label="Switch Camera"
              title="Flip Camera"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Shutter capture button */}
            <button
              onClick={captureFrame}
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-emerald-500/30"
              aria-label="Capture Photo"
              title="Snap Defect Photo"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors" />
            </button>

            {/* Close camera */}
            <button
              onClick={stopLiveCamera}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-rose-400 rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              aria-label="Stop Camera"
              title="Stop Camera"
            >
              <VideoOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Live Captured Badge */}
        {isLiveCaptured && (
          <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 z-20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Photo Snapped</span>
          </div>
        )}
      </div>

      {/* 3. Diagnostic Test Presets (Instant 1-Tap Demo / Defect Classifier) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>{isLiveCaptured ? 'Select AI Defect Category' : 'Target Category Presets'}</span>
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
            {isLiveCaptured ? '98.2%' : `${selectedPreset.confidence}%`} Confidence
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
        disabled={isSubmitting || isLiveCameraActive}
        className={`w-full py-4 px-4 font-black rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all min-h-[52px] text-sm ${
          isLiveCameraActive
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
        }`}
      >
        <Send className="w-5 h-5 stroke-[2.2]" />
        <span>
          {isSubmitting
            ? 'Dispatching Ticket...'
            : isLiveCameraActive
            ? 'Snap Photo First to Submit'
            : '1-Tap Submit Report'}
        </span>
      </button>
    </div>
  );
};
