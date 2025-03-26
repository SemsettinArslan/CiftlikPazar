const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const mongoose = require('mongoose');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

// @desc    Çiftçi kaydı oluştur
// @route   POST /api/farmers
// @access  Private
exports.registerFarmer = asyncHandler(async (req, res, next) => {
  const { 
    farmName, 
    city, 
    district, 
    address, 
    taxNumber, 
    categories, 
    hasShipping, 
    description 
  } = req.body;

  // Zorunlu alanları kontrol et
  if (!farmName || !city || !district || !address || !taxNumber || !categories || categories.length === 0) {
    return next(new ErrorResponse('Lütfen tüm gerekli alanları doldurun', 400));
  }

  // Vergi numarası kontrolü
  const taxExists = await Farmer.findOne({ taxNumber });
  if (taxExists) {
    return next(new ErrorResponse('Bu vergi numarası zaten kullanılıyor', 400));
  }

  // Kullanıcının daha önce bir çiftçi kaydı var mı kontrol et
  const existingFarmer = await Farmer.findOne({ user: req.user.id });
  if (existingFarmer) {
    return next(new ErrorResponse('Bu kullanıcıya ait bir çiftlik kaydı zaten mevcut', 400));
  }

  // Kullanıcı bilgilerini al
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
  }

  // Çiftçi oluştur
  const farmer = await Farmer.create({
    user: req.user.id,
    farmName,
    city,
    district,
    address,
    taxNumber,
    categories,
    hasShipping: hasShipping || false,
    description
  });

  // Kullanıcı onay durumunu beklemede olarak güncelle
  await User.findByIdAndUpdate(
    req.user.id,
    { approvalStatus: 'pending' },
    { new: true }
  );

  res.status(201).json({
    success: true,
    data: farmer
  });
});

// @desc    Çiftçi detayını getir
// @route   GET /api/farmers/:id
// @access  Public
exports.getFarmer = asyncHandler(async (req, res, next) => {
  const farmer = await Farmer.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('categories', 'category_name');

  if (!farmer) {
    return next(new ErrorResponse('Çiftlik bulunamadı', 404));
  }

  res.status(200).json({
    success: true,
    data: farmer
  });
});

// @desc    Kullanıcıya ait çiftlik bilgisini getir
// @route   GET /api/farmers/me
// @access  Private (Farmer)
exports.getMyFarm = asyncHandler(async (req, res, next) => {
  const farmer = await Farmer.findOne({ user: req.user.id })
    .populate('categories', 'category_name');

  if (!farmer) {
    return next(new ErrorResponse('Çiftlik kaydınız bulunamadı', 404));
  }

  res.status(200).json({
    success: true,
    data: farmer
  });
});

