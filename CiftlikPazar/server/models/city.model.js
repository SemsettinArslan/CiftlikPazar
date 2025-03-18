const mongoose = require('mongoose');

// Cities koleksiyonu için şema 
const CitySchema = new mongoose.Schema({
  cityid: {
    type: Number,
    required: true,
    unique: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  districts: {
    type: [String],
    required: true
  }
});

module.exports = mongoose.model('City', CitySchema, 'cities'); 