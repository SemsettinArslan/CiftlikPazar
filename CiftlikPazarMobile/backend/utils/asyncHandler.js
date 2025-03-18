/**
 * Async functions için try/catch bloğu yazmayı engelleyen wrapper fonksiyon
 * Bu fonksiyon hataları next() fonksiyonu ile error handler middleware'ine iletir
 * @param {Function} fn - Asenkron controller fonksiyonu
 * @returns {Function} - Express middleware fonksiyonu
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 