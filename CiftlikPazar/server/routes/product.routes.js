const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const productController = require('../controllers/product.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dosya yükleme için depolama yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ana dizindeki uploads klasörü
    const uploadDir = path.join(__dirname, '../../../uploads/product-images');
    
    // Dizin yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Her dosya için gerçekten benzersiz bir isim oluştur
    // Timestamp, rastgele sayı ve orijinal dosya adının bir kısmını kullan
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    
    // Orjinal dosya adından dosya uzantısını al
    const ext = path.extname(file.originalname);
    
    // Orjinal dosya adının ilk 10 karakterini al (varsa)
    let originalNameBase = path.basename(file.originalname, ext);
    originalNameBase = originalNameBase.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    
    // Benzersiz dosya adı oluştur
    const uniqueFilename = `${timestamp}-${randomNum}-${originalNameBase}${ext}`;
    
    console.log(`Orijinal dosya: ${file.originalname}, Yeni dosya adı: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  }
});

// Dosya kontrolü - sadece görüntülere izin ver
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

// Multer yapılandırması
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB maksimum boyut
  },
  fileFilter: fileFilter
});

// Ürün görseli yükle
router.post('/upload-image', protect, authorize('farmer'), upload.single('image'), productController.uploadProductImage);

// Tüm ürünleri getir (onaylıları)
router.get('/', productController.getProducts);

// Öne çıkan ürünleri getir
router.get('/featured', productController.getFeaturedProducts);

// Belirli bir çiftçiye ait ürünleri getir
router.get('/farmer/:farmerId', productController.getProductsByFarmer);

// Çiftçi kendi ürünlerini getir (onaylı/bekleyen/reddedilen hepsi)
router.get('/my-products', protect, authorize('farmer'), productController.getMyProducts);

// Onay bekleyen ürünleri getir (sadece admin)
router.get('/pending-approval', protect, authorize('admin'), productController.getPendingProducts);

// Admin için durum bazlı ürün listesi getir (onaylı/reddedilmiş/tümü)
router.get('/admin-products', protect, authorize('admin'), productController.getAdminProductsByStatus);

// Ürün onaylama (sadece admin)
router.put('/:id/approve', protect, authorize('admin'), productController.approveProduct);

// Ürün reddetme (sadece admin)
router.put('/:id/reject', protect, authorize('admin'), productController.rejectProduct);

// Ürün detayını getir - EN SON tanımlanmalı (yakalayıcı route)
router.get('/:id', productController.getProductById);

// Yeni ürün ekle (sadece çiftçiler)
router.post('/', protect, authorize('farmer'), productController.createProduct);

// Ürün güncelle (sadece ürünü ekleyen çiftçi)
router.put('/:id', protect, authorize('farmer'), productController.updateProduct);

// Ürün sil (sadece ürünü ekleyen çiftçi veya admin)
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router; 