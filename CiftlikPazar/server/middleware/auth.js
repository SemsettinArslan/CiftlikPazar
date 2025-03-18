const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Kimlik doğrulama ara yazılımı
exports.protect = async (req, res, next) => {
  let token;

  // Token kontrolü
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Token'ı Bearer kısmından ayır
    token = req.headers.authorization.split(' ')[1];
  }

  // Token var mı kontrol et
  if (!token) {
    return res.status(401).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
  }
};

// Rol bazlı yetkilendirme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} rolündeki kullanıcının bu işleme erişim izni yok`
      });
    }
    next();
  };
}; 