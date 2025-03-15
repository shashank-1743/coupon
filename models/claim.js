const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  ip_address: {
    type: String,
    required: true,
  },
  cookie_id: {
    type: String,
    required: true,
  },
  claimed_at: {
    type: Date,
    default: Date.now,
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
});

module.exports = mongoose.model('Claim', claimSchema);