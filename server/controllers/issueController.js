const Issue = require('../models/Issue');

// Format current time as readable string e.g. "10:15 AM"
const formatTimeNow = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
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
    res.status(200).json({ success: true, count: issues.length, data: issues });
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
    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/issues/check-duplicate - 50-meter duplicate detection query using MongoDB 2dsphere
exports.checkDuplicateIssue = async (req, res) => {
  try {
    const { lat, lng, category } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required for duplicate check' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const filter = {
      status: { $ne: 'resolved' },
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50, // 50-meter threshold
        },
      },
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const duplicate = await Issue.findOne(filter);

    if (duplicate) {
      return res.status(200).json({
        success: true,
        hasDuplicate: true,
        message: `Existing active report (${duplicate.ticketId}) found within 50 meters.`,
        duplicateIssue: duplicate,
      });
    }

    res.status(200).json({
      success: true,
      hasDuplicate: false,
      message: 'No duplicate reports found within 50 meters.',
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

    res.status(200).json({ success: true, data: issue });
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

    const lat = location && location.lat !== undefined ? parseFloat(location.lat) : 12.9352;
    const lng = location && location.lng !== undefined ? parseFloat(location.lng) : 77.6245;

    // MODULE 9: Duplicate detection query within 50 meters
    let duplicateWarning = null;
    try {
      const existingNearby = await Issue.findOne({
        status: { $ne: 'resolved' },
        category: category || 'pothole',
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: 50, // 50 meters
          },
        },
      });

      if (existingNearby) {
        duplicateWarning = {
          hasDuplicate: true,
          ticketId: existingNearby.ticketId,
          distance: 'within 50 meters',
          message: `Active report (${existingNearby.ticketId}) already exists at this location.`,
        };
      }
    } catch (geoErr) {
      console.warn('Geospatial check note:', geoErr.message);
    }

    const ticketId = customTicketId || (await generateTicketId());

    const initialTimeline = [
      {
        status: 'reported',
        title: 'Report Logged',
        time: formatTimeNow(),
        detail: 'Citizen captured defect evidence and AI Sentinel verified coordinates.',
        badge: 'Citizen Filed',
      },
    ];

    // Intelligent category & municipal department routing
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

    const newIssue = new Issue({
      ticketId,
      title: finalTitle,
      category: finalCategory,
      categoryName: finalCategoryName,
      description: description || '',
      imageUrl,
      location: {
        address: location?.address || 'Koramangala 4th Block, Bengaluru',
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
      timeline: initialTimeline,
    });

    const savedIssue = await newIssue.save();

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: savedIssue,
      duplicateWarning,
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

    issue.status = status;
    if (resolvedImageUrl) {
      issue.resolvedImageUrl = resolvedImageUrl;
    }

    const defaultTimelineMeta = {
      assigned: {
        title: title || 'Field Squad Dispatched',
        detail: detail || 'Assigned to Ward Quick-Response Engineering Squad.',
        badge: badge || 'Crew Assigned',
      },
      in_progress: {
        title: title || 'Repair In Progress',
        detail: detail || 'Field crew deployed on location with repair equipment.',
        badge: badge || 'Crew Active',
      },
      resolved: {
        title: title || 'Resolution Certified',
        detail: detail || 'Civic defect resolved and verified with after-repair photographic evidence.',
        badge: badge || 'Official Certified',
      },
    };

    const meta = defaultTimelineMeta[status] || {
      title: title || `Status advanced to ${status}`,
      detail: detail || '',
      badge: badge || 'Status Event',
    };

    issue.timeline.push({
      status,
      title: meta.title,
      time: formatTimeNow(),
      detail: meta.detail,
      badge: meta.badge,
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
