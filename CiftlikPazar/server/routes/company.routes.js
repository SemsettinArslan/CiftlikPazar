const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Firma kayıt
router.post('/register', companyController.registerCompany);

// Firma profili işlemleri (giriş yapmış firma için)
router.get('/profile', protect, authorize('company'), companyController.getCompanyProfile);
router.put('/profile', protect, authorize('company'), companyController.updateCompanyProfile);
router.put('/update', protect, authorize('company'), companyController.updateCompany);
router.put(
  '/upload-image',
  protect,
  authorize('company'),
  upload.single('image'),
  companyController.uploadCompanyImage
);

// Admin işlemleri
router.get('/', protect, authorize('admin'), companyController.getAllCompanies);
router.put('/:id/approval', protect, authorize('admin'), companyController.updateCompanyApproval);

// Genel firma detay bilgisi
router.get('/:id', protect, companyController.getCompanyById);

module.exports = router; 