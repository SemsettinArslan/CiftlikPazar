import axios from 'axios';

// Tüm illeri getir
export const getCities = async () => {
  try {
    const response = await axios.get('/api/cities');
    return response.data.data;
  } catch (error) {
    console.error('İller getirilirken hata:', error);
    throw error;
  }
};

// Bir ilin ilçelerini getir
export const getDistrictsByCityId = async (cityId) => {
  try {
    const response = await axios.get(`/api/cities/${cityId}/districts`);
    return response.data.data;
  } catch (error) {
    console.error('İlçeler getirilirken hata:', error);
    throw error;
  }
}; 