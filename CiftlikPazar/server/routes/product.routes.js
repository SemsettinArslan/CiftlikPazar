const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const productController = require('../controllers/product.controller');

// Tüm ürünleri getir
router.get('/', productController.getProducts);

// Öne çıkan ürünleri getir
router.get('/featured', productController.getFeaturedProducts);

// Belirli bir çiftçiye ait ürünleri getir
router.get('/farmer/:farmerId', productController.getProductsByFarmer);

// Ürün detayını getir - EN SON tanımlanmalı (yakalayıcı route)
router.get('/:id', productController.getProductById);

// Yeni ürün ekle (sadece çiftçiler)
router.post('/', protect, authorize('farmer'), productController.createProduct);

// Ürün güncelle (sadece ürünü ekleyen çiftçi)
router.put('/:id', protect, authorize('farmer'), productController.updateProduct);

// Ürün sil (sadece ürünü ekleyen çiftçi veya admin)
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router; 