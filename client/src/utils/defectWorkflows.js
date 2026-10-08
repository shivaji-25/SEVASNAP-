// Category-Specific Lifecycle Metadata Workflows for Bangalore Civic Operations

export const DEFECT_STAGE_METADATA = {
  water_leak: {
    department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
    reported: {
      title: 'Water Pipeline Leakage Logged',
      detail: 'Citizen reported pipe burst/leakage with photographic evidence; GPS locked to water board intake.',
      badge: 'Citizen Filed',
    },
    assigned: {
      title: 'BWSSB Hydraulic Maintenance Squad Dispatched',
      detail: 'Dispatched Hydraulic Valve Unit KA-01-WQ-8842 with isolation key and ductile iron pipe sleeves.',
      badge: 'Squad Dispatched',
    },
    in_progress: {
      title: 'Main Valve Isolation & Pipeline Repair Active',
      detail: 'Engineering crew isolated distribution sluice valve, excavated damaged section, and mounted heavy-duty repair sleeve.',
      badge: 'Active Repair',
    },
    resolved: {
      title: 'Water Pressure Restored & Zero-Leakage Certified',
      detail: 'BWSSB Zonal Engineer tested 4.2 bar mainline pressure, certified leak stoppage, and backfilled roadway trench.',
      badge: 'BWSSB Certified',
      resolvedBy: 'Er. Suresh Kumar (BWSSB Assistant Executive Engineer)',
      resolvedImageUrl:
        'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80',
    },
  },

  garbage: {
    department: 'Solid Waste Management (SWM)',
    reported: {
      title: 'Garbage Dump Logged & Geotagged',
      detail: 'Citizen reported waste accumulation; AI vision flagged sanitation violation for urgent clearance.',
      badge: 'Citizen Filed',
    },
    assigned: {
      title: 'Sanitation Flying Squad & Compactor Dispatched',
      detail: 'Dispatched SWM Zonal Sanitation Crew KA-04-SW-4410 with 4-ton compactor truck and mechanical loader.',
      badge: 'Squad Dispatched',
    },
    in_progress: {
      title: 'Waste Clearance & Anti-Bacterial Disinfection Active',
      detail: 'Sanitation crew cleared accumulated black-spot waste pile and disinfected surrounding footway with bleaching powder.',
      badge: 'Clearing Active',
    },
    resolved: {
      title: 'Complete Site Clearance & Cleanliness Certified',
      detail: 'BBMP Solid Waste Health Inspector verified footway clearance; black-spot eliminated and declared zero-waste compliance.',
      badge: 'Health Certified',
      resolvedBy: 'Dr. Manjunath (BBMP Senior Health Inspector)',
      resolvedImageUrl:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    },
  },

  streetlight: {
    department: 'Electricity Supply Company (BESCOM)',
    reported: {
      title: 'Streetlight Outage Logged & Geotagged',
      detail: 'Citizen reported non-functional streetlight fixture causing pedestrian dark-zone hazard.',
      badge: 'Citizen Filed',
    },
    assigned: {
      title: 'BESCOM Electrical Maintenance Squad Dispatched',
      detail: 'Dispatched Power Infrastructure Crew KA-03-EL-2219 with hydraulic cherry-picker and LED replacement units.',
      badge: 'Squad Dispatched',
    },
    in_progress: {
      title: 'Pole Cable Re-wiring & Luminaire Replacement Active',
      detail: 'Electrical technicians replaced faulted ballast, repaired feeder cables, and mounted 120W LED fixture.',
      badge: 'Repair Active',
    },
    resolved: {
      title: 'Luminance & Circuit Continuity Certified',
      detail: 'BESCOM Electrical Inspector performed lux-level photometric test; illumination restored to full safety compliance.',
      badge: 'BESCOM Certified',
      resolvedBy: 'Er. P. Venkatesh (BESCOM Zonal Section Officer)',
      resolvedImageUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    },
  },

  drainage: {
    department: 'Stormwater Drain & Sewerage Department',
    reported: {
      title: 'Drain Blockage Logged & Geotagged',
      detail: 'Citizen reported blocked stormwater drain with surface pooling hazard during rains.',
      badge: 'Citizen Filed',
    },
    assigned: {
      title: 'Stormwater Desilting & Super-Sucker Unit Dispatched',
      detail: 'Dispatched SWD Emergency Crew KA-05-DR-9011 equipped with high-volume jetting and vacuum desilting vehicle.',
      badge: 'Squad Dispatched',
    },
    in_progress: {
      title: 'Hydro-Jetting & Conduit Desilting Active',
      detail: 'Crew operating high-pressure water jetting to pulverize solid silt blockage and unblock stormwater conduit.',
      badge: 'Desilting Active',
    },
    resolved: {
      title: 'Free-Flow Gravity Drainage Certified',
      detail: 'Zonal Stormwater Engineer verified unrestricted gravity drainage flow and re-seated safety surface grate.',
      badge: 'SWD Certified',
      resolvedBy: 'Er. Narayana Swamy (SWD Executive Engineer)',
      resolvedImageUrl:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
  },

  pothole: {
    department: 'Roads & Infrastructure Department',
    reported: {
      title: 'Pothole Defect Logged & Geotagged',
      detail: 'Citizen captured road crater defect; AI calculated high impact hazard for passing vehicles.',
      badge: 'Citizen Filed',
    },
    assigned: {
      title: 'Road Maintenance Quick-Patch Squad Dispatched',
      detail: 'Dispatched Zonal Quick-Response Road Crew KA-01-EA-1904 to site with hot-mix asphalt batch.',
      badge: 'Squad Dispatched',
    },
    in_progress: {
      title: 'Asphalt Tarmac Compaction on Location',
      detail: 'Active engineering crew squaring crater edges, applying tack coat, and operating vibratory compaction roller.',
      badge: 'Crew Active',
    },
    resolved: {
      title: 'Surface Integrity & Level Riding Certified',
      detail: 'Roads Executive Engineer certified asphalt density, ride quality, and approved before/after visual proof-of-work.',
      badge: 'Official Certified',
      resolvedBy: 'Er. Rajeshwar Rao (BBMP Executive Engineer)',
      resolvedImageUrl:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
  },
};

/**
 * Returns category-tailored lifecycle metadata for a given status transition.
 */
export const getStageMetaForCategory = (category, stage, customAuthority = null) => {
  const catKey = (category || 'pothole').toLowerCase();
  const config = DEFECT_STAGE_METADATA[catKey] || DEFECT_STAGE_METADATA.pothole;
  const stageData = config[stage] || config.reported;

  const result = { ...stageData };

  if (stage === 'resolved' && customAuthority) {
    result.resolvedBy = `${customAuthority.name} (${customAuthority.employeeId || customAuthority.designation})`;
    result.detail = `Resolution certified by ${customAuthority.name} (${customAuthority.department}). Photographic proof approved.`;
  }

  return result;
};

/**
 * Normalizes existing timeline events so legacy road texts on non-road issues are corrected to match the actual defect.
 */
export const normalizeTimelineEvent = (event, category) => {
  if (!event) return event;
  const catKey = (category || 'pothole').toLowerCase();
  if (catKey === 'pothole') return event;

  const detailLower = (event.detail || '').toLowerCase();
  const titleLower = (event.title || '').toLowerCase();

  // If a non-pothole defect has road/tarmac/roller copy, replace with category copy
  const hasRoadCopy =
    detailLower.includes('tarmac') ||
    detailLower.includes('compaction roller') ||
    detailLower.includes('road maintenance unit') ||
    titleLower.includes('road maintenance unit') ||
    titleLower.includes('engineering repair on location');

  if (hasRoadCopy && event.status) {
    const fresh = getStageMetaForCategory(catKey, event.status);
    return {
      ...event,
      title: fresh.title,
      detail: fresh.detail,
      badge: fresh.badge,
    };
  }

  return event;
};
