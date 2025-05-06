const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: [true, 'Kategori adı gereklidir'],
    unique: true,
    trim: true,
    maxlength: [50, 'Kategori adı 50 karakterden uzun olamaz']
  },
  subcategory: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    }
  }],
  description: {
    type: String,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Subcategory slugları için pre-save hook
CategorySchema.pre('save', function(next) {
  // Alt kategori slug'larını oluştur
  if (this.subcategory && this.subcategory.length > 0) {
    this.subcategory.forEach(sub => {
      if (sub.name && !sub.slug) {
        sub.slug = sub.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    });
  }
  
  next();
});

module.exports = mongoose.model('Category', CategorySchema, 'Categories'); 