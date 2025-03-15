const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  is_claimed: { type: Boolean, default: false, index: true },
  claimed_at: { type: Date, default: null }
});

couponSchema.index({ is_claimed: 1, _id: 1 });

module.exports = mongoose.model('Coupon', couponSchema);