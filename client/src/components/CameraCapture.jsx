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
  Smartphone,
} from 'lucide-react';

export const CameraCapture = ({
  userLocation,
  onConfirmPhoto,
  presets = [],
  onSelectPreset,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null); // Stream in state for guaranteed React re-render
  const [capturedImage, setCapturedImage] = useState(null); // Data URL or URL
  const [capturedFile, setCapturedFile] = useState(null); // File object for Multer upload
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [cameraNotice, setCameraNotice] = useState(null);
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

  // Ensure video element srcObject is bound and playing whenever mediaStream changes
  useEffect(() => {
    if (videoRef.current && mediaStream && streamActive) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => console.warn('Video play on metadata:', e));
      };
      videoRef.current.play().catch((e) => console.warn('Video play immediate:', e));
    }
  }, [mediaStream, streamActive]);

  // Stop live video stream
  const stopLiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMediaStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // 1. Start Live Browser Camera Stream (or fallback to device camera if unavailable)
  const startLiveStream = async (facing = cameraFacing) => {
    setCameraNotice(null);

    // If browser doesn't support getUserMedia or is in insecure HTTP context
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported in this context. Launching native device camera...');
      setCameraNotice('Live stream unsupported in this browser/network. Opening native device camera...');
      nativeCameraInputRef.current?.click();
      return;
    }

    try {
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
      setMediaStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Autoplay error:', e));
        };
        videoRef.current.play().catch((playErr) => console.warn('Autoplay note:', playErr));
      }

      setStreamActive(true);
      setCapturedImage(null);
      setCapturedFile(null);
    } catch (err) {
      console.warn('Live camera access error:', err.message);
      setCameraNotice(
        'Camera permission was blocked or unavailable. Opening native device camera...'
      );
      setStreamActive(false);
      // Auto-fallback to native mobile camera
      nativeCameraInputRef.current?.click();
    }
  };

  // Launch Native Mobile Camera explicitly
  const openDeviceCamera = () => {
    stopLiveStream();
    setCameraNotice(null);
    nativeCameraInputRef.current?.click();
  };

  // Launch Gallery Picker explicitly
  const openGallery = () => {
    stopLiveStream();
    setCameraNotice(null);
    galleryInputRef.current?.click();
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
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

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
    // Reset input value so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  // 4. Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setCameraNotice(null);
    // Open camera again
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
    setCameraNotice(null);
    if (onSelectPreset) {
      onSelectPreset(preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden rasterization canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* HTML5 Native Mobile Camera capture (Hardware camera launch) */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* HTML5 Gallery file picker */}
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
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-bold truncate text-[11px]">
            {userLocation?.location_name || userLocation?.address || userLocation?.ward || 'GPS Calibrated'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 shrink-0">
          Verified Location
        </span>
      </div>

      {/* Main Camera Viewport & Preview Frame */}
      <div
        onClick={() => {
          if (!streamActive && !capturedImage) {
            startLiveStream();
          }
        }}
        className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center transition-all ${
          !streamActive && !capturedImage ? 'cursor-pointer hover:border-emerald-500/50' : ''
        }`}
      >
        {/* Shutter Flash Animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 transition-opacity duration-150 pointer-events-none" />
        )}

        {/* 1. Live Video Stream: ALWAYS rendered in DOM so ref is NEVER null */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
        />

        {/* 2. Captured Image Preview */}
        {!streamActive && capturedImage && (
          <img
            src={capturedImage}
            alt="Defect Preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* 3. Standby / Tap to Open Camera State */}
        {!streamActive && !capturedImage && (
          <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 select-none">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800 text-blue-400 shadow-xl shadow-blue-500/10 group-hover:scale-105 transition-transform">
              <Camera className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Tap to Open Camera</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Snap photo with phone camera or upload from gallery
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
              <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono text-blue-400 border border-blue-500/30">
                FRAME_LOCK
              </span>
            </div>

            <div className="self-center border-2 border-dashed border-blue-400/70 w-44 h-32 rounded-2xl flex flex-col items-center justify-center bg-blue-500/5">
              <Crosshair className="w-7 h-7 text-blue-400 animate-pulse stroke-[1.5]" />
              <span className="text-[9px] font-mono font-bold text-blue-300 mt-1 uppercase tracking-wider bg-slate-950/70 px-2 py-0.5 rounded">
                Center Defect
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFlipCamera();
              }}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              title="Flip Camera"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShutterCapture();
              }}
              className="w-16 h-16 rounded-full bg-white border-4 border-blue-600 shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-blue-500/30"
              title="Capture Photo"
            >
              <div className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors" />
            </button>

            {/* Close Live Camera */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                stopLiveStream();
              }}
              className="p-3 bg-slate-900/80 backdrop-blur-md text-rose-400 rounded-full border border-slate-700 hover:bg-slate-800 active:scale-95 transition-transform"
              title="Stop Camera"
            >
              <VideoOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Selected Image Ready Badge */}
        {!streamActive && capturedImage && (
          <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-500/30 flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3" />
            <span>Photo Ready</span>
          </div>
        )}
      </div>

      {/* Helpful Camera Notice/Alert */}
      {cameraNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-start space-x-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{cameraNotice}</span>
        </div>
      )}

      {/* Action Buttons: Device Cam / Live Viewfinder / Gallery */}
      {!streamActive && !capturedImage && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Mobile Device Hardware Camera (Always works on phones!) */}
            <button
              type="button"
              onClick={openDeviceCamera}
              className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-blue-100" />
              <span>Phone Cam</span>
            </button>

            {/* 2. Live In-Browser Viewfinder */}
            <button
              type="button"
              onClick={() => startLiveStream()}
              className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Live Feed</span>
            </button>

            {/* 3. Upload from Gallery */}
            <button
              type="button"
              onClick={openGallery}
              className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>Gallery</span>
            </button>
          </div>

          {/* Quick Defect Sample Presets */}
          {presets && presets.length > 0 && (
            <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Verified Civic Defect Samples</span>
                </span>
                <span className="text-[9px] text-blue-600 font-bold">1-tap demo</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 transition-all cursor-pointer group active:scale-95"
                    title={p.title}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="text-[9px] font-bold text-slate-700 mt-1 truncate w-full text-center">
                      {p.label.split('/')[0].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Confirmation Controls: Retake vs Confirm */}
      {!streamActive && capturedImage && (
        <div className="grid grid-cols-2 gap-2">
          {/* Retake Button */}
          <button
            type="button"
            onClick={handleRetake}
            className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm Photo</span>
          </button>
        </div>
      )}
    </div>
  );
};
