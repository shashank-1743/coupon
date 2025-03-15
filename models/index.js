const connectDB = require('../config/database');
const Coupon = require('./coupon');
const Claim = require('./claim');

connectDB();

module.exports = {
  Coupon,
  Claim,
};