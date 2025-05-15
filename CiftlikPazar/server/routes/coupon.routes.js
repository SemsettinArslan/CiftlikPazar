const express = require('express');
const router = express.Router();
const {
  getCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCoupon,
  useCoupon
} = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth');

// Admin erişimi gerektiren rotalar
router.route('/')
  .get(protect, authorize('admin'), getCoupons)
  .post(protect, authorize('admin'), createCoupon);

router.route('/:id')
  .get(protect, authorize('admin'), getCouponById)
  .put(protect, authorize('admin'), updateCoupon)
  .delete(protect, authorize('admin'), deleteCoupon);

// Herkese açık veya normal kullanıcı erişimi
router.post('/check', checkCoupon);
router.put('/use/:id', protect, useCoupon);

module.exports = router; 