/**
 * Async/await hata yakalama middleware'i
 * Bu middleware, async/await kullanılan controller fonksiyonlarında hata yakalamayı kolaylaştırır
 * Her controller fonksiyonu için ayrı try-catch blokları yazmak yerine bu middleware kullanılır
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 