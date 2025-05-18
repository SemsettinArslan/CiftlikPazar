import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { SelectList } from 'react-native-dropdown-select-list';
import { API_URL } from '../../constants/Config';

interface SelectListProps {
  setSelected: (val: string) => void;
  data: Array<{key: string, value: string}>;
  save?: string;
  placeholder?: string;
  boxStyles?: object;
  dropdownStyles?: object;
  search?: boolean;
  defaultOption?: {key: string, value: string};
}

const SelectList: React.FC<SelectListProps> = ({ 
  setSelected, 
  data, 
  placeholder = "Seçiniz", 
  boxStyles,
  defaultOption
}) => {
  const [value, setValue] = useState(defaultOption?.key || '');
  
  useEffect(() => {
    if (defaultOption?.key) {
      setSelected(defaultOption.key);
    }
  }, [defaultOption, setSelected]);
  
  return (
    <View style={[{ borderWidth: 1, padding: 10, borderRadius: 5 }, boxStyles]}>
      <TouchableOpacity 
        onPress={() => {
          if (data.length > 0) {
            setValue(data[0].key);
            setSelected(data[0].key);
          }
        }}
      >
        <Text>{value ? data.find(item => item.key === value)?.value : placeholder}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface FormData {
  name: string;
  description: string;
  price: string;
  countInStock: string;
  unit: string;
  category: string;
  isOrganic: boolean;
}

interface Category {
  _id: string;
  name: string;
}

export default function AddProductScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    countInStock: '',
    unit: 'kg',
    category: '',
    isOrganic: false,
  });
  const [image, setImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{key: string, value: string}>>([]);

  useEffect(() => {
    if (user && user.data && user.data.role !== 'farmer') {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        if (response.data.success) {
          const formattedCategories = response.data.data.map((category: Category) => ({
            key: category._id,
            value: category.name,
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu:', error);
        Alert.alert('Hata', 'Kategoriler yüklenirken bir sorun oluştu.');
      }
    };

    fetchCategories();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişimine izin vermeniz gerekiyor!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split('/').pop() || 'image.jpg';
        
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        const formDataObj = new FormData();
        
        formDataObj.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });

        try {
          const response = await axios.post(
            `${API_URL}/api/products/upload-image`,
            formDataObj,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setImage(response.data.data.imagePath);
            Alert.alert('Başarılı', 'Resim başarıyla yüklendi.');
          } else {
            Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu.');
          }
        } catch (error) {
          console.error('Resim yükleme hatası:', error);
          Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Resim seçme hatası:', error);
      Alert.alert('Hata', 'Resim seçilirken bir sorun oluştu.');
      setImageLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    if (!image) {
      Alert.alert('Hata', 'Lütfen bir ürün resmi yükleyin.');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        countInStock: parseInt(formData.countInStock) || 0,
        image: image,
      };

      const response = await axios.post(
        `${API_URL}/api/products`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Başarılı',
          response.data.message || 'Ürün başarıyla kaydedildi.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', 'Ürün kaydedilirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error);
      Alert.alert('Hata', 'Ürün kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (user && user.data && user.data.role !== 'farmer') {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Yeni Ürün Ekle',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ürün Adı *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ürün adını girin"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ürün Açıklaması *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ürün hakkında detaylı bilgi verin"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Fiyat (₺) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Stok Miktarı *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.countInStock}
                onChangeText={(text) => setFormData({ ...formData, countInStock: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Birim *</Text>
              <SelectList
                setSelected={(val: string) => setFormData({ ...formData, unit: val })}
                data={[
                  { key: 'kg', value: 'Kilogram (kg)' },
                  { key: 'g', value: 'Gram (g)' },
                  { key: 'adet', value: 'Adet' },
                  { key: 'litre', value: 'Litre' },
                  { key: 'demet', value: 'Demet' },
                  { key: 'paket', value: 'Paket' },
                ]}
                defaultOption={{ key: 'kg', value: 'Kilogram (kg)' }}
                save="key"
                search={false}
                boxStyles={styles.selectBox}
                dropdownStyles={styles.dropdown}
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Kategori *</Text>
              <SelectList
                setSelected={(val: string) => setFormData({ ...formData, category: val })}
                data={categories}
                save="key"
                placeholder="Kategori seçin"
                boxStyles={styles.selectBox}
                dropdownStyles={styles.dropdown}
              />
            </View>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, isOrganic: !formData.isOrganic })}
            >
              {formData.isOrganic ? (
                <Ionicons name="checkbox" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="square-outline" size={24} color="#666" />
              )}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Organik ürün</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ürün Görseli *</Text>
            <TouchableOpacity
              style={styles.imageUploadBtn}
              onPress={pickImage}
              disabled={imageLoading}
            >
              {imageLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: `${API_URL}/uploads/product-images/${image}` }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity 
                    style={styles.changeImageBtn}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeImageText}>Değiştir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons name="image-outline" size={24} color="#666" />
                  <Text style={styles.uploadText}>Resim Yükle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Ürünü Kaydet</Text>
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
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  imageUploadBtn: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 