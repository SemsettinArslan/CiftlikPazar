const User = require('../models/user.model');
const sendEmail = require('../utils/emailer');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      address, 
      city, 
      district,
      role // Rol parametresini al 
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lütfen zorunlu alanları doldurun (ad, soyad, e-posta, şifre)' 
      });
    }

    // E-posta formatını kontrol et
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen geçerli bir e-posta adresi girin'
      });
    }

    // Şifre uzunluğunu kontrol et
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Kullanıcının zaten var olup olmadığını kontrol et
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu e-posta adresi zaten kullanılıyor' 
      });
    }

    // Telefon numarası kontrolü
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası zaten kullanılıyor'
        });
      }
    }

    // Geçerli role değerlerini kontrol et
    const validRoles = ['customer', 'farmer'];
    const userRole = role && validRoles.includes(role) ? role : 'customer';

    // Kullanıcı oluştur
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      phone,
      address,
      city,
      district,
      accountStatus: 'active',
      profileCompleted: false,
      // isApproved değeri model içinde default olarak belirtildi
    };
    
    const user = await User.create(userData);

    // Kullanıcı başarıyla oluşturulduktan sonra giriş token'ı gönder
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta ve şifre giriniz'
      });
    }

    // Debug log - Giriş denemesi
    console.log(`[DEBUG] Giriş denemesi: ${email}`);

    // Veritabanından kullanıcıyı bul (şifre ile birlikte)
    const user = await User.findOne({ email }).select('+password');

    // Kullanıcı yoksa
    if (!user) {
      console.log(`[DEBUG] Kullanıcı bulunamadı: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    // Debug log - Kullanıcı detayları
    console.log(`[DEBUG] Kullanıcı bulundu - ID: ${user._id}, Email: ${user.email}, Role: ${user.role}, ApprovalStatus: ${user.approvalStatus}`);

    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[DEBUG] Yanlış şifre: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    // Debug log - Şifre doğru
    console.log(`[DEBUG] Şifre doğru: ${user.email}`);

    // Hesap durumu kontrolü - Askıya alınmış veya deaktive edilmişse
    if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
      console.log(`[DEBUG] Hesap aktif değil: ${user.email}, Durum: ${user.accountStatus}`);
      return res.status(401).json({
        success: false,
        message: 'Hesabınız şu anda aktif değil'
      });
    }

    // Çiftçi hesabı ve onay durumu kontrolü
    if (user.role === 'farmer') {
      console.log(`[DEBUG] Çiftçi hesabı kontrolü - ApprovalStatus: ${user.approvalStatus}`);
      
      if (user.approvalStatus === 'pending') {
        console.log(`[DEBUG] Çiftçi hesabı onay bekliyor: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Çiftçi hesabınız hala inceleme aşamasında'
        });
      } else if (user.approvalStatus === 'rejected') {
        console.log(`[DEBUG] Çiftçi hesabı reddedildi: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Çiftçi başvurunuz reddedildi. Lütfen destek ekibiyle iletişime geçin.'
        });
      }
      
      // İlişkili çiftçi kaydı var mı kontrol et
      try {
        const Farmer = require('../models/farmer.model');
        const farmerRecord = await Farmer.findOne({ user: user._id });
        
        console.log(`[DEBUG] Çiftçi kaydı aranıyor - User ID: ${user._id}`);
        
        if (!farmerRecord) {
          console.log(`[DEBUG] Çiftçi kaydı bulunamadı! User ID: ${user._id}`);
          return res.status(401).json({
            success: false,
            message: 'Çiftçi hesabınız eksik. Lütfen destek ekibiyle iletişime geçin.'
          });
        }
        
        console.log(`[DEBUG] Çiftçi kaydı bulundu - Farm ID: ${farmerRecord._id}, Farm Name: ${farmerRecord.farmName}`);
      } catch (error) {
        console.error(`[DEBUG] Çiftçi kaydı kontrol edilirken hata: ${error.message}`);
      }
    }

    // Firma hesabı ve onay durumu kontrolü
    if (user.role === 'company') {
      console.log(`[DEBUG] Firma hesabı kontrolü - ApprovalStatus: ${user.approvalStatus}`);
      
      if (user.approvalStatus === 'pending') {
        console.log(`[DEBUG] Firma hesabı onay bekliyor: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Firma hesabınız hala inceleme aşamasında'
        });
      } else if (user.approvalStatus === 'rejected') {
        console.log(`[DEBUG] Firma hesabı reddedildi: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Firma başvurunuz reddedildi. Lütfen destek ekibiyle iletişime geçin.'
        });
      }
      
      // İlişkili firma kaydı var mı kontrol et
      try {
        const Company = require('../models/company.model');
        const companyRecord = await Company.findOne({ user: user._id });
        
        console.log(`[DEBUG] Firma kaydı aranıyor - User ID: ${user._id}`);
        
        if (!companyRecord) {
          console.log(`[DEBUG] Firma kaydı bulunamadı! User ID: ${user._id}`);
          return res.status(401).json({
            success: false,
            message: 'Firma hesabınız eksik. Lütfen destek ekibiyle iletişime geçin.'
          });
        }
        
        console.log(`[DEBUG] Firma kaydı bulundu - Company ID: ${companyRecord._id}, Company Name: ${companyRecord.companyName}`);
      } catch (error) {
        console.error(`[DEBUG] Firma kaydı kontrol edilirken hata: ${error.message}`);
      }
    }

    // Son giriş tarihini güncelle
    await User.findByIdAndUpdate(user._id, { lastLoginAt: Date.now() });

    // JWT token oluştur
    const token = user.getSignedJwtToken();

    // Debug log - Başarılı giriş
    console.log(`[DEBUG] Başarılı giriş: ${user.email}`);

    // Kullanıcı bilgilerini döndür (şifre hariç)
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[DEBUG] Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Mevcut kullanıcı bilgilerini getir
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// @desc    Çıkış yap
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // JWT tabanlı kimlik doğrulama sistemlerinde sunucu tarafında gerçek bir oturum olmadığından,
    // çıkış işlemi client tarafında token'ın silinmesi ile gerçekleşir.
    // Ancak sunucu tarafından başarılı bir yanıt dönmek için burada ek işlemler yapabiliriz.
    
    // Örneğin, kullanıcının son çıkış zamanını güncelleyebiliriz
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $set: { lastLogoutAt: Date.now() }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      data: {}
    });
  } catch (error) {
    console.error('Çıkış yapma hatası:', error);
    // Hata durumunda bile başarılı cevap dönebiliriz çünkü 
    // asıl çıkış işlemi client tarafında gerçekleşiyor
    res.status(200).json({
      success: true,
      message: 'Çıkış işlemi gerçekleşti',
      data: {}
    });
  }
};

// JWT token oluşturup cookie içinde gönderme
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Şifre sıfırlama talebi
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta adresinizi girin'
      });
    }

    // Kullanıcıyı e-posta ile bul
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı'
      });
    }

    // Sıfırlama token'ı oluştur
    const resetToken = await user.getResetPasswordToken();

    // Token'ı veritabanına kaydet
    await user.save({ validateBeforeSave: false });

    // Şifre sıfırlama URL'i oluştur
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // E-posta içeriği
    const message = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Şifre Sıfırlama</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px 20px;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eaeaea;
        }
        h1 {
          color: #4CAF50;
          margin-top: 0;
        }
        .btn {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .warning {
          background-color: #fff8e1;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin-top: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Çiftlik Pazar</h1>
        </div>
        <div class="content">
          <h2>Şifre Sıfırlama</h2>
          <p>Merhaba ${user.firstName},</p>
          <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Şifremi Sıfırla</a>
          </div>
          
          <p>Bu bağlantı 10 dakika süreyle geçerlidir ve yalnızca bir kez kullanılabilir.</p>
          
          <div class="warning">
            <strong>Not:</strong> Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin ve hesabınızın güvenliğini kontrol edin.
          </div>
        </div>
        <div class="footer">
          <p>Bu e-posta, Çiftlik Pazar uygulaması tarafından gönderilmiştir.</p>
          <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Çiftlik Pazar - Şifre Sıfırlama',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
      });
    } catch (error) {
      // E-posta gönderilemezse token bilgilerini sıfırla
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.'
      });
    }
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama işlemi başarısız oldu'
    });
  }
};

// @desc    Şifre sıfırlama
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Token'ı hash'le
    const resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Token'a sahip ve geçerlilik süresi dolmamış kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }

    // Yeni şifreyi kontrol et
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Yeni şifreyi ayarla
    user.password = password;
    
    // Sıfırlama token bilgilerini temizle
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Kullanıcıyı kaydet
    await user.save();

    // Token yanıtını gönder
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama işlemi başarısız oldu'
    });
  }
};

// @desc    Kullanıcıyı admin yap (DEV ONLY)
// @route   POST /api/auth/make-admin
// @access  Public (sadece development ortamı için)
exports.makeAdmin = async (req, res) => {
  try {
    // Sadece development ortamında çalışsın
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ 
        success: false, 
        message: 'Sayfa bulunamadı'
      });
    }

    const { email, secretKey } = req.body;

    // Basit güvenlik kontrolü
    if (secretKey !== 'dev_admin_secret_key') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz anahtar'
      });
    }

    // Email kontrolü
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen e-posta adresi giriniz'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Admin rolü ver
    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Kullanıcı admin yapıldı',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin yapma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Telefon numarası güncelleme
// @route   PUT /api/auth/update-phone
// @access  Private
exports.updatePhone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber } = req.body;

    // Telefon numarası zorunlu
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen telefon numarası giriniz'
      });
    }

    // Telefon numarası formatını kontrol et (sadece rakamlardan oluşmalı)
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir telefon numarası giriniz (10-11 rakam)'
      });
    }

    // Telefon numarası başka bir kullanıcıda var mı kontrol et (kendisi hariç)
    const existingPhone = await User.findOne({ 
      phone: phoneNumber, 
      _id: { $ne: userId } 
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor'
      });
    }

    // Kullanıcıyı bul ve güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phone: phoneNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Telefon numarası başarıyla güncellendi',
      data: {
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('Telefon güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
}; 