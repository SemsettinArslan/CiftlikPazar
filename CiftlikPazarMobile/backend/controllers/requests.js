const Request = require('../models/Request');
const Company = require('../models/Company');
const Offer = require('../models/Offer');
const Farmer = require('../models/Farmer');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Talep oluşturma
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const requestData = {
      ...req.body,
      company: companyId
    };
    
    // Debug log
    console.log(`Yeni talep oluşturuluyor. Firma ID: ${companyId}`);
    
    const newRequest = new Request(requestData);
    await newRequest.save();
    
    console.log(`Yeni talep oluşturuldu. ID: ${newRequest._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Talep başarıyla oluşturuldu',
      data: newRequest
    });
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep oluşturulurken bir hata oluştu'
    });
  }
};

// Firma taleplerini getirme
exports.getCompanyRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    // Burada koleksiyon ismi düzeltiliyor, doğrudan Request modeli kullanıldığında
    // Mongoose otomatik olarak Requests koleksiyonunu hedefleyecek
    const requests = await Request.find({ company: companyId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`${requests.length} adet talep bulundu`);
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Firma talepleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talepler getirilirken bir hata oluştu'
    });
  }
};

// Firma talebini ID'ye göre getirme
exports.getCompanyRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: id,
      company: companyId
    }).populate('category', 'name');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Talep detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep detayı getirilirken bir hata oluştu'
    });
  }
};

// Talep güncelleme
exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    let request = await Request.findOne({
      _id: id,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklif varsa güncellemeye izin verme
    if (request.offers && request.offers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teklif alınmış talepler güncellenemez'
      });
    }
    
    request = await Request.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Talep başarıyla güncellendi',
      data: request
    });
  } catch (error) {
    console.error('Talep güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep güncellenirken bir hata oluştu'
    });
  }
};

// Talep silme
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: id,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Teklif varsa silmeye izin verme
    if (request.offers && request.offers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teklif alınmış talepler silinemez'
      });
    }
    
    await Request.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Talep başarıyla silindi'
    });
  } catch (error) {
    console.error('Talep silme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep silinirken bir hata oluştu'
    });
  }
};

// Talep iptal etme
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: id,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Bu talep zaten ${request.status} durumunda`
      });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    // İlgili teklifleri de reddet
    await Offer.updateMany(
      { request: id, status: 'pending' },
      { status: 'rejected' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Talep başarıyla iptal edildi',
      data: request
    });
  } catch (error) {
    console.error('Talep iptal hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep iptal edilirken bir hata oluştu'
    });
  }
};

// Talep tekliflerini getirme
exports.getRequestOffers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: id,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    const offers = await Offer.find({ request: id })
      .populate({
        path: 'farmer',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Talep teklifleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Talep teklifleri getirilirken bir hata oluştu'
    });
  }
};

// Teklif kabul etme
exports.acceptOffer = async (req, res) => {
  try {
    const { requestId, offerId } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: requestId,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Sadece aktif durumdaki taleplerin teklifleri kabul edilebilir'
      });
    }
    
    const offer = await Offer.findOne({
      _id: offerId,
      request: requestId
    });
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif daha önce işlem görmüş'
      });
    }
    
    // Teklifi kabul et
    offer.status = 'accepted';
    await offer.save();
    
    // Diğer teklifleri reddet
    await Offer.updateMany(
      {
        request: requestId,
        _id: { $ne: offerId },
        status: 'pending'
      },
      { status: 'rejected' }
    );
    
    // Talebi güncelle
    request.status = 'completed';
    request.selectedOffer = offerId;
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla kabul edildi',
      data: { offer, request }
    });
  } catch (error) {
    console.error('Teklif kabul hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Teklif kabul edilirken bir hata oluştu'
    });
  }
};

// Teklif reddetme
exports.rejectOffer = async (req, res) => {
  try {
    const { requestId, offerId } = req.params;
    const userId = req.user._id;
    
    // Kullanıcı ID'sinden şirket kaydını bul
    const company = await Company.findOne({ user: userId });
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için firma hesabınız olmalıdır'
      });
    }
    
    const companyId = company._id;
    
    const request = await Request.findOne({
      _id: requestId,
      company: companyId
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    const offer = await Offer.findOne({
      _id: offerId,
      request: requestId
    });
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif daha önce işlem görmüş'
      });
    }
    
    // Teklifi reddet
    offer.status = 'rejected';
    await offer.save();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla reddedildi',
      data: offer
    });
  } catch (error) {
    console.error('Teklif reddetme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Teklif reddedilirken bir hata oluştu'
    });
  }
};

// Çiftçi için mevcut talepleri getirme
exports.getAvailableRequests = async (req, res) => {
  try {
    const farmerId = req.user.farmerId;
    
    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için çiftçi hesabınız olmalıdır'
      });
    }
    
    // Filtre seçenekleri
    const { city, district, category, keyword } = req.query;
    let filter = { status: 'active' };
    
    // Şehir filtresi
    if (city) {
      filter.city = city;
    }
    
    // İlçe filtresi
    if (district) {
      filter.district = district;
    }
    
    // Kategori filtresi
    if (category) {
      filter.category = category;
    }
    
    // Anahtar kelime araması
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const requests = await Request.find(filter)
      .populate('company', 'companyName')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Mevcut talepler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Mevcut talepler getirilirken bir hata oluştu'
    });
  }
};

// Çiftçi teklif oluşturma
exports.createOffer = async (req, res) => {
  try {
    const { requestId } = req.params;
    const farmerId = req.user.farmerId;
    
    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için çiftçi hesabınız olmalıdır'
      });
    }
    
    const { price, quantity, estimatedDelivery, notes } = req.body;
    
    // Alan kontrolü
    if (!price || !quantity || !estimatedDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Fiyat, miktar ve tahmini teslimat tarihi gereklidir'
      });
    }
    
    // Talebi kontrol et
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Talep bulunamadı'
      });
    }
    
    // Talep aktif mi kontrol et
    if (request.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu talep artık aktif değil'
      });
    }
    
    // Daha önce teklif vermiş mi kontrol et
    const existingOffer = await Offer.findOne({
      request: requestId,
      farmer: farmerId,
      status: 'pending'
    });
    
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Bu talebe zaten bir teklif verdiniz'
      });
    }
    
    // Yeni teklif oluştur
    const newOffer = new Offer({
      request: requestId,
      farmer: farmerId,
      price,
      quantity,
      estimatedDelivery,
      notes
    });
    
    await newOffer.save();
    
    // Talebin teklifler dizisine ekle
    request.offers.push(newOffer._id);
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Teklif başarıyla oluşturuldu',
      data: newOffer
    });
  } catch (error) {
    console.error('Teklif oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Teklif oluşturulurken bir hata oluştu'
    });
  }
};

// Çiftçinin tekliflerini getirme
exports.getFarmerOffers = async (req, res) => {
  try {
    const farmerId = req.user.farmerId;
    
    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: 'Bu işlemi yapabilmek için çiftçi hesabınız olmalıdır'
      });
    }
    
    const offers = await Offer.find({ farmer: farmerId })
      .populate({
        path: 'request',
        populate: {
          path: 'company',
          select: 'companyName'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Çiftçi teklifleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Teklifler getirilirken bir hata oluştu'
    });
  }
}; 