import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../utils/networkUtils';

// API URL - Dinamik olarak server IP'sini alıyoruz
const API_URL = getApiBaseUrl();

// Token ile istek gönderme yardımcı fonksiyonu
const fetchWithToken = async (endpoint, options = {}) => {
  try {
    const userData = await AsyncStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const token = user ? user.token : null;

    // Her istekte güncel API URL'ini al - IP değişikliklerini yakalamak için
    const currentApiUrl = getApiBaseUrl();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${currentApiUrl}${endpoint}`, {
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
  // Tüm ürünleri getir (sadece onaylı ürünler)
  getAllProducts: async () => {
    return fetchWithToken('/products?approvalStatus=approved', { method: 'GET' });
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

  // Öne çıkan ürünleri getir
  getFeaturedProducts: async (limit = 10) => {
    try {
      // Öne çıkan ürünleri sorgulamak için API endpoint'i
      // Sunucu tarafında isFeatured=true filtreleme yapar
      // Limit parametresi ile kaç ürün döneceğini belirleyebiliriz
      const response = await fetchWithToken(`/products?isFeatured=true&approvalStatus=approved&limit=${limit}`, { 
        method: 'GET' 
      });
      
      console.log('Öne çıkan ürünler yanıt:', response);
      
      // API yanıtını kontrol et ve uygun formata dönüştür
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      } else if (response && Array.isArray(response)) {
        return response;
      } else if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Beklenmeyen öne çıkan ürünler API yanıt formatı:', response);
        // Hata durumunda boş dizi döndür
        return [];
      }
    } catch (error) {
      console.error('Öne çıkan ürünler yükleme hatası:', error);
      // Hata durumunda boş dizi döndür
      return [];
    }
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
      console.log('Kategoriler getiriliyor:', `${API_URL}/categories?limit=1000`);
      
      const response = await fetch(`${API_URL}/categories?limit=1000`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Önce tam yanıtı text olarak al ve logla
      const responseText = await response.text();
      console.log('Ham kategori API yanıtı:', responseText);
      
      // Yanıt boşsa veya geçersizse
      if (!responseText || responseText.trim() === '') {
        console.error('Kategori API boş yanıt döndü');
        return {
          success: false,
          message: 'API boş yanıt döndü',
          data: getDefaultCategories()
        };
      }
      
      try {
        // JSON parse et
        const data = JSON.parse(responseText);
        console.log('Ayrıştırılmış kategori API yanıtı:', data);
        
        // API yanıt formatını kontrol et
        if (data.success && Array.isArray(data.data)) {
          // Web API formatında yanıt (standart)
          console.log(`${data.data.length} kategori başarıyla yüklendi`);
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
        else if (data.data && Array.isArray(data.data.data)) {
          // İç içe data yapısı
          console.log(`${data.data.data.length} kategori başarıyla yüklendi (iç içe)`);
          return {
            success: true,
            message: 'Kategoriler başarıyla yüklendi',
            data: data.data.data
          };
        }
        else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          // Data bir object ise (pagination durumu)
          if (data.data.docs && Array.isArray(data.data.docs)) {
            console.log(`${data.data.docs.length} kategori başarıyla yüklendi (pagination)`);
            return {
              success: true,
              message: 'Kategoriler başarıyla yüklendi',
              data: data.data.docs
            };
          }
        }
        
        // Hiçbir format eşleşmezse
        console.warn('Beklenmeyen API yanıt formatı, veritabanından kategori çekilemedi:', data);
        return {
          success: true,
          message: 'Kategoriler veritabanından çekilemedi, varsayılan veriler kullanılıyor',
          data: getDefaultCategories(),
          isDefault: true
        };
      } catch (jsonError) {
        console.error('JSON parse hatası, veritabanından kategori çekilemedi:', jsonError);
        return {
          success: false,
          message: 'JSON parse hatası',
          data: getDefaultCategories(),
          isDefault: true
        };
      }
    } catch (error) {
      console.error('Kategori yükleme hatası, veritabanından kategori çekilemedi:', error);
      
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
      name: 'Sebze', 
      category_name: 'Sebze',
      slug: 'sebze',
      description: 'Taze sebzeler',
      isActive: true
    },
    { 
      _id: '2', 
      name: 'Meyve', 
      category_name: 'Meyve',
      slug: 'meyve',
      description: 'Taze meyveler',
      isActive: true
    },
    { 
      _id: '3', 
      name: 'Tahıl', 
      category_name: 'Tahıl',
      slug: 'tahil',
      description: 'Tahıl ürünleri',
      isActive: true
    },
    { 
      _id: '4', 
      name: 'Süt Ürünleri', 
      category_name: 'Süt Ürünleri',
      slug: 'sut-urunleri',
      description: 'Organik süt ürünleri',
      isActive: true
    },
    { 
      _id: '5', 
      name: 'Et Ürünleri', 
      category_name: 'Et Ürünleri',
      slug: 'et-urunleri',
      description: 'Doğal beslenmiş hayvanlardan et ürünleri',
      isActive: true
    },
    { 
      _id: '6', 
      name: 'Bal ve Arıcılık', 
      category_name: 'Bal ve Arıcılık',
      slug: 'bal-aricilik',
      description: 'Arıcılık ürünleri',
      isActive: true
    },
    { 
      _id: '7', 
      name: 'Organik Tarım', 
      category_name: 'Organik Tarım',
      slug: 'organik-tarim',
      description: 'Organik sertifikalı ürünler',
      isActive: true
    },
    { 
      _id: '8', 
      name: 'Kuru Gıda', 
      category_name: 'Kuru Gıda',
      slug: 'kuru-gida',
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