const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// JWT token ile korunan route'ları işleyen middleware
exports.protect = async (req, res, next) => {
  let token;

  // Token'ı al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Header'dan Bearer token'ı al
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    // Cookie'den token'ı al
    token = req.cookies.token;
  }

  // Token yoksa hata dön
  if (!token) {
    return next(new ErrorResponse('Bu sayfaya erişim için yetkiniz yok', 401));
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token geçerli ise kullanıcıyı bul
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Bu sayfaya erişim için yetkiniz yok', 401));
  }
};

// Rol bazlı yetkilendirme için helper
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Önce giriş yapmalısınız', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `'${req.user.role}' rolündeki kullanıcıların bu işlemi yapmaya yetkisi yok`,
          403
        )
      );
    }
    next();
  };
}; 