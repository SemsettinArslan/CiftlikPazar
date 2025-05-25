const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// JWT token ile korunan route'ları işleyen middleware
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Protect middleware çalıştı');
  console.log('Headers:', JSON.stringify(req.headers));

  // Token'ı al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Header'dan Bearer token'ı al
    token = req.headers.authorization.split(' ')[1];
    console.log('Bearer token bulundu:', token ? `${token.substring(0, 10)}...` : 'yok');
  } else if (req.cookies?.token) {
    // Cookie'den token'ı al
    token = req.cookies.token;
    console.log('Cookie token bulundu:', token ? `${token.substring(0, 10)}...` : 'yok');
  }

  // Token yoksa hata dön
  if (!token) {
    console.log('Token bulunamadı, yetkilendirme hatası');
    return next(new ErrorResponse('Bu sayfaya erişim için yetkiniz yok - token bulunamadı', 401));
  }

  try {
    // Token'ı doğrula
    console.log('Token doğrulanıyor...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token doğrulandı, kullanıcı ID:', decoded.id);

    // Token geçerli ise kullanıcıyı bul
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log('Kullanıcı bulunamadı, ID:', decoded.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    console.log('Kullanıcı bulundu:', req.user.name, 'Role:', req.user.role);
    next();
  } catch (err) {
    console.error('Token doğrulama hatası:', err.message);
    return next(new ErrorResponse('Bu sayfaya erişim için yetkiniz yok - geçersiz token', 401));
  }
};

// Rol bazlı yetkilendirme için helper
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorize middleware çalıştı, izin verilen roller:', roles);
    console.log('Kullanıcı rolü:', req.user?.role);
    
    if (!req.user) {
      console.log('Kullanıcı bulunamadı');
      return next(new ErrorResponse('Önce giriş yapmalısınız', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      console.log('Yetkisiz erişim, kullanıcı rolü:', req.user.role);
      return next(
        new ErrorResponse(
          `'${req.user.role}' rolündeki kullanıcıların bu işlemi yapmaya yetkisi yok`,
          403
        )
      );
    }
    
    console.log('Yetkilendirme başarılı');
    next();
  };
}; 