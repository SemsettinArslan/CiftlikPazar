import axios from 'axios';

// Tüm kategorileri getiren ve id-isim eşleştirmesi için bir mapping oluşturan fonksiyon
let categoryMapping = null;
let fetchPromise = null;

export const fetchCategoryMapping = async () => {
  // Zaten bir istek yapılıyorsa, aynı isteği tekrar yapmamak için mevcut promise'i döndür
  if (fetchPromise) {
    return fetchPromise;
  }
  
  // Eğer mapping zaten varsa, onu döndür
  if (categoryMapping) {
    return categoryMapping;
  }
  
  // Yeni bir istek yap
  fetchPromise = new Promise(async (resolve) => {
    try {
      const response = await axios.get('http://localhost:3001/api/categories');
      
      // API yanıtının yapısına göre veriyi al
      const categories = response.data.data || response.data || [];
      
      // ID -> Name eşleştirme objesi oluştur
      const mapping = {};
      
      categories.forEach(category => {
        if (category._id) {
          // Kategori ismini al (name veya category_name alanından)
          const name = category.name || category.category_name || 'Kategori';
          mapping[category._id] = name;
        }
      });
      
      // Mapping'i kaydet ve döndür
      categoryMapping = mapping;
      resolve(mapping);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      // Hata durumunda boş bir mapping döndür
      resolve({});
    } finally {
      // İşlem tamamlandı, promise'i sıfırla
      fetchPromise = null;
    }
  });
  
  return fetchPromise;
};

// Kategori ID'sinden kategori adını getiren yardımcı fonksiyon
export const getCategoryNameById = async (categoryId) => {
  if (!categoryId) return 'Kategori';
  
  // Eğer kategori zaten bir obje ise, doğrudan ismini al
  if (typeof categoryId === 'object') {
    return categoryId.name || categoryId.category_name || 'Kategori';
  }
  
  // Kategori ID string ise, mapping'den bul
  const mapping = await fetchCategoryMapping();
  return mapping[categoryId] || 'Kategori';
}; 