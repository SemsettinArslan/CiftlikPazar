const User = require('../models/user.model');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// @desc    Kullanıcı profilini getir
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Kullanıcı profilini güncelle
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      district
    } = req.body;
    
    // Güncellenecek alanları topla
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (city) updateFields.city = city;
    if (district) updateFields.district = district;
    
    // Telefon numarası kontrolü
    if (phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası zaten başka bir kullanıcı tarafından kullanılıyor'
        });
      }
    }
    
    // Kullanıcıyı güncelle
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Profil başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    });
  }
};

// @desc    Profil resmi yükle
// @route   POST /api/users/profile/upload-image
// @access  Private
exports.uploadProfileImage = (req, res) => {
  // Multer middleware'ini çalıştır - tek dosya yükleme
  upload.single('profileImage')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Lütfen bir resim dosyası yükleyin'
        });
      }
      
      // Eski profil resmini bul
      const user = await User.findById(req.user.id);
      
      // Eski profil resmi varsayılan değil ise ve mevcutsa, sil
      if (user.profileImage && user.profileImage !== 'default-profile.jpg') {
        try {
          // Ortak uploads klasöründeki dosya yolunu kullan
          const oldImagePath = path.join(__dirname, '../../../uploads/profile-images', user.profileImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error('Eski dosya silme hatası:', err);
          // Devam et, kritik bir hata değil
        }
      }
      
      // Veritabanında profil resmi yolunu güncelle
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: req.file.filename },
        { new: true }
      );
      
      res.status(200).json({
        success: true,
        data: {
          profileImage: req.file.filename,
          profileImageUrl: `/uploads/profile-images/${req.file.filename}`
        },
        message: 'Profil resmi başarıyla güncellendi'
      });
    } catch (error) {
      console.error('Profil resmi yükleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası'
      });
    }
  });
};

// @desc    Teslimat adreslerini getir
// @route   GET /api/users/delivery-addresses
// @access  Private
exports.getDeliveryAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.deliveryAddresses
    });
  } catch (error) {
    console.error('Teslimat adresleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Teslimat adresi ekle
// @route   POST /api/users/delivery-addresses
// @access  Private
exports.addDeliveryAddress = async (req, res) => {
  try {
    const { title, address, city, district, postalCode, isDefault } = req.body;
    
    // Gerekli alanları kontrol et
    if (!title || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Başlık, adres ve şehir alanları zorunludur'
      });
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
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
    console.error('Teslimat adresi ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Teslimat adresi güncelle
// @route   PUT /api/users/delivery-addresses/:id
// @access  Private
exports.updateDeliveryAddress = async (req, res) => {
  try {
    const { title, address, city, district, postalCode, isDefault } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Güncellenecek adresi bul
    const addressIndex = user.deliveryAddresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teslimat adresi bulunamadı'
      });
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
    console.error('Teslimat adresi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// @desc    Teslimat adresi sil
// @route   DELETE /api/users/delivery-addresses/:id
// @access  Private
exports.deleteDeliveryAddress = async (req, res) => {
  try {
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Silinecek adresi bul
    const addressIndex = user.deliveryAddresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Teslimat adresi bulunamadı'
      });
    }
    
    // Adresi sil
    user.deliveryAddresses.splice(addressIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Teslimat adresi başarıyla silindi'
    });
  } catch (error) {
    console.error('Teslimat adresi silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}; 