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

export default function CompanySettingsScreen() {
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
  
  // Firma bilgileri formu state'i
  const [formData, setFormData] = useState({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    city: '',
    district: '',
    contactPerson: {
      name: '',
      position: '',
      phone: '',
      email: ''
    }
  });
  
  // Normal kullanıcı ise ana sayfaya yönlendir
  useEffect(() => {
    if (user && user.data && user.data.role !== 'company') {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  // Firma olmayan kullanıcıları yönlendir
  if (user && user.data && user.data.role !== 'company') {
    return null;
  }
  
  // Firma bilgilerini çek
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        
        if (!token) {
          setError('Oturum bilgisi bulunamadı');
          setIsLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/companies/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.data) {
          const companyData = response.data.data;
          console.log('Firma verileri:', JSON.stringify(companyData, null, 2));
          
          // Form verilerini doldur
          setFormData({
            companyName: companyData.companyName || '',
            taxNumber: companyData.taxNumber || '',
            taxOffice: companyData.taxOffice || '',
            address: companyData.address || '',
            city: companyData.city || '',
            district: companyData.district || '',
            contactPerson: {
              name: companyData.contactPerson?.name || '',
              position: companyData.contactPerson?.position || '',
              phone: companyData.contactPerson?.phone || '',
              email: companyData.contactPerson?.email || ''
            }
          });
        }
      } catch (error: any) {
        console.error('Firma bilgileri çekilirken hata oluştu:', error);
        console.error('Hata detayları:', error.response?.status, error.response?.data);
        setError('Firma bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.data && user.data._id) {
      fetchCompanyData();
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
      if (!formData.city || cities.length === 0) {
        setDistricts([]);
        return;
      }

      try {
        setLoadingDistricts(true);
        console.log('Aradığımız şehir adı:', formData.city);
        
        // Şehir karşılaştırmasını esnek yapıyoruz
        const selectedCity = cities.find(c => 
          (c.city && c.city.toLowerCase() === formData.city.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === formData.city.toLowerCase())
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
        const districtExists = districtNames.some(d => d === formData.district);
        if (!districtExists) {
          setFormData(prev => ({ ...prev, district: '' }));
        }
        return;
      }
      
      // Eğer şehir nesnesinde districts yoksa, API isteği yap
      const fetchDistrictsFromAPI = async (cityObj: CityType) => {
        try {
          const cityId = cityObj._id;
          const response = await axios.get(`${API_URL}/cities/${cityId}/districts`);
          console.log('API\'den ilçeler alındı:', response.data);
          
          if (response.data.success && response.data.data) {
            setDistricts(response.data.data);
          } else {
            setDistricts([]);
          }
        } catch (err) {
          console.error('İlçeler API\'den alınırken hata:', err);
          setDistricts([]);
        }
      };
      
      fetchDistrictsFromAPI(cityObj);
    };

    loadDistricts();
  }, [formData.city, cities]);
  
  // Form değişikliklerini işle
  const handleChange = (name: string, value: string) => {
    // Nokta içeren isimler için (nested objects)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as Record<string, any>,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // İl değiştiğinde ilçeyi sıfırla
      if (name === 'city') {
        setFormData(prevState => ({
          ...prevState,
          district: ''
        }));
      }
    }
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
  
  // Firma bilgilerini güncelle
  const updateCompanyInfo = async () => {
    // Form doğrulama
    if (!formData.companyName) {
      setError('Firma adı zorunludur');
      return;
    }
    
    if (!formData.taxNumber) {
      setError('Vergi numarası zorunludur');
      return;
    }
    
    if (!formData.taxOffice) {
      setError('Vergi dairesi zorunludur');
      return;
    }
    
    if (!formData.city) {
      setError('Şehir seçimi zorunludur');
      return;
    }
    
    if (!formData.district) {
      setError('İlçe seçimi zorunludur');
      return;
    }
    
    if (!formData.address) {
      setError('Adres zorunludur');
      return;
    }
    
    if (!formData.contactPerson.name) {
      setError('İletişim kişisi adı zorunludur');
      return;
    }
    
    if (!formData.contactPerson.phone) {
      setError('Telefon numarası zorunludur');
      return;
    }
    
    if (!formData.contactPerson.email) {
      setError('E-posta adresi zorunludur');
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
      
      // API'ye gönderilecek veriler
      const apiData = {
        ...formData
      };
      
      console.log('Gönderilen firma verileri:', JSON.stringify(apiData, null, 2));
      
      const response = await axios.put(
        `${API_URL}/companies/update`,
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
        
        setSuccess('Firma bilgileri başarıyla güncellendi');
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Firma bilgileri güncellenirken bir hata oluştu');
      }
    } catch (err: unknown) {
      console.error('Firma bilgileri güncelleme hatası:', err);
      let errorMessage = 'Firma bilgileri güncellenirken bir hata oluştu';
      
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
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Firma Bilgileri',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#1976D2',
          },
        }}
      />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Kısa Açıklama */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#1976D2" />
          <Text style={styles.infoText}>
            Firmanızla ilgili temel bilgileri güncelleyebilirsiniz. Bu bilgiler çiftçilere ve müşterilere gösterilecektir.
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
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Bilgiler yükleniyor...</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Firma Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="business" size={16} color="#1976D2" /> Firma Adı
              </Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(value) => handleChange('companyName', value)}
                placeholder="Firma adını giriniz"
                placeholderTextColor="#aaa"
              />
            </View>
            
            {/* Vergi Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="document-text-outline" size={16} color="#1976D2" /> Vergi Numarası
              </Text>
              <TextInput
                style={styles.input}
                value={formData.taxNumber}
                onChangeText={(value) => handleChange('taxNumber', value)}
                placeholder="Vergi numarasını giriniz"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
            
            {/* Vergi Dairesi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="business-outline" size={16} color="#1976D2" /> Vergi Dairesi
              </Text>
              <TextInput
                style={styles.input}
                value={formData.taxOffice}
                onChangeText={(value) => handleChange('taxOffice', value)}
                placeholder="Vergi dairesi adını giriniz"
                placeholderTextColor="#aaa"
              />
            </View>
            
            {/* Şehir */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location-outline" size={16} color="#1976D2" /> Şehir
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.city}
                  onValueChange={(value) => handleChange('city', value)}
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
                <Ionicons name="navigate-outline" size={16} color="#1976D2" /> İlçe
              </Text>
              <View style={styles.pickerContainer}>
                {loadingDistricts ? (
                  <View style={styles.loadingContainerInline}>
                    <Text style={styles.loadingText}>İlçeler yükleniyor...</Text>
                    <ActivityIndicator size="small" color="#1976D2" />
                  </View>
                ) : (
                  <Picker
                    selectedValue={formData.district}
                    onValueChange={(value) => handleChange('district', value)}
                    style={styles.picker}
                    enabled={formData.city !== '' && districts.length > 0}
                  >
                    <Picker.Item label={districts.length === 0 ? "Önce İl Seçiniz" : "İlçe Seçiniz"} value="" />
                    {districts.map((district, index) => (
                      <Picker.Item key={index} label={district} value={district} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>
            
            {/* Firma Adresi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location" size={16} color="#1976D2" /> Firma Adresi
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
                placeholder="Firma adresini giriniz"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* İletişim Kişisi Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person" size={16} color="#1976D2" /> İletişim Kişisi Adı
              </Text>
              <TextInput
                style={styles.input}
                value={formData.contactPerson.name}
                onChangeText={(value) => handleChange('contactPerson.name', value)}
                placeholder="İletişim kişisinin adını giriniz"
                placeholderTextColor="#aaa"
              />
            </View>
            
            {/* Pozisyon */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="briefcase-outline" size={16} color="#1976D2" /> Pozisyon
              </Text>
              <TextInput
                style={styles.input}
                value={formData.contactPerson.position}
                onChangeText={(value) => handleChange('contactPerson.position', value)}
                placeholder="İletişim kişisinin pozisyonunu giriniz"
                placeholderTextColor="#aaa"
              />
            </View>
            
            {/* Telefon Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="call" size={16} color="#1976D2" /> Telefon Numarası
              </Text>
              <TextInput
                style={styles.input}
                value={formData.contactPerson.phone}
                onChangeText={(value) => handleChange('contactPerson.phone', value)}
                placeholder="Telefon numarasını giriniz"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
            
            {/* E-posta Adresi */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="mail" size={16} color="#1976D2" /> E-posta Adresi
              </Text>
              <TextInput
                style={styles.input}
                value={formData.contactPerson.email}
                onChangeText={(value) => handleChange('contactPerson.email', value)}
                placeholder="E-posta adresini giriniz"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            {/* Kaydet Butonu */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={updateCompanyInfo}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Firma Bilgilerini Güncelle</Text>
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
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    color: '#333',
    flex: 1,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  successText: {
    marginLeft: 8,
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 