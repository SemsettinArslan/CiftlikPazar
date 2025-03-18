import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL
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
    return fetchWithToken('/categories', { method: 'GET' });
  },
};

export default {
  userAPI,
  productAPI,
  orderAPI,
  categoryAPI,
}; 