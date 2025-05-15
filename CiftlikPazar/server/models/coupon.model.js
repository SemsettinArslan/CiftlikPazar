const mongoose = require('mongoose');

/**
 * Kupon Modeli
 * Tip: 'percentage' (yüzde indirim) veya 'fixed' (sabit tutar indirimi)
 * Kod: Kupon kodu (örn. SUMMER20, WELCOME10)
 * Değer: İndirim miktarı (yüzde veya TL)
 * MinimumAlışveriş: İndirimin uygulanması için minimum sepet tutarı
 * MaksimumİndirimMiktarı: Yüzdelik indirimler için maksimum indirim miktarı
 * KullanımSayısı: Kuponun kullanılabileceği toplam sayı
 * Kullanıldı: Şu ana kadar kaç kez kullanıldığı
 * BaşlangıçTarihi ve BitişTarihi: Kuponun geçerli olduğu tarih aralığı
 * Aktif: Kuponun aktif olup olmadığı
 */
const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Kupon kodu zorunludur'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Kupon açıklaması zorunludur'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Kupon tipi zorunludur'],
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  value: {
    type: Number,
    required: [true, 'Kupon değeri zorunludur'],
    min: [1, 'Kupon değeri en az 1 olmalıdır']
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum alışveriş tutarı 0 veya daha büyük olmalıdır']
  },
  maximumDiscountAmount: {
    type: Number,
    default: null
  },
  usageLimit: {
    type: Number,
    default: null // null sınırsız kullanım anlamına gelir
  },
  usedCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Kupon bitiş tarihi zorunludur']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  onlyForNewUsers: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncellendiğinde updatedAt alanını güncelle
CouponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Kuponun geçerliliğini kontrol eden metod
CouponSchema.methods.isValid = function() {
  const now = new Date();
  
  // Aktiflik kontrolü
  if (!this.isActive) return false;
  
  // Tarih kontrolü
  if (now < this.startDate || now > this.endDate) return false;
  
  // Kullanım limiti kontrolü
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  
  return true;
};

// Kuponun indirim miktarını hesaplayan metod
CouponSchema.methods.calculateDiscount = function(cartTotal) {
  // Minimum alışveriş tutarı kontrolü
  if (cartTotal < this.minimumPurchase) return 0;
  
  let discountAmount = 0;
  
  if (this.type === 'percentage') {
    // Yüzde indirimi hesapla
    discountAmount = (cartTotal * this.value) / 100;
    
    // Maksimum indirim miktarı kontrolü
    if (this.maximumDiscountAmount !== null && discountAmount > this.maximumDiscountAmount) {
      discountAmount = this.maximumDiscountAmount;
    }
  } else {
    // Sabit tutar indirimi
    discountAmount = this.value;
    
    // İndirim sepet tutarından büyük olamaz
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }
  }
  
  return discountAmount;
};

module.exports = mongoose.model('Coupon', CouponSchema); 