const Issue = require('../models/Issue');

// Format current time as readable format e.g. "10:15 AM"
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

// 1. Get Issues with filtering, sorting, and nearby radius query
exports.getIssues = async (req, res) => {
  try {
    const { category, status, priority, lat, lng, radiusInMeters } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Optional geospatial query
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
    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Single Issue by ID or Ticket ID
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue =
      id.startsWith('SEVA-')
        ? await Issue.findOne({ ticketId: id })
        : await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Issue with 50m Spatial Redundancy Check (SRS FR-3.3, FR-4.1)
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
    } = req.body;

    if (!location || location.lat === undefined || location.lng === undefined) {
      return res.status(400).json({ success: false, message: 'Valid location coordinates (lat, lng) are required' });
    }

    const lng = parseFloat(location.lng);
    const lat = parseFloat(location.lat);

    // FR-3.3: Spatial redundancy check within 50-meter radius
    const nearbyDuplicate = await Issue.findOne({
      status: { $ne: 'resolved' },
      category: category,
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

    const ticketId = await generateTicketId();

    const initialTimeline = [
      {
        status: 'reported',
        title: 'Report Logged',
        time: formatTimeNow(),
        detail: 'Citizen captured defect evidence and AI Sentinel verified coordinates.',
        badge: 'Citizen Filed',
      },
    ];

    const newIssue = new Issue({
      ticketId,
      title: title || `${categoryName || 'Civic'} Defect Reported`,
      category,
      categoryName: categoryName || category,
      description: description || '',
      imageUrl,
      location: {
        address: location.address || 'Detected Location',
        ward: location.ward || 'Municipal Ward',
        lat,
        lng,
        distance: location.distance || '',
      },
      geo: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      priority: priority || 'Medium',
      confidence: confidence || 95.0,
      department: department || 'Municipal Corporation',
      status: 'reported',
      timeline: initialTimeline,
    });

    const savedIssue = await newIssue.save();

    res.status(201).json({
      success: true,
      data: savedIssue,
      isDuplicateWarning: Boolean(nearbyDuplicate),
      duplicateTicketId: nearbyDuplicate ? nearbyDuplicate.ticketId : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Status Lifecycle (Non-reversible progression: reported -> assigned -> in_progress -> resolved)
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

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const currentStatus = issue.status;
    const allowedNext = validTransitions[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'. Transitions must be forward-only.`,
      });
    }

    issue.status = status;
    if (resolvedImageUrl) {
      issue.resolvedImageUrl = resolvedImageUrl;
    }

    // Default timeline details according to SRS
    const defaultTimelineData = {
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
        detail: detail || 'Civic defect resolved and verified with after-repair photographic inspection.',
        badge: badge || 'Official Certified',
      },
    };

    const eventConfig = defaultTimelineData[status] || {
      title: title || `Status updated to ${status}`,
      detail: detail || '',
      badge: badge || 'Status Update',
    };

    issue.timeline.push({
      status,
      title: eventConfig.title,
      time: formatTimeNow(),
      detail: eventConfig.detail,
      badge: eventConfig.badge,
    });

    const updatedIssue = await issue.save();
    res.json({ success: true, data: updatedIssue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Upvote Issue (SRS FR-7.1, FR-7.2: One vote per user/device)
exports.upvoteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;

    const deviceIdentifier = deviceId || req.ip || 'anonymous-device';
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const hasUpvoted = issue.upvotedDevices.includes(deviceIdentifier);

    if (hasUpvoted) {
      // Toggle off upvote
      issue.upvotedDevices = issue.upvotedDevices.filter((d) => d !== deviceIdentifier);
      issue.upvotes = Math.max(0, issue.upvotes - 1);
    } else {
      // Add upvote
      issue.upvotedDevices.push(deviceIdentifier);
      issue.upvotes += 1;
    }

    await issue.save();

    res.json({
      success: true,
      upvotes: issue.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. 50-meter Duplicate Detection Query (SRS FR-3.3)
exports.checkDuplicate = async (req, res) => {
  try {
    const { lat, lng, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng parameters are required' });
    }

    const filter = {
      status: { $ne: 'resolved' },
      geo: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 50, // 50m
        },
      },
    };

    if (category) filter.category = category;

    const duplicate = await Issue.findOne(filter);

    res.json({
      success: true,
      hasDuplicate: Boolean(duplicate),
      duplicateIssue: duplicate || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
