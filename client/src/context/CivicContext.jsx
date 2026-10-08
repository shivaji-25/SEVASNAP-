import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const CivicContext = createContext();

// Default seed issues for immediate demonstration if DB is fresh
const INITIAL_DEMO_ISSUES = [
  {
    _id: 'demo-1',
    ticketId: 'SEVA-8012',
    title: 'Severe Asphalt Pothole',
    category: 'pothole',
    categoryName: 'Pothole',
    description: 'Deep road cavity on main vehicular path causing axle shock and motorcycle hazard.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    resolvedImageUrl: null,
    location: {
      address: '100ft Road, 4th Block, Koramangala',
      ward: 'Ward 151, Koramangala',
      lat: 12.9352,
      lng: 77.6245,
      distance: '140m away',
    },
    priority: 'High',
    confidence: 97.4,
    department: 'Roads & Infrastructure Department',
    status: 'assigned',
    reportedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    upvotes: 24,
    timeline: [
      {
        status: 'reported',
        title: 'Report Logged',
        time: '08:15 AM',
        detail: 'Citizen snapped photographic defect via SEVASNAP Sentinel camera HUD.',
        badge: 'Citizen Filed',
      },
      {
        status: 'assigned',
        title: 'Field Squad Dispatched',
        time: '09:30 AM',
        detail: 'Zonal Road Patch Crew KA-01-EA-1904 assigned to Koramangala sector.',
        badge: 'Crew Dispatched',
      },
    ],
  },
  {
    _id: 'demo-2',
    ticketId: 'SEVA-7419',
    title: 'Overflowing Waste Dumpster',
    category: 'garbage',
    categoryName: 'Overflowing Waste Dump',
    description: 'Municipal waste bin overflowing onto sidewalk pedestrian path with stray cattle.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    resolvedImageUrl: null,
    location: {
      address: 'Near Sony World Signal, 80ft Road',
      ward: 'Ward 151, Koramangala',
      lat: 12.9372,
      lng: 77.6291,
      distance: '320m away',
    },
    priority: 'Medium',
    confidence: 96.2,
    department: 'Solid Waste Management (SWM)',
    status: 'reported',
    reportedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    upvotes: 18,
    timeline: [
      {
        status: 'reported',
        title: 'Report Logged',
        time: '06:40 AM',
        detail: 'AI verified civic waste violation and categorized under SWM priority triage.',
        badge: 'Citizen Filed',
      },
    ],
  },
  {
    _id: 'demo-3',
    ticketId: 'SEVA-6102',
    title: 'High-Pressure Pipeline Rupture',
    category: 'water_leak',
    categoryName: 'Water Pipeline Burst',
    description: 'Fresh potable drinking water main ruptured under footway with surface erosion.',
    imageUrl: 'https://images.unsplash.com/photo-1585687508687-32127fa289fe?auto=format&fit=crop&w=800&q=80',
    resolvedImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
    location: {
      address: '7th Main, 1st Block, Koramangala',
      ward: 'Ward 151, Koramangala',
      lat: 12.9315,
      lng: 77.6221,
      distance: '480m away',
    },
    priority: 'High',
    confidence: 98.7,
    department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
    status: 'resolved',
    reportedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    upvotes: 42,
    timeline: [
      {
        status: 'reported',
        title: 'Report Logged',
        time: 'Yesterday 10:00 AM',
        detail: 'Optical evidence locked GPS coordinates to BWSSB emergency intake.',
        badge: 'Citizen Filed',
      },
      {
        status: 'assigned',
        title: 'Valve Team Deployed',
        time: 'Yesterday 11:15 AM',
        detail: 'BWSSB pressure maintenance team isolated distribution valve.',
        badge: 'Crew Dispatched',
      },
      {
        status: 'in_progress',
        title: 'Pipe Section Replaced',
        time: 'Yesterday 02:45 PM',
        detail: '150mm ductile iron sleeve installed and pressure tested.',
        badge: 'Crew Active',
      },
      {
        status: 'resolved',
        title: 'Post-Repair Certified',
        time: 'Yesterday 05:20 PM',
        detail: 'Surface road re-leveled and water pressure restored cleanly.',
        badge: 'Official Certified',
      },
    ],
  },
];

