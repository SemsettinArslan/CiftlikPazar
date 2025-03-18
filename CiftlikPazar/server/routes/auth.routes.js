const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router; 