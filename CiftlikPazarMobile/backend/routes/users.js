const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateUserProfile,
  getDeliveryAddresses,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  uploadProfileImage
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Kullanıcı profili route'ları
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/profile/upload-image', protect, uploadProfileImage);

// Teslimat adresleri route'ları
router.get('/delivery-addresses', protect, getDeliveryAddresses);
router.post('/delivery-addresses', protect, addDeliveryAddress);
router.put('/delivery-addresses/:id', protect, updateDeliveryAddress);
router.delete('/delivery-addresses/:id', protect, deleteDeliveryAddress);

module.exports = router; 