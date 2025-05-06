const express = require('express');
const { getCategories, getCategory, createCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Kategori rotaları
router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin'), createCategory);

router.route('/:id')
  .get(getCategory);

module.exports = router; 