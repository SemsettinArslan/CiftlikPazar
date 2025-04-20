import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - Platformlara göre URL'leri ayarla
const getApiUrl = () => {
  // Android emülatörde localhost yerine 10.0.2.2 kullanılır
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api'; // Android için localhost
  } 
  return 'http://localhost:5000/api'; // iOS için localhost
};

const API_URL = getApiUrl();

const EditProfileScreen = () => {
  const router = useRouter();
  const { user, setUser, API_URL: contextApiUrl } = useAuth();
  
  // API_URL olarak context'teki URL'i kullanmayı tercih et
  const apiUrl = contextApiUrl || API_URL;
  
  // Kullanıcı bilgilerine göre başlangıç değerlerini ayarla
  const getInitialFormData = useCallback(() => {
    if (!user) return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      district: ''
    };
    
    return {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      district: user.district || ''
    };
  }, [user]);
  
  // Temel form state'i - kullanıcı bilgileriyle başlat
  const [formData, setFormData] = useState(getInitialFormData());
  
  // UI state'leri
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' veya 'error'
  
  // İl-ilçe state'leri
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Profil resmi state'leri
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Profil resmini başlangıçta ayarla
  useEffect(() => {
    if (user && user.profileImage) {
      const imageUrl = `${apiUrl}/../uploads/profile-images/${user.profileImage}`;
      console.log("Profil resmi URL:", imageUrl);
      setPreviewImage(imageUrl);
    }
  }, [user, apiUrl]);

  // Şehirleri çekme - Kayıt ekranındaki mekanizma
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`${apiUrl}/cities`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Şehirleri alfabetik sıraya göre diz
          const sortedCities = [...data.data].sort((a, b) => {
            const nameA = a.name || a.city || '';
            const nameB = b.name || b.city || '';
            return nameA.localeCompare(nameB, 'tr');
          });
          setCities(sortedCities);
          console.log("Şehirler yüklendi, toplam:", sortedCities.length);
        } else {
          console.error('Cities API response format error:', data);
          setMessage('Şehir listesi yüklenirken bir hata oluştu.');
          setMessageType('error');
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setMessage('Şehir listesi yüklenirken bir hata oluştu.');
        setMessageType('error');
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, [apiUrl]);

  // Şehir değiştiğinde ilçeleri getir - Kayıt ekranındaki mekanizma
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.city) {
        setDistricts([]);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Seçilen şehri bul
        const selectedCity = cities.find(c => (c.city === formData.city || c.name === formData.city));
        if (!selectedCity) {
          console.log("Seçilen şehir bulunamadı:", formData.city);
          setDistricts([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Seçilen şehir:", selectedCity);
        
        // İlçeleri alma stratejisini belirle
        let districtsList = [];
        
        // 1. Yöntem: Doğrudan şehir nesnesindeki districts dizisini kullan
        if (selectedCity.districts && Array.isArray(selectedCity.districts) && selectedCity.districts.length > 0) {
          console.log("1. Yöntem: Şehir nesnesindeki districts dizisi kullanılıyor");
          // districts verisinin formatını kontrol et
          if (typeof selectedCity.districts[0] === 'string') {
            // Doğrudan string dizisi
            districtsList = [...selectedCity.districts];
          } else if (typeof selectedCity.districts[0] === 'object') {
            // Özel format kontrolü: {"0":"B","1":"o","2":"z"...} formatında ilçe isimleri
            const processedDistricts = selectedCity.districts.map((district) => {
              // Eğer name özelliği varsa direkt kullan
              if (district.name) {
                return district.name;
              }
              
              // Karakter bazlı indekslenmiş ilçe isimleri için
              const keys = Object.keys(district).filter(key => !isNaN(Number(key)));
              if (keys.length > 0) {
                // Sayısal keyleri sırala ve birleştir
                const sortedKeys = keys.sort((a, b) => Number(a) - Number(b));
                const districtName = sortedKeys.map(key => district[key]).join('');
                return districtName;
              }
              
              // Diğer obje formatları
              return district.name || district.toString() || '';
            }).filter(Boolean);
            
            districtsList = processedDistricts;
          }
        } 
        // 2. Yöntem: API ile şehir ID'si üzerinden ilçeleri çek
        else if (selectedCity._id || selectedCity.cityid) {
          const cityId = selectedCity._id || selectedCity.cityid;
          console.log("2. Yöntem: API ile şehir ID'si üzerinden ilçeleri çekiyorum. ID:", cityId);
          
          const response = await fetch(`${apiUrl}/cities/${cityId}/districts`);
          const data = await response.json();
          console.log("İlçe yanıtı:", data);
          
          if (data.success && data.data && Array.isArray(data.data)) {
            if (data.data.length > 0) {
              if (typeof data.data[0] === 'string') {
                districtsList = [...data.data];
              } else if (typeof data.data[0] === 'object') {
                districtsList = data.data
                  .filter((d) => d && (d.name || d.toString))
                  .map((d) => d.name || d.toString());
              }
            }
          }
        }
        // 3. Yöntem: API ile şehir adı üzerinden ilçeleri çek
        else if (selectedCity.name || selectedCity.city) {
          const cityName = selectedCity.name || selectedCity.city;
          console.log("3. Yöntem: API ile şehir adı üzerinden ilçeleri çekiyorum. İsim:", cityName);
          
          // URL'deki Türkçe karakterler için encode
          const encodedCityName = encodeURIComponent(cityName);
          const response = await fetch(`${apiUrl}/cities/name/${encodedCityName}/districts`);
          const data = await response.json();
          console.log("İlçe yanıtı:", data);
          
          if (data.success && data.data && Array.isArray(data.data)) {
            if (data.data.length > 0) {
              if (typeof data.data[0] === 'string') {
                districtsList = [...data.data];
              } else if (typeof data.data[0] === 'object') {
                districtsList = data.data
                  .filter((d) => d && (d.name || d.toString))
                  .map((d) => d.name || d.toString());
              }
            }
          }
        }
        
        // İlçeleri alfabetik sırala
        if (districtsList.length > 0) {
          const sortedDistricts = districtsList
            .filter(Boolean) // null/undefined değerleri filtrele
            .sort((a, b) => a.localeCompare(b, 'tr'));
          console.log("İlçeler yüklendi, toplam:", sortedDistricts.length);
          setDistricts(sortedDistricts);
        } else {
          console.log("İlçe listesi boş");
          setDistricts([]);
        }
        
        // İlçe seçiminin geçerli olup olmadığını kontrol et
        if (formData.district && districtsList.indexOf(formData.district) === -1) {
          setFormData(prev => ({ ...prev, district: '' }));
        }
        
      } catch (error) {
        console.error('İlçeler yüklenirken hata oluştu:', error.message);
        if (error.response) {
          console.error('Sunucu yanıtı:', error.response.data);
        }
        setMessage('İlçeler yüklenirken bir hata oluştu.');
        setMessageType('error');
        setDistricts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (formData.city) {
      fetchDistricts();
    }
  }, [formData.city, cities, apiUrl]);
  
  // Kullanıcı bilgilerini değişirse formları güncelle
  useEffect(() => {
    if (user) {
      console.log("Kullanıcı verileri güncellendi, form verileri yenileniyor");
      setFormData(getInitialFormData());
    }
  }, [user, getInitialFormData]);
  
  // Form yüklendikten sonra formdaki verileri kontrol et
  useEffect(() => {
    console.log("Güncel form değerleri:", formData);
  }, [formData]);
  
  // Form alanı değişikliği
  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Şehir değiştiğinde ilçeyi sıfırla
    if (name === 'city') {
      setFormData(prev => ({ ...prev, district: '' }));
    }
  };

  // Profil resmi seçme
  const handleImagePick = async () => {
    try {
      // Kamera ve medya kütüphanesi izinlerini kontrol et
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('İzin gerekli', 'Profil fotoğrafı eklemek için kamera ve medya erişim izni vermeniz gerekiyor.');
        return;
      }
      
      // Kullanıcıya kamera veya galeri seçeneği sun
      Alert.alert(
        'Profil Fotoğrafı',
        'Profil fotoğrafınızı nereden seçmek istersiniz?',
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Kamera',
            onPress: () => pickFromCamera()
          },
          {
            text: 'Galeri',
            onPress: () => pickFromGallery()
          }
        ]
      );
    } catch (error) {
      console.error('İzin hatası:', error);
    }
  };
  
  // Kameradan fotoğraf çek
  const pickFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7
      });
      
      if (!result.canceled) {
        setProfileImage(result.assets[0]);
        setPreviewImage(result.assets[0].uri);
        
        // Resmi otomatik yükle
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
    }
  };
  
  // Galeriden fotoğraf seç
  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7
      });
      
      if (!result.canceled) {
        setProfileImage(result.assets[0]);
        setPreviewImage(result.assets[0].uri);
        
        // Resmi otomatik yükle
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Galeri hatası:', error);
    }
  };
  
  // Profil resmi yükleme
  const uploadImage = async (imageAsset) => {
    setUploadingImage(true);
    setMessage('');
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setMessage('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        setMessageType('error');
        setUploadingImage(false);
        return;
      }
      
      const formDataObj = new FormData();
      
      // iOS ve Android için farklı formatta dosya ekleme
      const uriParts = imageAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formDataObj.append('profileImage', {
        uri: imageAsset.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`
      });
      
      console.log('Profil resmi yükleniyor...');
      
      const response = await axios.post(
        `${apiUrl}/users/profile/upload-image`,
        formDataObj,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        if (user) {
          const updatedUser = {
            ...user,
            profileImage: response.data.data.profileImage
          };
          
          // Kullanıcı bilgilerini güncelle
          setUser(updatedUser);
          
          // AsyncStorage'daki kullanıcı bilgilerini güncelle
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setMessage('Profil resmi başarıyla güncellendi');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Profil resmi yükleme hatası:', error);
      setMessage('Profil resmi yüklenirken bir hata oluştu');
      setMessageType('error');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Form gönderildiğinde
  const handleSubmit = async () => {
    // Form doğrulama
    if (!formData.firstName || !formData.lastName) {
      setMessage('Ad ve soyad alanları zorunludur');
      setMessageType('error');
      return;
    }
    
    // Telefon doğrulama
    if (formData.phone && formData.phone.length !== 10) {
      setMessage('Telefon numarası 10 haneli olmalıdır');
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    // Şimdilik sadece bir mesaj gösterelim
    setTimeout(() => {
      setMessage('Profil bilgileriniz başarıyla güncellendi (Test)');
      setMessageType('success');
      setIsLoading(false);
      
      // Gerçek uygulamada burada API çağrısı yapılır
      console.log('Gönderilen form verileri:', formData);
    }, 1000);
    
    // Gerçek uygulamada aşağıdaki kodu aktif edebilirsiniz
    /*
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${apiUrl}/users/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        const updatedUser = {
          ...user,
          ...formData
        };
        
        // Kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        
        // AsyncStorage'daki kullanıcı bilgilerini güncelle
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage('Profil bilgileriniz başarıyla güncellendi');
        setMessageType('success');
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Profil güncellenirken bir hata oluştu'
      );
      setMessageType('error');
      console.error('Profil güncelleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
    */
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      {/* Üst bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* Profil resmi seçimi */}
        <View style={styles.profileImageContainer}>
          {uploadingImage ? (
            <View style={styles.profileImagePlaceholder}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : (
            <TouchableOpacity onPress={handleImagePick}>
              {previewImage ? (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={50} color="#ccc" />
                </View>
              )}
              
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Bildirim mesajı */}
        {message ? (
          <View style={[styles.messageContainer, messageType === 'error' ? styles.errorMessage : styles.successMessage]}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}
        
        {/* Form */}
        <View style={styles.formContainer}>
          {/* İsim alanı */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ad*</Text>
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              defaultValue={user ? user.firstName || '' : ''}
            />
          </View>
          
          {/* Soyisim alanı */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Soyad*</Text>
            <TextInput
              style={styles.input}
              placeholder="Soyadınız"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              defaultValue={user ? user.lastName || '' : ''}
            />
          </View>
          
          {/* E-posta alanı */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f0f0f0' }]}
              placeholder="E-posta adresiniz"
              value={formData.email}
              editable={false}
              defaultValue={user ? user.email || '' : ''}
            />
            <Text style={styles.helpText}>
              E-posta adresi değiştirilemez
            </Text>
          </View>
          
          {/* Telefon alanı */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XXXX"
              value={formData.phone}
              onChangeText={(text) => {
                // Sadece rakam girişine izin ver
                const numericValue = text.replace(/[^0-9]/g, '');
                handleChange('phone', numericValue);
              }}
              keyboardType="phone-pad"
              maxLength={10}
              defaultValue={user ? user.phone || '' : ''}
            />
            <Text style={styles.helpText}>
              Başında 0 olmadan 10 haneli olarak giriniz
            </Text>
          </View>
          
          {/* İl seçimi */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>İl</Text>
            <View style={styles.pickerContainer}>
              {loadingCities ? (
                <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: 15 }} />
              ) : (
                <Picker
                  selectedValue={formData.city}
                  onValueChange={(itemValue) => handleChange('city', itemValue)}
                  style={styles.picker}
                  enabled={!loadingCities}
                >
                  <Picker.Item label="İl seçin" value="" color="#999" />
                  {cities.map((city, index) => (
                    <Picker.Item 
                      key={index} 
                      label={city.name || city.city || 'Bilinmeyen Şehir'} 
                      value={city.name || city.city || ''}
                    />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          
          {/* İlçe seçimi */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>İlçe</Text>
            <View style={styles.pickerContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: 15 }} />
              ) : (
                <Picker
                  selectedValue={formData.district}
                  onValueChange={(itemValue) => handleChange('district', itemValue)}
                  style={styles.picker}
                  enabled={formData.city !== '' && districts.length > 0}
                >
                  <Picker.Item label={!formData.city ? "Önce il seçin" : (districts.length === 0 ? "İlçe Bulunamadı" : "İlçe seçin")} value="" color="#999" />
                  {districts.map((district, index) => (
                    <Picker.Item key={index} label={district} value={district} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          
          {/* Kaydet butonu */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorMessage: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  successMessage: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555555',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 