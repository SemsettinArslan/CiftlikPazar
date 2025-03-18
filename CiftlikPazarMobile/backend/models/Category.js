const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen kategori adı giriniz'],
    unique: true,
    trim: true,
    maxlength: [50, 'Kategori adı 50 karakterden uzun olamaz']
  },
  slug: String,
  description: {
    type: String,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  icon: {
    type: String,
    default: 'leaf-outline'
  },
  image: {
    type: String,
    default: 'no-image.jpg'
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Kategori adından slug oluştur
CategorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true
  });
  next();
});

// Alt kategorileri getir
CategorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  justOne: false
});

// Kategoriye ait ürünleri getir
CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

module.exports = mongoose.model('Category', CategorySchema); 