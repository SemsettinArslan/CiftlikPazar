const express = require('express');
const { 
  registerFarmer, 
  getFarmer, 
  getMyFarm, 
  registerFarmerPublic,
  completeRegistration,
  getAllFarmers,
  getPendingFarmers,
  approveFarmer,
  addCertificate,
  getCertificates,
  deleteCertificate,
  verifyCertificate,
  createFarmerRecordForExistingUser,
  updateFarmer,
  getPublicFarmers
} = require('../controllers/farmer.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public çiftçi rotaları - Aktif olarak kullanılan
router.post('/complete-registration', completeRegistration);
router.get('/public', getPublicFarmers);

// Eski kayıt rotaları - Artık kullanılmıyor
// router.post('/public', registerFarmerPublic);
// router.post('/', protect, registerFarmer);

// Admin/Debug - Eksik çiftçi kaydı oluşturma
router.post('/admin/create-farmer-record', protect, authorize('admin'), createFarmerRecordForExistingUser);

// Çiftçi profili güncelleme
router.put('/update', protect, authorize('farmer'), updateFarmer);

// Çiftçi profili rotaları
router.route('/me')
  .get(protect, authorize('farmer'), getMyFarm);

// Admin rotaları - ÖNEMLİ: Spesifik rotalar /:id gibi genel rotalardan ÖNCE gelmeli
router.route('/pending')
  .get(protect, authorize('admin'), getPendingFarmers);
  
router.route('/:id/approve')
  .put(protect, authorize('admin'), approveFarmer);

// Tüm çiftçileri getir
router.route('/')
  .get(protect, authorize('admin'), getAllFarmers);

// Sertifika rotaları
router.route('/:id/certificates')
  .get(protect, getCertificates)
  .post(protect, authorize('farmer'), addCertificate);

router.route('/:id/certificates/:certificateId')
  .delete(protect, authorize('farmer'), deleteCertificate);

router.route('/:id/certificates/:certificateId/verify')
  .put(protect, authorize('admin'), verifyCertificate);

// ID ile çiftçi getir - Bu en sonda olmalı çünkü en genel rota
router.route('/:id')
  .get(getFarmer);

module.exports = router; 