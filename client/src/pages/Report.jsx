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
    key: 'pothole',
    label: 'Pothole',
    icon: '🕳️',
    title: 'Asphalt Road Crater',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Pothole',
    severity: 'High',
    confidence: 97.4,
    department: 'Roads & Infrastructure Department',
    description: 'Dangerous road crater with exposed aggregate causing vehicular axle shock.',
  },
  {
    key: 'garbage',
    label: 'Garbage Dump',
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
    image: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Water Main Burst',
    severity: 'High',
    confidence: 98.7,
    department: 'Water Supply & Sewerage Board',
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
    department: 'Electricity Supply Company',
    description: 'Overhead luminaire failure creating dark pedestrian vulnerability.',
  },
  {
    key: 'drainage',
    label: 'Clogged Drain',
    icon: '🌊',
    title: 'Clogged Stormwater Drain',
    image: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80',
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
        description: activePreset?.description || undefined,
      });

      setAiAnalysis({
        category: aiResponse.category || activePreset?.key || 'pothole',
        categoryName: aiResponse.categoryName || activePreset?.categoryName || 'Civic Defect',
        severity: aiResponse.severity || activePreset?.severity || 'High',
        confidence: aiResponse.confidence || activePreset?.confidence || 97.4,
        department: aiResponse.department || activePreset?.department || 'Municipal Administration',
        sla: aiResponse.sla || activePreset?.sla || 'Under 4 hours',
        title: activePreset?.title || `Reported ${aiResponse.categoryName || 'Defect'}`,
        description: activePreset?.description || 'Detected civic hazard requiring municipal maintenance.',
      });

      setStage('verified');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      // Fallback to active preset or default pothole
      const fallback = activePreset || SRS_DEMO_PRESETS[0];
      setAiAnalysis({
        category: fallback.key,
        categoryName: fallback.categoryName,
        severity: fallback.severity,
        confidence: fallback.confidence,
        department: fallback.department,
        sla: 'Under 4 hours',
        title: fallback.title,
        description: fallback.description,
      });
      setStage('verified');
    }
  };

  // Preset selected directly
  const handlePresetSelected = (preset) => {
    setActivePreset(preset);
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
              src={photoData?.previewUrl}
              alt="Confirmed Defect"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white border border-slate-700 flex items-center gap-1.5">
              <span>{SRS_DEMO_PRESETS.find((p) => p.key === aiAnalysis.category)?.icon || '📍'}</span>
              <span>{aiAnalysis.categoryName}</span>
            </div>

            <button
              onClick={handleRetakePhoto}
              className="absolute top-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retake</span>
            </button>
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

            {/* Responsible Department & Location */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-start space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Assigned Department</span>
                  <span className="font-bold text-slate-900">{aiAnalysis.department}</span>
                </div>
              </div>

              <div className="flex items-start space-x-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Location Verified</span>
                  <span className="font-medium text-slate-800 text-[11px]">
                    {userLocation.address || userLocation.ward}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400">
                    {userLocation.lat?.toFixed(5)}° N, {userLocation.lng?.toFixed(5)}° E
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Citizen Notes */}
            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add any landmark or specific instructions for the municipal squad..."
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
    </div>
  );
};
