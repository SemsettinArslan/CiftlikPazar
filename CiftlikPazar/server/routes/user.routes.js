const express = require('express');
const { 
  updateProfile, 
  getProfile, 
  uploadProfileImage,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddresses,
  getUserStats
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Profil işlemleri
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/upload-image', protect, uploadProfileImage);

// Teslimat adresi işlemleri
router.get('/delivery-addresses', protect, getDeliveryAddresses);
router.post('/delivery-addresses', protect, addDeliveryAddress);
router.put('/delivery-addresses/:id', protect, updateDeliveryAddress);
router.delete('/delivery-addresses/:id', protect, deleteDeliveryAddress);

// Admin istatistikleri
router.get('/stats', protect, authorize('admin'), getUserStats);

module.exports = router; 