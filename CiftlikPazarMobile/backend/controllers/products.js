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
    .populate('seller', 'name');

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
  // Ürün satıcısını giriş yapmış kullanıcı olarak ayarla
  req.body.seller = req.user.id;

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
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
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
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
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
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
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

  const files = Array.isArray(req.files) ? req.files : [req.files.file];
  const images = [];

  for (const file of files) {
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

      // Resmin daha önceden var olup olmadığını kontrol et
      if (product.images.includes(file.name)) {
        return next(
          new ErrorResponse(`Bu resim zaten yüklü`, 400)
        );
      }

      // Resmi ürüne ekle
      product.images.push(file.name);
      images.push(file.name);
    });
  }

  await product.save();

  res.status(200).json({
    success: true,
    data: images
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

  // Kullanıcının daha önce değerlendirme yapıp yapmadığını kontrol et
  const alreadyReviewed = product.ratings.find(
    r => r.user.toString() === req.user.id
  );

  if (alreadyReviewed) {
    return next(
      new ErrorResponse(`Bu ürünü zaten değerlendirdiniz`, 400)
    );
  }

  const ratingObj = {
    rating: Number(rating),
    comment,
    user: req.user.id
  };

  product.ratings.push(ratingObj);
  
  // Ortalama değerlendirmeyi hesapla
  product.calculateAverageRating();
  
  await product.save();

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Ürün değerlendirmesini güncelle
// @route   PUT /api/products/:id/ratings/:ratingId
// @access  Private
exports.updateProductRating = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Değerlendirmeyi bul
  const ratingToUpdate = product.ratings.id(req.params.ratingId);

  if (!ratingToUpdate) {
    return next(
      new ErrorResponse(`Değerlendirme bulunamadı`, 404)
    );
  }

  // Kullanıcının değerlendirme sahibi olup olmadığını kontrol et
  if (ratingToUpdate.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Bu değerlendirmeyi güncelleme yetkiniz yok`,
        403
      )
    );
  }

  // Değerlendirmeyi güncelle
  ratingToUpdate.rating = Number(rating);
  ratingToUpdate.comment = comment;
  
  // Ortalama değerlendirmeyi hesapla
  product.calculateAverageRating();

  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Ürün değerlendirmesini sil
// @route   DELETE /api/products/:id/ratings/:ratingId
// @access  Private
exports.deleteProductRating = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Değerlendirmeyi bul
  const ratingToDelete = product.ratings.id(req.params.ratingId);

  if (!ratingToDelete) {
    return next(
      new ErrorResponse(`Değerlendirme bulunamadı`, 404)
    );
  }

  // Kullanıcının değerlendirme sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if (ratingToDelete.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Bu değerlendirmeyi silme yetkiniz yok`,
        403
      )
    );
  }

  // Değerlendirmeyi sil
  ratingToDelete.remove();
  
  // Ortalama değerlendirmeyi hesapla
  product.calculateAverageRating();

  await product.save();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 