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

// Kullanıcı kontrol route'ları
router.get('/check-email', async (req, res) => {
  try {
    const User = require('../models/User');
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ exists: false, message: 'E-posta adresi gereklidir' });
    }
    const user = await User.findOne({ email });
    return res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('E-posta kontrol hatası:', error);
    return res.status(500).json({ exists: false, message: 'Sunucu hatası' });
  }
});

router.get('/check-phone', async (req, res) => {
  try {
    const User = require('../models/User');
    const phone = req.query.phone;
    if (!phone) {
      return res.status(400).json({ exists: false, message: 'Telefon numarası gereklidir' });
    }
    const user = await User.findOne({ phone });
    return res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Telefon kontrol hatası:', error);
    return res.status(500).json({ exists: false, message: 'Sunucu hatası' });
  }
});

module.exports = router; 