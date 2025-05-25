const Order = require('../models/order.model');
const Product = require('../models/Product');
const User = require('../models/user.model');
const Coupon = require('../models/coupon.model');

/**
 * @desc    Yeni sipariş oluştur
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      totalPrice,
      shippingFee,
      discountAmount,
      totalAmount,
      coupon
    } = req.body;

    // Sipariş öğeleri kontrolü
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sipariş öğeleri bulunamadı'
      });
    }

    // Teslimat adresi kontrolü
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Teslimat adresi gereklidir'
      });
    }

    // Teslimat adresi zorunlu alanlarını kontrol et
    const requiredShippingFields = ['fullName', 'address', 'city', 'district', 'phone'];
    const missingFields = requiredShippingFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Teslimat adresi için gerekli alanlar eksik: ${missingFields.join(', ')}`
      });
    }

    // Stok kontrolü
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${item.name} ürünü bulunamadı`
        });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} için yeterli stok yok. Mevcut stok: ${product.countInStock}`
        });
      }
    }

    // Kupon kontrolü (varsa)
    let couponDoc = null;
    if (coupon) {
      couponDoc = await Coupon.findById(coupon);
      
      if (!couponDoc) {
        return res.status(404).json({
          success: false,
          message: 'Kupon bulunamadı'
        });
      }

      // Kupon geçerlilik kontrolü
      if (!couponDoc.isActive || couponDoc.expiryDate < Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'Kupon geçersiz veya süresi dolmuş'
        });
      }

      // Minimum alışveriş tutarı kontrolü
      if (couponDoc.minimumPurchase > totalPrice) {
        return res.status(400).json({
          success: false,
          message: `Bu kupon için minimum ${couponDoc.minimumPurchase} TL alışveriş yapmalısınız`
        });
      }

      // Kullanım sayısı kontrolü
      if (couponDoc.usageLimit && couponDoc.usageCount >= couponDoc.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Bu kuponun kullanım limiti dolmuştur'
        });
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
      coupon: couponDoc ? couponDoc._id : null
    });

    // Tahmini teslimat tarihi (3 gün sonrası)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
    order.estimatedDelivery = estimatedDelivery;

    // Siparişi kaydet
    await order.save();

    // Ürün stoklarını güncelle
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: -item.quantity } }
      );
    }

    // Kupon kullanım sayısını artır
    if (couponDoc) {
      try {
        console.log('Kupon bilgileri:', {
          code: couponDoc.code,
          currentUsedCount: couponDoc.usedCount,
          usageLimit: couponDoc.usageLimit
        });
        
        // usedCount alanını kullan (coupon.model.js'de tanımlı alan)
        couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
        await couponDoc.save();
        
        console.log('Kupon kullanım sayısı güncellendi:', {
          code: couponDoc.code,
          newUsedCount: couponDoc.usedCount
        });
      } catch (couponError) {
        console.error('Kupon kullanım sayısı güncellenirken hata:', couponError);
        // Sipariş oluşturmayı engellemiyoruz, sadece logluyoruz
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: order
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Kullanıcının siparişlerini getir
 * @route   GET /api/orders/myorders
 * @access  Private
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // En yeni siparişler önce
      .populate('items.farmer', 'farmName');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Siparişleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Çiftçinin siparişlerini getir
 * @route   GET /api/orders/sellerorders
 * @access  Private/Farmer
 */
