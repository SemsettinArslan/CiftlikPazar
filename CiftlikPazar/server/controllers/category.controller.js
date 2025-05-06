const Category = require('../models/category.model');

// @desc    Tüm kategorileri getir
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('category_name');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Kategori detayını getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Kategori detayını getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Yeni kategori oluştur
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const { category_name, subcategory, description } = req.body;
    
    // Zorunlu alan kontrolü
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: 'Kategori adı gereklidir'
      });
    }
    
    // Kategori oluştur
    const category = await Category.create({
      category_name,
      subcategory,
      description
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    // Duplicate kontrolü
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategori zaten mevcut'
      });
    }
    
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 