import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  VideoOff,
  Check,
  RefreshCw,
  Crosshair,
  Sparkles,
  MapPin,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';

export const CameraCapture = ({
  userLocation,
  onConfirmPhoto,
  presets = [],
  onSelectPreset,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // Data URL or URL
  const [capturedFile, setCapturedFile] = useState(null); // File object for Multer upload
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      stopLiveStream();
    };
  }, []);

  // 1. Start Live Browser Camera Stream (Webcam / Live Viewfinder)
  const startLiveStream = async (facing = cameraFacing) => {
    try {
      setCameraError(null);
      stopLiveStream();

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
      setStreamActive(true);
      setCapturedImage(null);
      setCapturedFile(null);
    } catch (err) {
      console.warn('Live camera stream error:', err);
      setCameraError(
        'Unable to access live webcam. You can use the Native Device Camera or Gallery button below.'
      );
      setStreamActive(false);
    }
  };

  // Stop live video stream
  const stopLiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  // Flip front / rear camera
  const handleFlipCamera = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    if (streamActive) {
      startLiveStream(next);
    }
  };

  // 2. Capture frame from live video feed
  const handleShutterCapture = () => {
    if (!videoRef.current) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    // Convert dataUrl to File object for Multer backend upload
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `defect-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          setCapturedFile(file);
        }
      },
      'image/jpeg',
      0.9
    );

    stopLiveStream();
  };

  // 3. Handle Native Mobile Camera or Gallery File Selection
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setCapturedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        stopLiveStream();
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    // Restart camera or open picker
    startLiveStream();
  };

  // 5. Confirm photo
  const handleConfirm = () => {
    if (capturedImage) {
      onConfirmPhoto({
        previewUrl: capturedImage,
        file: capturedFile,
      });
    }
  };

  // Select demo preset
  const handleSelectPreset = (preset) => {
    stopLiveStream();
    setCapturedImage(preset.image);
    setCapturedFile(null); // Preset uses online URL
    if (onSelectPreset) {
      onSelectPreset(preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden rasterization canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden HTML5 Native Mobile Camera capture */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Hidden Gallery file picker */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Location Status Bar */}
      <div className="bg-slate-900 text-slate-200 px-3 py-2 rounded-2xl flex items-center justify-between text-xs border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold truncate text-[11px]">
            {userLocation?.ward || userLocation?.address || 'GPS Calibrated'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
          {userLocation?.lat?.toFixed(4)}°, {userLocation?.lng?.toFixed(4)}°
        </span>
      </div>

      {/* Main Camera Viewport & Preview Frame */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
        {/* Shutter Flash Animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 transition-opacity duration-150 pointer-events-none" />
        )}

        {/* 1. Live Video Stream */}
        {streamActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* 2. Captured Image Preview */}
        {!streamActive && capturedImage && (
          <img
            src={capturedImage}
            alt="Defect Preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* 3. Standby / Empty Viewfinder State */}
        {!streamActive && !capturedImage && (
          <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-emerald-400">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Camera Standby</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tap "Open Camera" to capture defect or "Gallery" to upload.
              </p>
            </div>
          </div>
        )}

        {/* Augmented Reticle Overlay on Live Stream */}
        {streamActive && (
          <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300 border border-amber-500/30">
                LIVE VIEW
              </span>
              <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                FRAME_LOCK
              </span>
            </div>

            <div className="self-center border-2 border-dashed border-emerald-400/70 w-44 h-32 rounded-2xl flex flex-col items-center justify-center bg-emerald-500/5">
              <Crosshair className="w-7 h-7 text-emerald-400 animate-pulse stroke-[1.5]" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 mt-1 uppercase tracking-wider bg-slate-950/70 px-2 py-0.5 rounded">
                Center Defect
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                OPTICAL ACTIVE
              </span>
            </div>
          </div>
        )}

        {/* Live Stream Shutter Controls */}
        {streamActive && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-5 z-40">
            {/* Flip Camera */}
            <button
              onClick={handleFlipCamera}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              title="Flip Camera"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Shutter Button */}
            <button
              onClick={handleShutterCapture}
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-emerald-500/30"
              title="Capture Photo"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors" />
            </button>

            {/* Close Live Camera */}
            <button
              onClick={stopLiveStream}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-rose-400 rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              title="Stop Camera"
            >
              <VideoOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Selected Image Preview Badge */}
        {!streamActive && capturedImage && (
          <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3" />
            <span>Image Ready</span>
          </div>
        )}
      </div>

      {/* Camera Permission Alert */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-start space-x-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{cameraError}</span>
        </div>
      )}

      {/* Action Buttons: Open Camera / Device Cam / Gallery / Retake / Confirm */}
      {!streamActive && !capturedImage && (
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Open Live In-Browser Camera */}
          <button
            onClick={() => startLiveStream()}
            className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          {/* 2. Mobile Device Native Camera (capture="environment") */}
          <button
            onClick={() => nativeCameraInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md border border-slate-700 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Device Cam</span>
          </button>

          {/* 3. Upload from Gallery */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm active:scale-95 transition-all"
          >
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>Gallery</span>
          </button>
        </div>
      )}

      {/* Preview Confirmation Controls: Retake vs Confirm */}
      {!streamActive && capturedImage && (
        <div className="grid grid-cols-2 gap-2">
          {/* Retake Button */}
          <button
            onClick={handleRetake}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm Photo</span>
          </button>
        </div>
      )}

      {/* 5 SRS Demo Presets (Pothole, Garbage, Water Leak, Streetlight, Drain) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Or Test with SRS Demo Presets</span>
          <span className="text-[10px] text-slate-400 font-normal">1-Tap Verification</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleSelectPreset(preset)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all bg-white hover:bg-slate-50 border-slate-200 text-slate-700 active:scale-95 shadow-sm"
            >
              <span className="text-base">{preset.icon}</span>
              <span className="text-[10px] mt-1 leading-tight truncate w-full font-bold">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
