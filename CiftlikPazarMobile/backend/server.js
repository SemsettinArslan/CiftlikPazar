const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Ortam değişkenlerini yükle
dotenv.config();

// Veritabanı bağlantısı
connectDB();

// Route dosyalarını içe aktar
const auth = require('./routes/auth');
const cities = require('./routes/cities');
const categories = require('./routes/categories');
const farmers = require('./routes/farmers');
const products = require('./routes/products');
const orders = require('./routes/orders');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://ciftlikpazar.com' : 'http://localhost:3000',
  credentials: true
}));

// Dosya yükleme
app.use(fileUpload());

// Statik dosyalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API route'ları
app.use('/api/auth', auth);
app.use('/api/cities', cities);
app.use('/api/categories', categories);
app.use('/api/farmers', farmers);
app.use('/api/products', products);
app.use('/api/orders', orders);

// Basit route
app.get('/', (req, res) => {
  res.json({ message: 'API Çalışıyor' });
});

// Hata işleyici middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Sunucu ${process.env.NODE_ENV} modunda ${PORT} portunda çalışıyor`);
});

// İşlenmeyen promise redlerini yakala
process.on('unhandledRejection', (err, promise) => {
  console.log(`Hata: ${err.message}`);
  // Sunucuyu kapat ve işlemi sonlandır
  server.close(() => process.exit(1));
}); 