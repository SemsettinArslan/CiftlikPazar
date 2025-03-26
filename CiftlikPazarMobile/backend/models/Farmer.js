const mongoose = require('mongoose');

// Sertifika alt şeması
const CertificateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sertifika adı gerekli'],
    trim: true
  },
  issuer: {
    type: String, // Veren kurum/kuruluş
    required: [true, 'Sertifikayı veren kurum bilgisi gerekli'],
    trim: true
  },
  issueDate: {
    type: Date,
    required: [true, 'Sertifikanın verildiği tarih gerekli']
  },
  expiryDate: {
    type: Date // Opsiyonel, bazı sertifikaların son kullanma tarihi olmayabilir
  },
  certificateNumber: {
    type: String,
    trim: true
  },
  certificateType: {
    type: String,
    enum: ['organic', 'goodAgriculturalPractices', 'sustainability', 'qualityAssurance', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  image: {
    type: String // Belgenin görüntüsü (URL veya Base64)
  },
  verified: {
    type: Boolean,
    default: false // Admin tarafından doğrulanıp doğrulanmadığı
  }
});

// Ana Farmer şeması
const FarmerSchema = new mongoose.Schema({
  // İlişkili kullanıcı bilgileri
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    unique: true
  },
  
  // Çiftlik bilgileri
  farmName: {
    type: String,
    required: [true, 'Çiftlik adı gereklidir'],
    trim: true,
    maxlength: [100, 'Çiftlik adı 100 karakterden uzun olamaz']
  },
  city: {
    type: String,
    required: [true, 'İl bilgisi gereklidir'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'İlçe bilgisi gereklidir'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Adres bilgisi gereklidir'],
    maxlength: [200, 'Adres 200 karakterden uzun olamaz']
  },
  taxNumber: {
    type: String,
    required: [true, 'Vergi numarası gereklidir'],
    unique: true,
    trim: true
  },
  
  // Çiftlik özellikleri
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  hasShipping: {
    type: Boolean,
    default: false
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: [1000, 'Açıklama 1000 karakterden uzun olamaz']
  },
  
  // Yeni eklenen sertifikalar alanı
  certificates: [CertificateSchema],
  
  // İstatistik ve durum bilgileri
  rating: {
    type: Number,
    min: [0, 'Değerlendirme 0\'dan düşük olamaz'],
    max: [5, 'Değerlendirme 5\'ten büyük olamaz'],
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  profileImage: {
    type: String
  },
  coverImage: {
    type: String
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
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

// Kategori adlarını almak için populate işlemini kolaylaştırıcı virtual
FarmerSchema.virtual('categoryNames', {
  ref: 'Category',
  localField: 'categories',
  foreignField: '_id',
  justOne: false
});

// Güncellenme zamanını otomatik ayarlayan middleware
FarmerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Farmers', FarmerSchema, 'Farmers'); 