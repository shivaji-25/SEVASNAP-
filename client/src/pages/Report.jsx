import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { CameraCapture } from '../components/CameraCapture';
import { uploadImage, analyzeIssue } from '../services/api';
import {
  Camera,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';

const SRS_DEMO_PRESETS = [
  {
    key: 'water_leak',
    label: 'Water Repair / Leak',
    icon: '💧',
    title: 'Pressurized Water Pipeline Rupture & Leak',
    image: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Water Main Burst & Pipeline Leak',
    severity: 'High',
    confidence: 98.7,
    department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
    sla: 'Under 4 hours',
    description: 'Pressurized municipal drinking water pipeline rupture causing continuous clean water loss, roadway erosion, and distribution pressure failure. Emergency valve isolation and pipe section replacement required.',
  },
  {
    key: 'pothole',
    label: 'Pothole',
    icon: '🕳️',
    title: 'Severe Asphalt Road Crater',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Pothole',
    severity: 'High',
    confidence: 97.4,
    department: 'Roads & Infrastructure Department',
    sla: 'Under 4 hours',
    description: 'Dangerous road crater with exposed aggregate causing vehicular axle shock and commuter risk.',
  },
  {
    key: 'garbage',
    label: 'Garbage Dump',
    icon: '🗑️',
    title: 'Overflowing Municipal Waste Dump',
    image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Solid Waste Dump',
    severity: 'Medium',
    confidence: 96.2,
    department: 'Solid Waste Management (SWM)',
    sla: 'Under 24 hours',
    description: 'Municipal garbage dumpster overflowing onto public footway requiring immediate sanitation clearance.',
  },
  {
    key: 'streetlight',
    label: 'Streetlight',
    icon: '💡',
    title: 'Defective Public Streetlight Pole',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Damaged Streetlight',
    severity: 'Low',
    confidence: 94.1,
    department: 'Electricity Supply Company (BESCOM)',
    sla: 'Under 48 hours',
    description: 'Overhead luminaire failure creating dark pedestrian vulnerability and visibility hazards.',
  },
  {
    key: 'drainage',
    label: 'Clogged Drain',
    icon: '🌊',
    title: 'Clogged Stormwater Drain & Sewer',
    image: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Clogged Storm Drain',
    severity: 'High',
    confidence: 95.8,
    department: 'Stormwater Drain & Sewerage Department',
    sla: 'Under 4 hours',
    description: 'Debris and silt blockage preventing active monsoon surface drainage and causing roadway waterlogging.',
  },
];

const LOCATION_PRESETS = [
  { name: 'Sulur, Coimbatore', ward: 'Sulur Town Panchayat', address: 'Trichy Road, Sulur', lat: 11.0267, lng: 77.1264 },
  { name: 'Indiranagar, Bengaluru', ward: 'Ward 112, Indiranagar', address: '12th Main Road, HAL 2nd Stage', lat: 12.9784, lng: 77.6408 },
  { name: 'Whitefield, Bengaluru', ward: 'Ward 84, Whitefield', address: 'ITPB Main Road, Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Koramangala, Bengaluru', ward: 'Ward 151, Koramangala', address: '100ft Road, 4th Block', lat: 12.9352, lng: 77.6245 },
  { name: 'MG Road / CBD', ward: 'Ward 111, Shantala Nagar', address: 'MG Road Metro Station', lat: 12.9756, lng: 77.6066 },
];

export const Report = () => {
  const navigate = useNavigate();
  const { userLocation, setUserLocation, detectLocation, forwardGeocode, submitIssue } = useCivic();

  // Workflow state: 'capture' | 'analyzing' | 'verified'
  const [stage, setStage] = useState('capture');

  // Selected or captured photo details
  const [photoData, setPhotoData] = useState(null); // { previewUrl, file }
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  // AI Analysis Results
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Location editor state in Report page
  const [showLocModal, setShowLocModal] = useState(false);
  const [locWard, setLocWard] = useState(userLocation?.ward || '');
  const [locAddress, setLocAddress] = useState(userLocation?.address || '');
  const [locLat, setLocLat] = useState(userLocation?.lat?.toString() || '12.9352');
  const [locLng, setLocLng] = useState(userLocation?.lng?.toString() || '77.6245');
  const [isLocating, setIsLocating] = useState(false);

  const openReportLocModal = () => {
    setLocWard(userLocation?.ward || '');
    setLocAddress(userLocation?.address || '');
    setLocLat((userLocation?.lat || 12.9352).toString());
    setLocLng((userLocation?.lng || 77.6245).toString());
    setShowLocModal(true);
  };

  const handleSelectPreset = (p) => {
    setLocWard(p.ward);
    setLocAddress(p.address);
    setLocLat(p.lat.toString());
    setLocLng(p.lng.toString());
    setUserLocation({
      lat: p.lat,
      lng: p.lng,
      ward: p.ward,
      address: p.address,
      accuracy: 'Preset Calibrated',
    });
    setShowLocModal(false);
  };

  const handleDetectGPSInReport = async () => {
    try {
      const loc = await detectLocation();
      setLocWard(loc.ward);
      setLocAddress(loc.address);
      setLocLat(loc.lat.toString());
      setLocLng(loc.lng.toString());
      setShowLocModal(false);
    } catch (err) {
      console.warn('GPS detect error:', err);
    }
  };

  const handleSaveReportLoc = async (e) => {
    e.preventDefault();
    setIsLocating(true);
    try {
      let finalLat = parseFloat(locLat);
      let finalLng = parseFloat(locLng);

      const target = `${locWard.trim()} ${locAddress.trim()}`.trim();
      if (target) {
        const geo = await forwardGeocode(target);
        if (geo) {
          finalLat = geo.lat;
          finalLng = geo.lng;
        }
      }

      if (isNaN(finalLat)) finalLat = userLocation?.lat || 12.9352;
      if (isNaN(finalLng)) finalLng = userLocation?.lng || 77.6245;

      setUserLocation({
        lat: +finalLat.toFixed(5),
        lng: +finalLng.toFixed(5),
        ward: locWard.trim() || 'Custom Location',
        address: locAddress.trim() || locWard.trim(),
        accuracy: 'Custom Calibrated',
      });
      setShowLocModal(false);
    } catch (err) {
      console.error('Locate error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  // 1. User confirms photo from CameraCapture component
  const handlePhotoConfirmed = async ({ previewUrl, file }) => {
    setPhotoData({ previewUrl, file });
    setStage('analyzing');
    setErrorMessage('');

    try {
      let finalImageUrl = previewUrl;

      // If a real file was captured/uploaded, upload to backend Multer storage
      if (file) {
        try {
          const uploadRes = await uploadImage(file);
          if (uploadRes.imageUrl) {
            finalImageUrl = uploadRes.imageUrl;
            setUploadedImageUrl(uploadRes.imageUrl);
          }
        } catch (uploadErr) {
          console.warn('Backend upload notice, using preview URL:', uploadErr.message);
        }
      } else {
        setUploadedImageUrl(previewUrl);
      }

      // Send to Backend AI Vision Analysis
      const aiResponse = await analyzeIssue({
        image: finalImageUrl,
        location: userLocation,
        presetKey: activePreset?.key || undefined,
        category: activePreset?.key || undefined,
        title: activePreset?.title || undefined,
        description: customNotes.trim() || activePreset?.description || undefined,
      });

      const matchedPreset =
        SRS_DEMO_PRESETS.find((p) => p.key === aiResponse?.category) ||
        activePreset ||
        SRS_DEMO_PRESETS[0];

      setAiAnalysis({
        category: aiResponse?.category || matchedPreset.key,
        categoryName: aiResponse?.categoryName || matchedPreset.categoryName,
        severity: aiResponse?.severity || matchedPreset.severity,
        confidence: aiResponse?.confidence || matchedPreset.confidence,
        department: aiResponse?.department || matchedPreset.department,
        sla: aiResponse?.sla || matchedPreset.sla || 'Under 4 hours',
        title: aiResponse?.title || matchedPreset.title,
        description: aiResponse?.description || matchedPreset.description,
      });

      setStage('verified');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      // Fallback to active preset or default
      const fallback = activePreset || SRS_DEMO_PRESETS[0];
      setAiAnalysis({
        category: fallback.key,
        categoryName: fallback.categoryName,
        severity: fallback.severity,
        confidence: fallback.confidence,
        department: fallback.department,
        sla: fallback.sla || 'Under 4 hours',
        title: fallback.title,
        description: fallback.description,
      });
      setStage('verified');
    }
  };

  // Preset selected directly from quick samples
  const handlePresetSelected = (preset) => {
    setActivePreset(preset);
    setPhotoData({ previewUrl: preset.image, file: null });
    setUploadedImageUrl(preset.image);
  };

  // Switch category manually on verification screen
  const handleSwitchCategory = (catKey) => {
    const preset = SRS_DEMO_PRESETS.find((p) => p.key === catKey);
    if (!preset) return;
    setActivePreset(preset);
    setAiAnalysis((prev) => ({
      ...prev,
      category: preset.key,
      categoryName: preset.categoryName,
      title: preset.title,
      severity: preset.severity,
      confidence: preset.confidence,
      department: preset.department,
      sla: preset.sla,
      description: preset.description,
    }));
  };

  // Detect and synchronize category when citizen types custom notes
  const handleNotesChange = (text) => {
    setCustomNotes(text);
    const lower = text.toLowerCase();
    if (
      lower.includes('water') ||
      lower.includes('pipe') ||
      lower.includes('leak') ||
      lower.includes('valve') ||
      lower.includes('burst') ||
      (lower.includes('repair') && !lower.includes('road'))
    ) {
      if (aiAnalysis?.category !== 'water_leak') {
        handleSwitchCategory('water_leak');
      }
    } else if (
      lower.includes('garbage') ||
      lower.includes('waste') ||
      lower.includes('trash') ||
      lower.includes('dump')
    ) {
      if (aiAnalysis?.category !== 'garbage') {
        handleSwitchCategory('garbage');
      }
    } else if (
      lower.includes('light') ||
      lower.includes('lamp') ||
      lower.includes('pole')
    ) {
      if (aiAnalysis?.category !== 'streetlight') {
        handleSwitchCategory('streetlight');
      }
    } else if (
      lower.includes('drain') ||
      lower.includes('gutter') ||
      lower.includes('flood') ||
      lower.includes('sewer')
    ) {
      if (aiAnalysis?.category !== 'drainage') {
        handleSwitchCategory('drainage');
      }
    }
  };

  // Retake photo: resets back to Camera step
  const handleRetakePhoto = () => {
    setPhotoData(null);
    setUploadedImageUrl('');
    setAiAnalysis(null);
    setActivePreset(null);
    setStage('capture');
  };

  // 2. Final Confirmation: Save to MongoDB & Dispatch Ticket
  const handleCreateCivicTicket = async () => {
    setIsSubmittingTicket(true);
    setErrorMessage('');

    try {
      const payload = {
        title: aiAnalysis.title,
        category: aiAnalysis.category,
        categoryName: aiAnalysis.categoryName,
        description: customNotes.trim() || aiAnalysis.description,
        imageUrl: uploadedImageUrl || photoData?.previewUrl,
        location: {
          address: userLocation.address,
          ward: userLocation.ward,
          lat: userLocation.lat,
          lng: userLocation.lng,
          distance: 'At Reporting Location',
        },
        priority: aiAnalysis.severity,
        confidence: aiAnalysis.confidence,
        department: aiAnalysis.department,
      };

      const res = await submitIssue(payload);
      const ticketId = res.issue?.ticketId || 'SEVA-1001';
      navigate(`/tracking?ticket=${ticketId}`);
    } catch (err) {
      console.error('Ticket submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            {stage === 'capture' && 'Report Civic Issue'}
            {stage === 'analyzing' && 'AI Sentinel Vision'}
            {stage === 'verified' && 'AI Verification & Dispatch'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {stage === 'capture' && 'Snap photo & lock GPS coordinates'}
            {stage === 'analyzing' && 'Scanning defect boundaries & department routing...'}
            {stage === 'verified' && 'Review AI diagnosis & confirm municipal ticket'}
          </p>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Step {stage === 'capture' ? '1/3' : stage === 'analyzing' ? '2/3' : '3/3'}</span>
        </span>
      </div>

      {/* STAGE 1: CAMERA CAPTURE / GALLERY / PREVIEWS */}
      {stage === 'capture' && (
        <CameraCapture
          userLocation={userLocation}
          onConfirmPhoto={handlePhotoConfirmed}
          presets={SRS_DEMO_PRESETS}
          onSelectPreset={handlePresetSelected}
        />
      )}

      {/* STAGE 2: AI ANALYZING SCANNER */}
      {stage === 'analyzing' && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 border-2 border-slate-800 shadow-2xl text-center space-y-4 aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Pulsing Scan Rings */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 animate-ping absolute inset-0" />
            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-white">AI Sentinel Vision Triage</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Analyzing photo pixels, defect category, severity & municipal SLA...
            </p>
          </div>

          <div className="text-[10px] font-mono text-emerald-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
            TARGET: {userLocation.ward || 'GPS Coordinates Locked'}
          </div>
        </div>
      )}

      {/* STAGE 3: AI VERIFICATION CARD & FINAL TICKET CONFIRMATION */}
      {stage === 'verified' && aiAnalysis && (
        <div className="space-y-3.5">
          {/* Confirmed Photo Thumbnail + Category Badge */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 shadow-md">
            <img
              src={photoData?.previewUrl || activePreset?.image}
              alt="Confirmed Defect"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white border border-slate-700 flex items-center gap-1.5 shadow-lg">
              <span>{SRS_DEMO_PRESETS.find((p) => p.key === aiAnalysis.category)?.icon || '📍'}</span>
              <span>{aiAnalysis.categoryName}</span>
            </div>

            <button
              onClick={handleRetakePhoto}
              className="absolute top-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retake</span>
            </button>
          </div>

          {/* Quick Category Override Bar */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Verify Defect Category</span>
              </span>
              <span className="text-[9px] text-emerald-600 font-bold">Tap to adjust</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SRS_DEMO_PRESETS.map((p) => {
                const isSelected = aiAnalysis.category === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSwitchCategory(p.key)}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[9px] font-bold mt-0.5 truncate w-full text-center">
                      {p.label.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Diagnostic Results Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">AI Diagnostic Report</span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {aiAnalysis.confidence}% Confidence
              </span>
            </div>

            {/* Defect Title */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Defect Title
              </span>
              <span className="font-black text-slate-900 text-xs mt-0.5 block">
                {aiAnalysis.title}
              </span>
            </div>

            {/* Severity & SLA metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  Severity Rating
                </span>
                <span
                  className={`font-black ${
                    aiAnalysis.severity === 'High'
                      ? 'text-red-600'
                      : aiAnalysis.severity === 'Medium'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                >
                  {aiAnalysis.severity} Priority
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Resolution SLA
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{aiAnalysis.sla}</span>
                </span>
              </div>
            </div>

            {/* AI Damage Assessment Report */}
            <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-200/70 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-[10px] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Damage Assessment Report</span>
              </div>
              <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                {aiAnalysis.description}
              </p>
            </div>

            {/* Responsible Department & Location */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-start space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block font-bold">Assigned Department</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block text-[11px] mt-0.5">
                    {aiAnalysis.department}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-start space-x-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-bold">Location Verified</span>
                    <span className="font-medium text-slate-800 text-[11px] truncate block">
                      {userLocation.address || userLocation.ward}
                    </span>
                    <div className="text-[10px] font-mono text-emerald-600 font-bold">
                      {userLocation.lat?.toFixed(5)}° N, {userLocation.lng?.toFixed(5)}° E
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openReportLocModal}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <span>Change</span>
                </button>
              </div>
            </div>

            {/* Optional Citizen Notes */}
            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="e.g., water repair needed near main intersection..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Error Message if submit fails */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Confirm & Create Ticket Primary Action Button */}
          <button
            onClick={handleCreateCivicTicket}
            disabled={isSubmittingTicket}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all min-h-[50px] text-xs cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSubmittingTicket ? 'Creating Ticket & Dispatching...' : 'Confirm & Create Civic Ticket'}
            </span>
          </button>
        </div>
      )}

      {/* Report Location Change Modal */}
      {showLocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Set Reporting Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* GPS Detection */}
            <button
              type="button"
              onClick={handleDetectGPSInReport}
              className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Use My Live GPS Location</span>
            </button>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Quick Select Location
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2 py-1 rounded-lg text-slate-700 transition-all cursor-pointer"
                  >
                    📍 {p.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSaveReportLoc} className="space-y-2.5 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Area / Ward / City</label>
                <input
                  type="text"
                  value={locWard}
                  onChange={(e) => setLocWard(e.target.value)}
                  placeholder="e.g., Sulur, Coimbatore or Indiranagar"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Street Address / Landmark</label>
                <input
                  type="text"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="e.g., Trichy Road, Sulur"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={locLat}
                    onChange={(e) => setLocLat(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={locLng}
                    onChange={(e) => setLocLng(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLocating}
                  className="flex-1 py-2 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1"
                >
                  {isLocating ? 'Calibrating...' : 'Set Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
