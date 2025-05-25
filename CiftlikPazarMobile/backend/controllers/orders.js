const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Farmer = require('../models/Farmer');

// @desc    Tüm siparişleri getir
// @route   GET /api/orders
// @access  Private (Admin)
exports.getOrders = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Kullanıcının siparişlerini getir
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .populate('user', 'email firstName lastName phone')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Satıcının siparişlerini getir
// @route   GET /api/orders/sellerorders
// @access  Private (Satıcı)
exports.getSellerOrders = asyncHandler(async (req, res, next) => {
  // Önce mevcut kullanıcı ID'si ile ilişkili çiftçi kaydını bul
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  if (!farmer) {
    return next(
      new ErrorResponse('Çiftçi kaydı bulunamadı', 404)
    );
  }
  
  // Çiftçinin ürünlerini bul
  const products = await Product.find({ farmer: farmer._id }).select('_id');
  const productIds = products.map(product => product._id);

  console.log(`Çiftçi ID: ${farmer._id}, Bulunan ürün sayısı: ${productIds.length}`);
  
  // Satıcının ürünlerini içeren siparişleri bul
  const orders = await Order.find({
    'items.product': { $in: productIds }
  })
  .populate('user', 'email firstName lastName phone')
  .sort('-createdAt');

  console.log(`Bulunan sipariş sayısı: ${orders.length}`);

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Tek sipariş getir
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  // User modeli Users koleksiyonunda olduğu için, user bilgilerini populate ediyoruz
  const order = await Order.findById(req.params.id)
    .populate('user', 'email firstName lastName phone');

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Kullanıcının kendi siparişi mi veya admin mi kontrol et
  // Eğer user populate edildiyse _id kullanılır, aksi halde direkt olarak user id'si kontrol edilir
  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  if (orderUserId !== req.user.id && req.user.role !== 'admin') {
    // Satıcı ise, kendi ürünlerini içeren sipariş mi kontrol et
    if (req.user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: req.user.id });
      
      if (!farmer) {
        return next(
          new ErrorResponse(`Çiftçi kaydı bulunamadı`, 403)
        );
      }
      
      const products = await Product.find({ farmer: farmer._id }).select('_id');
      const productIds = products.map(product => product._id.toString());
      
      const hasSellerProduct = order.items.some(item => 
        productIds.includes(item.product.toString())
      );

      if (!hasSellerProduct) {
        return next(
          new ErrorResponse(`Bu siparişi görüntüleme yetkiniz yok`, 403)
        );
      }
    } else {
      return next(
        new ErrorResponse(`Bu siparişi görüntüleme yetkiniz yok`, 403)
      );
    }
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Sipariş oluştur
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    totalPrice,
    shippingFee,
    discountAmount,
    totalAmount,
    coupon,
    notes
  } = req.body;

  // Sipariş öğelerini kontrol et
  if (!items || items.length === 0) {
    return next(new ErrorResponse('Sipariş öğeleri gereklidir', 400));
  }

  // Teslimat adresi kontrolü
  if (!shippingAddress) {
    return next(new ErrorResponse('Teslimat adresi gereklidir', 400));
  }

  // Teslimat adresi zorunlu alanlarını kontrol et
  const requiredShippingFields = ['fullName', 'address', 'city', 'district', 'phone'];
  const missingFields = requiredShippingFields.filter(field => !shippingAddress[field]);
  
  if (missingFields.length > 0) {
    return next(new ErrorResponse(`Teslimat adresi için gerekli alanlar eksik: ${missingFields.join(', ')}`, 400));
  }

  // Ürünlerin stok durumunu kontrol et
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(
        new ErrorResponse(`${item.name} ürünü bulunamadı`, 404)
      );
    }

    if (product.stock < item.quantity) {
      return next(
        new ErrorResponse(`${product.name} için yeterli stok yok. Mevcut stok: ${product.stock}`, 400)
      );
    }

    // Stok miktarını güncelle
    product.stock -= item.quantity;
    await product.save();
  }

  // Kupon kontrolü (varsa)
  let couponDoc = null;
  if (coupon) {
    couponDoc = await Coupon.findById(coupon);
    
    if (!couponDoc) {
      return next(new ErrorResponse('Kupon bulunamadı', 404));
    }

    // Kupon geçerlilik kontrolü
    if (!couponDoc.isActive || couponDoc.expiryDate < Date.now()) {
      return next(new ErrorResponse('Kupon geçersiz veya süresi dolmuş', 400));
    }

    // Minimum alışveriş tutarı kontrolü
    if (couponDoc.minimumPurchase > totalPrice) {
      return next(new ErrorResponse(`Bu kupon için minimum ${couponDoc.minimumPurchase} TL alışveriş yapmalısınız`, 400));
    }

    // Kullanım sayısı kontrolü
    if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
      return next(new ErrorResponse('Bu kuponun kullanım limiti dolmuştur', 400));
    }
  }

  // Sipariş oluştur
  const order = new Order({
    user: req.user.id,
    items,
    shippingAddress,
    paymentMethod,
    totalPrice,
    shippingFee,
    discountAmount,
    totalAmount,
    coupon: couponDoc ? couponDoc._id : null,
    notes
  });

  // Tahmini teslimat tarihi (3 gün sonrası)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
  order.estimatedDelivery = estimatedDelivery;

  // Siparişi kaydet
  await order.save();

  // Kupon kullanım sayısını artır
  if (couponDoc) {
    try {
      couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
      await couponDoc.save();
    } catch (couponError) {
      console.error('Kupon kullanım sayısı güncellenirken hata:', couponError);
      // Sipariş oluşturmayı engellemiyoruz, sadece logluyoruz
    }
  }

  res.status(201).json({
    success: true,
    data: order,
    message: 'Sipariş başarıyla oluşturuldu'
  });
});

