import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCivic } from '../context/CivicContext';
import {
  Navigation,
  MapPin,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Layers,
  Filter,
  X,
  Crosshair,
} from 'lucide-react';

// Category icon map for OpenStreetMap pins
const CATEGORY_META = {
  all: { label: 'All Issues', icon: '📍' },
  pothole: { label: 'Pothole', icon: '🕳️' },
  garbage: { label: 'Garbage Dump', icon: '🗑️' },
  water_leak: { label: 'Water Leak', icon: '💧' },
  streetlight: { label: 'Streetlight', icon: '💡' },
  drainage: { label: 'Clogged Drain', icon: '🌊' },
};

// Custom Marker for Citizen Live GPS Location
const createUserIcon = () =>
  L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 0; border-radius: 50%; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// Dynamic Color-Coded Defect Markers (High = Red, Medium = Amber, Low = Blue, Resolved = Emerald)
const createIssueMarkerIcon = (issue) => {
  const isResolved = issue.status === 'resolved';
  let pinColor = '#2563eb'; // Low: Blue
  let pulseHtml = '';

  if (isResolved) {
    pinColor = '#059669'; // Resolved: Emerald
  } else if (issue.priority === 'High') {
    pinColor = '#dc2626'; // High: Red
    pulseHtml = `<div style="position: absolute; inset: -5px; border-radius: 50%; background: rgba(220, 38, 38, 0.45); animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`;
  } else if (issue.priority === 'Medium') {
    pinColor = '#d97706'; // Medium: Amber
  }

  const iconEmoji = CATEGORY_META[issue.category]?.icon || '⚠️';

  return L.divIcon({
    className: 'civic-defect-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; cursor: pointer;">
        ${pulseHtml}
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${pinColor}; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 13px;">
          ${isResolved ? '✓' : iconEmoji}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Helper component to smoothly center map when coordinates change
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { animate: true, duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

export const Map = () => {
  const navigate = useNavigate();
  const { issues, userLocation, detectLocation } = useCivic();

  const [mapCenter, setMapCenter] = useState([
    userLocation?.lat || 12.9352,
    userLocation?.lng || 77.6245,
  ]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, High, Medium, Low, resolved
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState(
    userLocation?.accuracyMeters || 35
  );
  const [showLegend, setShowLegend] = useState(false);

  // Sync map center if userLocation changes
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      if (userLocation.accuracyMeters) {
        setGpsAccuracyMeters(userLocation.accuracyMeters);
      }
    }
  }, [userLocation.lat, userLocation.lng, userLocation.accuracyMeters]);

  // Handle "Detect My Location" button click
  const handleDetectLocation = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await detectLocation();
      if (loc?.lat && loc?.lng) {
        setMapCenter([loc.lat, loc.lng]);
        if (loc.accuracyMeters) {
          setGpsAccuracyMeters(loc.accuracyMeters);
        }
      }
    } catch (err) {
      console.warn('GPS location detect notice:', err);
    } finally {
      setTimeout(() => setIsDetectingGps(false), 800);
    }
  };

  // Filter issues based on category & severity
  const filteredIssues = issues.filter((iss) => {
    const matchesCategory =
      selectedCategory === 'all' || iss.category === selectedCategory;

    let matchesPriority = true;
    if (selectedPriority === 'resolved') {
      matchesPriority = iss.status === 'resolved';
    } else if (selectedPriority !== 'all') {
      matchesPriority =
        iss.priority?.toLowerCase() === selectedPriority.toLowerCase() &&
        iss.status !== 'resolved';
    }

    return matchesCategory && matchesPriority;
  });

  return (
    <div className="relative h-full w-full max-w-md mx-auto overflow-hidden bg-slate-100 flex flex-col">
      {/* 1. Top Filter Cluster: Categories & Severity Chips */}
      <div className="absolute top-2 left-2 right-2 z-[400] space-y-1.5 pointer-events-auto">
        {/* Category Filter Horizontal Scroll */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          ))}
        </div>

        {/* Severity Filter Horizontal Scroll */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700/70 shadow-md">
          {[
            { id: 'all', label: 'All Severities' },
            { id: 'High', label: '🔴 High', color: 'text-red-400' },
            { id: 'Medium', label: '🟠 Medium', color: 'text-amber-400' },
            { id: 'Low', label: '🔵 Low', color: 'text-blue-400' },
            { id: 'resolved', label: '🟢 Resolved', color: 'text-emerald-400' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedPriority(filter.id)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedPriority === filter.id
                  ? 'bg-white text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Leaflet Map with 100% Free OpenStreetMap Tiles */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={15}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Map Center & FlyTo Controller */}
          <MapCenterController center={mapCenter} zoom={15} />

          {/* 100% Free OpenStreetMap Raster Tile Layer (Zero API Keys required) */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* User Live GPS Marker & Accuracy Circle */}
          {userLocation?.lat && userLocation?.lng && (
            <>
              {/* GPS Confidence Accuracy Radius Circle */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={gpsAccuracyMeters || 30}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '3, 6',
                }}
              />

              {/* User Live Marker */}
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserIcon()}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-slate-900 max-w-[200px]">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-700">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Your Live GPS Location</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 leading-tight">
                      {userLocation.address || userLocation.ward}
                    </p>
                    <div className="text-[9px] font-mono text-slate-500 bg-slate-100 p-1 rounded">
                      {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                    </div>
                    <div className="text-[9px] text-emerald-600 font-bold">
                      Accuracy: ±{gpsAccuracyMeters}m
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Render All Filtered Civic Defect Markers */}
          {filteredIssues.map((issue) => {
            const lat = issue.location?.lat || 12.9352;
            const lng = issue.location?.lng || 77.6245;

            return (
              <Marker
                key={issue._id || issue.ticketId}
                position={[lat, lng]}
                icon={createIssueMarkerIcon(issue)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-2 text-slate-900 max-w-[220px]">
                    {/* Defect Image Preview */}
                    {issue.imageUrl && (
                      <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={issue.imageUrl}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div>
                      {/* Ticket ID & Severity */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {issue.ticketId}
                        </span>
                        <span
                          className={`font-black px-1.5 py-0.5 rounded-full ${
                            issue.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : issue.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : issue.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {issue.status === 'resolved' ? '✓ Resolved' : `${issue.priority} Priority`}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <h4 className="text-xs font-black text-slate-900 mt-1 leading-snug">
                        {issue.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.location?.ward || issue.location?.address}</span>
                      </p>
                    </div>

                    {/* View Details / Audit Trail Button */}
                    <button
                      onClick={() => navigate(`/tracking?ticket=${issue.ticketId}`)}
                      className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 shadow-sm active:scale-95 transition-all"
                    >
                      <span>Track Lifecycle</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 3. Floating Bottom Controls: "Detect My Location" & Defect Count Badge */}
      <div className="absolute bottom-20 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        {/* Issues Count Pill */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-2 text-white">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold font-mono">
            {filteredIssues.length}
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              Issues on Map
            </span>
          </span>
        </div>

        {/* Primary "Detect My Location" Free GPS Action Button */}
        <button
          onClick={handleDetectLocation}
          disabled={isDetectingGps}
          className="pointer-events-auto flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/30 transition-all border border-emerald-400 cursor-pointer"
          title="Detect My Location via Browser GPS"
        >
          <Navigation
            className={`w-4 h-4 stroke-[2.5] ${
              isDetectingGps ? 'animate-spin' : ''
            }`}
          />
          <span>{isDetectingGps ? 'Locating...' : 'Detect My Location'}</span>
        </button>
      </div>

      {/* 4. Marker Legend Overlay Toggle Button */}
      <div className="absolute top-24 right-2 z-[400]">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="bg-slate-900/85 backdrop-blur-md p-2 rounded-xl text-slate-300 hover:text-white border border-slate-700 shadow-md text-[10px] font-bold flex items-center gap-1"
          title="Toggle Legend"
        >
          <span>Legend</span>
        </button>
      </div>

      {/* Collapsible Marker Legend */}
      {showLegend && (
        <div className="absolute top-32 right-2 z-[400] bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700 text-white shadow-2xl space-y-1.5 text-[10px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-800 pb-1">
            <span>Marker Legend</span>
            <button onClick={() => setShowLegend(false)}>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </button>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>High Severity</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Low Severity</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Resolved Defect</span>
          </div>
          <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-800">
            <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-300"></span>
            <span>Your Live GPS</span>
          </div>
        </div>
      )}
    </div>
  );
};
