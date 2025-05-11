const express = require('express');
const {
  getOrders,
  getMyOrders,
  getSellerOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderNote,
  updateSellerNote
} = require('../controllers/orders');

const Order = require('../models/Order');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Tüm route'lar için koruma
router.use(protect);

// Kullanıcı siparişleri
router.get('/myorders', getMyOrders);

// Satıcı siparişleri
router.get('/sellerorders', authorize('farmer', 'admin'), getSellerOrders);

// Sipariş durumu güncelleme
router.put('/:id/status', authorize('farmer', 'admin'), updateOrderStatus);

// Sipariş ödeme durumu güncelleme
router.put('/:id/pay', authorize('admin'), updateOrderPayment);

// Sipariş notu güncelleme
router.put('/:id/note', updateOrderNote);

// Satıcı notu güncelleme
router.put('/:id/sellernote', authorize('farmer', 'admin'), updateSellerNote);

// Sipariş route'ları
router
  .route('/')
  .get(
    authorize('admin'),
    advancedResults(Order, { path: 'user', select: 'name email' }),
    getOrders
  )
  .post(createOrder);

router
  .route('/:id')
  .get(getOrder);

module.exports = router; 