// @desc    Sipariş durumunu güncelle
// @route   PUT /api/orders/:id/status
// @access  Private (Satıcı ve Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Sipariş durumu gereklidir', 400));
  }

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Admin değilse, satıcının kendi ürünlerini içeren sipariş mi kontrol et
  if (req.user.role !== 'admin') {
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return next(
        new ErrorResponse(`Çiftçi kaydı bulunamadı`, 403)
      );
    }
    
    const products = await Product.find({ farmer: farmer._id }).select('_id');
    const productIds = products.map(product => product._id.toString());
    
    const hasSellerProduct = order.items.some(item => 
      productIds.includes(item.product.toString())
    );

    if (!hasSellerProduct) {
      return next(
        new ErrorResponse(`Bu siparişin durumunu güncelleme yetkiniz yok`, 403)
      );
    }
  }

  // Sipariş durumunu güncelle
  order.status = status;

  // Eğer durum "teslim edildi" ise, isDelivered ve deliveredAt alanlarını güncelle
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  await order.save();
  
  // Güncellenmiş siparişi user bilgileriyle birlikte getir
  const updatedOrder = await Order.findById(order._id)
    .populate('user', 'email firstName lastName phone');

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Sipariş ödeme durumunu güncelle
// @route   PUT /api/orders/:id/pay
// @access  Private (Admin)
exports.updateOrderPayment = asyncHandler(async (req, res, next) => {
  const { isPaid, paymentResult } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Ödeme durumunu güncelle
  order.isPaid = isPaid;
  
  if (isPaid) {
    order.paidAt = Date.now();
    
    if (paymentResult) {
      order.paymentResult = paymentResult;
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Sipariş notunu güncelle
// @route   PUT /api/orders/:id/note
// @access  Private
exports.updateOrderNote = asyncHandler(async (req, res, next) => {
  const { note } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Kullanıcının kendi siparişi mi kontrol et
  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  if (orderUserId !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Bu siparişin notunu güncelleme yetkiniz yok`, 403)
    );
  }

  // Sipariş notunu güncelle
  order.note = note;
  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Satıcı notunu güncelle
// @route   PUT /api/orders/:id/sellernote
// @access  Private (Satıcı ve Admin)
exports.updateSellerNote = asyncHandler(async (req, res, next) => {
  const { sellerNote } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Admin değilse, satıcının kendi ürünlerini içeren sipariş mi kontrol et
  if (req.user.role !== 'admin') {
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return next(
        new ErrorResponse(`Çiftçi kaydı bulunamadı`, 403)
      );
    }
    
    const products = await Product.find({ farmer: farmer._id }).select('_id');
    const productIds = products.map(product => product._id.toString());
    
    const hasSellerProduct = order.items.some(item => 
      productIds.includes(item.product.toString())
    );

    if (!hasSellerProduct) {
      return next(
        new ErrorResponse(`Bu siparişin satıcı notunu güncelleme yetkiniz yok`, 403)
      );
    }
  }

  // Satıcı notunu güncelle
  order.sellerNote = sellerNote;
  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
}); 