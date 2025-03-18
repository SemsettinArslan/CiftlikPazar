const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen ürün adı giriniz'],
    trim: true,
    maxlength: [100, 'Ürün adı 100 karakterden uzun olamaz']
  },
  description: {
    type: String,
    required: [true, 'Lütfen ürün açıklaması giriniz'],
    trim: true,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  price: {
    type: Number,
    required: [true, 'Lütfen ürün fiyatı giriniz'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Lütfen ürün birimini giriniz'],
    enum: ['kg', 'adet', 'litre', 'demet', 'paket']
  },
  images: {
    type: [String],
    default: ['no-image.jpg']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Lütfen kategori seçiniz']
  },
  stock: {
    type: Number,
    required: [true, 'Lütfen stok miktarını giriniz'],
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: [{
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Yeni bir değerlendirme (rating) eklendiğinde ortalama derecelendirmeyi hesapla
ProductSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.numReviews = 0;
    return;
  }
  
  const sum = this.ratings.reduce((acc, item) => item.rating + acc, 0);
  this.averageRating = sum / this.ratings.length;
  this.numReviews = this.ratings.length;
};

module.exports = mongoose.model('Product', ProductSchema); 