const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  toggleFavorite,
  forgotPassword,
  resetPassword,
  updateProfile
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/profile', protect, updateProfile);

// Şifre sıfırlama route'ları
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);

// Adres route'ları
router.post('/address', protect, addAddress);
router.put('/address/:id', protect, updateAddress);
router.delete('/address/:id', protect, deleteAddress);

// Favori route'ları
router.put('/favorites/:productId', protect, toggleFavorite);

module.exports = router; 