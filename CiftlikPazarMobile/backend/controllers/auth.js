const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Kullanıcı kayıt işlemi (web uygulamasıyla uyumlu)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { 
    firstName, 
    lastName,
    email, 
    password, 
    phone,
    city, 
    district, 
    address
  } = req.body;

  // Zorunlu alanları kontrol et
  if (!firstName || !lastName || !email || !password || !phone || !city || !district) {
    return next(new ErrorResponse('Lütfen zorunlu alanları doldurunuz.', 400));
  }

  // E-posta kullanılıyor mu kontrol et
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    return next(new ErrorResponse('Bu e-posta adresi zaten kullanılıyor', 400));
  }

  // Teslimat adresi oluştur - adres bilgileri varsa ekle
  let deliveryAddresses = [];
  if (address) {
    const deliveryAddress = {
      title: 'Ev Adresi', // Varsayılan başlık
      city: city,
      district: district,
      address: address || '',
      isDefault: true // İlk adres olduğu için varsayılan yap
    };
    deliveryAddresses.push(deliveryAddress);
  }

  // Kullanıcı oluştur
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    // Adres alanı opsiyonel, şehir ve ilçe zorunlu
    address: address || '',
    city: city,
    district: district,
    role: 'customer',
    accountStatus: 'active',
    isVerified: false,
    profileCompleted: true,
    // Teslimat adresi varsa ekle, yoksa boş dizi gönder
    deliveryAddresses: deliveryAddresses.length > 0 ? deliveryAddresses : [],
    createdAt: Date.now()
  });
  
  sendTokenResponse(user, 201, res);
});

// @desc    Kullanıcı giriş işlemi
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Email ve şifre kontrolü
  if (!email || !password) {
    return next(new ErrorResponse('Lütfen e-posta ve şifre giriniz', 400));
  }

  // Kullanıcıyı kontrol et (şifreyi de seç)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
  }

  // Şifreleri eşleştir
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Kullanıcı çıkış işlemi
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Giriş yapmış kullanıcı bilgisini getir
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Kullanıcı bilgilerini güncelle
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Şifreyi güncelle
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Mevcut şifreyi kontrol et
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Şifre hatalı', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Adres ekle
// @route   POST /api/auth/address
// @access  Private
exports.addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Eğer ilk adres ise varsayılan yap
  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  }

  // Yeni eklenecek adres varsayılan olarak işaretlenmişse, diğer adreslerin varsayılan durumunu kaldır
  if (req.body.isDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Adresi güncelle
// @route   PUT /api/auth/address/:id
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Adresi bul
  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new ErrorResponse('Adres bulunamadı', 404));
  }

  // Yeni gönderilen adres varsayılan olarak işaretlenmişse, diğer adreslerin varsayılan durumunu kaldır
  if (req.body.isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Adresi güncelle
  Object.keys(req.body).forEach(key => {
    address[key] = req.body[key];
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Adresi sil
// @route   DELETE /api/auth/address/:id
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Adresi bul
  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new ErrorResponse('Adres bulunamadı', 404));
  }

  // Varsayılan adres siliniyorsa, hata döndür
  if (address.isDefault) {
    return next(new ErrorResponse('Varsayılan adres silinemez. Önce başka bir adresi varsayılan yapın.', 400));
  }

  // Adresi sil
  address.remove();
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Favorilere ürün ekle/çıkar
// @route   PUT /api/auth/favorites/:productId
// @access  Private
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;

  // Ürün favorilerde var mı kontrol et
  const favoriteIndex = user.favorites.indexOf(productId);

  // Favorilerde yoksa ekle, varsa çıkar
  if (favoriteIndex === -1) {
    user.favorites.push(productId);
  } else {
    user.favorites.splice(favoriteIndex, 1);
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.favorites
  });
});

// @desc    Şifre sıfırlama tokenı oluştur ve e-posta gönder
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı', 404));
  }

  // Şifre sıfırlama tokenı oluştur
  const resetToken = user.getResetPasswordToken();
  
  // Mobil için 6 haneli sayısal kod oluştur (token'ın ilk 6 karakterini al ve sayıya dönüştür)
  const resetCode = Math.floor(100000 + Math.random() * 900000);
  
  // Kodu veritabanına kaydet
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetCode.toString())
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // HTML e-posta şablonu oluştur
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Şifre Sıfırlama Kodu</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .code-container {
          background-color: #e9f7ef;
          border: 1px solid #4CAF50;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .reset-code {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          letter-spacing: 6px;
        }
        .footer {
          font-size: 12px;
          text-align: center;
          color: #666;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .warning {
          background-color: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 5px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Çiftlik Pazar - Şifre Sıfırlama</h2>
        </div>
        <div class="content">
          <p>Sayın ${user.firstName} ${user.lastName},</p>
          <p>Şifrenizi sıfırlamak için talebinizi aldık. Aşağıdaki doğrulama kodunu kullanarak şifrenizi sıfırlayabilirsiniz:</p>
          
          <div class="code-container">
            <div class="reset-code">${resetCode}</div>
          </div>
          
          <p>Bu kodu Çiftlik Pazar mobil uygulamasındaki şifre sıfırlama ekranına girmeniz gerekiyor.</p>
          
          <div class="warning">
            <p><strong>Önemli:</strong> Bu kod 10 dakika boyunca geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı dikkate almayınız.</p>
          </div>
        </div>
        <div class="footer">
          <p>Bu e-posta Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Çiftlik Pazar - Şifre Sıfırlama Kodu',
      html: html
    });

    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi'
    });
  } catch (err) {
    console.error('E-posta gönderme hatası:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('E-posta gönderilemedi', 500));
  }
});

// @desc    Şifre sıfırlama işlemi
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Kullanıcının gönderdiği kod ve email
  const { code, email, password } = req.body;
  
  if (!code || !email || !password) {
    return next(new ErrorResponse('Lütfen tüm alanları doldurun', 400));
  }

  // Kodu hash'le
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(code.toString())
    .digest('hex');

  // Kod ve email ile kullanıcıyı bul
  const user = await User.findOne({
    email,
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Geçersiz kod veya süresi dolmuş', 400));
  }

  // Yeni şifreyi ayarla
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Token oluştur ve cookie ile gönder
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE.split('d')[0] * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // HTTPS kullanılıyorsa secure flag'i ekle
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        addresses: user.addresses
      }
    });
}; 