const Farmer = require('../models/farmer.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/emailer');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// @desc    Çiftçi kaydı oluştur
// @route   POST /api/farmers
// @access  Private
exports.registerFarmer = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli alanları doldurun'
      });
    }

    // Vergi numarası kontrolü
    const taxExists = await Farmer.findOne({ taxNumber });
    if (taxExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu vergi numarası zaten kullanılıyor'
      });
    }

    // Kullanıcının daha önce bir çiftçi kaydı var mı kontrol et
    const existingFarmer = await Farmer.findOne({ user: req.user.id });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya ait bir çiftlik kaydı zaten mevcut'
      });
    }

    // Kullanıcı bilgilerini al
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
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

    // Not: E-posta gönderme kısmı completeRegistration fonksiyonuna taşındı

    res.status(201).json({
      success: true,
      data: farmer
    });
  } catch (error) {
    console.error('Çiftçi kaydı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Çiftçi detayını getir
// @route   GET /api/farmers/:id
// @access  Public
exports.getFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('categories', 'name');

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: farmer
    });
  } catch (error) {
    console.error('Çiftlik detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Kullanıcıya ait çiftlik bilgisini getir
// @route   GET /api/farmers/me
// @access  Private
exports.getMyFarm = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id })
      .populate('categories', 'name');

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik kaydınız bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: farmer
    });
  } catch (error) {
    console.error('Kendi çiftlik bilgisini getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Çiftçi kaydı oluştur (public)
// @route   POST /api/public/farmers
// @access  Public
exports.registerFarmerPublic = async (req, res) => {
  try {
    const { 
      email, // E-posta adresi
      phone, // Telefon numarası (eklendi)
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
    if (!email || !phone || !farmName || !city || !district || !address || !taxNumber || !categories || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli alanları doldurun'
      });
    }

    // E-posta ve telefon kontrolü - eşsiz olup olmadığı
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası zaten kullanılıyor'
      });
    }

    // E-posta ile kullanıcıyı bul
    const userByEmail = await User.findOne({ email });
    if (!userByEmail) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Vergi numarası kontrolü
    const taxExists = await Farmer.findOne({ taxNumber });
    if (taxExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu vergi numarası zaten kullanılıyor'
      });
    }

    // Kullanıcının daha önce bir çiftçi kaydı var mı kontrol et
    const existingFarmer = await Farmer.findOne({ user: userByEmail._id });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya ait bir çiftlik kaydı zaten mevcut'
      });
    }

    // Çiftçi oluştur
    const farmer = await Farmer.create({
      user: userByEmail._id,
      farmName,
      city,
      district,
      address,
      taxNumber,
      categories,
      hasShipping: hasShipping || false,
      description
    });

    // Kullanıcı onayını bekliyor olarak güncelle
    await User.findByIdAndUpdate(
      userByEmail._id,
      { approvalStatus: 'pending' },
      { new: true }
    );

    // Not: E-posta gönderme kısmı completeRegistration fonksiyonuna taşındı

    res.status(201).json({
      success: true,
      data: {
        message: 'Başvurunuz alındı!'
      }
    });
  } catch (error) {
    console.error('Çiftçi kaydı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Çiftçi kayıt tamamlama (ikili adım)
// @route   POST /api/farmers/complete-registration
// @access  Public
exports.completeRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userInfo, farmInfo, certificates } = req.body;

    // Zorunlu alanları kontrol et - Kullanıcı bilgileri
    if (!userInfo || !userInfo.firstName || !userInfo.lastName || !userInfo.email || !userInfo.password || !userInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Tüm kullanıcı bilgilerini giriniz'
      });
    }

    // Zorunlu alanları kontrol et - Çiftlik bilgileri
    if (!farmInfo || !farmInfo.farmName || !farmInfo.city || !farmInfo.district || 
        !farmInfo.address || !farmInfo.taxNumber || !farmInfo.categories || farmInfo.categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tüm çiftlik bilgilerini giriniz'
      });
    }

    // Var olan kullanıcı/çiftlik kontrolü
    const emailExists = await User.findOne({ email: userInfo.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    const phoneExists = await User.findOne({ phone: userInfo.phone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası zaten kullanılıyor'
      });
    }

    const taxExists = await Farmer.findOne({ taxNumber: farmInfo.taxNumber });
    if (taxExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu vergi numarası zaten kullanılıyor'
      });
    }

    // Sertifika kontrolü (eğer varsa)
    let validatedCertificates = [];
    if (certificates && certificates.length > 0) {
      // Her bir sertifika için zorunlu alanları kontrol et
      for (const cert of certificates) {
        if (!cert.name || !cert.issuer || !cert.issueDate || !cert.certificateType) {
          return res.status(400).json({
            success: false,
            message: 'Lütfen tüm gerekli sertifika bilgilerini giriniz (ad, kurum, tarih ve tip)'
          });
        }
        
        // Geçerli sertifika türünü kontrol et
        const validTypes = ['organic', 'goodAgriculturalPractices', 'sustainability', 'qualityAssurance', 'other'];
        if (!validTypes.includes(cert.certificateType)) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz sertifika türü. Geçerli türler: ' + validTypes.join(', ')
          });
        }
        
        // Geçerli tarih formatını kontrol et
        if (isNaN(new Date(cert.issueDate).getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz tarih formatı. Lütfen geçerli bir tarih giriniz.'
          });
        }
        
        // Son kullanma tarihi varsa kontrol et
        if (cert.expiryDate && isNaN(new Date(cert.expiryDate).getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz son kullanma tarihi formatı. Lütfen geçerli bir tarih giriniz.'
          });
        }
        
        // Geçerli sertifikayı listeye ekle
        validatedCertificates.push({
          ...cert,
          verified: false // Yeni sertifikalar varsayılan olarak doğrulanmamış durumda
        });
      }
    }

    // Şifreyi hash'le
    try {
      // Kullanıcıyı oluştur - role: farmer olarak
      const user = await User.create([{
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        password: userInfo.password, // Şifreyi düz metin olarak gönderiyoruz, model kendi hashleyecek
        phone: userInfo.phone,
        role: 'farmer',
        approvalStatus: 'pending', // Başvuru durumu beklemede
        accountStatus: 'active'
      }], { session });

      // Çiftlik oluştur
      const farmer = await Farmer.create([{
        user: user[0]._id,
        farmName: farmInfo.farmName,
        city: farmInfo.city, 
        district: farmInfo.district,
        address: farmInfo.address,
        taxNumber: farmInfo.taxNumber,
        categories: farmInfo.categories,
        hasShipping: farmInfo.hasShipping || false,
        description: farmInfo.description || '',
        certificates: validatedCertificates, // Doğrulanmış sertifikaları ekle
        rating: 0,
        numReviews: 0
      }], { session });

      // Transaction'ı commit et
      await session.commitTransaction();
      session.endSession();

      // E-posta gönder
      try {
        await sendEmail({
          email: userInfo.email,
          subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Alındı',
          message: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Çiftlik Pazar - Başvurunuz Alındı</title>
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
              ul {
                padding-left: 20px;
              }
              li {
                margin-bottom: 8px;
              }
              .certificate-box {
                background-color: #E3F2FD;
                border-left: 4px solid #2196F3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🌱 Çiftlik Pazar</div>
              </div>
              <div class="content">
                <h1>Başvurunuz Alındı!</h1>
                <p>Sayın <strong>${userInfo.firstName} ${userInfo.lastName}</strong>,</p>
                <p>Çiftlik Pazar'a çiftçi olarak başvurunuzu aldık. Teşekkür ederiz! Başvurunuz ekibimiz tarafından incelenecek ve onaylandığında size bilgi verilecektir.</p>
                
                <div class="farm-info">
                  <h2>Çiftlik Bilgileriniz</h2>
                  <ul>
                    <li><strong>Çiftlik Adı:</strong> ${farmInfo.farmName}</li>
                    <li><strong>Lokasyon:</strong> ${farmInfo.city}, ${farmInfo.district}</li>
                    <li><strong>Vergi No:</strong> ${farmInfo.taxNumber}</li>
                  </ul>
                </div>
                
                ${validatedCertificates.length > 0 ? `
                <div class="certificate-box">
                  <h2>Eklediğiniz Sertifikalar</h2>
                  <p>Aşağıdaki sertifikalarınız başvurunuzla birlikte alınmıştır. Ekibimiz tarafından incelenip doğrulandıktan sonra profilinizde görünecektir.</p>
                  <ul>
                    ${validatedCertificates.map(cert => `
                      <li>
                        <strong>${cert.name}</strong> (${cert.issuer} tarafından verilmiş)
                      </li>
                    `).join('')}
                  </ul>
                </div>
                ` : ''}
                
                <div class="status-box">
                  <p>Başvurunuzun durumu: <strong>İnceleme Bekliyor</strong></p>
                  <p>Onay süreciniz genellikle 1-3 iş günü içinde tamamlanır. Başvurunuz onaylandığında, ürünlerinizi ekleyebilir ve çiftliğinizi yönetmeye başlayabilirsiniz.</p>
                </div>
                
                <p>Tüm sorularınız için bizimle <a href="mailto:destek@ciftlikpazar.com" style="color: #198754;">destek@ciftlikpazar.com</a> adresinden iletişime geçebilirsiniz.</p>
              </div>
              <div class="footer">
                <p>Bu e-posta, Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir.</p>
                <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
          `
        });
      } catch (emailError) {
        console.error('E-posta gönderme hatası:', emailError);
        // E-posta gönderme hatası kayıt işlemini etkilemesin
      }

      // Başarılı yanıt gönder
      const certificatesCount = validatedCertificates.length;
      
      res.status(201).json({
        success: true,
        message: `Çiftçi kaydınız başarıyla oluşturuldu! ${certificatesCount > 0 ? `${certificatesCount} sertifika eklendi.` : ''} Onay süreciniz başladı.`,
        data: {
          user: user[0],
          farmer: farmer[0]
        }
      });
    } catch (hashError) {
      console.error('Şifre hashleme hatası:', hashError);
      throw new Error('Şifre hashleme hatası: ' + (hashError.message || 'Bilinmeyen hata'));
    }
  } catch (error) {
    // Hata durumunda transaction'ı geri al
    await session.abortTransaction();
    session.endSession();

    console.error('Çiftçi kaydı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Tüm çiftçileri getir
// @route   GET /api/farmers
// @access  Admin
exports.getAllFarmers = async (req, res) => {
  try {
    // Tüm çiftçi verilerini kullanıcı bilgileriyle birleştirerek getir
    const farmers = await Farmer.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email phone approvalStatus createdAt'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: farmers.length,
      data: farmers
    });
  } catch (error) {
    console.error('Çiftçi listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Onay bekleyen çiftçileri getir
// @route   GET /api/farmers/pending
// @access  Admin
exports.getPendingFarmers = async (req, res) => {
  try {
    // Onay bekleyen çiftçileri bul
    const pendingFarmers = await Farmer.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email phone approvalStatus createdAt',
        match: { approvalStatus: 'pending', role: 'farmer' }
      })
      .populate({
        path: 'categories',
        select: 'category_name'
      })
      .sort({ createdAt: -1 });

    // Kullanıcısı olmayan veya onaylanmış/reddedilmiş olanları filtrele
    const filteredFarmers = pendingFarmers.filter(farmer => farmer.user !== null);

    res.status(200).json({
      success: true,
      count: filteredFarmers.length,
      data: filteredFarmers
    });
  } catch (error) {
    console.error('Onay bekleyen çiftçi listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Çiftçi onayını güncelle
// @route   PUT /api/farmers/:id/approve
// @access  Admin
exports.approveFarmer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    // Çiftlik bilgisini bul
    const farmer = await Farmer.findById(id).populate('user', 'email firstName lastName');
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi bulunamadı'
      });
    }

    // Kullanıcının onay durumunu güncelle
    await User.findByIdAndUpdate(
      farmer.user._id, 
      { approvalStatus: approved ? 'approved' : 'rejected' },
      { session }
    );

    // İşlemi tamamla
    await session.commitTransaction();
    session.endSession();

    // E-posta gönder - Onay veya Ret durumuna göre farklı e-postalar
    try {
      if (approved) {
        // Onay e-postası
        await sendEmail({
          email: farmer.user.email,
          subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Onaylandı',
          message: `
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
          `
        });
      } else {
        // Ret e-postası
        await sendEmail({
          email: farmer.user.email,
          subject: 'Çiftlik Pazar - Çiftçi Başvurunuz Hakkında Bilgilendirme',
          message: `
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
                
                ${rejectionReason ? `
                <div class="reason-box">
                  <h2>Başvurunuzla İlgili Geri Bildirim</h2>
                  <p>${rejectionReason}</p>
                </div>
                ` : ''}
                
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
                  <a href="https://ciftlikpazar.com/farmer-register" class="btn">Yeniden Başvur</a>
                </div>
              </div>
              <div class="footer">
                <p>Bu e-posta, Çiftlik Pazar uygulaması tarafından otomatik olarak gönderilmiştir.</p>
                <p>&copy; ${new Date().getFullYear()} Çiftlik Pazar. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
          `
        });
      }
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // E-posta gönderme hatası işlemi etkilemesin
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Çiftçi başvurusu onaylandı' : 'Çiftçi başvurusu reddedildi',
      data: { 
        id: farmer._id,
        approvalStatus: approved ? 'approved' : 'rejected'
      }
    });
  } catch (error) {
    // Hata durumunda transaction'ı geri al
    await session.abortTransaction();
    session.endSession();

    console.error('Çiftçi onaylama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Çiftçi için sertifika ekle
// @route   POST /api/farmers/:id/certificates
// @access  Private (Çiftçi)
exports.addCertificate = async (req, res) => {
  try {
    const farmerId = req.params.id;
    
    // Çiftlik sahibi olup olmadığını kontrol et
    const farmer = await Farmer.findOne({ _id: farmerId, user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik bulunamadı veya bu işlem için yetkiniz yok'
      });
    }
    
    // Gerekli sertifika alanlarını kontrol et
    const { name, issuer, issueDate, certificateType } = req.body;
    
    if (!name || !issuer || !issueDate || !certificateType) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm gerekli sertifika bilgilerini girin'
      });
    }
    
    // Sertifika ekle
    farmer.certificates.push(req.body);
    await farmer.save();
    
    const addedCertificate = farmer.certificates[farmer.certificates.length - 1];
    
    res.status(201).json({
      success: true,
      message: 'Sertifika başarıyla eklendi',
      data: addedCertificate
    });
  } catch (error) {
    console.error('Sertifika ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Çiftçi sertifikalarını getir
// @route   GET /api/farmers/:id/certificates
// @access  Public
exports.getCertificates = async (req, res) => {
  try {
    const farmerId = req.params.id;
    
    const farmer = await Farmer.findById(farmerId);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik bulunamadı'
      });
    }
    
    // Sadece doğrulanmış sertifikaları döndür (admin ise hepsini)
    let certificates;
    
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
  } catch (error) {
    console.error('Sertifikaları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Sertifika sil
// @route   DELETE /api/farmers/:id/certificates/:certificateId
// @access  Private (Çiftçi)
exports.deleteCertificate = async (req, res) => {
  try {
    const { id, certificateId } = req.params;
    
    // Çiftlik sahibi olup olmadığını kontrol et
    const farmer = await Farmer.findOne({ _id: id, user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik bulunamadı veya bu işlem için yetkiniz yok'
      });
    }
    
    // Sertifikayı bul
    const certificateIndex = farmer.certificates.findIndex(
      cert => cert._id.toString() === certificateId
    );
    
    if (certificateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sertifika bulunamadı'
      });
    }
    
    // Sertifikayı kaldır
    farmer.certificates.splice(certificateIndex, 1);
    await farmer.save();
    
    res.status(200).json({
      success: true,
      message: 'Sertifika başarıyla silindi'
    });
  } catch (error) {
    console.error('Sertifika silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Sertifikayı doğrula (Admin)
// @route   PUT /api/farmers/:id/certificates/:certificateId/verify
// @access  Private (Admin)
exports.verifyCertificate = async (req, res) => {
  try {
    const { id, certificateId } = req.params;
    
    const farmer = await Farmer.findById(id);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftlik bulunamadı'
      });
    }
    
    // Sertifikayı bul
    const certificate = farmer.certificates.id(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Sertifika bulunamadı'
      });
    }
    
    // Sertifikayı doğrula
    certificate.verified = true;
    await farmer.save();
    
    res.status(200).json({
      success: true,
      message: 'Sertifika başarıyla doğrulandı',
      data: certificate
    });
  } catch (error) {
    console.error('Sertifika doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
}; 