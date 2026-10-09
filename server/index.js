const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 image payloads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve uploaded image assets statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base Route
app.get('/', (req, res) => {
  res.send('SEVASNAP AI-Powered Civic Intelligence API is running');
});

const mongoose = require('mongoose');

// Health check route reporting live MongoDB connection state
app.get('/api/health', async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  let totalIssues = 0;
  if (isConnected) {
    try {
      const Issue = require('./models/Issue');
      totalIssues = await Issue.countDocuments();
    } catch {
      // Ignore count error
    }
  }

  res.json({
    status: 'OK',
    service: 'SEVASNAP Backend',
    database: {
      connected: isConnected,
      status: isConnected ? 'Connected' : 'Connecting/Offline',
      name: mongoose.connection.name || 'sevasnap',
      host: mongoose.connection.host || 'MongoDB Atlas',
      totalComplaintsStored: totalIssues,
    },
    timestamp: new Date().toISOString(),
  });
});

// Simulated AI Triage Endpoint (SRS Section 8.2 item 5 & FR-3.1)
app.post('/api/ai-triage', (req, res) => {
  const { categoryPreset, imageUrl } = req.body;

  const presets = {
    pothole: {
      category: 'pothole',
      categoryName: 'Pothole',
      priority: 'High',
      confidence: 97.4,
      department: 'Roads & Infrastructure Department',
      description: 'Severe asphalt surface depression detected posing vehicular hazard.',
    },
    garbage: {
      category: 'garbage',
      categoryName: 'Overflowing Waste Dump',
      priority: 'Medium',
      confidence: 96.2,
      department: 'Solid Waste Management (SWM)',
      description: 'Municipal dumpster overflow with perimeter litter dispersion.',
    },
    water_leak: {
      category: 'water_leak',
      categoryName: 'Water Pipeline Burst',
      priority: 'High',
      confidence: 98.7,
      department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
      description: 'Pressurized water main rupture causing surface water accumulation.',
    },
    streetlight: {
      category: 'streetlight',
      categoryName: 'Damaged Streetlight',
      priority: 'Low',
      confidence: 94.1,
      department: 'Electricity Supply Company (BESCOM)',
      description: 'Illumination failure or physical pole structural damage.',
    },
    drainage: {
      category: 'drainage',
      categoryName: 'Clogged Storm Drain',
      priority: 'High',
      confidence: 95.8,
      department: 'Stormwater Drain Department',
      description: 'Debris blockage preventing active stormwater surface drainage.',
    },
  };

  const triageResult = presets[categoryPreset] || presets.pothole;
  res.json({
    success: true,
    data: triageResult,
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/authority', require('./routes/statsRoutes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SEVASNAP Server listening on port ${PORT}`);
});
