const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose'un en son sürümlerinde bu parametreler varsayılan olarak true
      // Web uygulamanızda bu parametreleri kullanıyorsanız, burada da ekleyin
    });

    console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    
    // Koleksiyon adlarını web uygulamasıyla aynı tutmak için
    // Varsayılan koleksiyon adları:
    // - User modeli -> users koleksiyonu 
    // - City modeli -> cities koleksiyonu
    
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 