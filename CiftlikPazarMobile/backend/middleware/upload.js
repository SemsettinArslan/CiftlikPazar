const path = require('path');
const multer = require('multer');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs');

// Disk'e dosya kaydetme ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Kök dizindeki uploads klasörünü kullan
    const uploadPath = path.join(__dirname, '../../../uploads/product-images');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
      console.log('Upload klasörü bulunamadı, oluşturuluyor:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Dosya adını benzersiz yap: timestamp_originalname
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    
    cb(
      null,
      `product_${timestamp}_${randomString}_${sanitizedFileName}`
    );
  }
});

// Dosya filtreleme: Sadece görseller
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  // Dosya uzantısını kontrol et
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // MIME tipini kontrol et
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('Sadece görsel dosyaları yüklenebilir', 400));
  }
};

// Multer ayarları
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter
});

// Tek dosya yükleme middleware'i
exports.uploadSingle = (fieldName) => upload.single(fieldName);

// Çoklu dosya yükleme middleware'i (max 5 dosya)
exports.uploadMultiple = (fieldName) => upload.array(fieldName, 5);

// Hata yakalama middleware'i
exports.uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer hataları
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.', 400));
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ErrorResponse('Beklenmeyen dosya alanı.', 400));
    }
  }
  next(err);
}; 