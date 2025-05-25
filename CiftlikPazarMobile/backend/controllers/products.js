const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { verifyProduct } = require('../utils/geminiAI');
const Farmer = require('../models/Farmer');

// @desc    Tüm ürünleri getir
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Tek ürün getir
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    });

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Ürün oluştur
// @route   POST /api/products
// @access  Private (Satıcı ve Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Kullanıcının farmer ID'sini bul (çiftlik tablosundan)
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  if (!farmer) {
    return next(new ErrorResponse('Çiftlik kaydınız bulunamadı', 404));
  }
  
  // Ürün çiftçisi olarak Farmer tablosundaki ID kullanılmalı (User ID değil)
  req.body.farmer = farmer._id;

  // Kategori adını al (AI doğrulama için)
  let categoryName = '';
  if (req.body.category) {
    const categoryDoc = await Category.findById(req.body.category);
    if (categoryDoc) {
      categoryName = categoryDoc.category_name || categoryDoc.name || '';
      console.log("Kategori adı alındı:", categoryName);
    } else {
      console.log("Kategori bulunamadı, ID:", req.body.category);
    }
  } else {
    console.log("Kategori ID'si bulunamadı");
  }

  // Ürünü oluşturmadan önce otomatik AI doğrulaması yap
  let approvalStatus = 'pending'; // varsayılan onay durumu
  let verificationResult = null;
  let verificationReason = null;

  // Sadece görsel varsa doğrulama yap
  if (req.body.image && req.body.name && req.body.description) {
    try {
      // AI ile ürün doğrulama
      console.log("AI doğrulama başlatılıyor:", {
        name: req.body.name,
        image: req.body.image ? `${req.body.image.substring(0, 20)}...` : 'yok'
      });
      
      verificationResult = await verifyProduct(
        req.body.name, 
        req.body.description, 
        categoryName, 
        req.body.image
      );
      
      console.log("AI Doğrulama Sonucu:", verificationResult);
      
      // Doğrulama sonucuna göre onay durumunu belirle
      if (verificationResult && verificationResult.isValid === true && verificationResult.autoApproved === true) {
        approvalStatus = 'approved'; // Otomatik onay
        verificationReason = "AI tarafından doğrulandı: " + verificationResult.reason;
      } else {
        // Ürün doğrulanmadı veya güven skoru düşük, manuel incelemeye alınacak
        approvalStatus = 'pending';
        
        if (verificationResult && verificationResult.isValid === false) {
          // İsim problemiyle ilgili özel mesaj kontrolü
          if (verificationResult.reason && (
              verificationResult.reason.toLowerCase().includes("ürün adı") || 
              verificationResult.reason.toLowerCase().includes("isim"))) {
            verificationReason = "AI doğrulaması başarısız - Ürün adı uyumsuz: " + verificationResult.reason;
          } else {
            verificationReason = "AI doğrulaması başarısız: " + (verificationResult.reason || 'Bilinmeyen neden');
          }
        } else {
          // isValid true ama güven skoru düşük olabilir veya sonuç alınamadı
          verificationReason = verificationResult && verificationResult.reason ? 
            "Doğrulama sonuçları tam güvenilir değil: " + verificationResult.reason :
            "Doğrulama sonuçları alınamadı";
        }
      }
    } catch (aiError) {
      console.error("Ürün doğrulama hatası:", aiError);
      verificationReason = "Doğrulama işlemi sırasında bir hata oluştu: " + aiError.message;
      // Hata durumunda manuel onaya düşsün
      approvalStatus = 'pending';
      
      // Hata durumunda bile işleme devam et, sadece log ve uyarı ekle
      verificationResult = {
        isValid: false,
        confidence: 0,
        reason: "AI doğrulama hatası: " + aiError.message,
        autoApproved: false
      };
    }
  } else {
    console.log("AI doğrulama için gerekli bilgiler eksik:", {
      hasImage: !!req.body.image,
      hasName: !!req.body.name,
      hasDescription: !!req.body.description
    });
  }

  // Ürün verisine AI doğrulama sonuçlarını ekle
  const productData = {
    ...req.body,
    approvalStatus: approvalStatus,
    approvalDate: approvalStatus === 'approved' ? Date.now() : undefined,
    rejectionReason: approvalStatus === 'rejected' ? verificationReason : undefined
  };

  const product = await Product.create(productData);

  // Oluşturulan ürünü ID kullanarak tekrar çek ve ilişkili verileri populate et
  const populatedProduct = await Product.findById(product._id)
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    });

  // Yanıta doğrulama sonucunu ekle
  const responseMessage = approvalStatus === 'approved' 
    ? 'Ürün başarıyla kaydedildi ve otomatik olarak onaylandı.' 
    : 'Ürün başarıyla kaydedildi ve onay için gönderildi.';

  res.status(201).json({
    success: true,
    message: responseMessage,
    data: populatedProduct,
    verification: verificationResult // Frontend'e doğrulama detaylarını göndermek için
  });
});

