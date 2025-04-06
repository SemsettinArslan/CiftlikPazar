import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

// API URL - Platformlara göre URL'leri ayarla
const getApiUrl = () => {
  // Android emülatörde localhost yerine 10.0.2.2 kullanılır
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api'; // Android için localhost
  } else {
    return 'http://localhost:5000/api'; // iOS için localhost
  }
};

const API_URL = getApiUrl();

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  
  // State tanımlamaları
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Profil form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: ''
  });
  
  // Profil resmi state
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // İlleri yükle
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const response = await axios.get(`${API_URL}/cities`);
        setCities(response.data.data);
      } catch (error) {
        setError('İller yüklenirken bir hata oluştu.');
        console.error(error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      // İl seçilmemişse ilçeleri temizle
      if (!formData.city) {
        setDistricts([]);
        return;
      }

      try {
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === formData.city);
        if (selectedCity) {
          const response = await axios.get(`${API_URL}/cities/${selectedCity.cityid}/districts`);
          setDistricts(response.data.data);
          
          // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
          const districtExists = response.data.data.some(d => d === formData.district);
          if (!districtExists) {
            setFormData(prev => ({ ...prev, district: '' }));
          }
        }
      } catch (error) {
        setError('İlçeler yüklenirken bir hata oluştu.');
        console.error(error);
      }
    };

    loadDistricts();
  }, [formData.city, cities]);
  
  // Profil verilerini yükle
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        district: user.district || ''
      });
      
      // Profil resmi
      if (user.profileImage) {
        setPreviewImage(`${API_URL}/../uploads/profile-images/${user.profileImage}`);
      }
    }
  }, [user]);
  
  // Form verilerini güncelle
  const handleChange = (name, value) => {
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
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // iOS ve Android için farklı formatta dosya ekleme
      const uriParts = imageAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('profileImage', {
        uri: imageAsset.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`
      });
      
      const response = await axios.post(
        `${API_URL}/users/profile/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        const updatedUser = {
          ...user,
          profileImage: response.data.data.profileImage
        };
        
        // Kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccessMessage('Profil resmi başarıyla güncellendi');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Profil resmi yüklenirken bir hata oluştu'
      );
      console.error('Profil resmi yükleme hatası:', error);
    } finally {
      setUploadingImage(false);
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
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/users/profile`,
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
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccessMessage('Profil bilgileriniz başarıyla güncellendi');
        
        // Başarılı mesajını göster ve sonra geri dön
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Profil güncellenirken bir hata oluştu'
      );
      console.error('Profil güncelleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Düzenle</Text>
          <View style={{ width: 24 }} /> {/* Boş view ile başlığı ortala */}
        </View>
        
        {/* Hata ve başarı mesajları */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {successMessage ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
        
        {/* Profil Fotoğrafı */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePick}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {uploadingImage && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loaderText}>Fotoğraf yükleniyor...</Text>
            </View>
          )}
        </View>
        
        {/* Form */}
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
          
          {/* Adres */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color="#4CAF50" /> Adres
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              placeholder="Adres"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
                  <Picker.Item key={city.cityid} label={city.city} value={city.city} />
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
            disabled={isLoading}
          >
            {isLoading ? (
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#f8f9fa',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f8f9fa',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  textarea: {
    height: 100,
    paddingTop: 12,
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

export default EditProfileScreen; 