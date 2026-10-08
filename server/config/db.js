const mongoose = require('mongoose');
const dns = require('node:dns');

// On Windows and custom ISPs, Node.js often fails resolving MongoDB Atlas SRV records with ECONNREFUSED.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  console.warn('DNS server adjustment note:', e.message);
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log(`✅ MongoDB Connected to: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

const connectDB = async () => {
  const atlasURI = process.env.MONGO_URI;
  const localURI = 'mongodb://127.0.0.1:27017/sevasnap';

  // 1. Try connecting to configured URI (Atlas)
  if (atlasURI) {
    try {
      console.log('🔄 Attempting MongoDB Atlas connection...');
      const conn = await mongoose.connect(atlasURI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
      console.log(`📦 Database Name: ${conn.connection.name}`);
      return conn;
    } catch (atlasErr) {
      console.warn(`\n⚠️ MongoDB Atlas Connection Note: ${atlasErr.message}`);
      console.warn(`   Make sure your current IP address is whitelisted in MongoDB Atlas.`);
      console.warn(`   Cloud Atlas > Network Access > "+ Add IP Address" > "Allow from Anywhere (0.0.0.0/0)".`);
      console.warn(`🔄 Attempting fallback connection to local MongoDB service on 127.0.0.1:27017...\n`);
    }
  }

  // 2. Automatic seamless fallback to local MongoDB
  try {
    const localConn = await mongoose.connect(localURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ Local MongoDB Connected Successfully: ${localConn.connection.host}`);
    console.log(`📦 Database Name: ${localConn.connection.name}`);
    return localConn;
  } catch (localErr) {
    console.warn(`⚠️ Local MongoDB service not active on 127.0.0.1:27017: ${localErr.message}`);
  }
};

module.exports = connectDB;
