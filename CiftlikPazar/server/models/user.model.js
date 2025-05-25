const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Teslimat adresi şeması
const DeliveryAddressSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    maxlength: [200, 'Adres 200 karakterden uzun olamaz']
  },
  city: {
    type: String,
    required: true,
    maxlength: [50, 'Şehir 50 karakterden uzun olamaz']
  },
  district: {
    type: String,
    maxlength: [50, 'İlçe 50 karakterden uzun olamaz']
  },
  postalCode: {
    type: String,
    maxlength: [10, 'Posta kodu 10 karakterden uzun olamaz']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

// Ödeme bilgisi şeması
const PaymentInfoSchema = new mongoose.Schema({
  bankName: {
    type: String,
    trim: true
  },
  accountHolder: {
    type: String,
    trim: true
  },
  iban: {
    type: String,
    trim: true
  }
});

// Sadeleştirilmiş Customer-odaklı User modeli
const UserSchema = new mongoose.Schema({
  // Temel bilgiler
  firstName: {
    type: String,
    required: [true, 'Lütfen adınızı giriniz'],
    trim: true,
    maxlength: [30, 'Ad 30 karakterden uzun olamaz']
  },
  lastName: {
    type: String,
    required: [true, 'Lütfen soyadınızı giriniz'],
    trim: true,
    maxlength: [30, 'Soyad 30 karakterden uzun olamaz']
  },
  email: {
    type: String,
    required: [true, 'Lütfen e-posta adresinizi giriniz'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi giriniz'
    ]
  },
  password: {
    type: String,
    required: [true, 'Lütfen şifre giriniz'],
    minlength: [6, 'Şifre en az 6 karakterden oluşmalıdır'],
    select: false
  },
  phone: {
    type: String,
    maxlength: [20, 'Telefon numarası 20 karakterden uzun olamaz'],
    unique: [true, 'Bu telefon numarası zaten kullanılıyor']
  },
  address: {
    type: String,
    maxlength: [200, 'Adres 200 karakterden uzun olamaz']
  },
  city: {
    type: String,
    maxlength: [50, 'Şehir 50 karakterden uzun olamaz']
  },
  district: {
    type: String,
    maxlength: [50, 'İlçe 50 karakterden uzun olamaz']
  },
  profileImage: {
    type: String, // URL to profile image
    default: 'default-profile.jpg'
  },
  
  // Rol ve durum
  role: {
    type: String,
    enum: ['customer', 'farmer', 'admin', 'company'],
    default: 'customer'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'customer' ? 'approved' : 'pending'; // Müşteriler otomatik onaylanır, diğerleri beklemeye alınır
    }
  },
  accountStatus: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'deactivated'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Tarih bilgileri
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  lastLogoutAt: {
    type: Date
  },
  
  // Müşteri özel alanları
  deliveryAddresses: [DeliveryAddressSchema],
  paymentInfo: PaymentInfoSchema,
  preferences: {
    organic: {
      type: Boolean,
      default: false
    },
    local: {
      type: Boolean,
      default: false
    },
    seasonal: {
      type: Boolean,
      default: false
    }
  },
  favoriteProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Şifre sıfırlama token alanları
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Tam adı döndüren virtual property
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Şifre şifreleme - Pre-save middleware
UserSchema.pre('save', async function(next) {
  // Şifre değişmediyse hashleme işlemini atla
  if (!this.isModified('password')) {
    return next();
  }
  
  // Şifreyi hashle
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Şifre hashleme hatası:', error);
    next(error);
  }
});

// JWT Token oluşturma metodu
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Şifre karşılaştırma metodu
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Şifre sıfırlama token'ı oluştur
UserSchema.methods.getResetPasswordToken = function() {
  // Token oluştur
  const resetToken = require('crypto').randomBytes(20).toString('hex');

  // Hash token ve resetPasswordToken alanını ayarla
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token geçerlilik süresini şimdiden 10 dakika sonrasına ayarla
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Users koleksiyonunu açıkça belirterek model oluşturma
module.exports = mongoose.model('User', UserSchema, 'Users'); 