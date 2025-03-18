const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Miktar en az 1 olmalıdır']
    },
    price: {
      type: Number,
      required: true
    },
    unit: String,
    image: String
  }],
  shippingAddress: {
    title: String,
    address: {
      type: String,
      required: [true, 'Adres bilgisi gereklidir']
    },
    city: {
      type: String,
      required: [true, 'Şehir bilgisi gereklidir']
    },
    postalCode: String,
    phoneNumber: {
      type: String,
      required: [true, 'Telefon numarası gereklidir']
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Ödeme yöntemi gereklidir'],
    enum: ['kapıda ödeme', 'kredi kartı', 'havale/eft']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: Date,
  status: {
    type: String,
    required: true,
    enum: ['sipariş alındı', 'hazırlanıyor', 'kargoya verildi', 'teslim edildi', 'iptal edildi'],
    default: 'sipariş alındı'
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: Date,
  note: String,
  sellerNote: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema); 