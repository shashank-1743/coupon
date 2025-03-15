require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./models/coupon');
const Claim = require('./models/claim');
const connectDB = require('./config/database');

const generateCouponCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const seedCoupons = async () => {
  try {
    await connectDB();
    
    // Clear existing coupons and claims
    await Promise.all([
      Coupon.deleteMany({}),
      Claim.deleteMany({})
    ]);
    
    // Create 20 sample coupons
    const coupons = [];
    for (let i = 0; i < 2; i++) {
      coupons.push({
        code: generateCouponCode(),
        is_claimed: false
      });
    }
    
    await Coupon.insertMany(coupons);
    console.log('Database reset: All coupons and claims history cleared');
    console.log('New coupons seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedCoupons();