const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log hatayı geliştirme ortamında
  if (process.env.NODE_ENV === 'development') {
    console.log(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Kaynak bulunamadı`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Bu bilgilere sahip kayıt zaten mevcut';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Sunucu hatası'
  });
};

module.exports = errorHandler; 