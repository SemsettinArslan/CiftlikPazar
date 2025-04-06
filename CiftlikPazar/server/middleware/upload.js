const multer = require('multer');
const path = require('path');

// Dosya depolama seçenekleri
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ortak uploads klasörünü kullan (projenin ana dizininde)
    const uploadsPath = path.join(__dirname, '../../../uploads/profile-images');
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    // Dosya adını oluştur: kullanıcıID-timestamp.uzantı
    const userId = req.user.id;
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

// Sadece imaj dosyalarını kabul et
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = allowedTypes.test(file.mimetype.split('/')[1]);
  
  if (isValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Sadece .jpeg, .jpg, .png ve .gif dosyaları yüklenebilir!'), false);
  }
};

// Multer ayarlarını yap
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // max 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload; 