// @desc    Çiftçi kaydını tamamla
// @route   POST /api/farmers/complete-registration
// @access  Public
exports.completeRegistration = asyncHandler(async (req, res, next) => {
  try {
    console.log('Çiftçi kayıt isteği alındı:', JSON.stringify(req.body, null, 2));
    
    const { 
      firstName,
      lastName,
      email,
      phone,
      password,
      farmInfo,
      certificates
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!firstName || !lastName || !email || !phone || !password || !farmInfo) {
      console.error('Eksik alanlar:', { firstName, lastName, email, phone, password: !!password, farmInfo: !!farmInfo });
      return next(new ErrorResponse('Lütfen tüm gerekli alanları doldurun', 400));
    }

    // Zorunlu çiftlik bilgilerini kontrol et
    const { farmName, city, district, address, taxNumber, categories } = farmInfo;
    if (!farmName || !city || !district || !address || !taxNumber || !categories || categories.length === 0) {
      console.error('Eksik çiftlik bilgileri:', farmInfo);
      return next(new ErrorResponse('Lütfen tüm çiftlik bilgilerini doldurun', 400));
    }

    // E-posta ve telefon kontrolü
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.error('E-posta zaten kayıtlı:', email);
      return next(new ErrorResponse('Bu e-posta adresi zaten kullanılıyor', 400));
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      console.error('Telefon zaten kayıtlı:', phone);
      return next(new ErrorResponse('Bu telefon numarası zaten kullanılıyor', 400));
    }

    // Vergi numarası kontrolü
    const taxExists = await Farmer.findOne({ taxNumber: farmInfo.taxNumber });
    if (taxExists) {
      console.error('Vergi numarası zaten kayıtlı:', farmInfo.taxNumber);
      return next(new ErrorResponse('Bu vergi numarası zaten kullanılıyor', 400));
    }

    console.log('Tüm kontroller başarılı, kullanıcı oluşturuluyor...');
    
    // Kullanıcıyı oluştur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'farmer',
      approvalStatus: 'pending'
    });

    console.log('Kullanıcı oluşturuldu, ID:', user._id);
    console.log('Çiftlik kaydı oluşturuluyor...');

    // Çiftlik kaydını oluştur
    const farmer = await Farmer.create({
      user: user._id,
      farmName: farmInfo.farmName,
      city: farmInfo.city,
      district: farmInfo.district,
      address: farmInfo.address,
      taxNumber: farmInfo.taxNumber,
      categories: farmInfo.categories,
      hasShipping: farmInfo.hasShipping || false,
      description: farmInfo.description || '',
      certificates: certificates || []
    });

    console.log('Çiftlik kaydı oluşturuldu, ID:', farmer._id);
    
    // Kayıt bilgilendirme e-postası gönder
    try {
      const html = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Çiftlik Kaydınız Alındı</title>
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
            .farm-info {
              background-color: #e9f7ef;
              border: 1px solid #4CAF50;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-item strong {
              width: 120px;
              display: inline-block;
            }
            .steps {
              margin: 20px 0;
            }
            .step {
              margin-bottom: 15px;
              padding-left: 25px;
              position: relative;
            }
            .step:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #4CAF50;
              font-weight: bold;
            }
            .footer {
              font-size: 12px;
              text-align: center;
              color: #666;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Çiftlik Pazar - Başvurunuz Alındı</h2>
            </div>
            <div class="content">
              <p>Sayın <strong>${firstName} ${lastName}</strong>,</p>
              <p>Çiftlik Pazar platformuna yapmış olduğunuz başvuru başarıyla alınmıştır. Başvurunuz şu anda inceleme aşamasındadır.</p>
              
              <div class="farm-info">
                <h3>Çiftlik Bilgileriniz</h3>
                <div class="info-item"><strong>Çiftlik Adı:</strong> ${farmInfo.farmName}</div>
                <div class="info-item"><strong>İl/İlçe:</strong> ${farmInfo.city}/${farmInfo.district}</div>
                <div class="info-item"><strong>Vergi No:</strong> ${farmInfo.taxNumber}</div>
              </div>
              
              <div class="steps">
                <h3>Sonraki Adımlar</h3>
                <div class="step">Başvurunuz genellikle 1-3 iş günü içinde incelenir.</div>
                <div class="step">Başvurunuzun sonucu e-posta yoluyla bildirilecektir.</div>
                <div class="step">Başvurunuz onaylandıktan sonra ürünlerinizi ekleyebilir ve satışa sunabilirsiniz.</div>
              </div>
              
              <p>Sorularınız için her zaman destek ekibimize ulaşabilirsiniz.</p>
              <p>Teşekkür ederiz.</p>
            </div>
            <div class="footer">
              <p>Bu e-posta Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
              <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await sendEmail({
        email: email,
        subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Alındı',
        html: html
      });
      
      console.log('Bilgilendirme e-postası gönderildi:', email);
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // E-posta hatası işlemi durdurmaz, sadece loglama yapılır
    }

    console.log('Token oluşturuluyor...');

    // JWT token oluştur ve yanıt ver
    sendTokenResponse(user, 201, res, {
      farmer: farmer
    });
  } catch (error) {
    console.error('Çiftçi kayıt işleminde kritik hata:', error);
    console.error('Hata detayları:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // MongoDB hata kodlarını kontrol et
    if (error.code === 11000) {
      // Duplicate key error
      console.error('Aynı kayıt zaten mevcut:', error.keyValue);
      const field = Object.keys(error.keyValue)[0];
      return next(new ErrorResponse(`Bu ${field} zaten kullanılıyor`, 400));
    }
    
    // Validation hatası
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('Doğrulama hatası:', messages);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    
    return next(new ErrorResponse(`Kayıt işlemi sırasında hata oluştu: ${error.message}`, 500));
  }
});

