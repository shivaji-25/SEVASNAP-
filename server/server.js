const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Enable JSON & URL-encoded request body parsing (with 15MB limit for photos)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static defect uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root health check endpoint
app.get('/', (req, res) => {
  res.send('SEVASNAP — AI-Powered Civic Intelligence Backend API is Active');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SEVASNAP Backend',
    timestamp: new Date().toISOString(),
  });
});

// Register REST API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/authority', require('./routes/authorityRoutes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Uncaught Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 SEVASNAP Server running on http://localhost:${PORT}`);
});
