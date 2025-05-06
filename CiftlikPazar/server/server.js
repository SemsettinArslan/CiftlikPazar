const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth.routes');
const cityRoutes = require('./routes/city.routes');
const categoryRoutes = require('./routes/category.routes');
const farmerRoutes = require('./routes/farmer.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static uploads klasörü için ayar - ana dizindeki ortak uploads klasörü
const uploadsPath = path.join(__dirname, '../../uploads');
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

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Çiftlik Pazar API - Hoşgeldiniz' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 