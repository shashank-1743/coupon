require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbName = 'coupon_db';
    const options = {
      dbName: dbName // Force the database name
    };
    
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB connected to database: ${dbName}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;