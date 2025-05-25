const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs');
const path = require('path');

// @desc    Kullanıcı profilini getir
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı profilini güncelle
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone
    };
    
    // Boş alanları kaldır
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı profil fotoğrafını yükle
// @route   POST /api/users/profile/upload-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.files || !req.files.profileImage) {
      return next(new ErrorResponse('Lütfen bir profil fotoğrafı yükleyin', 400));
    }
    
    const file = req.files.profileImage;
    
    // Dosya türünü kontrol et
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Lütfen bir resim dosyası yükleyin', 400));
    }
    
    // Dosya boyutunu kontrol et
    if (file.size > process.env.MAX_FILE_SIZE || file.size > 2 * 1024 * 1024) { // 2MB
      return next(new ErrorResponse('Lütfen 2MB\'den küçük bir resim yükleyin', 400));
    }
    
    // Dosya adını oluştur
    const fileName = `photo_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;
    
    // Dosyayı taşı
    const uploadPath = path.join(__dirname, '../../../uploads/profile-images/', fileName);
    
    // Klasörün var olduğundan emin ol
    const dir = path.dirname(uploadPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    file.mv(uploadPath, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Dosya yükleme hatası', 500));
      }
      
      // Kullanıcıyı güncelle
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: fileName },
        { new: true }
      ).select('-password');
      
      res.status(200).json({
        success: true,
        data: user
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teslimat adreslerini getir
// @route   GET /api/users/delivery-addresses
// @access  Private
exports.getDeliveryAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    res.status(200).json({
      success: true,
      data: user.deliveryAddresses || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teslimat adresi ekle
// @route   POST /api/users/delivery-addresses
// @access  Private
exports.addDeliveryAddress = async (req, res, next) => {
  try {
    const { title, address, city, district, postalCode, isDefault } = req.body;
    
    // Gerekli alanları kontrol et
    if (!title || !address || !city) {
      return next(new ErrorResponse('Başlık, adres ve şehir alanları zorunludur', 400));
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    // Yeni teslimat adresi oluştur
    const newAddress = {
      title,
      address,
      city,
      district: district || '',
      postalCode: postalCode || '',
      isDefault: isDefault || false
    };
    
    // Eğer yeni adres varsayılan ise, diğer adreslerin varsayılan değerini false yap
    if (newAddress.isDefault) {
      user.deliveryAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Teslimat adresini ekle
    user.deliveryAddresses.push(newAddress);
    await user.save();
    
    res.status(201).json({
      success: true,
      data: newAddress,
      message: 'Teslimat adresi başarıyla eklendi'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teslimat adresi güncelle
// @route   PUT /api/users/delivery-addresses/:id
// @access  Private
exports.updateDeliveryAddress = async (req, res, next) => {
  try {
    const { title, address, city, district, postalCode, isDefault } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    // Güncellenecek adresi bul
    const addressIndex = user.deliveryAddresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );
    
    if (addressIndex === -1) {
      return next(new ErrorResponse('Teslimat adresi bulunamadı', 404));
    }
    
    // Adresi güncelle
    if (title) user.deliveryAddresses[addressIndex].title = title;
    if (address) user.deliveryAddresses[addressIndex].address = address;
    if (city) user.deliveryAddresses[addressIndex].city = city;
    if (district !== undefined) user.deliveryAddresses[addressIndex].district = district;
    if (postalCode !== undefined) user.deliveryAddresses[addressIndex].postalCode = postalCode;
    
    // isDefault değiştirilecekse
    if (isDefault !== undefined) {
      // Eğer varsayılan yapılacaksa diğerlerini false yap
      if (isDefault) {
        user.deliveryAddresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      user.deliveryAddresses[addressIndex].isDefault = isDefault;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.deliveryAddresses[addressIndex],
      message: 'Teslimat adresi başarıyla güncellendi'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teslimat adresi sil
// @route   DELETE /api/users/delivery-addresses/:id
// @access  Private
exports.deleteDeliveryAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    // Adresi bul
    const addressIndex = user.deliveryAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return next(new ErrorResponse('Teslimat adresi bulunamadı', 404));
    }
    
    // Adresi sil
    user.deliveryAddresses.splice(addressIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Teslimat adresi başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
}; 