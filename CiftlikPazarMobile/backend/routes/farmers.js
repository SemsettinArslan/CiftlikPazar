const express = require('express');
const { 
  registerFarmer, 
  getFarmer, 
  getMyFarm, 
  completeRegistration,
  getAllFarmers,
  getPendingFarmers,
  approveFarmer,
  addCertificate,
  getCertificates,
  deleteCertificate,
  verifyCertificate,
  updateFarm
} = require('../controllers/farmers');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Public çiftçi rotaları 
router.post('/complete-registration', completeRegistration);

// Çiftçi profili rotaları
router.route('/me')
  .get(protect, authorize('farmer'), getMyFarm);

// Çiftçi profil güncelleme
router.route('/update-profile')
  .put(protect, authorize('farmer'), updateFarm);

// Admin rotaları - ÖNEMLİ: Spesifik rotalar /:id gibi genel rotalardan ÖNCE gelmeli
router.route('/pending')
  .get(protect, authorize('admin'), getPendingFarmers);
  
router.route('/:id/approve')
  .put(protect, authorize('admin'), approveFarmer);

// Tüm çiftçileri getir
router.route('/')
  .get(protect, authorize('admin'), getAllFarmers)
  .post(protect, registerFarmer);

// Sertifika rotaları
router.route('/:id/certificates')
  .get(getCertificates)
  .post(protect, authorize('farmer'), uploadSingle('image'), uploadErrorHandler, addCertificate);

router.route('/:id/certificates/:certificateId')
  .delete(protect, authorize('farmer'), deleteCertificate);

router.route('/:id/certificates/:certificateId/verify')
  .put(protect, authorize('admin'), verifyCertificate);

// ID ile çiftçi getir - Bu en sonda olmalı çünkü en genel rota
router.route('/:id')
  .get(getFarmer);

module.exports = router; 