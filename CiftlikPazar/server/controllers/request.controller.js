const Request = require('../models/request.model');
const Company = require('../models/company.model');
const Farmer = require('../models/farmer.model');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Yeni talep oluştur
 * @route   POST /api/requests
 * @access  Private/Company
 */
exports.createRequest = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talep oluştur
    const request = await Request.create({
      company: company._id,
      ...req.body,
      // Son geçerlilik tarihi ayarla (eğer belirtilmemişse)
      expiryDate: req.body.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
    });
    
    res.status(201).json({
      success: true,
      message: 'Talep başarıyla oluşturuldu',
      data: request
    });
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firmanın taleplerini getir
 * @route   GET /api/requests/my-requests
 * @access  Private/Company
 */
exports.getCompanyRequests = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Firmanın taleplerini getir
    const requests = await Request.find({ company: company._id })
      .sort({ createdAt: -1 })
      .populate('category', 'name');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Firma talepleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Firma talepleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Firmanın belirli bir talebini getir
 * @route   GET /api/requests/my-requests/:id
 * @access  Private/Company
 */
exports.getCompanyRequestById = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi getir
    const request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    }).populate('category', 'name');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Talep detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep detayı getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Talebi güncelle
 * @route   PUT /api/requests/my-requests/:id
 * @access  Private/Company
 */
