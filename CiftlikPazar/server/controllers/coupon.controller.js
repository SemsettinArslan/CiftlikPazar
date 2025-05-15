const asyncHandler = require('express-async-handler');
const Coupon = require('../models/coupon.model');

/**
 * @desc    Tüm kuponları getir (Admin için)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  
  res.status(200).json({
    success: true,
    count: coupons.length,
    data: coupons
  });
});

/**
 * @desc    Kupon oluştur
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    type,
    value,
    minimumPurchase,
    maximumDiscountAmount,
    usageLimit,
    startDate,
    endDate,
    isActive,
    applicableProducts,
    applicableCategories,
    excludedProducts,
    onlyForNewUsers
  } = req.body;

  // Kupon kodu kontrolü
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    res.status(400);
    throw new Error('Bu kupon kodu zaten kullanılıyor');
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    type,
    value,
    minimumPurchase,
    maximumDiscountAmount,
    usageLimit,
    startDate,
    endDate,
    isActive,
    applicableProducts,
    applicableCategories,
    excludedProducts,
    onlyForNewUsers
  });

  res.status(201).json({
    success: true,
    data: coupon
  });
});

/**
 * @desc    Kupon detaylarını getir
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Kupon bulunamadı');
  }

  res.status(200).json({
    success: true,
    data: coupon
  });
});

/**
 * @desc    Kupon güncelle
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
const updateCoupon = asyncHandler(async (req, res) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Kupon bulunamadı');
  }

  // Kupon kodunu değiştiriyorsa, benzersiz olduğunu kontrol et
  if (req.body.code && req.body.code !== coupon.code) {
    const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existingCoupon) {
      res.status(400);
      throw new Error('Bu kupon kodu zaten kullanılıyor');
    }
    req.body.code = req.body.code.toUpperCase();
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: coupon
  });
});

/**
 * @desc    Kupon sil
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Kupon bulunamadı');
  }

  await coupon.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Kupon kodu geçerliliğini kontrol et
 * @route   POST /api/coupons/check
 * @access  Public
 */
const checkCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  try {
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir kupon kodu girin'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Böyle bir kupon kodu bulunamadı'
      });
    }

    // Kuponun aktifliğini kontrol et
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon şu anda aktif değil'
      });
    }

    // Kuponun tarih geçerliliğini kontrol et
    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: `Bu kupon henüz aktif değil. Başlangıç tarihi: ${coupon.startDate.toLocaleDateString()}`
      });
    }
    
    if (now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: `Bu kuponun süresi dolmuş. Son kullanma tarihi: ${coupon.endDate.toLocaleDateString()}`
      });
    }

    // Kullanım limiti kontrolü
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Bu kuponun kullanım limiti dolmuştur'
      });
    }

    // Minimum alışveriş tutarı kontrolü
    if (cartTotal < coupon.minimumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Bu kuponu kullanmak için minimum ${coupon.minimumPurchase.toFixed(2)} ₺ alışveriş yapmalısınız`
      });
    }

    // Yeni kullanıcı kontrolü
    if (coupon.onlyForNewUsers && req.user && req.user.createdAt) {
      const userRegistrationDate = new Date(req.user.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      if (userRegistrationDate < oneWeekAgo) {
        return res.status(400).json({
          success: false,
          message: 'Bu kupon sadece yeni kullanıcılar için geçerlidir'
        });
      }
    }

    // İndirim tutarını hesapla
    const discountAmount = coupon.calculateDiscount(cartTotal || 0);

    return res.status(200).json({
      success: true,
      data: {
        coupon,
        discountAmount,
        discountedTotal: Math.max(0, (cartTotal || 0) - discountAmount)
      }
    });
  } catch (error) {
    console.error('Kupon kontrolü sırasında hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Kupon işlenirken bir hata oluştu',
      error: error.message
    });
  }
});

/**
 * @desc    Kuponu kullan (sipariş oluşturulduğunda çağrılır)
 * @route   PUT /api/coupons/use/:id
 * @access  Private
 */
const useCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Kupon bulunamadı');
  }

  // Kuponun kullanım sayısını artır
  coupon.usedCount += 1;
  await coupon.save();

  res.status(200).json({
    success: true,
    data: coupon
  });
});

module.exports = {
  getCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCoupon,
  useCoupon
}; 