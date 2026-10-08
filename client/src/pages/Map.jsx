import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { MapPin, Navigation, ArrowRight, ShieldCheck, AlertCircle, X } from 'lucide-react';
import L from 'leaflet';

export const Map = () => {
  const navigate = useNavigate();
  const { issues, userLocation } = useCivic();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredIssues = issues.filter((iss) => {
    if (filterPriority === 'all') return true;
    if (filterPriority === 'resolved') return iss.status === 'resolved';
    return iss.priority?.toLowerCase() === filterPriority.toLowerCase();
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat || 12.9352, userLocation.lng || 77.6245],
        zoom: 15,
        zoomControl: false,
      });

      // CartoDB Voyager raster tiles (SRS Section 3.3)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add user location blue radar dot
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(16, 185, 129, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #10b981; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

    // Plot priority-colored defect markers (SRS FR-5.2)
    filteredIssues.forEach((issue) => {
      const lat = issue.location?.lat || 12.9352;
      const lng = issue.location?.lng || 77.6245;

      const isResolved = issue.status === 'resolved';
      let pinColor = '#2563eb'; // Low: Blue
      let pulseHtml = '';

      if (isResolved) {
        pinColor = '#059669'; // Resolved: Emerald
      } else if (issue.priority === 'High') {
        pinColor = '#dc2626'; // High: Red with pulse
        pulseHtml = `<div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(220, 38, 38, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -4px; left: -4px;"></div>`;
      } else if (issue.priority === 'Medium') {
        pinColor = '#d97706'; // Medium: Amber
      }

      const defectIcon = L.divIcon({
        className: 'defect-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px; cursor: pointer;">
            ${pulseHtml}
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
              ${isResolved ? '✓' : '!'}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: defectIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedIssue(issue);
      });
    });
  }, [filteredIssues, userLocation]);

  return (
    <div className="relative h-full w-full max-w-md mx-auto overflow-hidden">
      {/* 1. Top Filter Pills Overlay */}
      <div className="absolute top-3 left-4 right-4 z-[400] flex space-x-1.5 overflow-x-auto no-scrollbar bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
        {['all', 'high', 'medium', 'low', 'resolved'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterPriority(filter)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterPriority === filter
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 2. Fullscreen Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 3. Recenter GPS Button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);
          }
        }}
        className="absolute bottom-20 right-4 z-[400] p-3 rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 active:scale-95 transition-transform"
        aria-label="Recenter on current GPS"
      >
        <Navigation className="w-5 h-5 text-emerald-400" />
      </button>

      {/* 4. Slide-Up Bottom Sheet for Selected Issue (SRS FR-5.3) */}
      {selectedIssue && (
        <div className="absolute bottom-16 left-3 right-3 z-[500] bg-white rounded-3xl p-4 border border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                {selectedIssue.ticketId}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedIssue.priority === 'High'
                    ? 'bg-red-100 text-red-700'
                    : selectedIssue.priority === 'Medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {selectedIssue.priority} Priority
              </span>
            </div>

            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-3 mt-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              <img
                src={selectedIssue.imageUrl}
                alt={selectedIssue.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {selectedIssue.title}
                </h4>
                <p className="text-slate-500 text-xs line-clamp-2 mt-0.5">
                  {selectedIssue.description || 'Civic defect reported on road infrastructure.'}
                </p>
              </div>

              <div className="flex items-center text-slate-400 text-[11px] space-x-1 mt-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate">{selectedIssue.location?.ward || 'Ward 151'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/tracking?ticket=${selectedIssue.ticketId}`)}
            className="w-full mt-3 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-98 transition-all min-h-[44px]"
          >
            <span>View Full Audit Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