exports.updateRequest = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi bul
    let request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklif varsa güncelleme yapılamaz
    if (request.offers && request.offers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teklifler alınmış talep güncellenemez'
      });
    }
    
    // Talebi güncelle
    request = await Request.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Talep başarıyla güncellendi',
      data: request
    });
  } catch (error) {
    console.error('Talep güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep güncellenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Talebi sil
 * @route   DELETE /api/requests/my-requests/:id
 * @access  Private/Company
 */
exports.deleteRequest = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi bul
    const request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklif varsa silme yapılamaz
    if (request.offers && request.offers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teklifler alınmış talep silinemez'
      });
    }
    
    // Talebi sil
    await request.remove();
    
    res.status(200).json({
      success: true,
      message: 'Talep başarıyla silindi'
    });
  } catch (error) {
    console.error('Talep silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep silinirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Çiftçiler için mevcut talepleri getir
 * @route   GET /api/requests/available
 * @access  Private/Farmer
 */
exports.getAvailableRequests = asyncHandler(async (req, res) => {
  try {
    // Çiftçi bilgilerini al
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi profili bulunamadı'
      });
    }
    
    // Filtreleme seçenekleri
    const { city, district, category, isOrganic } = req.query;
    
    // Filtre oluştur
    const filter = {
      status: 'active',
      expiryDate: { $gt: new Date() }
    };
    
    // Şehir filtresi
    if (city) {
      filter.city = city;
    }
    
    // İlçe filtresi
    if (district) {
      filter.district = district;
    }
    
    // Kategori filtresi
    if (category) {
      filter.category = category;
    }
    
    // Organik filtresi
    if (isOrganic) {
      filter.isOrganic = isOrganic === 'true';
    }
    
    // Mevcut talepleri getir
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate('category', 'name')
      .populate('company', 'companyName');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Mevcut talepleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mevcut talepler getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Talebe teklif ver
 * @route   POST /api/requests/:id/offers
 * @access  Private/Farmer
 */
exports.createOffer = asyncHandler(async (req, res) => {
  try {
    // Çiftçi bilgilerini al
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi profili bulunamadı'
      });
    }
    
    // Talebi bul
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Talep aktif mi kontrol et
    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu talep artık aktif değil'
      });
    }
    
    // Daha önce teklif verilmiş mi kontrol et
    const existingOffer = request.offers.find(
      offer => offer.farmer.toString() === farmer._id.toString()
    );
    
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Bu talebe zaten teklif verdiniz'
      });
    }
    
    // Yeni teklif oluştur
    const newOffer = {
      farmer: farmer._id,
      price: req.body.price,
      description: req.body.description,
      estimatedDeliveryDate: req.body.estimatedDeliveryDate
    };
    
    // Teklifi talebe ekle
    request.offers.push(newOffer);
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Teklif başarıyla oluşturuldu',
      data: request.offers[request.offers.length - 1]
    });
  } catch (error) {
    console.error('Teklif oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Teklifi güncelle
 * @route   PUT /api/requests/offers/:offerId
 * @access  Private/Farmer
 */
exports.updateOffer = asyncHandler(async (req, res) => {
  try {
    // Çiftçi bilgilerini al
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi profili bulunamadı'
      });
    }
    
    // Teklifi içeren talebi bul
    const request = await Request.findOne({
      'offers._id': req.params.offerId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Teklifi bul
    const offerIndex = request.offers.findIndex(
      offer => offer._id.toString() === req.params.offerId
    );
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Teklif çiftçiye ait mi kontrol et
    if (request.offers[offerIndex].farmer.toString() !== farmer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi güncelleme yetkiniz yok'
      });
    }
    
    // Teklif durumu kontrol et
    if (request.offers[offerIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Sadece bekleyen teklifler güncellenebilir'
      });
    }
    
    // Teklifi güncelle
    request.offers[offerIndex].price = req.body.price || request.offers[offerIndex].price;
    request.offers[offerIndex].description = req.body.description || request.offers[offerIndex].description;
    request.offers[offerIndex].estimatedDeliveryDate = req.body.estimatedDeliveryDate || request.offers[offerIndex].estimatedDeliveryDate;
    request.offers[offerIndex].updatedAt = Date.now();
    
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla güncellendi',
      data: request.offers[offerIndex]
    });
  } catch (error) {
    console.error('Teklif güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif güncellenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Teklifi sil
 * @route   DELETE /api/requests/offers/:offerId
 * @access  Private/Farmer
 */
exports.deleteOffer = asyncHandler(async (req, res) => {
  try {
    // Çiftçi bilgilerini al
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi profili bulunamadı'
      });
    }
    
    // Teklifi içeren talebi bul
    const request = await Request.findOne({
      'offers._id': req.params.offerId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Teklifi bul
    const offerIndex = request.offers.findIndex(
      offer => offer._id.toString() === req.params.offerId
    );
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Teklif çiftçiye ait mi kontrol et
    if (request.offers[offerIndex].farmer.toString() !== farmer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi silme yetkiniz yok'
      });
    }
    
    // Teklif durumu kontrol et
    if (request.offers[offerIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Sadece bekleyen teklifler silinebilir'
      });
    }
    
    // Teklifi sil
    request.offers.splice(offerIndex, 1);
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla silindi'
    });
  } catch (error) {
    console.error('Teklif silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif silinirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Çiftçinin verdiği teklifleri getir
 * @route   GET /api/requests/my-offers
 * @access  Private/Farmer
 */
exports.getFarmerOffers = asyncHandler(async (req, res) => {
  try {
    // Çiftçi bilgilerini al
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Çiftçi profili bulunamadı'
      });
    }
    
    // Çiftçinin tekliflerini içeren talepleri getir
    const requests = await Request.find({
      'offers.farmer': farmer._id
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name')
      .populate('company', 'companyName');
    
    // Çiftçinin tekliflerini ayıkla
    const offers = [];
    requests.forEach(request => {
      const farmerOffers = request.offers.filter(
        offer => offer.farmer.toString() === farmer._id.toString()
      );
      
      farmerOffers.forEach(offer => {
        offers.push({
          offerId: offer._id,
          requestId: request._id,
          requestTitle: request.title,
          company: request.company,
          category: request.category,
          quantity: request.quantity,
          unit: request.unit,
          price: offer.price,
          status: offer.status,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt
        });
      });
    });
    
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Çiftçi tekliflerini getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Çiftçi teklifleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Talebe yapılan teklifleri getir
 * @route   GET /api/requests/:id/offers
 * @access  Private/Company
 */
exports.getRequestOffers = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi bul
    const request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    }).populate({
      path: 'offers.farmer',
      select: 'farmName city district rating'
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      count: request.offers.length,
      data: request.offers
    });
  } catch (error) {
    console.error('Talep tekliflerini getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep teklifleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Teklifi kabul et
 * @route   PUT /api/requests/:id/offers/:offerId/accept
 * @access  Private/Company
 */
exports.acceptOffer = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi bul
    const request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklifi bul
    const offerIndex = request.offers.findIndex(
      offer => offer._id.toString() === req.params.offerId
    );
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Talebin durumunu kontrol et
    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu talep artık aktif değil'
      });
    }
    
    // Teklifi kabul et
    request.offers[offerIndex].status = 'accepted';
    request.selectedOffer = request.offers[offerIndex]._id;
    request.status = 'completed';
    
    // Diğer teklifleri reddet
    request.offers.forEach((offer, index) => {
      if (index !== offerIndex) {
        offer.status = 'rejected';
      }
    });
    
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla kabul edildi',
      data: request
    });
  } catch (error) {
    console.error('Teklif kabul etme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Teklifi reddet
 * @route   PUT /api/requests/:id/offers/:offerId/reject
 * @access  Private/Company
 */
exports.rejectOffer = asyncHandler(async (req, res) => {
  try {
    // Firma ID'sini al
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Firma profili bulunamadı'
      });
    }
    
    // Talebi bul
    const request = await Request.findOne({
      _id: req.params.id,
      company: company._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklifi bul
    const offerIndex = request.offers.findIndex(
      offer => offer._id.toString() === req.params.offerId
    );
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Teklifi reddet
    request.offers[offerIndex].status = 'rejected';
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla reddedildi',
      data: request.offers[offerIndex]
    });
  } catch (error) {
    console.error('Teklif reddetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif reddedilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Tüm talepleri getir
 * @route   GET /api/requests
 * @access  Private
 */
exports.getAllRequests = asyncHandler(async (req, res) => {
  try {
    // Filtreleme seçenekleri
    const { city, district, category, status, isOrganic } = req.query;
    
    // Filtre oluştur
    const filter = {};
    
    // Şehir filtresi
    if (city) {
      filter.city = city;
    }
    
    // İlçe filtresi
    if (district) {
      filter.district = district;
    }
    
    // Kategori filtresi
    if (category) {
      filter.category = category;
    }
    
    // Durum filtresi
    if (status) {
      filter.status = status;
    }
    
    // Organik filtresi
    if (isOrganic) {
      filter.isOrganic = isOrganic === 'true';
    }
    
    // Talepleri getir
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate('category', 'name')
      .populate('company', 'companyName');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Talepleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talepler getirilirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Talep detayını getir
 * @route   GET /api/requests/:id
 * @access  Private
 */
exports.getRequestById = asyncHandler(async (req, res) => {
  try {
    // Populate seçeneklerini kontrol et
    const { populate } = req.query;
    
    // Log debugging
    console.log(`[DEBUG] getRequestById çağrıldı, ID: ${req.params.id}, Populate sorgusu:`, populate);
    
    // Talebi getir ve populate et
    let requestQuery = Request.findById(req.params.id)
      .populate('category', 'category_name')
      .populate('company', 'companyName city district');
    
    // Teklifler ve çiftçi bilgilerini her durumda getir
    if (populate && populate.includes('farmer.user')) {
      console.log('[DEBUG] farmer.user populate edilecek');
      
      // Çiftçi bilgilerini ve bağlı kullanıcı bilgilerini al
      requestQuery = requestQuery.populate({
        path: 'offers',
        populate: [
          {
            path: 'farmer',
            select: 'farmName city district address user',
            populate: {
              path: 'user',
              select: 'firstName lastName email phone',
              model: 'User'
            }
          }
        ]
      });
    } else {
      // Sadece temel çiftçi bilgilerini al
      requestQuery = requestQuery.populate({
        path: 'offers',
        populate: {
          path: 'farmer',
          select: 'farmName city district address'
        }
      });
    }
    
    const request = await requestQuery;
    
    if (!request) {
      console.log('[DEBUG] Talep bulunamadı:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Debugging için teklif bilgilerini log'la
    if (request.offers && request.offers.length > 0) {
      console.log('[DEBUG] Teklif sayısı:', request.offers.length);
      
      // Farmer.user populate oldu mu kontrol et
      const firstOffer = request.offers[0];
      if (firstOffer && firstOffer.farmer) {
        console.log('[DEBUG] İlk teklif farmer bilgisi:', 
          JSON.stringify({
            farmName: firstOffer.farmer.farmName,
            hasUserInfo: firstOffer.farmer.user ? true : false,
            userPhone: firstOffer.farmer.user?.phone || 'Yok',
            userEmail: firstOffer.farmer.user?.email || 'Yok'
          }, null, 2)
        );
      }
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Talep detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Talep detayı getirilirken bir hata oluştu',
      error: error.message
    });
  }
}); 