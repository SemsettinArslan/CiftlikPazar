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
const { uploadSingle, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Ürün değerlendirme route'ları
router
  .route('/:id/ratings')
  .post(protect, addProductRating)
  .put(protect, updateProductRating)
  .delete(protect, deleteProductRating);

// Ürün resmi yükleme route'u
router
  .route('/:id/image')
  .put(
    protect, 
    authorize('farmer', 'admin'),
    uploadSingle('image'),
    uploadErrorHandler,
    productImageUpload
  );

// Ürün route'ları
router
  .route('/')
  .get(
    advancedResults(Product, [
      { path: 'category', select: 'name slug' },
      { path: 'farmer', select: 'name farmName' }
    ]),
    getProducts
  )
  .post(protect, authorize('farmer', 'admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('farmer', 'admin'), updateProduct)
  .delete(protect, authorize('farmer', 'admin'), deleteProduct);

module.exports = router; 