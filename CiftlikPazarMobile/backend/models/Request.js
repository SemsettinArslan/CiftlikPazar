const mongoose = require('mongoose');

// Ana Talep şeması
const RequestSchema = new mongoose.Schema({
  // İlişkili firma bilgileri
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Talep bilgileri
  title: {
    type: String,
    required: [true, 'Talep başlığı gereklidir'],
    trim: true,
    maxlength: [100, 'Başlık 100 karakterden uzun olamaz']
  },
  description: {
    type: String,
    required: [true, 'Talep açıklaması gereklidir'],
    maxlength: [1000, 'Açıklama 1000 karakterden uzun olamaz']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Kategori seçimi gereklidir']
  },
  quantity: {
    type: Number,
    required: [true, 'Miktar bilgisi gereklidir'],
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  unit: {
    type: String,
    required: [true, 'Birim bilgisi gereklidir'],
    enum: ['kg', 'g', 'adet', 'litre', 'demet', 'paket'],
    default: 'kg'
  },
  
  // Konum bilgileri
  city: {
    type: String,
    required: [true, 'İl bilgisi gereklidir']
  },
  district: {
    type: String,
    required: [true, 'İlçe bilgisi gereklidir']
  },
  
  // Fiyat ve teslim bilgileri
  budget: {
    type: Number,
    min: [0, 'Bütçe 0 veya daha büyük olmalıdır']
  },
  deadline: {
    type: Date,
    required: [true, 'Son teslim tarihi gereklidir']
  },
  
  // Ek özellikler
  isOrganic: {
    type: Boolean,
    default: false
  },
  specifications: {
    type: String,
    maxlength: [500, 'Özellikler 500 karakterden uzun olamaz']
  },
  
  // Durum bilgileri
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  
  // Teklifler - Bağımsız Offer dokümanlarına referanslar
  offers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  }],
  
  // Seçilen teklif
  selectedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  
  // Zaman bilgileri
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
});

// Güncellenme zamanını otomatik ayarlayan middleware
RequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Request', RequestSchema, 'Requests'); 