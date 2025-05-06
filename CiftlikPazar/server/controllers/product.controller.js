const Product = require('../models/Product');
const Farmer = require('../models/farmer.model');

// Tüm ürünleri getir
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({
        path: 'farmer',
        select: 'farmName city district description'
      });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Ürün detayını getir
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'farmer',
        select: 'farmName city district description'
      });
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Yeni ürün ekle
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      countInStock,
      unit
    } = req.body;

    // Çiftçi ID'sini kullanıcı ID'si ile ilişkilendirilen çiftçi profilinden alıyoruz
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(400).json({ message: 'Geçerli bir çiftçi profili bulunamadı' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      countInStock,
      unit,
      farmer: farmer._id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Ürün güncelle
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      countInStock,
      unit
    } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Çiftçi ID'sini bulma
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    // Ürünün sahibi olan çiftçi veya admin değilse güncellemeye izin verme
    if (farmer && farmer._id.toString() !== product.farmer.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.image = image || product.image;
    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;
    product.unit = unit || product.unit;

    const updatedProduct = await product.save();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Ürün sil
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Çiftçi ID'sini bulma
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    // Ürünün sahibi olan çiftçi veya admin değilse silmeye izin verme
    if (farmer && farmer._id.toString() !== product.farmer.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    await product.deleteOne();
    
    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}; 