const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');

// Talep oluşturma ve firma talepleri
router.post('/', protect, authorize('company'), requestController.createRequest);
router.get('/my-requests', protect, authorize('company'), requestController.getCompanyRequests);
router.get('/my-requests/:id', protect, authorize('company'), requestController.getCompanyRequestById);
router.put('/my-requests/:id', protect, authorize('company'), requestController.updateRequest);
router.delete('/my-requests/:id', protect, authorize('company'), requestController.deleteRequest);

// Çiftçi için talepler
router.get('/available', protect, authorize('farmer'), requestController.getAvailableRequests);
router.post('/:id/offers', protect, authorize('farmer'), requestController.createOffer);
router.put('/offers/:offerId', protect, authorize('farmer'), requestController.updateOffer);
router.delete('/offers/:offerId', protect, authorize('farmer'), requestController.deleteOffer);
router.get('/my-offers', protect, authorize('farmer'), requestController.getFarmerOffers);

// Firma için teklif yönetimi
router.get('/:id/offers', protect, authorize('company'), requestController.getRequestOffers);
router.put('/:id/offers/:offerId/accept', protect, authorize('company'), requestController.acceptOffer);
router.put('/:id/offers/:offerId/reject', protect, authorize('company'), requestController.rejectOffer);

// Genel talepler (yetkilendirilmiş tüm kullanıcılar için)
router.get('/', protect, requestController.getAllRequests);
router.get('/:id', protect, requestController.getRequestById);

module.exports = router; 