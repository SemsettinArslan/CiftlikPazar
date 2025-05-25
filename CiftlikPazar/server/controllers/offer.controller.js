const Offer = require('../models/offer.model');
const Request = require('../models/request.model');
const Farmer = require('../models/farmer.model');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Teklif oluştur
 * @route   POST /api/offers
 * @access  Private/Farmer
 */
exports.createOffer = asyncHandler(async (req, res) => {
  // Teklif verilerini al
  const { requestId, price, quantity, estimatedDelivery, notes } = req.body;
  
  if (!requestId || !price || !quantity || !estimatedDelivery) {
    return res.status(400).json({
      success: false,
      message: 'Lütfen tüm gerekli alanları doldurun'
    });
  }
  
  // Talep bilgisini kontrol et
  const request = await Request.findById(requestId);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Talep bulunamadı'
    });
  }
  
  // Talebin aktif olup olmadığını kontrol et
  if (request.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Bu talep artık aktif değil'
    });
  }
  
  // Çiftçi bilgisini al
  const farmer = await Farmer.findOne({ user: req.user._id });
  
  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Çiftçi bilgisi bulunamadı'
    });
  }
  
  // Daha önce bu talep için teklif verilip verilmediğini kontrol et
  const existingOffer = await Offer.findOne({
    request: requestId,
    farmer: farmer._id
  });
  
  if (existingOffer) {
    return res.status(400).json({
      success: false,
      message: 'Bu talep için zaten bir teklifiniz bulunmaktadır'
    });
  }
  
  // Teklifi oluştur
  const offer = await Offer.create({
    request: requestId,
    farmer: farmer._id,
    price: parseFloat(price),
    quantity: parseInt(quantity),
    estimatedDelivery,
    notes,
    status: 'pending'
  });
  
  // Talebin tekliflerine ekle
  request.offers.push(offer._id);
  await request.save();
  
  res.status(201).json({
    success: true,
    data: offer,
    message: 'Teklifiniz başarıyla oluşturuldu'
  });
});

/**
 * @desc    Çiftçinin tekliflerini getir
 * @route   GET /api/offers/my-offers
 * @access  Private/Farmer
 */
exports.getFarmerOffers = asyncHandler(async (req, res) => {
  // Çiftçi bilgisini al
  const farmer = await Farmer.findOne({ user: req.user._id });
  
  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Çiftçi bilgisi bulunamadı'
    });
  }
  
  // Çiftçinin tekliflerini getir
  const offers = await Offer.find({ farmer: farmer._id })
    .populate({
      path: 'request',
      select: 'title category quantity unit deadline company status',
      populate: {
        path: 'company',
        select: 'companyName city district'
      }
    })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

/**
 * @desc    Teklif detayını getir
 * @route   GET /api/offers/:id
 * @access  Private
 */
exports.getOfferById = asyncHandler(async (req, res) => {
  // Teklif bilgisini getir
  const offer = await Offer.findById(req.params.id)
    .populate({
      path: 'request',
      select: 'title category quantity unit deadline company status',
      populate: {
        path: 'company',
        select: 'companyName city district'
      }
    })
    .populate({
      path: 'farmer',
      select: 'farmName farmType city district'
    });
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Teklif bulunamadı'
    });
  }
  
  // Teklifi görüntüleme yetkisi kontrolü
  const farmer = await Farmer.findOne({ user: req.user._id });
  const request = await Request.findById(offer.request._id).populate('company', 'user');
  
  // Sadece teklifi veren çiftçi veya talebin sahibi firma görebilir
  if (
    (farmer && farmer._id.toString() === offer.farmer._id.toString()) || 
    (request && request.company.user.toString() === req.user._id.toString()) ||
    req.user.role === 'admin'
  ) {
    res.status(200).json({
      success: true,
      data: offer
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Bu teklifi görüntüleme yetkiniz bulunmamaktadır'
    });
  }
});

/**
 * @desc    Teklifi kabul et
 * @route   PUT /api/offers/:id/accept
 * @access  Private/Company
 */
exports.acceptOffer = asyncHandler(async (req, res) => {
  // Teklif bilgisini getir
  const offer = await Offer.findById(req.params.id);
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Teklif bulunamadı'
    });
  }
  
  // Talep bilgisini getir
  const request = await Request.findById(offer.request).populate('company', 'user');
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Talep bulunamadı'
    });
  }
  
  // Talebin sahibi olup olmadığını kontrol et
  if (request.company.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Bu teklifi kabul etme yetkiniz bulunmamaktadır'
    });
  }
  
  // Talebin durumunu kontrol et
  if (request.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Bu talep artık aktif değil'
    });
  }
  
  // Teklif durumunu güncelle
  offer.status = 'accepted';
  await offer.save();
  
  // Talep durumunu güncelle
  request.status = 'completed';
  await request.save();
  
  // Diğer teklifleri reddet
  await Offer.updateMany(
    { request: request._id, _id: { $ne: offer._id } },
    { status: 'rejected' }
  );
  
  res.status(200).json({
    success: true,
    data: offer,
    message: 'Teklif başarıyla kabul edildi'
  });
});

/**
 * @desc    Teklifi reddet
 * @route   PUT /api/offers/:id/reject
 * @access  Private/Company
 */
exports.rejectOffer = asyncHandler(async (req, res) => {
  // Teklif bilgisini getir
  const offer = await Offer.findById(req.params.id);
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Teklif bulunamadı'
    });
  }
  
  // Talep bilgisini getir
  const request = await Request.findById(offer.request).populate('company', 'user');
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Talep bulunamadı'
    });
  }
  
  // Talebin sahibi olup olmadığını kontrol et
  if (request.company.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Bu teklifi reddetme yetkiniz bulunmamaktadır'
    });
  }
  
  // Teklif durumunu güncelle
  offer.status = 'rejected';
  await offer.save();
  
  res.status(200).json({
    success: true,
    data: offer,
    message: 'Teklif başarıyla reddedildi'
  });
}); 