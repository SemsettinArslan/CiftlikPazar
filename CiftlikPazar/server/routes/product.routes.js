const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const productController = require('../controllers/product.controller');

// Tüm ürünleri getir
router.get('/', productController.getProducts);

// Ürün detayını getir
router.get('/:id', productController.getProductById);

// Yeni ürün ekle (sadece çiftçiler)
router.post('/', protect, authorize('farmer'), productController.createProduct);

// Ürün güncelle (sadece ürünü ekleyen çiftçi)
router.put('/:id', protect, authorize('farmer'), productController.updateProduct);

// Ürün sil (sadece ürünü ekleyen çiftçi veya admin)
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router; 