// @desc    Ürün güncelle
// @route   PUT /api/products/:id
// @access  Private (Satıcı ve Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının çiftlik kaydını bul
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if ((!farmer || product.farmer.toString() !== farmer._id.toString()) && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürünü güncelleme yetkiniz yok`,
        403
      )
    );
  }

  // Önemli bilgiler değişmişse yeniden AI doğrulaması yap
  let newApprovalStatus = product.approvalStatus;
  let verificationResult = null;
  let verificationReason = null;

  const isNameChanged = req.body.name && req.body.name !== product.name;
  const isDescriptionChanged = req.body.description && req.body.description !== product.description;
  const isImageChanged = req.body.image && req.body.image !== product.image;
  const isCategoryChanged = req.body.category && req.body.category.toString() !== product.category.toString();

  // Önemli bilgiler değiştiyse ve ürün onaylanmışsa, yeniden incelemeye al
  if ((isNameChanged || isDescriptionChanged || isImageChanged || isCategoryChanged) && 
      product.approvalStatus === 'approved') {
    
    // Kategori adını al
    let categoryName = '';
    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (categoryDoc) {
        categoryName = categoryDoc.category_name || categoryDoc.name || '';
        console.log("Kategori adı alındı:", categoryName);
      } else {
        console.log("Kategori bulunamadı, ID:", req.body.category);
      }
    } else {
      console.log("Kategori ID'si bulunamadı");
    }

    // AI doğrulaması yap
    const productName = req.body.name || product.name;
    const productDesc = req.body.description || product.description;
    const productImage = req.body.image || product.image;

    if (productImage && productName && productDesc) {
      try {
        verificationResult = await verifyProduct(productName, productDesc, categoryName, productImage);
        
        console.log("AI Güncelleme Doğrulama Sonucu:", verificationResult);
        
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
      } catch (aiError) {
        console.error("Ürün güncelleme doğrulama hatası:", aiError);
        // Hata durumunda manuel onaya düşsün
        newApprovalStatus = 'pending';
      }
    }
  }

  // Güncelleme verisine onay durumunu ekle
  const updateData = {
    ...req.body,
    approvalStatus: newApprovalStatus,
    approvalDate: newApprovalStatus === 'approved' ? Date.now() : product.approvalDate,
    rejectionReason: newApprovalStatus === 'rejected' ? verificationReason : product.rejectionReason
  };

  product = await Product.findOneAndUpdate(
    { _id: req.params.id },
    updateData,
    {
      new: true,
      runValidators: true
    }
  )
  .populate('category', 'name category_name slug')
  .populate({
    path: 'farmer',
    select: 'farmName city district user',
    populate: { path: 'user', select: 'firstName lastName' }
  });

  res.status(200).json({
    success: true,
    data: product,
    verification: verificationResult
  });
});

// @desc    Ürün sil
// @route   DELETE /api/products/:id
// @access  Private (Satıcı ve Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının çiftlik kaydını bul
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if ((!farmer || product.farmer.toString() !== farmer._id.toString()) && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürünü silme yetkiniz yok`,
        403
      )
    );
  }

  await product.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Ürün resmi yükle
