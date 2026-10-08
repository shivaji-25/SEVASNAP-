const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.send('SEVASNAP API Server');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SEVASNAP Server is running smoothly' });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sevasnap';
if (process.env.MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('MONGO_URI not set in environment. Skipping database connection for now.');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
