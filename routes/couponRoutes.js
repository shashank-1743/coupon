const express = require('express');
const router = express.Router();
const { Coupon, Claim } = require('../models');
const crypto = require('crypto');

// Helper function to generate a cookie ID if not present
const ensureCookieId = (req, res) => {
  if (!req.cookies.couponUserId) {
    const cookieId = crypto.randomBytes(16).toString('hex');
    res.cookie('couponUserId', cookieId, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true 
    });
    return cookieId;
  }
  return req.cookies.couponUserId;
};

// Check if user can claim a coupon
const canUserClaim = async (ip, cookieId) => {
  const cooldownMinutes = parseInt(process.env.CLAIM_COOLDOWN_MINUTES) || 60;
  const cooldownTime = new Date(Date.now() - (cooldownMinutes * 60 * 1000));
  
  const recentClaim = await Claim.findOne({
    $or: [
      { ip_address: ip },
      { cookie_id: cookieId }
    ],
    claimed_at: { $gt: cooldownTime }
  });
  
  return !recentClaim;
};

// Get time remaining before user can claim again
const getTimeRemaining = async (ip, cookieId) => {
  const cooldownMinutes = parseInt(process.env.CLAIM_COOLDOWN_MINUTES) || 60;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  
  const recentClaim = await Claim.findOne({
    $or: [
      { ip_address: ip },
      { cookie_id: cookieId }
    ]
  }).sort({ claimed_at: -1 });
  
  if (!recentClaim) return 0;
  
  const claimTime = new Date(recentClaim.claimed_at).getTime();
  const currentTime = Date.now();
  const elapsedTime = currentTime - claimTime;
  
  if (elapsedTime >= cooldownMs) return 0;
  return Math.ceil((cooldownMs - elapsedTime) / 60000);
};

// Routes
router.post('/claim', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = ensureCookieId(req, res);
    
    const canClaim = await canUserClaim(ip, cookieId);
    if (!canClaim) {
      const minutesRemaining = await getTimeRemaining(ip, cookieId);
      return res.status(429).json({
        success: false,
        message: `You can claim another coupon in ${minutesRemaining} minutes.`,
        minutesRemaining
      });
    }
    
    // First try to find an unclaimed coupon
    let coupon = await Coupon.findOne({ is_claimed: false }).sort({ _id: 1 });
    
    // If all coupons are claimed, reset all coupons
    if (!coupon) {
      await Coupon.updateMany({}, { 
        is_claimed: false,
        claimed_at: null
      });
      
      // Try to get the first coupon again
      coupon = await Coupon.findOne({ is_claimed: false }).sort({ _id: 1 });
    }
    
    coupon.is_claimed = true;
    coupon.claimed_at = new Date();
    await coupon.save();
    
    await Claim.create({
      ip_address: ip,
      cookie_id: cookieId,
      coupon: coupon._id,
      claimed_at: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Coupon claimed successfully!',
      coupon: {
        code: coupon.code
      }
    });
  } catch (error) {
    console.error('Error claiming coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while claiming the coupon.'
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = req.cookies.couponUserId || '';
    
    const minutesRemaining = await getTimeRemaining(ip, cookieId);
    
    return res.status(200).json({
      canClaim: minutesRemaining === 0,
      minutesRemaining
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking claim status.'
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = req.cookies.couponUserId || '';
    
    const claims = await Claim.find({
      $or: [
        { ip_address: ip },
        { cookie_id: cookieId }
      ]
    }).populate('coupon').sort({ claimed_at: -1 });
    
    const claimedCoupons = claims.map(claim => ({
      code: claim.coupon ? claim.coupon.code : 'Unknown',
      claimedAt: claim.claimed_at
    }));
    
    return res.status(200).json({
      success: true,
      coupons: claimedCoupons
    });
  } catch (error) {
    console.error('Error fetching coupon history:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your coupon history.'
    });
  }
});

module.exports = router;