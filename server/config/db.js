const mongoose = require('mongoose');
const dns = require('node:dns');

// On Windows, Node.js can fail resolving MongoDB Atlas SRV records with ECONNREFUSED.
// Setting public DNS servers (Google/Cloudflare) ensures Atlas SRV records resolve smoothly.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if unable to set custom DNS servers
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sevasnap';
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
