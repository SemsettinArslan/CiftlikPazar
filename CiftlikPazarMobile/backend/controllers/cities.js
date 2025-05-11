const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const City = require('../models/City');

// @desc    Tüm şehirleri getir
// @route   GET /api/cities
// @access  Public
exports.getCities = asyncHandler(async (req, res, next) => {
  let query;

  // Sadece aktif şehirleri getir
  if (req.query.active === 'true') {
    query = City.find({ isActive: true });
  } else {
    query = City.find();
  }

  // Şehirleri alfabetik sıraya göre sırala
  query = query.sort('name');

  const cities = await query;

  res.status(200).json({
    success: true,
    count: cities.length,
    data: cities
  });
});

// @desc    Kayıt/Adres formu için basitleştirilmiş şehir listesi getir
// @route   GET /api/cities/list
// @access  Public
exports.getCitiesList = asyncHandler(async (req, res, next) => {
  // Sadece aktif şehirleri bul ve name ve _id alanlarını seç
  const cities = await City.find({ isActive: true }).select('name').sort('name');

  res.status(200).json({
    success: true,
    count: cities.length,
    data: cities
  });
});

// @desc    Bir şehrin ilçelerini getir
// @route   GET /api/cities/:id/districts
// @access  Public
exports.getCityDistricts = asyncHandler(async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return next(
        new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
      );
    }

    // İlçe listesinin varlığını ve diziliş yapısını kontrol et
    let districts = [];
    
    if (city.districts && Array.isArray(city.districts)) {
      // İlçeleri alfabetik sıraya göre güvenli şekilde sırala
      districts = city.districts.filter(d => d && d.name)  // Null veya name özelliği olmayan öğeleri filtrele
                          .sort((a, b) => {
                            if (!a || !a.name) return 1;
                            if (!b || !b.name) return -1;
                            return a.name.localeCompare(b.name);
                          });
    }

    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (error) {
    next(new ErrorResponse(`İlçe sorgusu sırasında hata: ${error.message}`, 500));
  }
});

// @desc    Şehir adına göre ilçeleri getir
// @route   GET /api/cities/name/:cityName/districts
// @access  Public
exports.getDistrictsByCityName = asyncHandler(async (req, res, next) => {
  try {
    const city = await City.findOne({ name: req.params.cityName });

    if (!city) {
      return next(
        new ErrorResponse(`${req.params.cityName} adlı şehir bulunamadı`, 404)
      );
    }

    // İlçe listesinin varlığını ve diziliş yapısını kontrol et
    let districts = [];
    
    if (city.districts && Array.isArray(city.districts)) {
      // İlçeleri alfabetik sıraya göre güvenli şekilde sırala
      districts = city.districts.filter(d => d && d.name)  // Null veya name özelliği olmayan öğeleri filtrele
                          .sort((a, b) => {
                            if (!a || !a.name) return 1;
                            if (!b || !b.name) return -1;
                            return a.name.localeCompare(b.name);
                          });
    }

    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (error) {
    next(new ErrorResponse(`İlçe sorgusu sırasında hata: ${error.message}`, 500));
  }
});

// @desc    Tek şehir getir
// @route   GET /api/cities/:id
// @access  Public
exports.getCity = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: city
  });
});

// @desc    Şehir ekle
// @route   POST /api/cities
// @access  Private (Admin)
exports.createCity = asyncHandler(async (req, res, next) => {
  const city = await City.create(req.body);

  res.status(201).json({
    success: true,
    data: city
  });
});

// @desc    Şehir güncelle
// @route   PUT /api/cities/:id
// @access  Private (Admin)
exports.updateCity = asyncHandler(async (req, res, next) => {
  let city = await City.findById(req.params.id);

  if (!city) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
    );
  }

  city = await City.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: city
  });
});

// @desc    Şehir sil
// @route   DELETE /api/cities/:id
// @access  Private (Admin)
exports.deleteCity = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
    );
  }

  await city.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Şehre ilçe ekle
// @route   POST /api/cities/:id/districts
// @access  Private (Admin)
exports.addDistrict = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
    );
  }

  // İlçeyi ekle
  city.districts.push(req.body);
  await city.save();

  res.status(201).json({
    success: true,
    data: city
  });
});

// @desc    Şehirden ilçe sil
// @route   DELETE /api/cities/:id/districts/:districtId
// @access  Private (Admin)
exports.deleteDistrict = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return next(
      new ErrorResponse(`${req.params.id} ID'li şehir bulunamadı`, 404)
    );
  }

  // İlçeyi bul
  const district = city.districts.id(req.params.districtId);

  if (!district) {
    return next(
      new ErrorResponse(`${req.params.districtId} ID'li ilçe bulunamadı`, 404)
    );
  }

  // İlçeyi sil
  district.remove();
  await city.save();

  res.status(200).json({
    success: true,
    data: city
  });
}); 