// @desc    Tüm çiftçileri getir
// @route   GET /api/farmers
// @access  Private (Admin)
exports.getAllFarmers = asyncHandler(async (req, res, next) => {
  const farmers = await Farmer.find()
    .populate('user', 'firstName lastName email phone approvalStatus')
    .populate('categories', 'category_name');

  res.status(200).json({
    success: true,
    count: farmers.length,
    data: farmers
  });
});

// @desc    Onay bekleyen çiftçileri getir
// @route   GET /api/farmers/pending
// @access  Private (Admin)
exports.getPendingFarmers = asyncHandler(async (req, res, next) => {
  const pendingFarmers = await Farmer.find()
    .populate({
      path: 'user',
      select: 'firstName lastName email phone approvalStatus createdAt',
      match: { approvalStatus: 'pending', role: 'farmer' }
    })
    .populate('categories', 'category_name');

  // Null user filtreleme - eğer populate match koşulları sağlanmazsa user alanı null olabilir
  const filteredFarmers = pendingFarmers.filter(farmer => farmer.user !== null);

  res.status(200).json({
    success: true,
    count: filteredFarmers.length,
    data: filteredFarmers
  });
});

// @desc    Çiftçi başvurusunu onayla/reddet
// @route   PUT /api/farmers/:id/approve
// @access  Private (Admin)
exports.approveFarmer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Geçerli bir onay durumu belirtmelisiniz (approved/rejected)', 400));
  }

  const farmer = await Farmer.findById(id).populate('user', 'email firstName lastName');

  if (!farmer) {
    return next(new ErrorResponse('Çiftçi bulunamadı', 404));
  }

  // Kullanıcı durumunu güncelle
  await User.findByIdAndUpdate(
    farmer.user._id,
    { approvalStatus: status },
    { new: true }
  );

  // E-posta gönder
  try {
    if (status === 'approved') {
      // Onay e-postası
      const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Çiftlik Pazar - Başvurunuz Onaylandı</title>
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
            color: #198754;
            font-size: 26px;
            font-weight: bold;
          }
          .content {
            padding: 30px 20px;
          }
          .farm-info {
            background-color: #f8f9fa;
            border-left: 4px solid #198754;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #eaeaea;
          }
          h1 {
            color: #198754;
            margin-top: 0;
          }
          h2 {
            color: #2E7D32;
            font-size: 18px;
            margin-top: 25px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #198754;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .status-box {
            background-color: #e8f5e9;
            border-radius: 4px;
            padding: 15px;
            margin-top: 25px;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            margin-right: 5px;
            margin-bottom: 5px;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .next-steps {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-top: 25px;
          }
          .next-steps h3 {
            color: #0d47a1;
            margin-top: 0;
          }
          .checkmark {
            color: #4CAF50;
            font-size: 20px;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱 Çiftlik Pazar</div>
          </div>
          <div class="content">
            <h1>Tebrikler! Başvurunuz Onaylandı!</h1>
            <p>Sayın <strong>${farmer.user.firstName} ${farmer.user.lastName}</strong>,</p>
            <p>Çiftlik Pazar'a çiftçi olarak başvurunuz onaylandı. Artık ürünlerinizi ekleyebilir ve satışa başlayabilirsiniz!</p>
            
            <div class="farm-info">
              <h2>Çiftlik Bilgileriniz</h2>
              <ul>
                <li><strong>Çiftlik Adı:</strong> ${farmer.farmName}</li>
                <li><strong>Lokasyon:</strong> ${farmer.city}, ${farmer.district}</li>
              </ul>
            </div>
            
            <div class="status-box">
              <p><span class="checkmark">✓</span> Hesap durumunuz: <strong>Onaylandı</strong></p>
              <p>Hesabınıza giriş yaparak ürünlerinizi yönetebilir, sipariş süreçlerinizi takip edebilirsiniz.</p>
            </div>
            
            <div class="next-steps">
              <h3>Sıradaki Adımlar</h3>
              <ol>
                <li>Hesabınıza giriş yapın</li>
                <li>Çiftlik profilinizi tamamlayın</li>
                <li>Ürünlerinizi ekleyin</li>
                <li>Satışları takip etmeye başlayın</li>
              </ol>
            </div>
            
            <p>Deneyiminizi iyileştirmek için önerilerinizi ve geri bildirimlerinizi bizimle paylaşabilirsiniz.</p>
            <p>Tüm sorularınız için <a href="mailto:destek@ciftlikpazar.com" style="color: #198754;">destek@ciftlikpazar.com</a> adresinden bize ulaşabilirsiniz.</p>
            
            <div style="text-align: center;">
              <a href="https://ciftlikpazar.com/login" class="btn">Giriş Yap ve Başla</a>
            </div>
          </div>
          <div class="footer">
            <p>Bu e-posta, Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir.</p>
            <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      await sendEmail({
        email: farmer.user.email,
        subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Onaylandı',
        message
      });
    }
    else if (status === 'rejected') {
      // Red e-postası
      if (!rejectionReason) {
        return next(new ErrorResponse('Reddetme durumunda bir sebep belirtmelisiniz', 400));
      }
      
      const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Çiftlik Pazar - Başvuru Bilgilendirmesi</title>
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
            color: #198754;
            font-size: 26px;
            font-weight: bold;
          }
          .content {
            padding: 30px 20px;
          }
          .farm-info {
            background-color: #f8f9fa;
            border-left: 4px solid #6c757d;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #eaeaea;
          }
          h1 {
            color: #6c757d;
            margin-top: 0;
          }
          h2 {
            color: #495057;
            font-size: 18px;
            margin-top: 25px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #198754;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .status-box {
            background-color: #f8d7da;
            border-radius: 4px;
            padding: 15px;
            margin-top: 25px;
            font-weight: 500;
          }
          .reason-box {
            background-color: #fff3cd;
            border-radius: 4px;
            padding: 15px;
            margin-top: 25px;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .feedback {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-top: 25px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱 Çiftlik Pazar</div>
          </div>
          <div class="content">
            <h1>Başvurunuz Hakkında Bilgilendirme</h1>
            <p>Sayın <strong>${farmer.user.firstName} ${farmer.user.lastName}</strong>,</p>
            <p>Çiftlik Pazar'a çiftçi olarak yaptığınız başvuruyu değerlendirdik. Maalesef, başvurunuzu şu aşamada onaylayamadığımızı bildirmek isteriz.</p>
            
            <div class="farm-info">
              <h2>Başvuru Bilgileriniz</h2>
              <ul>
                <li><strong>Çiftlik Adı:</strong> ${farmer.farmName}</li>
                <li><strong>Lokasyon:</strong> ${farmer.city}, ${farmer.district}</li>
                <li><strong>Başvuru Tarihi:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div class="status-box">
              <p>Hesap durumunuz: <strong>Reddedildi</strong></p>
            </div>
            
            <div class="reason-box">
              <h2>Başvurunuzla İlgili Geri Bildirim</h2>
              <p>${rejectionReason}</p>
            </div>
            
            <div class="feedback">
              <h3>Sonraki Adımlar</h3>
              <p>Eğer başvurunuzu güncellemek ve yeniden değerlendirme için göndermek isterseniz, aşağıdaki bilgileri göz önünde bulundurarak işlemi gerçekleştirebilirsiniz:</p>
              <ul>
                <li>Çiftlik bilgilerinizin eksiksiz ve doğru olduğundan emin olun</li>
                <li>Çiftliğinizin konumu ve üretim bilgilerinizi detaylı olarak belirtin</li>
                <li>Varsa lisans ve sertifikalarınızı ekleyin</li>
              </ul>
              <p>Herhangi bir sorunuz için destek ekibimizle iletişime geçmekten çekinmeyin.</p>
            </div>
            
            <p>Tüm sorularınız için <a href="mailto:destek@ciftlikpazar.com" style="color: #198754;">destek@ciftlikpazar.com</a> adresinden bize ulaşabilirsiniz.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/farmer-register" class="btn">Yeniden Başvur</a>
            </div>
          </div>
          <div class="footer">
            <p>Bu e-posta, Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir.</p>
            <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      await sendEmail({
        email: farmer.user.email,
        subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Hakkında Bilgilendirme',
        message
      });
    }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    // E-posta hatası işlemi durdurmaz, sadece loglama yapılır
  }

  res.status(200).json({
    success: true,
    data: {
      id: farmer._id,
      status
    }
  });
});