// @route   PUT /api/products/:id/image
// @access  Private (Satıcı ve Admin)
exports.productImageUpload = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Kullanıcının çiftlik kaydını bul
  const farmer = await Farmer.findOne({ user: req.user.id });
  
  // Kullanıcının ürünün sahibi olup olmadığını veya admin olup olmadığını kontrol et
  if ((!farmer || product.farmer.toString() !== farmer._id.toString()) && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `${req.params.id} ID'li ürüne resim yükleme yetkiniz yok`,
        403
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Lütfen bir dosya yükleyin`, 400));
  }

  const file = req.files.file;

  // Dosya boyutunu kontrol et (5MB'dan büyük olmamalı)
  if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 5 * 1024 * 1024) {
    return next(
      new ErrorResponse(
        `Lütfen 5MB'dan küçük dosya yükleyin`,
        400
      )
    );
  }

  // Dosya adını oluştur
  file.name = `photo_${product._id}_${Date.now()}${path.parse(file.name).ext}`;

  // Dosyayı taşı
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Dosya yükleme hatası`, 500));
    }

    // Ürün resmini güncelle
    await Product.findByIdAndUpdate(req.params.id, { image: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Ürüne değerlendirme ekle
// @route   POST /api/products/:id/ratings
// @access  Private
exports.addProductRating = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Yeni değerlendirme puanını hesapla
  const newRating = (product.rating * product.numReviews + Number(rating)) / (product.numReviews + 1);
  
  // Ürünü güncelle
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating: newRating,
      numReviews: product.numReviews + 1
    },
    { new: true }
  );

  res.status(201).json({
    success: true,
    data: updatedProduct
  });
});

// @desc    Ürün değerlendirmesini güncelle (Basitleştirilmiş)
// @route   PUT /api/products/:id/ratings
// @access  Private
exports.updateProductRating = asyncHandler(async (req, res, next) => {
  const { rating } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Basitleştirilmiş rating güncellemesi
  await Product.findByIdAndUpdate(
    req.params.id,
    { rating: Number(rating) },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Değerlendirme başarıyla güncellendi'
  });
});

// @desc    Ürün değerlendirmesini sil (Basitleştirilmiş)
// @route   DELETE /api/products/:id/ratings
// @access  Private
exports.deleteProductRating = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }

  // Değerlendirme sayısı hesaplanabilir değilse
  if (product.numReviews <= 0) {
    return next(
      new ErrorResponse(`Bu ürüne ait değerlendirme bulunamadı`, 404)
    );
  }

  // Basitleştirilmiş silme işlemi
  await Product.findByIdAndUpdate(
    req.params.id,
    {
      rating: 0,
      numReviews: 0
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Değerlendirme başarıyla silindi'
  });
});

// @desc    Onay bekleyen ürünleri getir (admin için)
// @route   GET /api/products/pending-approval
// @access  Private (sadece admin)
exports.getPendingProducts = asyncHandler(async (req, res, next) => {
  const pendingProducts = await Product.find({ approvalStatus: 'pending' })
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    })
    .sort({ createdAt: -1 }); // En yeni eklenenler üstte
  
  res.status(200).json({
    success: true,
    count: pendingProducts.length,
    data: pendingProducts
  });
});

// @desc    Reddedilen ürünleri getir (admin için)
// @route   GET /api/products/rejected
// @access  Private (sadece admin)
exports.getRejectedProducts = asyncHandler(async (req, res, next) => {
  const rejectedProducts = await Product.find({ approvalStatus: 'rejected' })
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    })
    .sort({ approvalDate: -1, createdAt: -1 }); // En son işlem yapılanlar üstte
  
  res.status(200).json({
    success: true,
    count: rejectedProducts.length,
    data: rejectedProducts
  });
});

// @desc    Ürün onaylama (admin için)
// @route   PUT /api/products/:id/approve
// @access  Private (sadece admin)
exports.approveProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    });
  
  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }
  
  if (product.approvalStatus === 'approved') {
    return next(
      new ErrorResponse('Bu ürün zaten onaylanmış', 400)
    );
  }
  
  // Ürün durumunu güncelle
  product.approvalStatus = 'approved';
  product.approvalDate = Date.now();
  product.rejectionReason = null;
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Ürün başarıyla onaylandı',
    data: product
  });
});

// @desc    Ürün reddetme (admin için)
// @route   PUT /api/products/:id/reject
// @access  Private (sadece admin)
exports.rejectProduct = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(
      new ErrorResponse('Red sebebi belirtilmelidir', 400)
    );
  }
  
  const product = await Product.findById(req.params.id)
    .populate('category', 'name category_name slug')
    .populate({
      path: 'farmer',
      select: 'farmName city district user',
      populate: { path: 'user', select: 'firstName lastName' }
    });
  
  if (!product) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li ürün bulunamadı`, 404)
    );
  }
  
  // Ürün durumunu güncelle
  product.approvalStatus = 'rejected';
  product.rejectionReason = reason;
  product.approvalDate = Date.now();
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Ürün reddedildi',
    data: product
  });
}); 