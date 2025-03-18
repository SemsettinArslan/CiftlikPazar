const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Şehir adı gereklidir'],
    unique: true,
    trim: true,
    maxlength: [50, 'Şehir adı 50 karakterden uzun olamaz']
  },
  code: {
    type: String,
    trim: true,
    maxlength: [10, 'Şehir kodu 10 karakterden uzun olamaz']
  },
  districts: [{
    name: {
      type: String,
      required: [true, 'İlçe adı gereklidir'],
      trim: true
    },
    code: {
      type: String,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('City', CitySchema); 