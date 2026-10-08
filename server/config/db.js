const mongoose = require('mongoose');
const dns = require('node:dns');

// On Windows, Node.js can fail resolving MongoDB Atlas SRV records with ECONNREFUSED.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

const connectDB = async () => {
  const atlasURI = process.env.MONGO_URI;
  const localURI = 'mongodb://127.0.0.1:27017/sevasnap';

  // 1. Try connecting to configured URI (Atlas)
  if (atlasURI) {
    try {
      console.log('🔄 Attempting MongoDB Atlas connection...');
      const conn = await mongoose.connect(atlasURI, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      console.log(`📦 Database Name: ${conn.connection.name}`);
      return;
    } catch (atlasErr) {
      console.warn(`\n⚠️ MongoDB Atlas IP Whitelist Notice:`);
      console.warn(`   Atlas blocked connection because your current IP address is not whitelisted.`);
      console.warn(`   To fix Atlas: Cloud Atlas > Network Access > "+ Add IP Address" > "Allow from Anywhere (0.0.0.0/0)".`);
      console.warn(`🔄 Falling back to your local running MongoDB service on 127.0.0.1:27017...\n`);
    }
  }

  // 2. Automatic seamless fallback to local MongoDB
  try {
    const localConn = await mongoose.connect(localURI);
    console.log(`✅ Local MongoDB Connected Successfully: ${localConn.connection.host}`);
    console.log(`📦 Database Name: ${localConn.connection.name}`);
  } catch (localErr) {
    console.error(`❌ Could not connect to local MongoDB either: ${localErr.message}`);
  }
};

module.exports = connectDB;
