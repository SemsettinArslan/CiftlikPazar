const mongoose = require('mongoose');

// Sipariş öğesi şeması
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Fiyat 0 veya daha büyük olmalıdır']
  },
  image: {
    type: String
  },
  unit: {
    type: String,
    default: 'kg'
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  }
});

// Teslimat adresi şeması
const ShippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  postalCode: {
    type: String
  },
  phone: {
    type: String,
    required: true
  }
});

// Sipariş şeması
const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  paymentMethod: {
    type: String,
    required: true,
    default: 'Kapıda Ödeme'
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingFee: {
    type: Number,
    required: true,
    default: 0.0
  },
  discountAmount: {
    type: Number,
    default: 0.0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  estimatedDelivery: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Sipariş numarası oluşturma (opsiyonel)
OrderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `CP${year}${month}${day}${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema); 