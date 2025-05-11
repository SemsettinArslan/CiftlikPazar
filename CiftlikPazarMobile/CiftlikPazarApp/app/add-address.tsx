import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../src/utils/networkUtils';

// Sabit API URL yerine dinamik API URL
const API_URL = getApiBaseUrl();

// Tip tanımlamaları
interface CityType {
  _id: string;
  cityid: string | number;
  city: string;
  districts?: {
    _id: string;
    [key: string]: string;
  }[];
}

export default function AddAddressScreen() {
  const { user, setUser, refreshUserData } = useAuth();
  const router = useRouter();
  
  // State tanımlamaları
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // İl ve ilçe state'leri
  const [cities, setCities] = useState<CityType[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Form state'i
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    isDefault: false
  });
  
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
        if (cities.length === 0 && formData.city) {
          console.log('İller henüz yüklenmedi, ilçe yükleme işlemi erteleniyor...');
        }
        setDistricts([]);
        return;
      }

      try {
        // Mevcut tüm şehirleri ve aranan şehir adını loglayalım
        console.log('Tüm şehir isimleri:', cities.map(c => c.city));
        console.log('Aradığımız şehir adı:', formData.city);
        
        // Şehir karşılaştırmasını daha esnek yapıyoruz
        // Büyük-küçük harf duyarlılığını kaldırarak karşılaştırma
        const selectedCity = cities.find(c => 
          c.city.toLowerCase() === formData.city.toLowerCase() ||
          c.city.trim().toLowerCase() === formData.city.trim().toLowerCase()
        );
        
        console.log('Seçilen şehir:', selectedCity);
        
        // Eğer şehir bulunamadıysa, daha esnek arama yapalım
        if (!selectedCity) {
          console.log('Şehir tam eşleşme ile bulunamadı, kısmi eşleşme deneniyor...');
          
          // Şehir adının bir kısmı ile eşleşme arama
          const partialMatch = cities.find(c => 
            c.city.toLowerCase().includes(formData.city.toLowerCase()) ||
            formData.city.toLowerCase().includes(c.city.toLowerCase())
          );
          
          if (partialMatch) {
            console.log('Kısmi eşleşme bulundu:', partialMatch.city);
            // Bulunan şehri kullanarak ilçeleri yükle
            loadDistrictsForCity(partialMatch);
            return;
          } else {
            console.error('Hiçbir şehir eşleşmedi:', formData.city);
            setDistricts([]);
            setError(`"${formData.city}" için ilçe bilgisi bulunamadı.`);
            return;
          }
        }
        
        // Bulunan şehir için ilçeleri yükle
        loadDistrictsForCity(selectedCity);
        
      } catch (err: any) {
        console.error('İlçeler yüklenirken hata:', err);
        console.error('Hata detayı:', err.response?.data);
        
        setError('İlçeler yüklenirken bir hata oluştu.');
        setDistricts([]);
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
          const requestUrl = `${API_URL}/cities/${cityId}/districts`;
          console.log('İlçe API isteği URL:', requestUrl);
          
          const response = await axios.get(requestUrl);
          console.log('İlçe yanıtı:', response.data);
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            console.log('İlçeler API\'den yüklendi:', response.data.data.length);
            setDistricts(response.data.data);
            
            // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
            const districtExists = response.data.data.some((d: string) => d === formData.district);
            if (!districtExists) {
              setFormData(prev => ({ ...prev, district: '' }));
            }
          } else {
            console.warn('API\'den ilçe verisi boş veya geçersiz:', response.data);
            setDistricts([]);
            setError('Bu il için ilçe bilgisi bulunamadı.');
          }
        } catch (err: any) {
          console.error('API\'den ilçe yükleme hatası:', err);
          setError('İlçeler yüklenirken bir hata oluştu.');
          setDistricts([]);
        }
      };
      
      fetchDistrictsFromAPI(cityObj);
    };

    // İller yüklendiğinde ilçeleri yükle
    if (cities.length > 0) {
      loadDistricts();
    }
  }, [formData.city, cities]);
  
  // Form verilerini güncelle
  const handleChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Token'ı AsyncStorage'dan al veya user nesnesinden al
  const getToken = async () => {
    try {
      // Önce user nesnesinden token'ı almayı dene
      if (user && user.token) {
        return user.token;
      }
      
      // Yoksa AsyncStorage'dan almayı dene
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  };
  
  // Adres ekleme
  const handleSubmit = async () => {
    // Form doğrulama
    if (!formData.title) {
      setError('Adres başlığı zorunludur');
      return;
    }
    
    if (!formData.address) {
      setError('Adres alanı zorunludur');
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
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Token'ı al
      const token = await getToken();
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      console.log('Adres ekleme isteği gönderiliyor...');
      
      const response = await axios.post(
        `${API_URL}/auth/address`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Adres ekleme yanıtı:', response.data);
      
      if (response.data.success) {
        // Kullanıcı verilerini güncelle
        await refreshUserData();
        
        setSuccess('Yeni adres başarıyla eklendi');
        
        // Başarılı mesajını göster ve sonra geri dön
        Alert.alert('Başarılı', 'Yeni adres başarıyla eklendi', [
          { text: 'Tamam', onPress: () => router.back() }
        ]);
      } else {
        setError(response.data.message || 'Adres eklenirken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Adres ekleme hatası:', err);
      setError(
        err.response?.data?.message || 'Adres eklenirken bir hata oluştu'
      );
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
          title: 'Yeni Adres Ekle',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          }
        }}
      />
      
      <ScrollView style={styles.container}>
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
        
        <View style={styles.formContainer}>
          {/* Adres Başlığı */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="bookmark" size={16} color="#4CAF50" /> Adres Başlığı
            </Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              placeholder="Örn: Ev, İş, Yazlık..."
              placeholderTextColor="#aaa"
              maxLength={50}
            />
          </View>
          
          {/* Adres */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color="#4CAF50" /> Adres
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              placeholder="Adres detaylarını giriniz"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
          
          {/* Şehir */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="business" size={16} color="#4CAF50" /> Şehir
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
                  <Picker.Item key={city._id} label={city.city} value={city.city} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* İlçe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color="#4CAF50" /> İlçe
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.district}
                onValueChange={(value) => handleChange('district', value)}
                style={styles.picker}
                enabled={formData.city !== '' && districts.length > 0}
              >
                <Picker.Item label="İlçe Seçiniz" value="" />
                {districts.map((district, index) => (
                  <Picker.Item key={index} label={district} value={district} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Posta Kodu */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="mail" size={16} color="#4CAF50" /> Posta Kodu (Opsiyonel)
            </Text>
            <TextInput
              style={styles.input}
              value={formData.postalCode}
              onChangeText={(value) => handleChange('postalCode', value)}
              placeholder="Posta kodunu giriniz"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          
          {/* Varsayılan Adres */}
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" /> Varsayılan Adres
            </Text>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => handleChange('isDefault', value)}
              trackColor={{ false: '#eee', true: '#A5D6A7' }}
              thumbColor={formData.isDefault ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.helperText}>Bu adres teslimat için varsayılan olarak kullanılacaktır.</Text>
          
          {/* Kaydet Butonu */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={styles.buttonLoader}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveButtonText}>Ekleniyor...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="save" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Adresi Kaydet</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 