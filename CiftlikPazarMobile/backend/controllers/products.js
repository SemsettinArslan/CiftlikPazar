const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');

// @desc    Tüm ürünleri getir
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Tek ürün getir
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('farmer', 'name');

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Ürün oluştur
// @route   POST /api/products
// @access  Private (Satıcı ve Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Ürün çiftçisini giriş yapmış kullanıcı olarak ayarla
  req.body.farmer = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Ürün güncelle
// @route   PUT /api/products/:id
// @access  Private (Satıcı ve Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürünü güncelleme yetkiniz yok`,
        403
      )
    );
  }

  product = await Product.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Ürün sil
// @route   DELETE /api/products/:id
// @access  Private (Satıcı ve Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürünü silme yetkiniz yok`,
        403
      )
    );
  }

  await product.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Ürün resmi yükle
// @route   PUT /api/products/:id/image
// @access  Private (Satıcı ve Admin)
exports.productImageUpload = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürüne resim yükleme yetkiniz yok`,
        403
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Lütfen bir dosya yükleyin`, 400));
  }

  const file = req.files.file;

  // Dosya boyutunu kontrol et (5MB'dan büyük olmamalı)
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 5 * 1024 * 1024) {
    return next(
      new ErrorResponse(
        `Lütfen 5MB'dan küçük dosya yükleyin`,
        400
      )
    );
  }

  // Dosya adını oluştur
  file.name = `photo_${product._id}_${Date.now()}${path.parse(file.name).ext}`;

  // Dosyayı taşı
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Dosya yükleme hatası`, 500));
    }

    // Ürün resmini güncelle
    await Product.findByIdAndUpdate(req.params.id, { image: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Ürüne değerlendirme ekle
// @route   POST /api/products/:id/ratings
// @access  Private
exports.addProductRating = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Yeni değerlendirme puanını hesapla
  const newRating = (product.rating * product.numReviews + Number(rating)) / (product.numReviews + 1);
  
  // Ürünü güncelle
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating: newRating,
      numReviews: product.numReviews + 1
    },
    { new: true }
  );

  res.status(201).json({
    success: true,
    data: updatedProduct
  });
});

// @desc    Ürün değerlendirmesini güncelle (Basitleştirilmiş)
// @route   PUT /api/products/:id/ratings
// @access  Private
exports.updateProductRating = asyncHandler(async (req, res, next) => {
  const { rating } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Basitleştirilmiş rating güncellemesi
  await Product.findByIdAndUpdate(
    req.params.id,
    { rating: Number(rating) },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Değerlendirme başarıyla güncellendi'
  });
});

// @desc    Ürün değerlendirmesini sil (Basitleştirilmiş)
// @route   DELETE /api/products/:id/ratings
// @access  Private
exports.deleteProductRating = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Değerlendirme sayısı hesaplanabilir değilse
  if (product.numReviews <= 0) {
    return next(
      new ErrorResponse(`Bu ürüne ait değerlendirme bulunamadı`, 404)
    );
  }

  // Değerlendirme sayısını azalt
  await Product.findByIdAndUpdate(
    req.params.id,
    { 
      rating: product.numReviews > 1 ? (product.rating * product.numReviews - product.rating) / (product.numReviews - 1) : 0,
      numReviews: Math.max(0, product.numReviews - 1)
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Değerlendirme başarıyla silindi'
  });
}); 