// @desc    Çiftçi sertifikası ekle
// @route   POST /api/farmers/:id/certificates
// @access  Private (Farmer)
exports.addCertificate = asyncHandler(async (req, res, next) => {
  const farmerId = req.params.id;
  
  // Sadece kendi çiftlik kaydına sertifika ekleyebilir
  const farmer = await Farmer.findOne({ _id: farmerId, user: req.user.id });
  
  if (!farmer) {
    return next(new ErrorResponse('İzin yok veya çiftlik bulunamadı', 404));
  }
  
  // Dosya yüklendiyse işle
  if (req.file) {
    // Sertifika görüntüsünü ekle
    req.body.image = req.file.filename;
  }
  
  farmer.certificates.push(req.body);
  await farmer.save();
  
  const addedCertificate = farmer.certificates[farmer.certificates.length - 1];
  
  res.status(201).json({
    success: true,
    data: addedCertificate
  });
});

// @desc    Çiftçi sertifikalarını getir
// @route   GET /api/farmers/:id/certificates
// @access  Public/Private
exports.getCertificates = asyncHandler(async (req, res, next) => {
  const farmerId = req.params.id;
  
  const farmer = await Farmer.findById(farmerId);
  
  if (!farmer) {
    return next(new ErrorResponse('Çiftlik bulunamadı', 404));
  }
  
  let certificates;
  // Admin veya çiftlik sahibi tüm sertifikaları görebilir, diğerleri sadece onaylanmış olanları
  if (req.user && (req.user.role === 'admin' || (req.user.id && farmer.user.toString() === req.user.id))) {
    certificates = farmer.certificates; // Admin veya çiftlik sahibiyse tüm sertifikaları gör
  } else {
    certificates = farmer.certificates.filter(cert => cert.verified); // Diğer kullanıcılar sadece doğrulanmış olanları görsün
  }
  
  res.status(200).json({
    success: true,
    count: certificates.length,
    data: certificates
  });
});

