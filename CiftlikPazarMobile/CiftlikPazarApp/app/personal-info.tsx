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
  KeyboardAvoidingView
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
  _id: string;  // MongoDB ObjectId
  cityid: string | number;
  city: string;
  districts?: {
    _id: string;
    [key: string]: string; // Her karakter için index
  }[];
}

export default function PersonalInfoScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  
  // State tanımlamaları
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // İl ve ilçe state'leri
  const [cities, setCities] = useState<CityType[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Form state'i
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    district: ''
  });
  
  // Kullanıcı verilerini yükle
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          console.log('Kullanıcı bilgileri:', user);
          // Doğru veri yapısı: user.data içinden bilgileri alıyoruz
          setFormData({
            firstName: user.data?.firstName || '',
            lastName: user.data?.lastName || '',
            email: user.data?.email || '',
            phone: user.data?.phone || '',
            city: user.data?.city || '',
            district: user.data?.district || ''
          });
        } else {
          // Kullanıcı bilgileri yoksa profil sayfasına geri dön
          Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı');
          router.back();
        }
      } catch (err) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', err);
        setError('Kullanıcı bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, router]);
  
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
  const handleChange = (name: string, value: string) => {
    // Ad ve soyad için sadece harf girişine izin ver
    if ((name === 'firstName' || name === 'lastName') && value !== '') {
      const letterPattern = /^[A-Za-zğüşıöçĞÜŞİÖÇ ]+$/;
      if (!letterPattern.test(value)) {
        return; // Eğer sadece harf değilse değeri değiştirme
      }
    }
    
    // Telefon için sadece sayı girişine izin ver
    if (name === 'phone' && value !== '') {
      const numberPattern = /^[0-9]+$/;
      if (!numberPattern.test(value)) {
        return; // Eğer sadece sayı değilse değeri değiştirme
      }
    }
    
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
  
  // Profil bilgilerini güncelleme
  const handleSubmit = async () => {
    // Form doğrulama
    if (!formData.firstName || !formData.lastName) {
      setError('Ad ve soyad alanları zorunludur');
      return;
    }
    
    // Telefon doğrulama
    if (formData.phone && formData.phone.length !== 10) {
      setError('Telefon numarası 10 haneli olmalıdır');
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
      
      console.log('Profil güncelleme isteği gönderiliyor...');
      
      // Doğru endpoint: `/api/auth/profile`
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Profil güncelleme yanıtı:', response.data);
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        const updatedUser = {
          ...user,
          data: {
            ...user.data,
            ...formData
          }
        };
        
        // Kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        
        setSuccess('Profil bilgileriniz başarıyla güncellendi');
        
        // Başarılı mesajını göster ve sonra geri dön
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
          { text: 'Tamam', onPress: () => router.back() }
        ]);
      } else {
        setError(response.data.message || 'Profil güncellenirken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Profil güncelleme hatası:', err);
      setError(
        err.response?.data?.message || 'Profil güncellenirken bir hata oluştu'
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Yükleniyor göstergesi
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Bilgiler yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Kişisel Bilgiler',
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
          {/* Ad */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person" size={16} color="#4CAF50" /> Ad
            </Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="Adınız"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          
          {/* Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person" size={16} color="#4CAF50" /> Soyad
            </Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Soyadınız"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          
          {/* E-posta */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="mail" size={16} color="#4CAF50" /> E-posta
            </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
              selectTextOnFocus={false}
            />
            <Text style={styles.helperText}>E-posta adresi değiştirilemez</Text>
          </View>
          
          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="call" size={16} color="#4CAF50" /> Telefon
            </Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="5XXXXXXXXX"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={styles.helperText}>Başında 0 olmadan 10 haneli (Örn: 5XXXXXXXXX)</Text>
          </View>
          
          {/* Şehir */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color="#4CAF50" /> Şehir
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
          
          {/* Kaydet Butonu */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={styles.buttonLoader}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveButtonText}>Güncelleniyor...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="save" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
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