export const CivicProvider = ({ children }) => {
  const [issues, setIssues] = useState(() => {
    const cached = localStorage.getItem('sevasnap_issues');
    return cached ? JSON.parse(cached) : INITIAL_DEMO_ISSUES;
  });

  const [currentIssue, setCurrentIssue] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userRole, setUserRoleState] = useState(() => {
    return localStorage.getItem('sevasnap_user_role') || 'citizen';
  });

  const setUserRole = (role) => {
    setUserRoleState(role);
    localStorage.setItem('sevasnap_user_role', role);
  };

  const [deviceId] = useState(() => {
    let id = localStorage.getItem('sevasnap_device_id');
    if (!id) {
      id = `device-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('sevasnap_device_id', id);
    }
    return id;
  });

  // Track upvoted tickets in local state for rapid UI toggling
  const [upvotedTickets, setUpvotedTickets] = useState(() => {
    const saved = localStorage.getItem('sevasnap_upvotes');
    return saved ? JSON.parse(saved) : {};
  });

  // Live or Mock GPS Location (SRS Feature 2: 12.9352° N, 77.6245° E, Ward 151 Koramangala)
  const [userLocation, setUserLocation] = useState({
    lat: 12.9352,
    lng: 77.6245,
    address: 'Koramangala 4th Block, Bengaluru',
    ward: 'Ward 151, Koramangala',
    accuracy: 'Sensor GPS High-Lock',
  });

  // Persist issues & upvotes to localStorage for offline resilience (SRS Sec 5.3)
  useEffect(() => {
    localStorage.setItem('sevasnap_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('sevasnap_upvotes', JSON.stringify(upvotedTickets));
  }, [upvotedTickets]);

  // Fetch live issues from backend on mount
  const refreshIssues = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssues(filters);
      if (data && data.length > 0) {
        setIssues(data);
      }
    } catch (err) {
      console.warn('Backend not reachable yet, using offline cached issues:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIssues();
  }, [refreshIssues]);

  // Geolocation detector with 3.5s timeout & calibrated ward fallback (SRS FR-2.1)
  const detectLocation = useCallback(() => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = {
              lat: +pos.coords.latitude.toFixed(4),
              lng: +pos.coords.longitude.toFixed(4),
              address: 'Current Street Location',
              ward: 'Ward 151, Koramangala',
              accuracy: `GPS ±${Math.round(pos.coords.accuracy)}m`,
            };
            setUserLocation(loc);
            resolve(loc);
          },
          () => {
            // Graceful fallback baseline (SRS FR-2.3)
            const fallbackLoc = {
              lat: 12.9352,
              lng: 77.6245,
              address: 'Koramangala 4th Block, Bengaluru',
              ward: 'Ward 151, Koramangala',
              accuracy: 'Calibrated Ward Baseline',
            };
            setUserLocation(fallbackLoc);
            resolve(fallbackLoc);
          },
          { timeout: 3500, enableHighAccuracy: true }
        );
      } else {
        resolve(userLocation);
      }
    });
  }, [userLocation]);

  // AI Triage Runner
  const runAiAnalysis = async (params) => {
    setLoading(true);
    try {
      const result = await api.analyzeIssue(params);
      setAiAnalysis(result);
      return result;
    } catch (err) {
      console.warn('AI analysis API fallback to client heuristics:', err.message);
      const fallbackResult = {
        category: params.presetKey || 'pothole',
        categoryName: params.presetKey ? params.presetKey.toUpperCase() : 'Pothole',
        severity: 'High',
        confidence: 97.4,
        department: 'Roads & Infrastructure Department',
        sla: 'Under 4 hours',
        description: 'Asphalt cavity detected requiring road patch triage.',
      };
      setAiAnalysis(fallbackResult);
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  // Upvote Action (1 vote per user/device, SRS FR-7.1)
  const toggleUpvote = async (issueId, ticketId) => {
    const isCurrentlyUpvoted = Boolean(upvotedTickets[ticketId]);
    const updatedState = { ...upvotedTickets, [ticketId]: !isCurrentlyUpvoted };
    setUpvotedTickets(updatedState);

    // Optimistic UI update
    setIssues((prev) =>
      prev.map((item) => {
        if (item._id === issueId || item.ticketId === ticketId) {
          const newCount = isCurrentlyUpvoted
            ? Math.max(0, item.upvotes - 1)
            : item.upvotes + 1;
          return { ...item, upvotes: newCount, hasUpvoted: !isCurrentlyUpvoted };
        }
        return item;
      })
    );

    // Sync with backend API
    try {
      await api.upvoteIssue(issueId, deviceId);
    } catch (err) {
      console.warn('Backend upvote sync fallback:', err.message);
    }
  };

  // Submit and create new issue (SRS SCR-02, SCR-03)
  const submitIssue = async (issuePayload) => {
    setLoading(true);
    try {
      const response = await api.createIssue(issuePayload);
      const created = response.data;
      setIssues((prev) => [created, ...prev]);
      setCurrentIssue(created);
      return { success: true, issue: created, duplicateWarning: response.duplicateWarning };
    } catch (err) {
      console.warn('Offline report submission fallback:', err.message);
      // Construct fallback offline issue
      const randomTicket = `SEVA-${Math.floor(1000 + Math.random() * 9000)}`;
      const offlineIssue = {
        _id: `offline-${Date.now()}`,
        ticketId: randomTicket,
        title: issuePayload.title || `${issuePayload.categoryName} Defect`,
        category: issuePayload.category,
        categoryName: issuePayload.categoryName,
        description: issuePayload.description,
        imageUrl: issuePayload.imageUrl,
        location: issuePayload.location || userLocation,
        priority: issuePayload.priority || 'Medium',
        confidence: issuePayload.confidence || 95.0,
        department: issuePayload.department || 'Municipal Corporation',
        status: 'reported',
        reportedAt: new Date().toISOString(),
        upvotes: 1,
        timeline: [
          {
            status: 'reported',
            title: 'Report Logged',
            time: 'Just now',
            detail: 'Report created and stored in local civic memory.',
            badge: 'Citizen Filed',
          },
        ],
      };
      setIssues((prev) => [offlineIssue, ...prev]);
      setCurrentIssue(offlineIssue);
      return { success: true, issue: offlineIssue };
    } finally {
      setLoading(false);
    }
  };

  // Forward-only status lifecycle progression (SRS FR-4.2)
  const advanceIssueStatus = async (issueId, nextStatus, meta = {}) => {
    try {
      const updated = await api.updateIssueStatus(issueId, { status: nextStatus, ...meta });
      setIssues((prev) => prev.map((item) => (item._id === issueId ? updated : item)));
      if (currentIssue && currentIssue._id === issueId) {
        setCurrentIssue(updated);
      }
      return updated;
    } catch (err) {
      console.warn('Status update API error, falling back locally:', err.message);
      // Local progression fallback
      setIssues((prev) =>
        prev.map((item) => {
          if (item._id === issueId) {
            const newTimeline = [
              ...item.timeline,
              {
                status: nextStatus,
                title: meta.title || `Status updated to ${nextStatus}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                detail: meta.detail || 'Lifecycle progression advanced by authority console.',
                badge: meta.badge || 'Field Action',
              },
            ];
            const updatedItem = {
              ...item,
              status: nextStatus,
              timeline: newTimeline,
              ...(meta.resolvedImageUrl ? { resolvedImageUrl: meta.resolvedImageUrl } : {}),
            };
            if (currentIssue && currentIssue._id === issueId) {
              setCurrentIssue(updatedItem);
            }
            return updatedItem;
          }
          return item;
        })
      );
    }
  };

  return (
    <CivicContext.Provider
      value={{
        issues,
        currentIssue,
        setCurrentIssue,
        userLocation,
        detectLocation,
        selectedCategory,
        setSelectedCategory,
        aiAnalysis,
        setAiAnalysis,
        runAiAnalysis,
        submitIssue,
        advanceIssueStatus,
        toggleUpvote,
        upvotedTickets,
        refreshIssues,
        userRole,
        setUserRole,
        loading,
        error,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};
