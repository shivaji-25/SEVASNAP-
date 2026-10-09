const Issue = require('../models/Issue');
const {
  calculateHaversineDistance,
  reverseGeocode,
  findProximityDuplicate,
  sanitizeIssueForClient,
} = require('../services/geoService');

// Format current time and date as readable string e.g. "03:15 AM, 09 Oct 2026"
const formatTimeNow = (d = new Date()) => {
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${time}, ${date}`;
};

// Generate unique ticket ID: e.g. SEVA-8012 (SRS FR-4.1)
const generateTicketId = async () => {
  let unique = false;
  let ticketId = '';
  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    ticketId = `SEVA-${randomNum}`;
    const existing = await Issue.findOne({ ticketId });
    if (!existing) unique = true;
  }
  return ticketId;
};

// 1. GET /api/issues - List with filtering (category, status, department, nearby)
exports.getIssues = async (req, res) => {
  try {
    const { category, status, department, priority, lat, lng, radiusInMeters } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (req.query.deviceId) filter['reportedBy.deviceId'] = req.query.deviceId;
    if (req.query.reporterId) filter['reportedBy.id'] = req.query.reporterId;
    if (req.query.reporterEmail) filter['reportedBy.email'] = req.query.reporterEmail.toLowerCase().trim();

    // Geospatial nearby filtering (MongoDB 2dsphere index)
    if (lat && lng) {
      const radius = parseFloat(radiusInMeters) || 5000; // default 5km
      filter.geo = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius,
        },
      };
    }

    const issues = await Issue.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues.map(sanitizeIssueForClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/issues/nearby - Dedicated MongoDB 2dsphere Geospatial Search
exports.getNearbyIssues = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, category } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude query parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseFloat(radius);

    const filter = {
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const issues = await Issue.find(filter);
    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues.map(sanitizeIssueForClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/issues/check-duplicate - Proximity-based duplicate detection (5 to 10-meter radius)
exports.checkDuplicateIssue = async (req, res) => {
  try {
    const { lat, lng, category, thresholdMeters = 10 } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required for duplicate check' });
    }

    const { isDuplicate, duplicateIssue, distanceMeters } = await findProximityDuplicate(Issue, {
      lat,
      lng,
      category,
      thresholdMeters: parseFloat(thresholdMeters) || 10,
    });

    if (isDuplicate && duplicateIssue) {
      return res.status(200).json({
        success: true,
        hasDuplicate: true,
        isDuplicate: true,
        distanceMeters,
        message: `Existing active report (${duplicateIssue.ticketId}) found within ${distanceMeters.toFixed(1)} meters.`,
        duplicateIssue: sanitizeIssueForClient(duplicateIssue),
      });
    }

    res.status(200).json({
      success: true,
      hasDuplicate: false,
      isDuplicate: false,
      distanceMeters,
      message: 'No duplicate active reports found within proximity threshold.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// 2. GET /api/issues/:id - Single issue by Mongo ID or Ticket ID (SEVA-xxxx)
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = id.startsWith('SEVA-')
      ? await Issue.findOne({ ticketId: id })
      : await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.status(200).json({ success: true, data: sanitizeIssueForClient(issue) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. POST /api/issues - Create issue with 50-meter duplicate detection (SRS FR-3.3, FR-4.1)
exports.createIssue = async (req, res) => {
  try {
    const {
      title,
      category,
      categoryName,
      description,
      imageUrl,
      location,
      priority,
      confidence,
      department,
      customTicketId,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Defect image is required' });
    }

    const lat = req.body.lat !== undefined
      ? parseFloat(req.body.lat)
      : (location && location.lat !== undefined ? parseFloat(location.lat) : 12.9352);
    const lng = req.body.lng !== undefined
      ? parseFloat(req.body.lng)
      : (location && location.lng !== undefined ? parseFloat(location.lng) : 77.6245);

    // 1. Intelligent category & municipal department routing
    let finalCategory = category || 'pothole';
    const textContext = `${title || ''} ${description || ''} ${categoryName || ''} ${category || ''}`.toLowerCase();

    if (
      textContext.includes('water') ||
      textContext.includes('leak') ||
      textContext.includes('pipe') ||
      textContext.includes('valve') ||
      textContext.includes('burst') ||
      textContext.includes('plumb') ||
      (textContext.includes('repair') && (textContext.includes('water') || textContext.includes('pipe')))
    ) {
      finalCategory = 'water_leak';
    } else if (
      textContext.includes('garbage') ||
      textContext.includes('waste') ||
      textContext.includes('trash') ||
      textContext.includes('dump')
    ) {
      finalCategory = 'garbage';
    } else if (
      textContext.includes('light') ||
      textContext.includes('lamp') ||
      textContext.includes('pole') ||
      textContext.includes('luminaire')
    ) {
      finalCategory = 'streetlight';
    } else if (
      textContext.includes('drain') ||
      textContext.includes('flood') ||
      textContext.includes('gutter') ||
      textContext.includes('sewer')
    ) {
      finalCategory = 'drainage';
    }

    // 2. CORE TASK 1: Proximity-Based Duplicate Detection (5 to 10-meter radius via Haversine Formula)
    const { isDuplicate, duplicateIssue, distanceMeters } = await findProximityDuplicate(Issue, {
      lat,
      lng,
      category: finalCategory,
      thresholdMeters: 10, // 5 to 10-meter proximity threshold
    });

    // If an existing complaint is found within 5-10 meters, link to original ticket; DO NOT create standalone issue
    if (isDuplicate && duplicateIssue) {
      const subReportId = `LINK-${Math.floor(1000 + Math.random() * 9000)}`;
      const reporterInfo = req.body.reportedBy || {
        id: req.body.userId || null,
        name: req.body.userName || 'Citizen Reporter',
        email: req.body.userEmail || null,
        phone: req.body.userPhone || null,
        deviceId: req.body.deviceId || null,
      };

      duplicateIssue.duplicateCount = (duplicateIssue.duplicateCount || 0) + 1;
      duplicateIssue.upvotes = (duplicateIssue.upvotes || 0) + 1;
      duplicateIssue.linkedReports = duplicateIssue.linkedReports || [];
      duplicateIssue.linkedReports.push({
        reportId: subReportId,
        imageUrl,
        description: description || 'Additional photographic evidence submitted by citizen.',
        reportedAt: new Date(),
        distanceMeters: Math.round(distanceMeters * 10) / 10,
        reportedBy: reporterInfo,
      });

      const now = new Date();
      duplicateIssue.timeline.push({
        status: duplicateIssue.status,
        title: `Duplicate Complaint Linked (${distanceMeters.toFixed(1)}m)`,
        time: formatTimeNow(now),
        detail: `Another citizen reported this same defect within ${distanceMeters.toFixed(1)} meters. Consolidated and endorsed active ticket ${duplicateIssue.ticketId}.`,
        badge: 'Duplicate Linked',
        timestamp: now,
      });

      const updatedDuplicate = await duplicateIssue.save();
      const clientPayload = sanitizeIssueForClient(updatedDuplicate);

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        ticketId: duplicateIssue.ticketId,
        originalTicketId: duplicateIssue.ticketId,
        location_name: clientPayload.location_name,
        distanceMeters,
        duplicateDistance: distanceMeters,
        duplicateCount: duplicateIssue.duplicateCount,
        message: `Duplicate complaint detected within ${distanceMeters.toFixed(1)}m. Linked to active ticket ${duplicateIssue.ticketId}.`,
        data: clientPayload,
        issue: clientPayload,
      });
    }

    // 3. CORE TASK 2: Reverse Geocoding Integration (Convert raw coordinates to human-readable location_name)
    const locationName = await reverseGeocode(lat, lng);

    const ticketId = customTicketId || (await generateTicketId());
    const now = new Date();
    const timeString = formatTimeNow(now);

    const initialTimeline = [
      {
        status: 'reported',
        title: 'Report Logged & Saved in MongoDB',
        time: timeString,
        detail: 'Citizen captured photographic defect evidence; complaint verified and stored in MongoDB database.',
        badge: 'Citizen Filed',
        timestamp: now,
      },
    ];

    const DEPT_MAP = {
      water_leak: 'Water Supply & Sewerage Board (BWSSB)',
      garbage: 'Solid Waste Management (SWM)',
      streetlight: 'Electricity Supply Company (BESCOM)',
      drainage: 'Stormwater Drain & Sewerage Department',
      pothole: 'Roads & Infrastructure Department',
    };

    const CATEGORY_NAMES = {
      water_leak: 'Water Main Burst & Pipeline Leak',
      garbage: 'Solid Waste Dump',
      streetlight: 'Damaged Streetlight',
      drainage: 'Clogged Storm Drain',
      pothole: 'Pothole',
    };

    const DEFAULT_TITLES = {
      water_leak: 'Pressurized Water Pipeline Rupture & Leak',
      garbage: 'Overflowing Municipal Waste Dump',
      streetlight: 'Defective Public Streetlight Fixture',
      drainage: 'Blocked Monsoon Stormwater Drain',
      pothole: 'Severe Asphalt Pothole Cavity',
    };

    let finalDepartment = department;
    if (!finalDepartment || (finalDepartment === 'Roads & Infrastructure Department' && finalCategory !== 'pothole')) {
      finalDepartment = DEPT_MAP[finalCategory] || 'Roads & Infrastructure Department';
    }

    let finalCategoryName = categoryName || CATEGORY_NAMES[finalCategory] || 'Civic Defect';
    if (finalCategory === 'water_leak' && (!categoryName || categoryName === 'Pothole')) {
      finalCategoryName = CATEGORY_NAMES.water_leak;
    }

    let finalTitle = title;
    if (!finalTitle || (finalTitle.includes('Pothole') && finalCategory !== 'pothole')) {
      finalTitle = DEFAULT_TITLES[finalCategory] || `${finalCategoryName} Defect`;
    }

    // Store raw lat/lon securely in database strictly for calculations, but expose location_name
    const newIssue = new Issue({
      ticketId,
      title: finalTitle,
      category: finalCategory,
      categoryName: finalCategoryName,
      description: description || '',
      imageUrl,
      location_name: locationName,
      location: {
        location_name: locationName,
        address: location?.address || locationName,
        ward: location?.ward || 'Ward 151, Koramangala',
        lat,
        lng,
        distance: location?.distance || 'Nearby',
      },
      geo: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      priority: priority || (finalCategory === 'water_leak' ? 'High' : 'Medium'),
      confidence: confidence || 96.5,
      department: finalDepartment,
      status: 'reported',
      reportedBy: {
        id: req.body.reportedBy?.id || req.body.userId || null,
        name: req.body.reportedBy?.name || req.body.userName || 'Citizen Reporter',
        email: (req.body.reportedBy?.email || req.body.userEmail || '').toLowerCase().trim() || null,
        phone: req.body.reportedBy?.phone || req.body.userPhone || null,
        deviceId: req.body.reportedBy?.deviceId || req.body.deviceId || null,
      },
      timeline: initialTimeline,
    });

    const savedIssue = await newIssue.save();
    const clientPayload = sanitizeIssueForClient(savedIssue);

    res.status(201).json({
      success: true,
      isDuplicate: false,
      ticketId: clientPayload.ticketId,
      location_name: clientPayload.location_name,
      message: 'Issue reported successfully',
      data: clientPayload,
      issue: clientPayload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. PUT /api/issues/:id - Update issue (by MongoDB _id or Ticket ID)
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If updating location, synchronize GeoJSON point coordinates
    if (updateData.location && updateData.location.lat != null && updateData.location.lng != null) {
      updateData.location.type = 'Point';
      updateData.location.coordinates = [
        Number(updateData.location.lng),
        Number(updateData.location.lat),
      ];
    }

    const filter = id.startsWith('SEVA-') ? { ticketId: id } : { _id: id };
    const issue = await Issue.findOneAndUpdate(filter, updateData, { new: true });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE /api/issues/:id - Delete issue
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByIdAndDelete(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    res.status(200).json({ success: true, message: 'Issue removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. POST /api/issues/:id/status - Status Lifecycle API (Forward only)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, detail, badge, resolvedImageUrl } = req.body;

    const validTransitions = {
      reported: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: [],
    };

    const issue = id.startsWith('SEVA-')
      ? await Issue.findOne({ ticketId: id })
      : await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const currentStatus = issue.status;
    const allowedNext = validTransitions[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'. Status progression must be forward-only.`,
      });
    }

    const now = new Date();
    const timeString = formatTimeNow(now);

    issue.status = status;
    if (resolvedImageUrl) {
      issue.resolvedImageUrl = resolvedImageUrl;
    }

    if (status === 'assigned') {
      issue.assignedAt = now;
    } else if (status === 'in_progress') {
      issue.workStartedAt = now;
    } else if (status === 'resolved') {
      issue.resolvedAt = now;
      issue.resolvedTimeReadable = timeString;
      issue.resolvedBy = req.body.resolvedBy || req.body.badge || 'Zonal Authority Official';
      issue.resolutionNotes = detail || title || 'Defect resolved and verified with photographic evidence.';
      if (issue.reportedAt) {
        issue.durationToResolveMinutes = Math.max(1, Math.round((now.getTime() - new Date(issue.reportedAt).getTime()) / 60000));
      }
    }

    const CATEGORY_STATUS_META = {
      water_leak: {
        assigned: {
          title: 'BWSSB Hydraulic Maintenance Squad Dispatched',
          detail: 'Dispatched Hydraulic Valve Unit with pipeline isolation key and replacement ductile iron sleeves.',
          badge: 'Squad Dispatched',
        },
        in_progress: {
          title: 'Main Valve Isolation & Pipeline Repair Active',
          detail: 'Engineering crew isolated distribution sluice valve and mounted heavy-duty repair sleeve with pressure testing.',
          badge: 'Active Repair',
        },
        resolved: {
          title: 'Water Pressure Restored & Zero-Leakage Certified',
          detail: 'BWSSB Zonal Engineer tested 4.2 bar mainline pressure, certified leak stoppage, and backfilled roadway trench.',
          badge: 'BWSSB Certified',
          resolvedImageUrl: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80',
        },
      },
      garbage: {
        assigned: {
          title: 'Sanitation Flying Squad & Compactor Dispatched',
          detail: 'Dispatched SWM Zonal Sanitation Crew with 4-ton compactor truck and mechanical loader.',
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
          resolvedImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        },
      },
      streetlight: {
        assigned: {
          title: 'BESCOM Electrical Maintenance Squad Dispatched',
          detail: 'Dispatched Power Infrastructure Crew with hydraulic cherry-picker and LED luminaire units.',
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
          resolvedImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        },
      },
      drainage: {
        assigned: {
          title: 'Stormwater Desilting & Super-Sucker Unit Dispatched',
          detail: 'Dispatched SWD Emergency Crew equipped with high-volume jetting and vacuum desilting vehicle.',
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
          resolvedImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        },
      },
      pothole: {
        assigned: {
          title: 'Road Maintenance Quick-Patch Squad Dispatched',
          detail: 'Dispatched Zonal Quick-Response Road Crew to site with hot-mix asphalt batch.',
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
          resolvedImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        },
      },
    };

    const catConfig = CATEGORY_STATUS_META[issue.category] || CATEGORY_STATUS_META.pothole;
    const catStage = catConfig[status] || {};

    const meta = {
      title: title || catStage.title || `Status advanced to ${status}`,
      detail: detail || catStage.detail || '',
      badge: badge || catStage.badge || 'Status Event',
    };

    if (status === 'resolved' && !issue.resolvedImageUrl) {
      issue.resolvedImageUrl = resolvedImageUrl || catStage.resolvedImageUrl || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
    }

    issue.timeline.push({
      status,
      title: meta.title,
      time: timeString,
      detail: meta.detail,
      badge: meta.badge,
      timestamp: now,
      performedBy: req.body.resolvedBy || req.body.authorityName || null,
    });

    const updatedIssue = await issue.save();
    res.status(200).json({ success: true, data: updatedIssue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. POST /api/issues/:id/upvote - Upvote API
exports.upvoteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;
    const deviceIdentifier = deviceId || req.ip || 'anonymous-device';

    const issue = id.startsWith('SEVA-')
      ? await Issue.findOne({ ticketId: id })
      : await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const hasUpvoted = issue.upvotedDevices.includes(deviceIdentifier);

    if (hasUpvoted) {
      issue.upvotedDevices = issue.upvotedDevices.filter((d) => d !== deviceIdentifier);
      issue.upvotes = Math.max(0, issue.upvotes - 1);
    } else {
      issue.upvotedDevices.push(deviceIdentifier);
      issue.upvotes += 1;
    }

    await issue.save();

    res.status(200).json({
      success: true,
      upvotes: issue.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
