import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL
// Daha güvenilir olması için IP adresini kullanıyoruz, localhost bazen çalışmıyor
const API_URL = 'http://192.168.43.11:5000/api';

// Token ile istek gönderme yardımcı fonksiyonu
const fetchWithToken = async (endpoint, options = {}) => {
  try {
    const userData = await AsyncStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const token = user ? user.token : null;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Bir hata oluştu');
    }

    return data;
  } catch (error) {
    console.error('API isteği hatası:', error);
    throw error;
  }
};

// Kullanıcı API'leri
export const userAPI = {
  // Kullanıcı bilgilerini getir
  getProfile: async () => {
    return fetchWithToken('/users/profile', { method: 'GET' });
  },

  // Kullanıcı bilgilerini güncelle
  updateProfile: async (userData) => {
    return fetchWithToken('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Adres ekle
  addAddress: async (addressData) => {
    return fetchWithToken('/users/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  // Adresleri getir
  getAddresses: async () => {
    return fetchWithToken('/users/addresses', { method: 'GET' });
  },
};

// Ürün API'leri
export const productAPI = {
  // Tüm ürünleri getir
  getAllProducts: async () => {
    return fetchWithToken('/products', { method: 'GET' });
  },

  // Ürün detaylarını getir
  getProductDetails: async (productId) => {
    return fetchWithToken(`/products/${productId}`, { method: 'GET' });
  },

  // Kategoriye göre ürünleri getir
  getProductsByCategory: async (categoryId) => {
    return fetchWithToken(`/products/category/${categoryId}`, { method: 'GET' });
  },

  // Ürün ara
  searchProducts: async (query) => {
    return fetchWithToken(`/products/search?q=${query}`, { method: 'GET' });
  },
};

// Sipariş API'leri
export const orderAPI = {
  // Sipariş oluştur
  createOrder: async (orderData) => {
    return fetchWithToken('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Siparişleri getir
  getOrders: async () => {
    return fetchWithToken('/orders', { method: 'GET' });
  },

  // Sipariş detaylarını getir
  getOrderDetails: async (orderId) => {
    return fetchWithToken(`/orders/${orderId}`, { method: 'GET' });
  },
};

// Kategori API'leri
export const categoryAPI = {
  // Tüm kategorileri getir
  getAllCategories: async () => {
    try {
      console.log('Kategoriler getiriliyor:', `${API_URL}/categories`);
      
      const response = await fetch(`${API_URL}/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Sunucu yanıtını kontrol et
      if (!response.ok) {
        console.error('Kategori API hatası:', response.status, response.statusText);
        return {
          success: false,
          message: `Kategori API hatası: ${response.status} ${response.statusText}`,
          data: getDefaultCategories()
        };
      }
      
      const data = await response.json();
      
      // API yanıt formatını kontrol et
      if (data.success && Array.isArray(data.data)) {
        // Web API formatında yanıt
        console.log(`${data.data.length} kategori başarıyla yüklendi`);
        
        // Web formatlı kategori verisini dön
        return {
          success: true,
          message: 'Kategoriler başarıyla yüklendi',
          data: data.data
        };
      } 
      else if (Array.isArray(data)) {
        // Doğrudan dizi olarak yanıt
        console.log(`${data.length} kategori başarıyla yüklendi (dizi)`);
        return {
          success: true,
          message: 'Kategoriler başarıyla yüklendi',
          data: data
        };
      } 
      else {
        // API yanıt formatı beklenenden farklı, varsayılan verileri kullan
        console.warn('Beklenmeyen API yanıt formatı, varsayılan kategoriler kullanılıyor');
        return {
          success: true,
          message: 'Beklenmeyen API yanıt formatı, varsayılan kategoriler kullanılıyor',
          data: getDefaultCategories(),
          isDefault: true
        };
      }
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
      
      // Hata durumunda varsayılan kategorileri döndür
      return {
        success: true, // Kullanıcı deneyimi için true döndürüyoruz
        message: 'Kategoriler yüklenirken bir hata oluştu, varsayılan veriler kullanılıyor',
        data: getDefaultCategories(),
        isDefault: true
      };
    }
  },
  
  // Kategori detaylarını getir
  getCategoryById: async (categoryId) => {
    if (!categoryId) {
      console.error('Kategori ID belirtilmedi');
      return {
        success: false,
        message: 'Kategori ID belirtilmedi',
        data: null
      };
    }
    
    try {
      console.log('Kategori detayları getiriliyor:', `${API_URL}/categories/${categoryId}`);
      
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Sunucu yanıtını kontrol et
      if (!response.ok) {
        console.error('Kategori detay API hatası:', response.status, response.statusText);
        return {
          success: false,
          message: `Kategori detay API hatası: ${response.status} ${response.statusText}`,
          data: null
        };
      }
      
      const data = await response.json();
      
      // API yanıt formatını kontrol et
      if (data.success && data.data) {
        // Web API formatında yanıt
        console.log('Kategori detayları başarıyla yüklendi');
        return {
          success: true,
          message: 'Kategori detayları başarıyla yüklendi',
          data: data.data
        };
      } 
      else {
        // API yanıt formatı beklenenden farklı
        console.warn('Beklenmeyen API yanıt formatı (kategori detay)');
        return {
          success: false,
          message: 'Beklenmeyen API yanıt formatı (kategori detay)',
          data: null
        };
      }
    } catch (error) {
      console.error('Kategori detay yükleme hatası:', error);
      return {
        success: false,
        message: 'Kategori detayları yüklenirken bir hata oluştu',
        data: null
      };
    }
  },
  
  // Kategoriye göre ürünleri getir
  getProductsByCategory: async (categoryId) => {
    if (!categoryId) {
      return {
        success: false,
        message: 'Kategori ID belirtilmedi',
        data: []
      };
    }
    
    try {
      console.log('Kategoriye göre ürünler getiriliyor:', `${API_URL}/products/category/${categoryId}`);
      
      const response = await fetch(`${API_URL}/products/category/${categoryId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Sunucu yanıtını kontrol et
      if (!response.ok) {
        console.error('Ürün listesi API hatası:', response.status, response.statusText);
        return {
          success: false,
          message: 'Ürünler yüklenirken bir hata oluştu',
          data: []
        };
      }
      
      const data = await response.json();
      
      // API yanıt formatını kontrol et
      if (data.success && Array.isArray(data.data)) {
        // Web API formatında yanıt
        console.log(`${data.data.length} ürün başarıyla yüklendi`);
        return {
          success: true,
          message: 'Ürünler başarıyla yüklendi',
          data: data.data
        };
      } 
      else if (Array.isArray(data)) {
        // Doğrudan dizi olarak yanıt
        console.log(`${data.length} ürün başarıyla yüklendi (dizi)`);
        return {
          success: true,
          message: 'Ürünler başarıyla yüklendi',
          data: data
        };
      } 
      else {
        // API yanıt formatı beklenenden farklı
        console.warn('Beklenmeyen API yanıt formatı (ürün listesi)');
        return {
          success: false,
          message: 'Beklenmeyen API yanıt formatı (ürün listesi)',
          data: []
        };
      }
    } catch (error) {
      console.error('Ürün listesi yükleme hatası:', error);
      return {
        success: false,
        message: 'Ürünler yüklenirken bir hata oluştu',
        data: []
      };
    }
  }
};

// İl/İlçe API'leri
export const cityAPI = {
  // Tüm illeri getir
  getAllCities: async () => {
    try {
      console.log('Fetching cities from:', `${API_URL}/cities`);
      const response = await fetch(`${API_URL}/cities`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Önce response'u text olarak al
      const responseText = await response.text();
      
      try {
        // HTML içeriyor mu kontrol et (hata sayfası olabilir)
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE html')) {
          console.error('Cities API returned HTML instead of JSON');
          return { success: false, message: 'Sunucu HTML döndürdü, API çalışmıyor olabilir' };
        }
        
        // JSON'a çevir
        const data = JSON.parse(responseText);
        
        console.log('Cities fetch response:', data);
        return data;
      } catch (jsonError) {
        console.error('JSON parse error for cities:', jsonError);
        console.error('Raw API Response:', responseText.substring(0, 200) + '...');
        return { success: false, message: 'JSON parse hatası' };
      }
    } catch (error) {
      console.error('İl getirme hatası:', error);
      throw error;
    }
  },
  
  // İlçeleri getir
  getDistricts: async (cityId) => {
    try {
      console.log('Fetching districts from:', `${API_URL}/cities/${cityId}/districts`);
      const response = await fetch(`${API_URL}/cities/${cityId}/districts`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Önce response'u text olarak al
      const responseText = await response.text();
      
      try {
        // HTML içeriyor mu kontrol et (hata sayfası olabilir)
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE html')) {
          console.error('Districts API returned HTML instead of JSON');
          return { success: false, message: 'Sunucu HTML döndürdü, API çalışmıyor olabilir' };
        }
        
        // JSON'a çevir
        const data = JSON.parse(responseText);
        
        console.log('Districts fetch response:', data);
        return data;
      } catch (jsonError) {
        console.error('JSON parse error for districts:', jsonError);
        console.error('Raw API Response:', responseText.substring(0, 200) + '...');
        return { success: false, message: 'JSON parse hatası' };
      }
    } catch (error) {
      console.error('İlçe getirme hatası:', error);
      throw error;
    }
  }
};

// Varsayılan kategori verilerini döndüren yardımcı fonksiyon
function getDefaultCategories() {
  return [
    { 
      _id: '1', 
      category_name: 'Sebze', 
      subcategory: [
        { name: 'Domates', slug: 'domates' },
        { name: 'Biber', slug: 'biber' },
        { name: 'Patlıcan', slug: 'patlican' }
      ],
      description: 'Taze sebzeler',
      isActive: true
    },
    { 
      _id: '2', 
      category_name: 'Meyve', 
      subcategory: [
        { name: 'Elma', slug: 'elma' },
        { name: 'Armut', slug: 'armut' },
        { name: 'Çilek', slug: 'cilek' }
      ],
      description: 'Taze meyveler',
      isActive: true
    },
    { 
      _id: '3', 
      category_name: 'Tahıl', 
      subcategory: [
        { name: 'Buğday', slug: 'bugday' },
        { name: 'Arpa', slug: 'arpa' },
        { name: 'Çavdar', slug: 'cavdar' }
      ],
      description: 'Tahıl ürünleri',
      isActive: true
    },
    { 
      _id: '4', 
      category_name: 'Süt Ürünleri', 
      subcategory: [
        { name: 'Peynir', slug: 'peynir' },
        { name: 'Yoğurt', slug: 'yogurt' },
        { name: 'Tereyağı', slug: 'tereyagi' }
      ],
      description: 'Organik süt ürünleri',
      isActive: true
    },
    { 
      _id: '5', 
      category_name: 'Et Ürünleri', 
      subcategory: [
        { name: 'Dana Eti', slug: 'dana-eti' },
        { name: 'Tavuk', slug: 'tavuk' },
        { name: 'Kuzu Eti', slug: 'kuzu-eti' }
      ],
      description: 'Doğal beslenmiş hayvanlardan et ürünleri',
      isActive: true
    },
    { 
      _id: '6', 
      category_name: 'Bal ve Arıcılık', 
      subcategory: [
        { name: 'Çiçek Balı', slug: 'cicek-bali' },
        { name: 'Polen', slug: 'polen' },
        { name: 'Propolis', slug: 'propolis' }
      ],
      description: 'Arıcılık ürünleri',
      isActive: true
    },
    { 
      _id: '7', 
      category_name: 'Organik Tarım', 
      subcategory: [
        { name: 'Organik Sebze', slug: 'organik-sebze' },
        { name: 'Organik Meyve', slug: 'organik-meyve' },
        { name: 'Organik Bakliyat', slug: 'organik-bakliyat' }
      ],
      description: 'Organik sertifikalı ürünler',
      isActive: true
    },
    { 
      _id: '8', 
      category_name: 'Kuru Gıda', 
      subcategory: [
        { name: 'Bakliyat', slug: 'bakliyat' },
        { name: 'Kuruyemiş', slug: 'kuruyemis' },
        { name: 'Kuru Meyve', slug: 'kuru-meyve' }
      ],
      description: 'Kuru gıda ürünleri',
      isActive: true
    }
  ];
}

export default {
  userAPI,
  productAPI,
  orderAPI,
  categoryAPI,
  cityAPI,
}; 