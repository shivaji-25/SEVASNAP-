const mongoose = require('mongoose');

// Timeline Event Schema (SRS Section 6.2)
const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['reported', 'assigned', 'in_progress', 'resolved'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  time: {
    type: String, // Human-readable timestamp (e.g., "10:15 AM")
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  badge: {
    type: String, // e.g., "Citizen Filed", "Crew Dispatched", "Work in Progress", "Official Certified"
    default: 'Civic Log',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  performedBy: {
    type: String,
    default: null,
  },
});

// Issue Item Schema (SRS Section 6.1)
const issueSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['pothole', 'garbage', 'water_leak', 'streetlight', 'drainage'],
      index: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    resolvedImageUrl: {
      type: String,
      default: null,
    },
    location_name: {
      type: String,
      default: '',
    },
    location: {
      location_name: { type: String, default: 'Street Location' },
      address: { type: String, default: 'Street Location' },
      ward: { type: String, default: 'Ward 151, Koramangala' },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      distance: { type: String, default: '' },
    },
    // GeoJSON Point for MongoDB 2dsphere Geospatial Index (50m duplicate check & nearby queries)
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 95.0,
    },
    department: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['reported', 'assigned', 'in_progress', 'resolved'],
      default: 'reported',
      index: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    workStartedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true,
    },
    resolvedTimeReadable: {
      type: String,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: null,
    },
    durationToResolveMinutes: {
      type: Number,
      default: null,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedDevices: {
      type: [String],
      default: [],
    },
    // Duplicate Tracking & Consolidated Proximity Linkage
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    originalTicketId: {
      type: String,
      default: null,
    },
    linkedReports: [
      {
        reportId: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        description: { type: String, default: '' },
        reportedAt: { type: Date, default: Date.now },
        distanceMeters: { type: Number, default: 0 },
        reportedBy: {
          id: { type: String, default: null },
          name: { type: String, default: null },
          phone: { type: String, default: null },
        },
      },
    ],
    reportedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      deviceId: { type: String, default: null },
    },
    timeline: [timelineEventSchema],
  },
  {
    timestamps: true,
  }
);

// 2dsphere index on GeoJSON coordinates for spatial queries (<50m redundancy check)
issueSchema.index({ geo: '2dsphere' });

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
