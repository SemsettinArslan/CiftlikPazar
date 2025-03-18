const City = require('../models/city.model');

// @desc    Tüm illeri getir
// @route   GET /api/cities
// @access  Public
exports.getCities = async (req, res) => {
  try {
    const cities = await City.find().select('cityid city').sort('city');
    
    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    console.error('İller getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İller getirilemedi'
    });
  }
};

// @desc    Bir ilin ilçelerini getir
// @route   GET /api/cities/:cityId/districts
// @access  Public
exports.getDistrictsByCity = async (req, res) => {
  try {
    const city = await City.findOne({ cityid: req.params.cityId });
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'İl bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: city.districts
    });
  } catch (error) {
    console.error('İlçeler getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İlçeler getirilemedi'
    });
  }
}; 