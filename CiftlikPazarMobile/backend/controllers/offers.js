const Offer = require('../models/Offer');
const Request = require('../models/Request');
const Farmer = require('../models/Farmer');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Teklif oluştur
// @route   POST /api/offers
// @access  Private/Farmer
exports.createOffer = asyncHandler(async (req, res, next) => {
  // Request ID ve fiyat kontrolü
  if (!req.body.request || !req.body.price) {
    return next(new ErrorResponse('Talep ID ve fiyat bilgisi gereklidir', 400));
  }

  // Talep var mı ve aktif mi kontrol et
  const request = await Request.findById(req.body.request);
  if (!request) {
    return next(new ErrorResponse('Talep bulunamadı', 404));
  }

  if (request.status !== 'active') {
    return next(new ErrorResponse('Bu talep artık aktif değil', 400));
  }

  // Çiftçi bilgisini al
  const farmer = await Farmer.findOne({ user: req.user.id });
  if (!farmer) {
    return next(new ErrorResponse('Çiftçi profili bulunamadı', 404));
  }

  // Daha önce teklif verilmiş mi kontrol et
  const existingOffer = await Offer.findOne({
    request: req.body.request,
    farmer: farmer._id
  });

  if (existingOffer) {
    return next(new ErrorResponse('Bu talebe zaten teklif verdiniz', 400));
  }

  // Teklif oluştur
  const offerData = {
    ...req.body,
    farmer: farmer._id
  };

  // Zorunlu alanlar için varsayılan değerler
  if (!offerData.quantity) {
    offerData.quantity = request.quantity;
  }

  if (!offerData.estimatedDelivery) {
    // Varsayılan olarak talep son tarihini kullan
    offerData.estimatedDelivery = request.deadline;
  }

  const offer = await Offer.create(offerData);

  // Talebin teklifler dizisine ekle
  request.offers.push(offer._id);
  await request.save();

  res.status(201).json({
    success: true,
    data: offer
  });
});

// @desc    Çiftçinin tekliflerini getir
// @route   GET /api/offers/my-offers
// @access  Private/Farmer
exports.getFarmerOffers = asyncHandler(async (req, res, next) => {
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  if (!farmer) {
    return next(new ErrorResponse('Çiftçi profili bulunamadı', 404));
  }

  // Sayfalama için parametreler
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Durum filtresi
  const statusFilter = req.query.status ? { status: req.query.status } : {};

  const offers = await Offer.find({ 
    farmer: farmer._id,
    ...statusFilter
  })
    .populate({
      path: 'request',
      select: 'title description status company quantity unit deadline',
      populate: {
        path: 'company',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Toplam teklif sayısı
  const total = await Offer.countDocuments({ 
    farmer: farmer._id,
    ...statusFilter
  });

  res.status(200).json({
    success: true,
    count: offers.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: offers
  });
});

// @desc    Teklif detayını getir
// @route   GET /api/offers/:id
// @access  Private
exports.getOfferById = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id)
    .populate({
      path: 'request',
      select: 'title description status company quantity unit deadline',
      populate: {
        path: 'company',
        select: 'name'
      }
    })
    .populate('farmer', 'farmName address.city address.district');

  if (!offer) {
    return next(new ErrorResponse('Teklif bulunamadı', 404));
  }

  // Yetki kontrolü - sadece ilgili çiftçi veya şirket görebilir
  const farmer = await Farmer.findOne({ user: req.user.id });
  const request = await Request.findById(offer.request).populate('company');

  // Çiftçi veya şirket değilse erişimi engelle
  const isOwnerFarmer = farmer && farmer._id.toString() === offer.farmer._id.toString();
  const isOwnerCompany = request && request.company.user.toString() === req.user.id;

  if (!isOwnerFarmer && !isOwnerCompany && req.user.role !== 'admin') {
    return next(new ErrorResponse('Bu teklifi görüntüleme yetkiniz yok', 403));
  }

  res.status(200).json({
    success: true,
    data: offer
  });
});

// @desc    Teklifi güncelle (sadece bekleyen teklifler için)
// @route   PUT /api/offers/:id
// @access  Private/Farmer
exports.updateOffer = asyncHandler(async (req, res, next) => {
  let offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(new ErrorResponse('Teklif bulunamadı', 404));
  }

  // Çiftçi kontrolü
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  if (!farmer || farmer._id.toString() !== offer.farmer.toString()) {
    return next(new ErrorResponse('Bu teklifi güncelleme yetkiniz yok', 403));
  }

  // Sadece bekleyen teklifler güncellenebilir
  if (offer.status !== 'pending') {
    return next(new ErrorResponse('Sadece bekleyen teklifler güncellenebilir', 400));
  }

  // Güncellenebilir alanlar
  const allowedFields = ['price', 'quantity', 'estimatedDelivery', 'notes'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  offer = await Offer.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: offer
  });
});

// @desc    Teklifi sil/iptal et
// @route   DELETE /api/offers/:id
// @access  Private/Farmer
exports.deleteOffer = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(new ErrorResponse('Teklif bulunamadı', 404));
  }

  // Çiftçi kontrolü
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  if (!farmer || farmer._id.toString() !== offer.farmer.toString()) {
    return next(new ErrorResponse('Bu teklifi silme yetkiniz yok', 403));
  }

  // Sadece bekleyen teklifler silinebilir
  if (offer.status !== 'pending') {
    return next(new ErrorResponse('Sadece bekleyen teklifler silinebilir', 400));
  }

  // İlgili talepten teklifi kaldır
  const request = await Request.findById(offer.request);
  if (request) {
    request.offers = request.offers.filter(
      offerId => offerId.toString() !== offer._id.toString()
    );
    await request.save();
  }

  await offer.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 