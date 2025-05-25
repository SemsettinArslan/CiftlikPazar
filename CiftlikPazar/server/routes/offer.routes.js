const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offer.controller');
const { protect, authorize } = require('../middleware/auth');

// Teklif oluşturma
router.post('/', protect, authorize('farmer'), offerController.createOffer);

// Çiftçinin tekliflerini getirme
router.get('/my-offers', protect, authorize('farmer'), offerController.getFarmerOffers);

// Teklif detayını getirme
router.get('/:id', protect, offerController.getOfferById);

// Teklifi kabul etme ve reddetme
router.put('/:id/accept', protect, authorize('company'), offerController.acceptOffer);
router.put('/:id/reject', protect, authorize('company'), offerController.rejectOffer);

module.exports = router; 