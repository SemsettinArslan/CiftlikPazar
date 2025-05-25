const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Fiyat bilgisi gereklidir'],
    min: [0, 'Fiyat 0\'dan büyük olmalıdır']
  },
  quantity: {
    type: Number,
    required: [true, 'Miktar bilgisi gereklidir'],
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  description: {
    type: String,
    required: [true, 'Teklif açıklaması gereklidir'],
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  estimatedDelivery: {
    type: Date,
    required: [true, 'Tahmini teslimat tarihi gereklidir']
  },
  notes: {
    type: String,
    maxlength: [500, 'Not en fazla 500 karakter olabilir']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Offer', OfferSchema, 'offers'); 