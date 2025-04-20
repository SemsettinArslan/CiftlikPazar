import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditFarmProfileScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const token = userInfo.token;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [hasImageChanged, setHasImageChanged] = useState({
    profile: false,
    cover: false,
  });

  useEffect(() => {
    getFarmerProfile();
    fetchCities();
    fetchCategories();
  }, []);

  const getFarmerProfile = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/farmers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setFarmer(response.data);
      setProfileImage(response.data.profileImage);
      setCoverImage(response.data.coverImage);
      
      if (response.data.city) {
        fetchDistricts(response.data.city);
      }
      
      if (response.data.categories) {
        setSelectedCategories(response.data.categories.map(cat => cat._id || cat));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
      Alert.alert('Hata', 'Çiftlik bilgileri yüklenirken bir hata oluştu.');
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/locations/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchDistricts = async (cityId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/locations/districts/${cityId}`);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const pickImage = async (type) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Hata', 'Galeri erişim izni gereklidir.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'profile') {
          setProfileImage(result.assets[0].uri);
          setHasImageChanged(prev => ({ ...prev, profile: true }));
        } else {
          setCoverImage(result.assets[0].uri);
          setHasImageChanged(prev => ({ ...prev, cover: true }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
    }
  };

  const uploadImage = async (uri, type) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const fileType = filename.split('.').pop();
      
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type: `image/${fileType}`,
      });

      const response = await axios.post(
        `${BASE_URL}/api/farmers/upload-${type}-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data.imageUrl;
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      throw new Error(`${type === 'profile' ? 'Profil' : 'Kapak'} resmi yüklenirken bir hata oluştu.`);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      let updatedValues = { ...values };
      
      // Upload profile image if changed
      if (hasImageChanged.profile && profileImage) {
        const profileImageUrl = await uploadImage(profileImage, 'profile');
        updatedValues.profileImage = profileImageUrl;
      }
      
      // Upload cover image if changed
      if (hasImageChanged.cover && coverImage) {
        const coverImageUrl = await uploadImage(coverImage, 'cover');
        updatedValues.coverImage = coverImageUrl;
      }
      
      // Add selected categories
      updatedValues.categories = selectedCategories;
      
      const response = await axios.put(
        `${BASE_URL}/api/farmers/update-profile`,
        updatedValues,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setMessage({ type: 'success', text: 'Çiftlik bilgileri başarıyla güncellendi.' });
      setFarmer(response.data);
      setHasImageChanged({ profile: false, cover: false });
      
      // Update stored userInfo with new farmer data
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          const updatedUserInfo = {
            ...userInfo,
            user: {
              ...userInfo.user,
              farmer: response.data,
            },
          };
          await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        }
      } catch (err) {
        console.error('Error updating AsyncStorage:', err);
      }
      
    } catch (error) {
      console.error('Error updating farmer profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Çiftlik bilgileri güncellenirken bir hata oluştu.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const validationSchema = Yup.object().shape({
    farmName: Yup.string().required('Çiftlik adı gereklidir'),
    taxNumber: Yup.string().required('Vergi numarası gereklidir'),
    city: Yup.string().required('İl seçmelisiniz'),
    district: Yup.string().required('İlçe seçmelisiniz'),
    address: Yup.string().required('Adres gereklidir'),
    minOrderAmount: Yup.number()
      .typeError('Minimum sipariş tutarı rakam olmalıdır')
      .min(0, 'Minimum sipariş tutarı negatif olamaz'),
  });

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Çiftlik Bilgilerini Düzenle</Text>
        </View>

        {message && (
          <View style={[styles.messageContainer, message.type === 'error' ? styles.errorMessage : styles.successMessage]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <FontAwesome name="image" size={50} color="#cccccc" />
            </View>
          )}
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={() => pickImage('cover')}
          >
            <FontAwesome name="camera" size={16} color="#fff" />
            <Text style={styles.changeImageText}>Kapak Fotoğrafı Değiştir</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.placeholderProfileImage]}>
              <FontAwesome name="user" size={40} color="#cccccc" />
            </View>
          )}
          <TouchableOpacity
            style={styles.changeProfileImageButton}
            onPress={() => pickImage('profile')}
          >
            <FontAwesome name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Formik
          initialValues={{
            farmName: farmer?.farmName || '',
            taxNumber: farmer?.taxNumber || '',
            city: farmer?.city || '',
            district: farmer?.district || '',
            address: farmer?.address || '',
            description: farmer?.description || '',
            hasShipping: farmer?.hasShipping || false,
            minOrderAmount: farmer?.minOrderAmount ? farmer.minOrderAmount.toString() : '0',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Çiftlik Adı</Text>
                <TextInput
                  style={styles.input}
                  value={values.farmName}
                  onChangeText={handleChange('farmName')}
                  onBlur={handleBlur('farmName')}
                  placeholder="Çiftlik Adı"
                />
                {touched.farmName && errors.farmName && (
                  <Text style={styles.errorText}>{errors.farmName}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vergi Numarası</Text>
                <TextInput
                  style={styles.input}
                  value={values.taxNumber}
                  onChangeText={handleChange('taxNumber')}
                  onBlur={handleBlur('taxNumber')}
                  placeholder="Vergi Numarası"
                  keyboardType="number-pad"
                />
                {touched.taxNumber && errors.taxNumber && (
                  <Text style={styles.errorText}>{errors.taxNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>İl</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.city}
                    style={styles.picker}
                    onValueChange={(itemValue) => {
                      setFieldValue('city', itemValue);
                      setFieldValue('district', '');
                      if (itemValue) {
                        fetchDistricts(itemValue);
                      } else {
                        setDistricts([]);
                      }
                    }}
                  >
                    <Picker.Item label="İl Seçin" value="" />
                    {cities.map((city) => (
                      <Picker.Item
                        key={city._id}
                        label={city.name}
                        value={city._id}
                      />
                    ))}
                  </Picker>
                </View>
                {touched.city && errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>İlçe</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.district}
                    style={styles.picker}
                    enabled={values.city !== ''}
                    onValueChange={(itemValue) => {
                      setFieldValue('district', itemValue);
                    }}
                  >
                    <Picker.Item label="İlçe Seçin" value="" />
                    {districts.map((district) => (
                      <Picker.Item
                        key={district._id}
                        label={district.name}
                        value={district._id}
                      />
                    ))}
                  </Picker>
                </View>
                {touched.district && errors.district && (
                  <Text style={styles.errorText}>{errors.district}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Adres</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={values.address}
                  onChangeText={handleChange('address')}
                  onBlur={handleBlur('address')}
                  placeholder="Adres"
                  multiline
                  numberOfLines={4}
                />
                {touched.address && errors.address && (
                  <Text style={styles.errorText}>{errors.address}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Açıklama</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={values.description}
                  onChangeText={handleChange('description')}
                  onBlur={handleBlur('description')}
                  placeholder="Çiftliğiniz hakkında bilgi verin"
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Kategoriler</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryChip,
                        selectedCategories.includes(category._id) && styles.selectedCategoryChip,
                      ]}
                      onPress={() => toggleCategory(category._id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategories.includes(category._id) && styles.selectedCategoryChipText,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Kargo Seçeneği</Text>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    values.hasShipping ? styles.switchButtonActive : {},
                  ]}
                  onPress={() => setFieldValue('hasShipping', !values.hasShipping)}
                >
                  <Text style={styles.switchButtonText}>
                    {values.hasShipping ? 'Kargo Var' : 'Kargo Yok'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Minimum Sipariş Tutarı (TL)</Text>
                <TextInput
                  style={styles.input}
                  value={values.minOrderAmount}
                  onChangeText={handleChange('minOrderAmount')}
                  onBlur={handleBlur('minOrderAmount')}
                  placeholder="0"
                  keyboardType="numeric"
                />
                {touched.minOrderAmount && errors.minOrderAmount && (
                  <Text style={styles.errorText}>{errors.minOrderAmount}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  coverImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderProfileImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  changeProfileImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#4CAF50',
  },
  switchButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 12,
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
  },
});

export default EditFarmProfileScreen; 