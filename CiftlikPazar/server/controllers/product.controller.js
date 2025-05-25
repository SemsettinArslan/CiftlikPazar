const Product = require('../models/Product');
const Farmer = require('../models/farmer.model');
const Category = require('../models/category.model');
const { verifyProduct } = require('../utils/geminiAI');

// Tüm ürünleri getir (sadece onaylı ürünler)
exports.getProducts = async (req, res) => {
  try {
    // Filtreleme - varsayılan olarak onaylı ürünler
    const query = { approvalStatus: 'approved' };
    
    // Eğer istek sadece öne çıkanları istiyorsa
    if (req.query.isFeatured === 'true') {
      query.isFeatured = true;
    }
    
    // Eğer özel olarak bir onay durumu belirtilmişse
    if (req.query.approvalStatus) {
      // Admin veya çiftçi ise tüm onay durumlarını görebilir
      if (req.user && (req.user.role === 'admin' || req.user.role === 'farmer')) {
        if (['approved', 'pending', 'rejected'].includes(req.query.approvalStatus)) {
          query.approvalStatus = req.query.approvalStatus;
        }
      } else {
        // Normal kullanıcılar sadece onaylı ürünleri görebilir
        // approvalStatus parametresi ne olursa olsun, sadece onaylı ürünleri göster
        query.approvalStatus = 'approved';
      }
    }

    // Limit parametresi kontrol et
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    // Ürünleri getir
    let productsQuery = Product.find(query)
      .populate({
        path: 'farmer',
        select: 'farmName city district description'
      });
    
    // Eğer limit belirtilmişse uygula
    if (limit && limit > 0) {
      productsQuery = productsQuery.limit(limit);
    }
    
    const products = await productsQuery;
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
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
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
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
      unit,
      isOrganic
    } = req.body;

    // Çiftçi ID'sini kullanıcı ID'si ile ilişkilendirilen çiftçi profilinden alıyoruz
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      return res.status(400).json({ success: false, message: 'Geçerli bir çiftçi profili bulunamadı' });
    }

    // Gemini AI doğrulaması için kategori adını al
    let categoryName = '';
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (categoryDoc) {
        categoryName = categoryDoc.category_name || categoryDoc.name;
      }
    }

    // Ürünü oluşturmadan önce otomatik Gemini AI doğrulaması yap
    let approvalStatus = 'pending'; // varsayılan onay durumu
    let verificationResult = null;
    let verificationReason = null;

    // Sadece görsel varsa doğrulama yap
    if (image && name && description) {
      try {
        // Gemini API ile ürün doğrulama
        verificationResult = await verifyProduct(name, description, categoryName, image);
        
        console.log("Gemini AI Doğrulama Sonucu:", verificationResult);
        
        // Doğrulama sonucuna göre onay durumunu belirle
        if (verificationResult.autoApproved === true && verificationResult.isValid === true) {
          approvalStatus = 'approved'; // Otomatik onay
          verificationReason = "AI tarafından doğrulandı: " + verificationResult.reason;
        } else {
          // Ürün doğrulanmadı veya güven skoru düşük, manuel incelemeye alınacak
          approvalStatus = 'pending';
          
          if (verificationResult.isValid === false) {
            // İsim problemiyle ilgili özel mesaj kontrolü
            if (verificationResult.reason.toLowerCase().includes("ürün adı") || 
                verificationResult.reason.toLowerCase().includes("isim")) {
              verificationReason = "AI doğrulaması başarısız - Ürün adı uyumsuz: " + verificationResult.reason;
            } else {
              verificationReason = "AI doğrulaması başarısız: " + verificationResult.reason;
            }
          } else {
            // isValid true ama güven skoru düşük olabilir
            verificationReason = "Doğrulama sonuçları tam güvenilir değil: " + verificationResult.reason;
          }
        }
      } catch (aiError) {
        console.error("Ürün doğrulama hatası:", aiError);
        verificationReason = "Doğrulama işlemi sırasında bir hata oluştu";
        // Hata durumunda manuel onaya düşsün
        approvalStatus = 'pending';
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      countInStock,
      unit,
      isOrganic: isOrganic || false,
      farmer: farmer._id,
      approvalStatus: approvalStatus, // Güncellendi - Gemini AI otomatik onayı
      approvalDate: approvalStatus === 'approved' ? Date.now() : undefined,
      rejectionReason: approvalStatus === 'rejected' ? verificationReason : undefined
    });

    // Yanıta doğrulama sonucunu ekle
    const responseMessage = approvalStatus === 'approved' 
      ? 'Ürün başarıyla kaydedildi ve otomatik olarak onaylandı.' 
      : 'Ürün başarıyla kaydedildi ve onay için gönderildi.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: product,
      verification: verificationResult // İsteğe bağlı - frontend'e doğrulama detaylarını göndermek için
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
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
      unit,
      isOrganic
    } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }

    // Çiftçi ID'sini bulma
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    // Ürünün sahibi olan çiftçi veya admin değilse güncellemeye izin verme
    if (farmer && farmer._id.toString() !== product.farmer.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    // Ürün adı, açıklama veya görsel değiştiyse Gemini AI doğrulaması yap
    let newApprovalStatus = product.approvalStatus;
    let verificationResult = null;
    let verificationReason = null;
    
    const isChanged = (name && name !== product.name) || 
                      (description && description !== product.description) || 
                      (image && image !== product.image) ||
                      (category && category.toString() !== product.category.toString());

    // Önemli alanlardan biri değiştiyse ve mevcut AI değerleri varsa
    if (isChanged) {
      // Gemini AI doğrulaması için kategori adını al
      let categoryName = '';
      let categoryId = category || product.category;
      
      if (categoryId) {
        const categoryDoc = await Category.findById(categoryId);
        if (categoryDoc) {
          categoryName = categoryDoc.category_name || categoryDoc.name;
        }
      }
      
      // Değiştirilen veya mevcut değerleri kullan
      const productName = name || product.name;
      const productDesc = description || product.description;
      const productImage = image || product.image;
      
      // Gemini AI ile ürün doğrulama
      try {
        if (productImage && productName && productDesc) {
          verificationResult = await verifyProduct(productName, productDesc, categoryName, productImage);
          
          console.log("Gemini AI Güncelleme Doğrulama Sonucu:", verificationResult);
          
          // Doğrulama sonucuna göre onay durumunu belirle
          if (verificationResult.autoApproved === true && verificationResult.isValid === true) {
            newApprovalStatus = 'approved'; // Otomatik onay
            verificationReason = "AI tarafından doğrulandı: " + verificationResult.reason;
          } else {
            // Ürün doğrulanmadı veya güven skoru düşük, manuel incelemeye alınacak
            newApprovalStatus = 'pending';
            
            if (verificationResult.isValid === false) {
              // İsim problemiyle ilgili özel mesaj kontrolü
              if (verificationResult.reason.toLowerCase().includes("ürün adı") || 
                  verificationResult.reason.toLowerCase().includes("isim")) {
                verificationReason = "AI doğrulaması başarısız - Ürün adı uyumsuz: " + verificationResult.reason;
              } else {
                verificationReason = "AI doğrulaması başarısız: " + verificationResult.reason;
              }
            } else {
              // isValid true ama güven skoru düşük olabilir
              verificationReason = "Doğrulama sonuçları tam güvenilir değil: " + verificationResult.reason;
            }
          }
        } else {
          // Eksik veriler olduğunda manuel inceleme
          newApprovalStatus = 'pending';
        }
      } catch (aiError) {
        console.error("Ürün güncelleme doğrulama hatası:", aiError);
        // Hata durumunda manuel onaya düşsün
        newApprovalStatus = 'pending';
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.image = image || product.image;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.unit = unit || product.unit;
    product.isOrganic = isOrganic !== undefined ? isOrganic : product.isOrganic;
    product.approvalStatus = newApprovalStatus;

    if (newApprovalStatus === 'approved' && isChanged) {
      product.approvalDate = Date.now();
      product.rejectionReason = undefined;
    } else if (newApprovalStatus === 'pending') {
      product.rejectionReason = undefined;
    }

    const updatedProduct = await product.save();
    
    // Yanıta doğrulama sonucunu ekle
    const responseMessage = newApprovalStatus === 'approved' 
      ? 'Ürün güncellendi ve otomatik olarak onaylandı.' 
      : newApprovalStatus === 'pending'
        ? 'Ürün güncellendi ve tekrar onay için gönderildi.'
        : 'Ürün başarıyla güncellendi.';

    res.json({
      success: true,
      message: responseMessage,
      data: updatedProduct,
      verification: verificationResult // İsteğe bağlı - frontend'e doğrulama detaylarını göndermek için
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Ürün sil
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }

    // Çiftçi ID'sini bulma
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    // Ürünün sahibi olan çiftçi veya admin değilse silmeye izin verme
    if (farmer && farmer._id.toString() !== product.farmer.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }

    await product.deleteOne();
    
    res.json({ success: true, message: 'Ürün silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Öne çıkan ürünleri getir
exports.getFeaturedProducts = async (req, res) => {
  try {
    // Limit parametresi, kaç ürün döndürüleceğini belirler (varsayılan 4)
    const limit = parseInt(req.query.limit) || 4;

    const featuredProducts = await Product.find({ 
      isFeatured: true,
      approvalStatus: 'approved' // Sadece onaylı ürünler gösterilir
    })
      .limit(limit)
      .populate({
        path: 'farmer',
        select: 'farmName city district description'
      })
      .populate('category', 'name');
    
    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      data: featuredProducts
    });
  } catch (error) {
    console.error('Öne çıkan ürünleri getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Belirli bir çiftçiye ait ürünleri getir (sadece onaylı olanlar - müşteriler için)
exports.getProductsByFarmer = async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    
    // Çiftçi kontrolü
    const farmerExists = await Farmer.findById(farmerId);
    if (!farmerExists) {
      return res.status(404).json({
        success: false,
        message: 'Üretici bulunamadı'
      });
    }
    
    // Sadece onaylı ürünleri göster
    const products = await Product.find({ 
      farmer: farmerId,
      approvalStatus: 'approved'
    })
      .populate({
        path: 'farmer',
        select: 'farmName city district description'
      })
      .populate('category', 'name');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Çiftçi ürünlerini getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Çiftçinin kendi ürünlerini getir (tüm durumlar - çiftçi için)
exports.getMyProducts = async (req, res) => {
  try {
    // Çiftçi kontrolü
    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Üretici profili bulunamadı'
      });
    }
    
    // Query parametreleri
    const { status } = req.query;
    let query = { farmer: farmer._id };
    
    // Eğer durum filtresi varsa ekle
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.approvalStatus = status;
    }
    
    const products = await Product.find(query)
      .populate('category', 'category_name')
      .sort({ createdAt: -1 }); // En yeni eklenenler üstte
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Kendi ürünlerini getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Onay bekleyen ürünleri getir (admin için)
exports.getPendingProducts = async (req, res) => {
  try {
    const pendingProducts = await Product.find({ approvalStatus: 'pending' })
      .populate({
        path: 'farmer',
        select: 'farmName city district user',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('category', 'name')
      .sort({ createdAt: -1 }); // En yeni eklenenler üstte
    
    res.status(200).json({
      success: true,
      count: pendingProducts.length,
      data: pendingProducts
    });
  } catch (error) {
    console.error('Onay bekleyen ürünleri getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Reddedilen ürünleri getir (admin için)
exports.getRejectedProducts = async (req, res) => {
  try {
    const rejectedProducts = await Product.find({ approvalStatus: 'rejected' })
      .populate({
        path: 'farmer',
        select: 'farmName city district user',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('category', 'name')
      .sort({ approvalDate: -1, createdAt: -1 }); // En son işlem yapılanlar üstte
    
    res.status(200).json({
      success: true,
      count: rejectedProducts.length,
      data: rejectedProducts
    });
  } catch (error) {
    console.error('Reddedilen ürünleri getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Ürün onaylama (admin için)
exports.approveProduct = async (req, res) => {
  try {
    // Ürünü ID'ye göre bul ve çiftçi/kategori ile birlikte getir
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'farmName')
      .populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    if (product.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün zaten onaylanmış'
      });
    }
    
    // Ürün durumunu güncelle
    product.approvalStatus = 'approved';
    product.approvalDate = Date.now();
    product.rejectionReason = null;
    
    // Değişiklikleri kaydet
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla onaylandı',
      data: product
    });
  } catch (error) {
    console.error('Ürün onaylama hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Ürün reddetme (admin için)
exports.rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Red sebebi belirtilmelidir'
      });
    }
    
    // Ürünü ID'ye göre bul ve çiftçi/kategori ile birlikte getir
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'farmName')
      .populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    // Ürün durumunu güncelle
    product.approvalStatus = 'rejected';
    product.rejectionReason = reason;
    product.approvalDate = Date.now();
    
    // Değişiklikleri kaydet
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Ürün reddedildi',
      data: product
    });
  } catch (error) {
    console.error('Ürün reddetme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Admin için durum bazlı ürün listesi getir (onaylı, reddedilmiş veya tümü)
exports.getAdminProductsByStatus = async (req, res) => {
  try {
    // Query parametrelerinden status değerini al
    const { status } = req.query;
    
    // Status değeri geçerliyse filtreleme yap, değilse tüm ürünleri getir
    let query = {};
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.approvalStatus = status;
    }
    
    // Ürünleri çiftçi ve kategori bilgileriyle birlikte getir
    const products = await Product.find(query)
      .populate({
        path: 'farmer',
        select: 'farmName city district user',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('category', 'name')
      .sort({ approvalDate: -1, createdAt: -1 }); // En son işlem yapılanlar üstte
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Admin ürün listesi getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası' 
    });
  }
};

// Ürün görseli yükleme
exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir görsel dosyası yükleyin'
      });
    }

    // Sadece dosya adını kullan, tam yol değil
    // Bu şekilde tekrarlayan uploads/product-images/ sorunu çözülür
    const imagePath = req.file.filename;
    
    console.log('Yüklenen dosya adı:', imagePath);
    
    return res.status(200).json({
      success: true,
      message: 'Görsel başarıyla yüklendi',
      data: {
        imagePath: imagePath
      }
    });
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Görsel yüklenirken bir hata oluştu'
    });
  }
}; 