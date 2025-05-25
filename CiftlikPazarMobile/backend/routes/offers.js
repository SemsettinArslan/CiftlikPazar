const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const offersController = require('../controllers/offers');

// Teklif oluşturma
router.post('/', protect, authorize('farmer'), offersController.createOffer);

// Çiftçinin kendi tekliflerini getirme
router.get('/my-offers', protect, authorize('farmer'), offersController.getFarmerOffers);

// Teklif detayını getirme
router.get('/:id', protect, offersController.getOfferById);

// Teklifi güncelleme (sadece bekleyen teklifler için)
router.put('/:id', protect, authorize('farmer'), offersController.updateOffer);

// Teklifi iptal etme
router.delete('/:id', protect, authorize('farmer'), offersController.deleteOffer);

module.exports = router; 