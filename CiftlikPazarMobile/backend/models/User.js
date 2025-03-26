const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// Web uygulamasıyla uyumlu User modeli
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
    maxlength: [20, 'Telefon numarası 20 karakterden uzun olamaz']
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
    type: String // URL to profile image
  },
  
  // Rol ve durum - Web uygulamasıyla uyumlu
  role: {
    type: String,
    enum: ['customer', 'farmer', 'admin'],
    default: 'customer'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'customer' ? 'approved' : 'pending'; // Müşteriler otomatik onaylanır, çiftçiler beklemeye alınır
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
  
  // Şifre sıfırlama alanları
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Tam adı döndüren virtual property
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Şifre şifreleme - Pre-save middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Login sonrası son giriş zamanını güncelle
UserSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = Date.now();
  return this.save();
};

// JWT token oluştur
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, firstName: this.firstName, lastName: this.lastName, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Şifreleri karşılaştır
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Şifre sıfırlama token'ı oluştur
UserSchema.methods.getResetPasswordToken = function() {
  // Rastgele token oluştur
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Token'ı hash'le ve veritabanına kaydet
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token'ın geçerlilik süresini ayarla (10 dakika)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('Users', UserSchema, 'Users'); 