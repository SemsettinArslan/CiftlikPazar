const express = require('express');
const {
  getCities,
  getCitiesList,
  getCity,
  getCityDistricts,
  getDistrictsByCityName,
  createCity,
  updateCity,
  deleteCity,
  addDistrict,
  deleteDistrict
} = require('../controllers/cities');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Basit şehir listesi route'u (kayıt/adres formu için)
router.get('/list', getCitiesList);

// Şehir adına göre ilçeleri getir
router.get('/name/:cityName/districts', getDistrictsByCityName);

// İlçe route'ları
router
  .route('/:id/districts')
  .get(getCityDistricts)
  .post(protect, authorize('admin'), addDistrict);

router
  .route('/:id/districts/:districtId')
  .delete(protect, authorize('admin'), deleteDistrict);

// Şehir route'ları
router
  .route('/')
  .get(getCities)
  .post(protect, authorize('admin'), createCity);

router
  .route('/:id')
  .get(getCity)
  .put(protect, authorize('admin'), updateCity)
  .delete(protect, authorize('admin'), deleteCity);

module.exports = router; 