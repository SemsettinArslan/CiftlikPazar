const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');

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
  // Satıcının ürünlerini bul
  const products = await Product.find({ farmer: req.user.id }).select('_id');
  const productIds = products.map(product => product._id);

  // Satıcının ürünlerini içeren siparişleri bul
  const orders = await Order.find({
    'items.product': { $in: productIds }
  }).sort('-createdAt');

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
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email');

  if (!order) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li sipariş bulunamadı`, 404)
    );
  }

  // Kullanıcının kendi siparişi mi veya admin mi kontrol et
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    // Satıcı ise, kendi ürünlerini içeren sipariş mi kontrol et
    if (req.user.role === 'seller') {
      const products = await Product.find({ farmer: req.user.id }).select('_id');
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
    itemsPrice,
    shippingPrice,
    totalPrice,
    note
  } = req.body;

  // Sipariş öğelerini kontrol et
  if (!items || items.length === 0) {
    return next(new ErrorResponse('Sipariş öğeleri gereklidir', 400));
  }

  // Ürünlerin stok durumunu kontrol et
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(
        new ErrorResponse(`${item.product} ID'li ürün bulunamadı`, 404)
      );
    }

    if (product.stock < item.quantity) {
      return next(
        new ErrorResponse(`${product.name} için yeterli stok yok`, 400)
      );
    }

    // Stok miktarını güncelle
    product.stock -= item.quantity;
    await product.save();
  }

  // Sipariş oluştur
  const order = await Order.create({
    user: req.user.id,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
    note
  });

  res.status(201).json({
    success: true,
    data: order
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
    const products = await Product.find({ farmer: req.user.id }).select('_id');
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
  if (status === 'teslim edildi') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.status(200).json({
    success: true,
    data: order
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
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
    const products = await Product.find({ farmer: req.user.id }).select('_id');
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