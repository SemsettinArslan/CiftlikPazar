const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// @desc    Firma kaydı oluştur
// @route   POST /api/companies/register
// @access  Public
exports.registerCompany = asyncHandler(async (req, res, next) => {
  try {
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
      return next(new ErrorResponse('Bu e-posta adresi zaten kullanılıyor', 400));
    }

    const taxNumberExists = await Company.findOne({ taxNumber });
    if (taxNumberExists) {
      return next(new ErrorResponse('Bu vergi numarası zaten kayıtlı', 400));
    }

    // Kullanıcı oluştur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      city,
      district,
      address,
      role: 'company',
      approvalStatus: 'pending'
    });

    // Firma oluştur
    const company = await Company.create({
      user: user._id,
      companyName,
      taxNumber,
      taxOffice,
      city,
      district,
      address,
      contactPerson,
      companyType,
      approvalStatus: 'pending'
    });

    // Admin ve destek ekibine bildirim e-postası gönder
    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL || 'admin@ciftlikpazar.com',
        subject: 'Yeni Firma Kaydı - Çiftlik Pazar',
        html: `
        <h1>Yeni Firma Kaydı</h1>
        <p><strong>Firma Adı:</strong> ${companyName}</p>
        <p><strong>Vergi No:</strong> ${taxNumber}</p>
        <p><strong>Yetkili Kişi:</strong> ${firstName} ${lastName}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Adres:</strong> ${address}, ${district}, ${city}</p>
        <p>Lütfen firma bilgilerini kontrol edip onaylayın.</p>
        `
      });

      // Firma yetkilisine bilgilendirme e-postası gönder
      const html = `
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
            color: #1976D2;
            font-size: 26px;
            font-weight: bold;
          }
          .content {
            padding: 30px 20px;
          }
          .company-info {
            background-color: #f8f9fa;
            border-left: 4px solid #1976D2;
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
            color: #1976D2;
            margin-top: 0;
          }
          h3 {
            color: #1976D2;
            font-size: 18px;
            margin-top: 25px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1976D2;
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
          .info-item {
            margin-bottom: 8px;
          }
          .contact-box {
            background-color: #E3F2FD;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .steps {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .step {
            margin-bottom: 10px;
            position: relative;
            padding-left: 25px;
          }
          .step:before {
            content: "✓";
            color: #1976D2;
            position: absolute;
            left: 0;
            top: 0;
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
            <p>Çiftlik Pazar platformuna firma olarak yapmış olduğunuz başvuru başarıyla alınmıştır. Başvurunuz şu anda inceleme aşamasındadır.</p>
            
            <div class="company-info">
              <h3>Firma Bilgileriniz</h3>
              <div class="info-item"><strong>Firma Adı:</strong> ${companyName}</div>
              <div class="info-item"><strong>Vergi No:</strong> ${taxNumber}</div>
              <div class="info-item"><strong>Vergi Dairesi:</strong> ${taxOffice}</div>
              <div class="info-item"><strong>İl/İlçe:</strong> ${city}/${district}</div>
            </div>
            
            <div class="contact-box">
              <h3>İletişim Kişisi</h3>
              <div class="info-item"><strong>Ad Soyad:</strong> ${contactPerson.name}</div>
              <div class="info-item"><strong>Pozisyon:</strong> ${contactPerson.position || 'Belirtilmedi'}</div>
              <div class="info-item"><strong>Telefon:</strong> ${contactPerson.phone}</div>
              <div class="info-item"><strong>E-posta:</strong> ${contactPerson.email}</div>
            </div>
            
            <div class="steps">
              <h3>Sonraki Adımlar</h3>
              <div class="step">Başvurunuz genellikle 1-3 iş günü içinde incelenir.</div>
              <div class="step">Başvurunuzun sonucu e-posta yoluyla bildirilecektir.</div>
              <div class="step">Başvurunuz onaylandıktan sonra sistemi kullanmaya başlayabilirsiniz.</div>
            </div>
            
            <div class="status-box">
              <p>Başvurunuzun durumu: <strong>İnceleme Bekliyor</strong></p>
              <p>Onay süreciniz genellikle 1-3 iş günü içinde tamamlanır.</p>
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
        subject: 'Çiftlik Pazar - Firma Başvurunuz Alındı',
        html: html
      });
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // Email gönderme hatası durumunda işlemi durdurmuyoruz
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

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
    return next(new ErrorResponse('Firma hesabı oluşturulurken bir hata oluştu', 500));
  }
});

// @desc    Firma profilini getir
// @route   GET /api/companies/profile
// @access  Private/Company
exports.getCompanyProfile = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone');

    if (!company) {
      return next(new ErrorResponse('Firma profili bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Firma profili getirme hatası:', error);
    return next(new ErrorResponse('Firma profili getirilirken bir hata oluştu', 500));
  }
});

// @desc    Firma profilini güncelle
// @route   PUT /api/companies/update
// @access  Private/Company
exports.updateCompany = asyncHandler(async (req, res, next) => {
  try {
    const {
      companyName,
      taxNumber,
      taxOffice,
      city,
      district,
      address,
      contactPerson,
      companyType
    } = req.body;

    // Vergi numarası zaten varsa ve başka bir firmaya aitse kontrol et
    if (taxNumber) {
      const existingCompany = await Company.findOne({ 
        taxNumber, 
        user: { $ne: req.user.id } 
      });

      if (existingCompany) {
        return next(new ErrorResponse('Bu vergi numarası başka bir firma tarafından kullanılıyor', 400));
      }
    }

    // Firma bilgilerini güncelle
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      {
        companyName,
        taxNumber,
        taxOffice,
        city,
        district,
        address,
        contactPerson,
        companyType,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return next(new ErrorResponse('Firma profili bulunamadı', 404));
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
    return next(new ErrorResponse('Firma bilgileri güncellenirken bir hata oluştu', 500));
  }
});

// @desc    Onay bekleyen firmaları getir
// @route   GET /api/companies/pending
// @access  Private (Admin)
exports.getPendingCompanies = asyncHandler(async (req, res, next) => {
  try {
    const pendingCompanies = await Company.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email phone approvalStatus createdAt',
        match: { approvalStatus: 'pending', role: 'company' }
      });

    // Null user filtreleme - eğer populate match koşulları sağlanmazsa user alanı null olabilir
    const filteredCompanies = pendingCompanies.filter(company => company.user !== null);

    res.status(200).json({
      success: true,
      count: filteredCompanies.length,
      data: filteredCompanies
    });
  } catch (error) {
    console.error('Onay bekleyen firmaları getirme hatası:', error);
    return next(new ErrorResponse('Onay bekleyen firmalar getirilirken bir hata oluştu', 500));
  }
});

// @desc    Onaylanmış firmaları getir
// @route   GET /api/companies/approved
// @access  Private (Admin)
exports.getApprovedCompanies = asyncHandler(async (req, res, next) => {
  try {
    const approvedCompanies = await Company.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email phone approvalStatus createdAt',
        match: { approvalStatus: 'approved', role: 'company' }
      });

    // Null user filtreleme - eğer populate match koşulları sağlanmazsa user alanı null olabilir
    const filteredCompanies = approvedCompanies.filter(company => company.user !== null);

    res.status(200).json({
      success: true,
      count: filteredCompanies.length,
      data: filteredCompanies
    });
  } catch (error) {
    console.error('Onaylanmış firmaları getirme hatası:', error);
    return next(new ErrorResponse('Onaylanmış firmalar getirilirken bir hata oluştu', 500));
  }
});

// @desc    Reddedilmiş firmaları getir
// @route   GET /api/companies/rejected
// @access  Private (Admin)
exports.getRejectedCompanies = asyncHandler(async (req, res, next) => {
  try {
    const rejectedCompanies = await Company.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email phone approvalStatus createdAt',
        match: { approvalStatus: 'rejected', role: 'company' }
      });

    // Null user filtreleme - eğer populate match koşulları sağlanmazsa user alanı null olabilir
    const filteredCompanies = rejectedCompanies.filter(company => company.user !== null);

    res.status(200).json({
      success: true,
      count: filteredCompanies.length,
      data: filteredCompanies
    });
  } catch (error) {
    console.error('Reddedilmiş firmaları getirme hatası:', error);
    return next(new ErrorResponse('Reddedilmiş firmalar getirilirken bir hata oluştu', 500));
  }
});

// @desc    Firma başvurusunu onayla/reddet
// @route   PUT /api/companies/:id/approve
// @access  Private (Admin)
exports.approveCompany = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Geçerli bir onay durumu belirtmelisiniz (approved/rejected)', 400));
  }

  const company = await Company.findById(id).populate('user', 'email firstName lastName');

  if (!company) {
    return next(new ErrorResponse('Firma bulunamadı', 404));
  }

  // Kullanıcı durumunu güncelle
  await User.findByIdAndUpdate(
    company.user._id,
    { approvalStatus: status },
    { new: true }
  );

  // Firma durumunu güncelle
  if (status === 'rejected' && rejectionReason) {
    company.rejectionReason = rejectionReason;
  }
  
  company.approvalStatus = status;
  await company.save();

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
            color: #1976D2;
            font-size: 26px;
            font-weight: bold;
          }
          .content {
            padding: 30px 20px;
          }
          .company-info {
            background-color: #f8f9fa;
            border-left: 4px solid #1976D2;
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
            color: #1976D2;
            margin-top: 0;
          }
          h2 {
            color: #1976D2;
            font-size: 18px;
            margin-top: 25px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1976D2;
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
            <p>Sayın <strong>${company.user.firstName} ${company.user.lastName}</strong>,</p>
            <p>Çiftlik Pazar'a firma olarak başvurunuz onaylandı. Artık platform üzerinden alım yapabilir ve ürünlerimizi inceleyebilirsiniz!</p>
            
            <div class="company-info">
              <h2>Firma Bilgileriniz</h2>
              <ul>
                <li><strong>Firma Adı:</strong> ${company.companyName}</li>
                <li><strong>Lokasyon:</strong> ${company.city}, ${company.district}</li>
              </ul>
            </div>
            
            <div class="status-box">
              <p><span class="checkmark">✓</span> Hesap durumunuz: <strong>Onaylandı</strong></p>
              <p>Hesabınıza giriş yaparak işlemlere başlayabilirsiniz.</p>
            </div>
            
            <div class="next-steps">
              <h3>Sıradaki Adımlar</h3>
              <ol>
                <li>Hesabınıza giriş yapın</li>
                <li>Firma profilinizi tamamlayın</li>
                <li>Ürünleri inceleyin ve sipariş vermeye başlayın</li>
              </ol>
            </div>
            
            <p>Deneyiminizi iyileştirmek için önerilerinizi ve geri bildirimlerinizi bizimle paylaşabilirsiniz.</p>
            <p>Tüm sorularınız için <a href="mailto:destek@ciftlikpazar.com" style="color: #1976D2;">destek@ciftlikpazar.com</a> adresinden bize ulaşabilirsiniz.</p>
            
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
        email: company.user.email,
        subject: 'Çiftlik Pazar - Firma Başvurunuz Onaylandı',
        html: message
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
            color: #1976D2;
            font-size: 26px;
            font-weight: bold;
          }
          .content {
            padding: 30px 20px;
          }
          .company-info {
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
            background-color: #1976D2;
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
            <p>Sayın <strong>${company.user.firstName} ${company.user.lastName}</strong>,</p>
            <p>Çiftlik Pazar'a firma olarak yaptığınız başvuruyu değerlendirdik. Maalesef, başvurunuzu şu aşamada onaylayamadığımızı bildirmek isteriz.</p>
            
            <div class="company-info">
              <h2>Başvuru Bilgileriniz</h2>
              <ul>
                <li><strong>Firma Adı:</strong> ${company.companyName}</li>
                <li><strong>Lokasyon:</strong> ${company.city}, ${company.district}</li>
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
                <li>Firma bilgilerinizin eksiksiz ve doğru olduğundan emin olun</li>
                <li>Eksik veya yanlış belgeleri düzeltin</li>
                <li>Vergi numarası ve diğer kurumsal bilgilerinizi kontrol edin</li>
              </ul>
              <p>Herhangi bir sorunuz için destek ekibimizle iletişime geçmekten çekinmeyin.</p>
            </div>
            
            <p>Tüm sorularınız için <a href="mailto:destek@ciftlikpazar.com" style="color: #1976D2;">destek@ciftlikpazar.com</a> adresinden bize ulaşabilirsiniz.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/company-register" class="btn">Yeniden Başvur</a>
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
        email: company.user.email,
        subject: 'Çiftlik Pazar - Firma Başvurunuz Hakkında Bilgilendirme',
        html: message
      });
    }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    // E-posta hatası işlemi durdurmaz, sadece loglama yapılır
  }

  res.status(200).json({
    success: true,
    data: {
      id: company._id,
      status
    }
  });
}); 