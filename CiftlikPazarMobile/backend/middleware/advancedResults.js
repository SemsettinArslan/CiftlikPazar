/**
 * Gelişmiş sonuçlar middleware'i
 * Filtreleme, sıralama, sayfalama ve ilişkili verileri getirme özelliklerini sağlar
 * @param {Model} model - Mongoose model
 * @param {Array} populate - Populate edilecek alanlar
 * @returns {Function} - Express middleware fonksiyonu
 */
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // İstek parametrelerinin bir kopyasını oluştur
  const reqQuery = { ...req.query };

  // Özel alanları çıkar
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Arama parametresi varsa
  if (req.query.search) {
    const searchTerm = req.query.search;
    reqQuery.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  // Filtreleme için operatörleri ekle
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Sorguyu oluştur
  query = model.find(JSON.parse(queryStr));

  // Select alanları
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sıralama
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Sayfalama
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Populate
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(item => {
        query = query.populate(item);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Sorguyu çalıştır
  const results = await query;

  // Sayfalama sonuçlarını oluştur
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    total,
    data: results
  };

  next();
};

module.exports = advancedResults; 