exports.getSellerOrders = async (req, res) => {
  try {
    // Çiftçinin ID'sini al
    const farmerId = req.user.farmerId;
    console.log('Çiftçi siparişleri getiriliyor. Çiftçi ID:', farmerId);
    
    if (!farmerId) {
      console.error('Çiftçi ID bulunamadı:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Çiftçi kimliği bulunamadı'
      });
    }

    // MongoDB sorgusu için farmerId'yi string'e çevir
    const farmerIdStr = farmerId.toString();
    console.log('Sorgu için kullanılacak çiftçi ID:', farmerIdStr);

    // Çiftçinin ürünlerini içeren siparişleri bul
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name price image')
      .populate('items.farmer');
    
    // Siparişleri filtreleme işlemini JavaScript tarafında yapalım
    const filteredOrders = orders.filter(order => {
      return order.items.some(item => {
        if (!item.farmer) return false;
        
        let itemFarmerId;
        if (typeof item.farmer === 'string') {
          itemFarmerId = item.farmer;
        } else if (typeof item.farmer === 'object') {
          itemFarmerId = item.farmer._id ? item.farmer._id.toString() : item.farmer.toString();
        } else {
          return false;
        }
        
        return itemFarmerId === farmerIdStr;
      });
    });
    
    console.log(`Toplam ${orders.length} siparişten ${filteredOrders.length} tanesi çiftçiye ait`);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders
    });
  } catch (error) {
    console.error('Satıcı siparişlerini getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Satıcı siparişleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Sipariş detayını getir
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.farmer', 'farmName')
      .populate('coupon', 'code value type');

    // Sipariş bulunamadı
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Yetki kontrolü - sadece siparişi veren kullanıcı veya admin görebilir
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'farmer'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi görüntüleme yetkiniz yok'
      });
    }

    // Eğer çiftçi ise, sadece kendi ürünlerini görebilir
    if (req.user.role === 'farmer') {
      const farmerId = req.user.farmerId;
      console.log('Çiftçi ID:', farmerId);
      console.log('Sipariş öğeleri:', order.items);
      
      const hasSellerItems = order.items.some(item => {
        if (!item.farmer) return false;
        
        // Farmer ID string veya object olabilir
        const itemFarmerId = typeof item.farmer === 'object' ? item.farmer._id.toString() : item.farmer.toString();
        console.log('Karşılaştırma:', itemFarmerId, farmerId, itemFarmerId === farmerId);
        return itemFarmerId === farmerId;
      });

      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişi görüntüleme yetkiniz yok'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Sipariş detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Sipariş durumunu güncelle
 * @route   PUT /api/orders/:id/status
 * @access  Private/Farmer/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, farmerId } = req.body;
    console.log('Gelen istek bilgileri:', { orderId: req.params.id, status, farmerId, userRole: req.user.role });

    // Durum kontrolü
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sipariş durumu'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('items.farmer');

    // Sipariş bulunamadı
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Yetki kontrolü - sadece admin veya ilgili çiftçi güncelleyebilir
    if (req.user.role !== 'admin' && req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Sipariş durumunu güncelleme yetkiniz yok'
      });
    }

    // Çiftçi ise, sadece kendi ürünlerini içeren siparişleri güncelleyebilir
    if (req.user.role === 'farmer') {
      const userFarmerId = req.user.farmerId || farmerId;
      console.log('Çiftçi ID:', userFarmerId);
      console.log('Sipariş öğeleri:', JSON.stringify(order.items, null, 2));
      
      // Çiftçinin ürünlerini içeren sipariş öğelerini bul
      const hasSellerItems = order.items.some(item => {
        if (!item.farmer) {
          console.log('Ürün için çiftçi bilgisi yok:', item);
          return false;
        }
        
        // Farmer ID string veya object olabilir
        let itemFarmerId;
        if (typeof item.farmer === 'string') {
          itemFarmerId = item.farmer;
        } else if (typeof item.farmer === 'object') {
          itemFarmerId = item.farmer._id ? item.farmer._id.toString() : item.farmer.toString();
        } else {
          console.log('Bilinmeyen farmer tipi:', typeof item.farmer);
          return false;
        }
        
        console.log('Karşılaştırma:', {
          itemFarmerId,
          userFarmerId,
          match: itemFarmerId === userFarmerId.toString()
        });
        
        return itemFarmerId === userFarmerId.toString();
      });

      if (!hasSellerItems) {
        console.log('Çiftçi bu siparişi güncelleme yetkisine sahip değil');
        return res.status(403).json({
          success: false,
          message: 'Bu siparişi güncelleme yetkiniz yok'
        });
      }
    }

    // Sipariş durumunu güncelle
    order.status = status;

    // Teslim edildi durumu için teslim tarihini güncelle
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // Siparişi kaydet
    await order.save();
    console.log('Sipariş durumu güncellendi:', status);

    res.status(200).json({
      success: true,
      message: 'Sipariş durumu güncellendi',
      data: order
    });
  } catch (error) {
    console.error('Sipariş durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Tüm siparişleri getir (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email')
      .populate('items.farmer', 'farmName');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Tüm siparişleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * @desc    Sipariş istatistiklerini getir (Admin)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
exports.getOrderStats = async (req, res) => {
  try {
    // Toplam sipariş sayısı
    const totalOrders = await Order.countDocuments();

    // Toplam gelir
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Durum bazında sipariş sayıları
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Son 7 gündeki siparişler
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastWeekOrders = await Order.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Son 7 günün günlük sipariş sayıları
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        statusCounts,
        lastWeekOrders,
        dailyOrders
      }
    });
  } catch (error) {
    console.error('Sipariş istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş istatistikleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
}; 