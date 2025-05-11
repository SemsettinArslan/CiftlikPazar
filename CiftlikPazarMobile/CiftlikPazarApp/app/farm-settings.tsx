import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiBaseUrl } from '../src/utils/networkUtils';

// Sabit API URL yerine dinamik API URL
const API_URL = getApiBaseUrl();

// Şehir tipi tanımı
interface CityType {
  _id: string;
  cityid?: string | number;
  city: string;
  name?: string; // Alternatif şehir adı
  districts?: {
    _id: string;
    [key: string]: string;
  }[];
}

export default function FarmSettingsScreen() {
  const { user, logout, refreshUserData } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Şehir ve ilçeler için state
  const [cities, setCities] = useState<CityType[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  
  // Çiftlik bilgileri formu state'i
  const [formData, setFormData] = useState({
    farmName: '',
    farmAddress: '',
    farmDescription: '',
    farmPhone: user?.data?.phone || '',
    farmCity: '',
    farmDistrict: '',
    farmTaxNumber: '',
    farmCategories: [],
    shipsWithCargo: false,
  });
  
  // Form kategori değişimi için
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // API'den gelen kategori tipi tanımı
  interface Category {
    _id: string;
    id?: string;
    name?: string;
    category_name?: string; // API'den gelen asıl kategori adı alanı
    description?: string;
    subcategory?: Array<{
      _id?: string;
      name: string;
    }>;
    isActive?: boolean;
  }
  
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
  // Normal kullanıcı ise ana sayfaya yönlendir
  useEffect(() => {
    if (user && user.data && user.data.role !== 'farmer') {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  // Çiftçi olmayan kullanıcıları yönlendir
  if (user && user.data && user.data.role !== 'farmer') {
    return null;
  }
  
  // Çiftlik bilgilerini çek
  useEffect(() => {
    const fetchFarmerData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        
        if (!token) {
          setError('Oturum bilgisi bulunamadı');
          setIsLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/farmers/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.data) {
          const farmerData = response.data.data;
          console.log('Çiftlik verileri:', JSON.stringify(farmerData, null, 2));
          
          // Veri yapısı daha esnek hale getirelim - hem name hem de farmName kontrol edelim
          const farmNameValue = farmerData.farmName || farmerData.name || '';
          console.log('Çiftlik adı:', farmNameValue);
          
          setFormData({
            farmName: farmNameValue,
            farmAddress: farmerData.address || farmerData.farmAddress || '',
            farmDescription: farmerData.description || farmerData.farmDescription || '',
            farmPhone: farmerData.phoneNumber || farmerData.farmPhone || user?.data?.phone || '',
            farmCity: farmerData.city || farmerData.farmCity || '',
            farmDistrict: farmerData.district || farmerData.farmDistrict || '',
            farmTaxNumber: farmerData.taxNumber || farmerData.farmTaxNumber || '',
            farmCategories: farmerData.categories || farmerData.farmCategories || [],
            shipsWithCargo: farmerData.hasShipping || farmerData.shipsWithCargo || false,
          });
          
          // Hem categories hem de farmCategories kontrol et
          const categoryData = farmerData.categories || farmerData.farmCategories || [];
          console.log('Kategori verileri:', JSON.stringify(categoryData, null, 2));
          
          // Kategori ID'lerini çıkar
          const categoryIds = categoryData.map((cat: string | { _id?: string; id?: string }) => 
            typeof cat === 'string' ? cat : cat._id || cat.id || ''
          );
          console.log('Kategori ID listesi:', categoryIds);
          setSelectedCategories(categoryIds);
        }
      } catch (error) {
        console.error('Çiftlik bilgileri çekilirken hata oluştu:', error);
        setError('Çiftlik bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.data && user.data._id) {
      fetchFarmerData();
    }
  }, [user]);
  
  // İlleri yükle
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const response = await axios.get(`${API_URL}/cities`);
        console.log('İller yüklendi:', response.data.data.length);
        setCities(response.data.data);
      } catch (err) {
        console.error('İller yüklenirken hata:', err);
        setError('İller yüklenirken bir hata oluştu.');
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      // İl seçilmemişse veya iller henüz yüklenmemişse işlemi yapma
      if (!formData.farmCity || cities.length === 0) {
        setDistricts([]);
        return;
      }

      try {
        setLoadingDistricts(true);
        console.log('Aradığımız şehir adı:', formData.farmCity);
        
        // Şehir karşılaştırmasını esnek yapıyoruz
        const selectedCity = cities.find(c => 
          (c.city && c.city.toLowerCase() === formData.farmCity.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === formData.farmCity.toLowerCase())
        );
        
        console.log('Seçilen şehir:', selectedCity);
        
        if (!selectedCity) {
          console.log('Şehir bulunamadı');
          setDistricts([]);
          return;
        }
        
        // Bulunan şehir için ilçeleri yükle
        loadDistrictsForCity(selectedCity);
        
      } catch (err) {
        console.error('İlçeler yüklenirken hata:', err);
        setError('İlçeler yüklenirken bir hata oluştu.');
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    
    // Şehir nesnesinden ilçeleri yükleme fonksiyonu
    const loadDistrictsForCity = (cityObj: CityType) => {
      if (!cityObj) return;
      
      // Eğer şehrin districts dizisi varsa, doğrudan kullan
      if (cityObj.districts && cityObj.districts.length > 0) {
        console.log('Şehir nesnesinde ilçeler bulundu:', cityObj.districts.length);
        
        // İlçe isimlerini oluştur (karakter dizisini birleştir)
        const districtNames = cityObj.districts.map(district => {
          // _id dışındaki tüm anahtarları al (0, 1, 2, ...)
          const keys = Object.keys(district).filter(key => key !== '_id');
          // Anahtarları sırala ve her birindeki karakteri birleştir
          const name = keys.sort((a, b) => Number(a) - Number(b)).map(key => district[key]).join('');
          return name;
        });
        
        console.log('İlçe isimleri oluşturuldu:', districtNames);
        setDistricts(districtNames);
        
        // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
        const districtExists = districtNames.some(d => d === formData.farmDistrict);
        if (!districtExists) {
          setFormData(prev => ({ ...prev, farmDistrict: '' }));
        }
        return;
      }
      
      // Eğer şehir nesnesinde districts yoksa, API isteği yap
      const fetchDistrictsFromAPI = async (cityObj: CityType) => {
        try {
          const cityId = cityObj._id;
          const response = await axios.get(`${API_URL}/cities/${cityId}/districts`);
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            console.log('İlçeler API\'den yüklendi:', response.data.data.length);
            setDistricts(response.data.data);
            
            // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
            const districtExists = response.data.data.some((d: string) => d === formData.farmDistrict);
            if (!districtExists) {
              setFormData(prev => ({ ...prev, farmDistrict: '' }));
            }
          } else {
            console.warn('API\'den ilçe verisi boş veya geçersiz');
            setDistricts([]);
            setError('Bu il için ilçe bilgisi bulunamadı.');
          }
        } catch (err) {
          console.error('API\'den ilçe yükleme hatası:', err);
          setDistricts([]);
        }
      };
      
      fetchDistrictsFromAPI(cityObj);
    };

    // İller yüklendiğinde ilçeleri yükle
    if (cities.length > 0) {
      loadDistricts();
    }
  }, [formData.farmCity, cities]);
  
  // Kategorileri çek
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data.success) {
          console.log('Tüm kategoriler:', response.data.data);
          setAvailableCategories(response.data.data);
        }
      } catch (error) {
        console.error('Kategoriler çekilirken hata oluştu:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Form değişikliklerini izle
  const handleChange = (name: string, value: string | boolean | string[]) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Kategori seçimi/kaldırma
  const toggleCategory = (categoryId: string) => {
    const updatedCategories = [...selectedCategories];
    
    if (updatedCategories.includes(categoryId)) {
      const index = updatedCategories.indexOf(categoryId);
      updatedCategories.splice(index, 1);
    } else {
      updatedCategories.push(categoryId);
    }
    
    setSelectedCategories(updatedCategories);
    handleChange('farmCategories', updatedCategories);
  };
  
  // Token al
  const getToken = async () => {
    try {
      if (user && user.token) {
        return user.token;
      }
      
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  };
  
  // Çiftlik bilgilerini güncelle
  const updateFarmInfo = async () => {
    // Form doğrulama
    if (!formData.farmName) {
      setError('Çiftlik adı zorunludur');
      return;
    }
    
    if (!formData.farmCity) {
      setError('Şehir seçimi zorunludur');
      return;
    }
    
    if (!formData.farmDistrict) {
      setError('İlçe seçimi zorunludur');
      return;
    }
    
    if (!formData.farmAddress) {
      setError('Çiftlik adresi zorunludur');
      return;
    }
    
    if (!formData.farmPhone) {
      setError('Telefon numarası zorunludur');
      return;
    }
    
    if (!formData.farmTaxNumber) {
      setError('Vergi numarası zorunludur');
      return;
    }
    
    if (formData.farmCategories.length === 0) {
      setError('En az bir kategori seçilmelidir');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = await getToken();
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      // Verileri API'nin beklediği formata çevir
      const apiData = {
        farmName: formData.farmName,
        name: formData.farmName,
        address: formData.farmAddress,
        description: formData.farmDescription,
        phoneNumber: formData.farmPhone,
        city: formData.farmCity,
        district: formData.farmDistrict,
        taxNumber: formData.farmTaxNumber,
        categories: formData.farmCategories,
        hasShipping: formData.shipsWithCargo
      };
      
      console.log('Gönderilen çiftlik verileri:', JSON.stringify(apiData, null, 2));
      
      // Doğru endpointi kullan (farmers/me yerine auth/profile)
      const response = await axios.put(
        `${API_URL}/farmers/update-profile`,
        apiData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı verilerini güncelle
        await refreshUserData();
        
        setSuccess('Çiftlik bilgileri başarıyla güncellendi');
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Çiftlik bilgileri güncellenirken bir hata oluştu');
      }
    } catch (err: unknown) {
      console.error('Çiftlik bilgileri güncelleme hatası:', err);
      let errorMessage = 'Çiftlik bilgileri güncellenirken bir hata oluştu';
      
      // Axios hata yanıtı için tip kontrolü
      interface ErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorObj = err as ErrorResponse;
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Çiftlik Bilgileri',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Kısa Açıklama */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
          <Text style={styles.infoText}>
            Çiftliğinizle ilgili temel bilgileri güncelleyebilirsiniz. Bu bilgiler müşterilerinize gösterilecektir.
          </Text>
        </View>
        
        {/* Hata ve başarı mesajları */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Bilgiler yükleniyor...</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Çiftlik Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="business" size={16} color="#4CAF50" /> Çiftlik Adı
              </Text>
              <TextInput
                style={styles.input}
                value={formData.farmName}
                onChangeText={(value) => handleChange('farmName', value)}
                placeholder="Çiftlik adını giriniz"
                placeholderTextColor="#aaa"
              />
            </View>
            
            {/* Şehir */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location-outline" size={16} color="#4CAF50" /> Şehir
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.farmCity}
                  onValueChange={(value) => handleChange('farmCity', value)}
                  style={styles.picker}
                  enabled={!loadingCities}
                >
                  <Picker.Item label="İl Seçiniz" value="" />
                  {cities.map((city) => (
                    <Picker.Item 
                      key={city._id} 
                      label={city.city || city.name || ''} 
                      value={city.city || city.name || ''} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* İlçe */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="navigate-outline" size={16} color="#4CAF50" /> İlçe
              </Text>
              <View style={styles.pickerContainer}>
                {loadingDistricts ? (
                  <View style={styles.loadingContainerInline}>
                    <Text style={styles.loadingText}>İlçeler yükleniyor...</Text>
                    <ActivityIndicator size="small" color="#4CAF50" />
                  </View>
                ) : (
                  <Picker
                    selectedValue={formData.farmDistrict}
                    onValueChange={(value) => handleChange('farmDistrict', value)}
                    style={styles.picker}
                    enabled={formData.farmCity !== '' && districts.length > 0}
                  >
                    <Picker.Item label={districts.length === 0 ? "Önce İl Seçiniz" : "İlçe Seçiniz"} value="" />
                    {districts.map((district, index) => (
                      <Picker.Item key={index} label={district} value={district} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>
            
            {/* Çiftlik Adresi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location" size={16} color="#4CAF50" /> Çiftlik Adresi
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.farmAddress}
                onChangeText={(value) => handleChange('farmAddress', value)}
                placeholder="Çiftlik adresini giriniz"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Vergi Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="document-text-outline" size={16} color="#4CAF50" /> Vergi Numarası
              </Text>
              <TextInput
                style={styles.input}
                value={formData.farmTaxNumber}
                onChangeText={(value) => handleChange('farmTaxNumber', value)}
                placeholder="Vergi numarasını giriniz"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
              />
            </View>
            
            {/* Çiftlik Açıklaması */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="document-text" size={16} color="#4CAF50" /> Çiftlik Açıklaması
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.farmDescription}
                onChangeText={(value) => handleChange('farmDescription', value)}
                placeholder="Çiftliğiniz hakkında kısa bir açıklama giriniz"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Telefon Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="call" size={16} color="#4CAF50" /> Telefon Numarası
              </Text>
              <TextInput
                style={styles.input}
                value={formData.farmPhone}
                onChangeText={(value) => handleChange('farmPhone', value)}
                placeholder="Çiftlik telefon numarasını giriniz"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
              />
            </View>
            
            {/* Kategoriler */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="list" size={16} color="#4CAF50" /> Kategoriler
              </Text>
              <Text style={styles.helperText}>Çiftliğinizin üretim kategorilerini seçin</Text>
              
              {availableCategories.length > 0 ? (
                <View>
                  {availableCategories.map((category) => (
                    <View key={category._id} style={styles.categoryContainer}>
                      {/* Ana kategori switch'i */}
                      <View style={styles.checkboxContainer}>
                        <Switch
                          value={selectedCategories.includes(category._id) || selectedCategories.includes(category.id || '')}
                          onValueChange={(value) => toggleCategory(category._id || category.id || '')}
                          trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
                          thumbColor={selectedCategories.includes(category._id) || selectedCategories.includes(category.id || '') ? '#fff' : '#f4f3f4'}
                        />
                        <Text style={styles.categoryLabel}>
                          {category.category_name || category.name || ''}
                        </Text>
                      </View>
                      
                      {/* Alt kategoriler varsa göster */}
                      {selectedCategories.includes(category._id) && category.subcategory && category.subcategory.length > 0 && (
                        <View style={styles.subcategoriesContainer}>
                          {category.subcategory.map((subcat, index: number) => (
                            <Text key={index} style={styles.subcategoryText}>
                              • {subcat.name}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Kategori açıklaması */}
                      {category.description && (
                        <Text style={styles.categoryDescription}>
                          {category.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMessage}>Kategori bulunamadı. Lütfen daha sonra tekrar deneyin.</Text>
              )}
            </View>
            
            {/* Kargo ile Sipariş */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="car" size={16} color="#4CAF50" /> Kargo ile Sipariş
              </Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    formData.shipsWithCargo ? styles.toggleOptionSelected : null
                  ]}
                  onPress={() => handleChange('shipsWithCargo', true)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      formData.shipsWithCargo ? styles.toggleTextSelected : null
                    ]}
                  >
                    Evet
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !formData.shipsWithCargo ? styles.toggleOptionSelected : null
                  ]}
                  onPress={() => handleChange('shipsWithCargo', false)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !formData.shipsWithCargo ? styles.toggleTextSelected : null
                    ]}
                  >
                    Hayır
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Kaydet Butonu */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={updateFarmInfo}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Çiftlik Bilgilerini Güncelle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#2E7D32',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
  },
  subcategoriesContainer: {
    marginLeft: 35,
    marginTop: 5,
    paddingLeft: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#4CAF50',
  },
  subcategoryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 35,
    marginTop: 5
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  toggleOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  toggleTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 