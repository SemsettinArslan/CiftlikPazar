const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  forgotPassword, 
  resetPassword,
  makeAdmin
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// DEV ONLY - Kullanıcıyı admin yapma (Prod'da kapatılmalı)
router.post('/make-admin', makeAdmin);

module.exports = router; 