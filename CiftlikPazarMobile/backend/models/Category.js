const mongoose = require('mongoose');
const slugify = require('slugify');

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
  slug: String,
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

// Subcategory slugları için pre-save hook
CategorySchema.pre('save', function(next) {
  // Ana kategori için slug oluşturma
  if (this.category_name && !this.slug) {
    this.slug = slugify(this.category_name, {
      lower: true,
      strict: true
    });
  }
  
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

module.exports = mongoose.model('Category', CategorySchema, 'Categories'); 