// @desc    Çiftçi sertifikasını sil
// @route   DELETE /api/farmers/:id/certificates/:certificateId
// @access  Private (Farmer)
exports.deleteCertificate = asyncHandler(async (req, res, next) => {
  const { id, certificateId } = req.params;
  
  const farmer = await Farmer.findOne({ _id: id, user: req.user.id });
  
  if (!farmer) {
    return next(new ErrorResponse('İzin yok veya çiftlik bulunamadı', 404));
  }
  
  const certificateIndex = farmer.certificates.findIndex(
    cert => cert._id.toString() === certificateId
  );
  
  if (certificateIndex === -1) {
    return next(new ErrorResponse('Sertifika bulunamadı', 404));
  }
  
  // Sertifikayı sil
  farmer.certificates.splice(certificateIndex, 1);
  await farmer.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Çiftçi sertifikasını doğrula
// @route   PUT /api/farmers/:id/certificates/:certificateId/verify
// @access  Private (Admin)
exports.verifyCertificate = asyncHandler(async (req, res, next) => {
  const { id, certificateId } = req.params;
  const { verified } = req.body;
  
  const farmer = await Farmer.findById(id);
  
  if (!farmer) {
    return next(new ErrorResponse('Çiftlik bulunamadı', 404));
  }
  
  const certificate = farmer.certificates.id(certificateId);
  
  if (!certificate) {
    return next(new ErrorResponse('Sertifika bulunamadı', 404));
  }
  
  // Sertifikayı doğrula veya doğrulamayı kaldır
  certificate.verified = verified === true || verified === 'true';
  await farmer.save();
  
  res.status(200).json({
    success: true,
    data: certificate
  });
});

// Token yanıt fonksiyonu (helpers)
const sendTokenResponse = (user, statusCode, res, extraData = {}) => {
  try {
    // Token oluştur
    const token = user.getSignedJwtToken();

    const cookieExpire = process.env.JWT_COOKIE_EXPIRE || 30;
    console.log('Cookie süresi (gün):', cookieExpire);

    const options = {
      expires: new Date(
        Date.now() + cookieExpire * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Yanıt objesi oluştur
    const responseObject = {
      success: true,
      token,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        ...extraData
      }
    };

    console.log('Token başarıyla oluşturuldu:', token.substring(0, 15) + '...');

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json(responseObject);
  } catch (error) {
    console.error('Token oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama hatası: ' + error.message
    });
  }
}; 