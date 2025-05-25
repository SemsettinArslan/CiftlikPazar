const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

// Kullanıcı siparişleri
router.route('/')
  .post(protect, orderController.createOrder)
  .get(protect, authorize('admin'), orderController.getAllOrders);

// Kullanıcının kendi siparişleri
router.route('/myorders')
  .get(protect, orderController.getMyOrders);

// Çiftçinin siparişleri
router.route('/sellerorders')
  .get(protect, authorize('farmer'), orderController.getSellerOrders);

// Sipariş istatistikleri (Admin)
router.route('/stats')
  .get(protect, authorize('admin'), orderController.getOrderStats);

// Sipariş detayı ve durum güncelleme
router.route('/:id')
  .get(protect, orderController.getOrderById);

router.route('/:id/status')
  .put(protect, authorize('admin', 'farmer'), orderController.updateOrderStatus);

module.exports = router; 