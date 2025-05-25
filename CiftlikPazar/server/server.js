const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/auth.routes');
const cityRoutes = require('./routes/city.routes');
const categoryRoutes = require('./routes/category.routes');
const farmerRoutes = require('./routes/farmer.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const couponRoutes = require('./routes/coupon.routes');
const orderRoutes = require('./routes/order.routes');
const companyRoutes = require('./routes/company.routes');
const requestRoutes = require('./routes/request.routes');
const offerRoutes = require('./routes/offer.routes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
// CORS ayarlarını daha açık belirtelim
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend URL'leri
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// Static uploads klasörü için ayar - ana dizindeki ortak uploads klasörü
const uploadsPath = path.join(__dirname, '../../uploads');
// Uploads dizini yoksa oluştur
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Product Images dizini de oluştur
const productImagesPath = path.join(uploadsPath, 'product-images');
if (!fs.existsSync(productImagesPath)) {
  fs.mkdirSync(productImagesPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ciftlikpazar', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Çiftlik Pazar API - Hoşgeldiniz' });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 hatası - Bulunamayan route'lar için
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'İstenen sayfa bulunamadı'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 