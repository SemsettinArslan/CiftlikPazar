const mongoose = require('mongoose');

// Ana Firma şeması
const CompanySchema = new mongoose.Schema({
  // İlişkili kullanıcı bilgileri
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Firma bilgileri
  companyName: {
    type: String,
    required: [true, 'Firma adı gereklidir'],
    trim: true,
    maxlength: [100, 'Firma adı 100 karakterden uzun olamaz']
  },
  taxNumber: {
    type: String,
    required: [true, 'Vergi numarası gereklidir'],
    unique: true,
    trim: true
  },
  taxOffice: {
    type: String,
    required: [true, 'Vergi dairesi gereklidir'],
    trim: true
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
  
  // İletişim bilgileri
  contactPerson: {
    name: {
      type: String,
      required: [true, 'İletişim kurulacak kişi adı gereklidir'],
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'İletişim telefonu gereklidir'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'İletişim e-postası gereklidir'],
      trim: true,
      lowercase: true
    }
  },
  
  // Firma özellikleri
  companyType: {
    type: String,
    enum: ['restaurant', 'hotel', 'market', 'processor', 'exporter', 'other'],
    default: 'other'
  },
  companySize: {
    type: String,
    enum: ['micro', 'small', 'medium', 'large'],
    default: 'small'
  },
  description: {
    type: String,
    maxlength: [1000, 'Açıklama 1000 karakterden uzun olamaz']
  },
  
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
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  profileImage: {
    type: String
  },
  logoImage: {
    type: String
  },
  website: {
    type: String,
    trim: true
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
    linkedin: {
      type: String,
      trim: true
    }
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

// Güncellenme zamanını otomatik ayarlayan middleware
CompanySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Company', CompanySchema, 'Companies'); 