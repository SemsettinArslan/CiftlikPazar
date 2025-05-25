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
  deleteProductRating,
  getPendingProducts,
  getRejectedProducts,
  approveProduct,
  rejectProduct
} = require('../controllers/products');

const Product = require('../models/Product');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Admin endpoints - ürün onay işlemleri
router
  .route('/pending-approval')
  .get(protect, authorize('admin'), getPendingProducts);

router
  .route('/rejected')
  .get(protect, authorize('admin'), getRejectedProducts);

router
  .route('/:id/approve')
  .put(protect, authorize('admin'), approveProduct);

router
  .route('/:id/reject')
  .put(protect, authorize('admin'), rejectProduct);

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
      { path: 'category', select: 'name category_name slug' },
      { 
        path: 'farmer', 
        select: 'farmName city district user', 
        populate: { path: 'user', select: 'firstName lastName' }
      }
    ]),
    getProducts
  )
  .post(
    (req, res, next) => {
      console.log('Ürün oluşturma isteği alındı');
      console.log('Authorization header:', req.headers.authorization);
      next();
    },
    protect, 
    authorize('farmer', 'admin'), 
    createProduct
  );

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('farmer', 'admin'), updateProduct)
  .delete(protect, authorize('farmer', 'admin'), deleteProduct);

// Ürün resmi yükleme endpoint'i
router.post('/upload-image', async (req, res, next) => {
  try {
    console.log('Resim yükleme isteği alındı');
    
    // Dosya kontrolü
    if (!req.files) {
      console.log('Dosya bulunamadı: req.files yok');
      return res.status(400).json({
        success: false,
        message: 'Dosya bulunamadı'
      });
    }
    
    if (!req.files.image) {
      console.log('Resim bulunamadı: req.files.image yok');
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim yükleyin'
      });
    }

    const file = req.files.image;
    console.log('Dosya bilgileri:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype
    });

    // Dosya boyutunu kontrol et (5MB'dan büyük olmamalı)
    if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 5 * 1024 * 1024) {
      console.log('Dosya boyutu çok büyük:', file.size);
      return res.status(400).json({
        success: false,
        message: 'Lütfen 5MB\'dan küçük dosya yükleyin'
      });
    }

    // Dosya tipini kontrol et
    if (!file.mimetype.startsWith('image')) {
      console.log('Geçersiz dosya tipi:', file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim dosyası yükleyin'
      });
    }

    // Uploads klasörünün varlığını kontrol et
    const fs = require('fs');
    const path = require('path');
    const uploadPath = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '../../../uploads/product-images');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
      console.log('Upload klasörü bulunamadı, oluşturuluyor:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Dosya adını oluştur - daha güvenli bir şekilde
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `product_${timestamp}_${randomString}_${sanitizedFileName}`;
    const filePath = path.join(uploadPath, fileName);
    
    console.log('Dosya kaydediliyor:', filePath);

    // Dosyayı taşı
    file.mv(filePath, async (err) => {
      if (err) {
        console.error('Dosya yükleme hatası:', err);
        return res.status(500).json({
          success: false,
          message: 'Dosya yükleme hatası: ' + err.message,
          error: err.toString()
        });
      }

      console.log('Dosya başarıyla kaydedildi');
      res.status(200).json({
        success: true,
        data: {
          imagePath: fileName
        }
      });
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message,
      error: error.toString()
    });
  }
});

module.exports = router; 