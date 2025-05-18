const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ürün adı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ürün açıklaması zorunludur'],
    },
    price: {
      type: Number,
      required: [true, 'Ürün fiyatı zorunludur'],
      min: [0, 'Fiyat 0 veya daha büyük olmalıdır'],
    },
    image: {
      type: String,
      default: 'default-product.jpg',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Ürün kategorisi zorunludur'],
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Ürünün çiftçisi zorunludur'],
    },
    countInStock: {
      type: Number,
      required: [true, 'Ürün stok miktarı zorunludur'],
      min: [0, 'Stok miktarı 0 veya daha büyük olmalıdır'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Ürün birimi zorunludur'],
      enum: ['kg', 'g', 'adet', 'litre', 'demet', 'paket'],
      default: 'kg',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 