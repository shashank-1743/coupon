require('dotenv').config({ path: '.env.production' });
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

const seedProductionCoupons = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected successfully');
    
    // Check if coupons already exist
    const existingCoupons = await Coupon.countDocuments();
    console.log(`Found ${existingCoupons} existing coupons`);
    
    if (existingCoupons > 0) {
      // Force reset - remove this if condition to always reset
      await Coupon.deleteMany({});
      await Claim.deleteMany({});
      console.log('Cleared existing coupons and claims');
    }
    
    // Create 20 sample coupons
    const coupons = [];
    for (let i = 0; i < 20; i++) {
      const code = generateCouponCode();
      coupons.push({
        code,
        is_claimed: false
      });
      console.log(`Generated coupon: ${code}`);
    }
    
    const insertedCoupons = await Coupon.insertMany(coupons);
    console.log(`Successfully inserted ${insertedCoupons.length} coupons`);
    
    // Verify insertion
    const finalCount = await Coupon.countDocuments();
    console.log(`Final coupon count: ${finalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production database:', error);
    console.error('Full error:', error.stack);
    process.exit(1);
  }
};

seedProductionCoupons();