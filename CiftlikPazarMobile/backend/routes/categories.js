const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryImageUpload
} = require('../controllers/categories');

const Category = require('../models/Category');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Kategori resmi yükleme route'u
router
  .route('/:id/image')
  .put(
    protect, 
    authorize('admin'),
    uploadSingle('image'),
    uploadErrorHandler,
    categoryImageUpload
  );

// Kategori route'ları
router
  .route('/')
  .get(
    advancedResults(Category, 'subCategories'),
    getCategories
  )
  .post(protect, authorize('admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router; 