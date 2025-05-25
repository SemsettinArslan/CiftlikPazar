const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerCompany,
  getCompanyProfile,
  updateCompany,
  getPendingCompanies,
  getApprovedCompanies,
  getRejectedCompanies,
  approveCompany
} = require('../controllers/companies');

// Firma kayıt
router.post('/register', registerCompany);

// Firma profili işlemleri
router.get('/profile', protect, authorize('company'), getCompanyProfile);
router.put('/update', protect, authorize('company'), updateCompany);

// Admin firma listeleme ve onaylama işlemleri
router.get('/pending', protect, authorize('admin'), getPendingCompanies);
router.get('/approved', protect, authorize('admin'), getApprovedCompanies);
router.get('/rejected', protect, authorize('admin'), getRejectedCompanies);
router.put('/:id/approve', protect, authorize('admin'), approveCompany);

module.exports = router; 