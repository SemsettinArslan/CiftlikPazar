const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const path = require('path');

// @desc    Tüm kategorileri getir
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  // Filtre uygula: sadece aktif kategorileri getir
  if (!req.query.isActive) {
    req.query.isActive = true;
  }
  
  res.status(200).json(res.advancedResults);
});

// @desc    Tek kategori getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('subCategories')
    .populate('products');

  if (!category) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li kategori bulunamadı`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Kategori oluştur
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = asyncHandler(async (req, res, next) => {
  // category_name alanını kontrol et
  if (!req.body.category_name) {
    return next(
      new ErrorResponse('Kategori adı gereklidir', 400)
    );
  }
  
  try {
    const category = await Category.create(req.body);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    // Duplicate kontrolü
    if (error.code === 11000) {
      return next(
        new ErrorResponse('Bu kategori zaten mevcut', 400)
      );
    }
    
    next(error);
  }
});

// @desc    Kategori güncelle
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li kategori bulunamadı`, 404)
    );
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Kategori sil
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li kategori bulunamadı`, 404)
    );
  }

  // Alt kategorileri kontrol et
  const subCategories = await Category.find({ parentCategory: req.params.id });
  
  if (subCategories.length > 0) {
    return next(
      new ErrorResponse(`Bu kategoriye ait alt kategoriler var. Önce alt kategorileri silmelisiniz.`, 400)
    );
  }

  // Kategoriye ait ürünleri kontrol et
  const products = await Category.findById(req.params.id).populate('products');
  
  if (products.products.length > 0) {
    return next(
      new ErrorResponse(`Bu kategoriye ait ürünler var. Önce ürünleri silmelisiniz.`, 400)
    );
  }

  await category.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Kategori resmi yükle
// @route   PUT /api/categories/:id/image
// @access  Private (Admin)
exports.categoryImageUpload = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li kategori bulunamadı`, 404)
    );
  }

  if (!req.file) {
    return next(new ErrorResponse(`Lütfen bir dosya yükleyin`, 400));
  }

  // Dosya boyutunu kontrol et (5MB'dan büyük olmamalı)
  if (req.file.size > process.env.MAX_FILE_UPLOAD || req.file.size > 5 * 1024 * 1024) {
    return next(
      new ErrorResponse(
        `Lütfen 5MB'dan küçük dosya yükleyin`,
        400
      )
    );
  }

  // Dosya adını oluştur
  const file = req.file;
  file.name = `category_${category._id}${path.parse(file.originalname).ext}`;

  // Dosyayı taşı
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Dosya yükleme hatası`, 500));
    }

    await Category.findByIdAndUpdate(req.params.id, { image: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
}); 