const express = require('express');
const { getCities, getDistrictsByCity } = require('../controllers/city.controller');

const router = express.Router();

// Public routes
router.get('/', getCities);
router.get('/:cityId/districts', getDistrictsByCity);

module.exports = router; 