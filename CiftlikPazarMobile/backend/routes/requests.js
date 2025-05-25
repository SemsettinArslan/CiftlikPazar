const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requests');
const { protect, authorize } = require('../middleware/auth');

// Talep oluşturma ve firma talepleri
router.post('/', protect, authorize('company'), requestController.createRequest);
router.get('/my-requests', protect, authorize('company'), requestController.getCompanyRequests);
router.get('/my-requests/:id', protect, authorize('company'), requestController.getCompanyRequestById);
router.put('/my-requests/:id', protect, authorize('company'), requestController.updateRequest);
router.delete('/my-requests/:id', protect, authorize('company'), requestController.deleteRequest);
router.put('/my-requests/:id/cancel', protect, authorize('company'), requestController.cancelRequest);

// Talep teklifleri
router.get('/my-requests/:id/offers', protect, authorize('company'), requestController.getRequestOffers);
router.put('/:requestId/offers/:offerId/accept', protect, authorize('company'), requestController.acceptOffer);
router.put('/:requestId/offers/:offerId/reject', protect, authorize('company'), requestController.rejectOffer);

// Çiftçi için talepler
router.get('/available', protect, authorize('farmer'), requestController.getAvailableRequests);
router.post('/:requestId/offers', protect, authorize('farmer'), requestController.createOffer);
router.get('/farmer/offers', protect, authorize('farmer'), requestController.getFarmerOffers);

module.exports = router; 