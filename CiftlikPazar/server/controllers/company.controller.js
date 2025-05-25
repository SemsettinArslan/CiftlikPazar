const Company = require('../models/company.model');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailer');

/**
 * @desc    Firma hesabı oluştur
 * @route   POST /api/companies/register
 * @access  Public
 */
exports.registerCompany = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    companyName,
    taxNumber,
    taxOffice,
    city,
    district,
    address,
    contactPerson,
    companyType
  } = req.body;

  // Email ve vergi numarası kontrolü
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({
      success: false,
      message: 'Bu e-posta adresi zaten kullanılıyor'
    });
  }

  const taxNumberExists = await Company.findOne({ taxNumber });
  if (taxNumberExists) {
    return res.status(400).json({
      success: false,
      message: 'Bu vergi numarası zaten kayıtlı'
    });
  }

  try {
    // Kullanıcı oluştur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'company',
      approvalStatus: 'pending',
      city,
      district,
      address
    });

    // Firma bilgilerini oluştur
    const company = await Company.create({
      user: user._id,
      companyName,
      taxNumber,
      taxOffice,
      city,
      district,
      address,
      contactPerson,
      companyType
    });

    // Email notification
    try {
      await sendEmail({
        email: email,
        subject: 'Çiftlik Pazar - Firma Başvurunuz Alındı',
        message: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Çiftlik Pazar - Firma Başvurunuz Alındı</title>
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
            .company-info {
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
            .contact-box {
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
              <h1>Firma Başvurunuz Alındı!</h1>
              <p>Sayın <strong>${firstName} ${lastName}</strong>,</p>
              <p>Çiftlik Pazar'a firma olarak başvurunuzu aldık. Teşekkür ederiz! Başvurunuz ekibimiz tarafından incelenecek ve onaylandığında size bilgi verilecektir.</p>
              
              <div class="company-info">
                <h2>Firma Bilgileriniz</h2>
                <ul>
                  <li><strong>Firma Adı:</strong> ${companyName}</li>
                  <li><strong>Vergi Numarası:</strong> ${taxNumber}</li>
                  <li><strong>Vergi Dairesi:</strong> ${taxOffice}</li>
                  <li><strong>Lokasyon:</strong> ${city}, ${district}</li>
                </ul>
              </div>
              
              <div class="contact-box">
                <h2>İletişim Kişisi</h2>
                <ul>
                  <li><strong>Ad Soyad:</strong> ${contactPerson.name}</li>
                  <li><strong>Pozisyon:</strong> ${contactPerson.position}</li>
                  <li><strong>Telefon:</strong> ${contactPerson.phone}</li>
                  <li><strong>E-posta:</strong> ${contactPerson.email}</li>
                </ul>
              </div>
              
              <div class="status-box">
                <p>Başvurunuzun durumu: <strong>İnceleme Bekliyor</strong></p>
                <p>Onay süreciniz genellikle 1-3 iş günü içinde tamamlanır. Başvurunuz onaylandığında, firma profilinizi düzenleyebilir ve sistemi kullanmaya başlayabilirsiniz.</p>
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
      // Email gönderme hatası durumunda işlemi durdurmuyoruz
    }

    // JWT token oluştur
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Firma hesabı başarıyla oluşturuldu. Onay için bekleyiniz.',
      token,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus
        },
        company: {
          id: company._id,
          companyName: company.companyName,
          approvalStatus: company.approvalStatus
        }
      }
    });
  } catch (error) {
    console.error('Firma kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma hesabı oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma profilini getir
 * @route   GET /api/companies/profile
 * @access  Private/Company
 */
exports.getCompanyProfile = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Firma profili getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma profili getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma profilini güncelle
 * @route   PUT /api/companies/profile
 * @access  Private/Company
 */
exports.updateCompanyProfile = asyncHandler(async (req, res) => {
  try {
    const {
      companyName,
      taxOffice,
      city,
      district,
      address,
      contactPerson,
      companyType,
      companySize,
      description,
      website,
      socialMedia
    } = req.body;

    // Firma bilgilerini güncelle
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      {
        companyName,
        taxOffice,
        city,
        district,
        address,
        contactPerson,
        companyType,
        companySize,
        description,
        website,
        socialMedia,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }

    // Kullanıcı bilgilerini de güncelle
    await User.findByIdAndUpdate(
      req.user.id,
      {
        city,
        district,
        address,
        profileCompleted: true
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Firma profili başarıyla güncellendi',
      data: company
    });
  } catch (error) {
    console.error('Firma profili güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma profili güncellenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma logo/profil resmi yükle
 * @route   PUT /api/companies/upload-image
 * @access  Private/Company
 */
exports.uploadCompanyImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim yükleyin'
      });
    }

    const imageType = req.body.imageType || 'profile'; // profile veya logo
    const imageField = imageType === 'logo' ? 'logoImage' : 'profileImage';
    const imagePath = req.file.filename;

    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      { [imageField]: imagePath },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: `Firma ${imageType === 'logo' ? 'logosu' : 'profil resmi'} başarıyla güncellendi`,
      data: {
        [imageField]: imagePath
      }
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Resim yüklenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Tüm firmaları getir (admin için)
 * @route   GET /api/companies
 * @access  Private/Admin
 */
exports.getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('user', 'firstName lastName email phone approvalStatus');

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Firmaları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firmalar getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma onay durumunu güncelle (admin için)
 * @route   PUT /api/companies/:id/approval
 * @access  Private/Admin
 */
exports.updateCompanyApproval = asyncHandler(async (req, res) => {
  try {
    const { approvalStatus } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz onay durumu'
      });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    // Kullanıcı onay durumunu da güncelle
    await User.findByIdAndUpdate(
      company.user,
      { approvalStatus },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Firma onay durumu "${approvalStatus}" olarak güncellendi`,
      data: company
    });
  } catch (error) {
    console.error('Firma onay durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma onay durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma detayını getir (ID'ye göre)
 * @route   GET /api/companies/:id
 * @access  Private
 */
exports.getCompanyById = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Firma detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma detayı getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firma bilgilerini güncelle
 * @route   PUT /api/companies/update
 * @access  Private/Company
 */
exports.updateCompany = asyncHandler(async (req, res) => {
  try {
    const {
      companyName,
      taxNumber,
      taxOffice,
      address,
      city,
      district,
      contactPerson
    } = req.body;

    // Vergi numarası zaten varsa ve başka bir firmaya aitse kontrol et
    if (taxNumber) {
      const existingCompany = await Company.findOne({ 
        taxNumber, 
        user: { $ne: req.user.id } 
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Bu vergi numarası başka bir firma tarafından kullanılıyor'
        });
      }
    }

    // Firma bilgilerini güncelle
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      {
        companyName,
        taxNumber,
        taxOffice,
        address,
        city,
        district,
        contactPerson,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }

    // Kullanıcı bilgilerini de güncelle
    await User.findByIdAndUpdate(
      req.user.id,
      {
        city,
        district,
        address,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Firma bilgileri başarıyla güncellendi',
      data: company
    });
  } catch (error) {
    console.error('Firma bilgileri güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma bilgileri güncellenirken bir hata oluştu',
      error: error.message
    });
  }
}); 