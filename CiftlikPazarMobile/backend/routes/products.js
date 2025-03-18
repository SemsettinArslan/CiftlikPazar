const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  productImageUpload,
  addProductRating,
  updateProductRating,
  deleteProductRating
} = require('../controllers/products');

const Product = require('../models/Product');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Ürün değerlendirme route'ları
router
  .route('/:id/ratings')
  .post(protect, addProductRating);

router
  .route('/:id/ratings/:ratingId')
  .put(protect, updateProductRating)
  .delete(protect, deleteProductRating);

// Ürün resmi yükleme route'u
router
  .route('/:id/image')
  .put(
    protect, 
    authorize('seller', 'admin'),
    uploadMultiple('images'),
    uploadErrorHandler,
    productImageUpload
  );

// Ürün route'ları
router
  .route('/')
  .get(
    advancedResults(Product, [
      { path: 'category', select: 'name slug' },
      { path: 'seller', select: 'name' }
    ]),
    getProducts
  )
  .post(protect, authorize('seller', 'admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router; 