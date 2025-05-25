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
  Switch
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { SelectList } from 'react-native-dropdown-select-list';
import { getApiBaseUrl } from '../../src/utils/networkUtils';

// API URL'ini al
const API_URL = getApiBaseUrl();

interface ProductFormData {
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
  category_name?: string;
}

export default function AddProductScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
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
  const [aiVerificationResult, setAiVerificationResult] = useState<any>(null);

  useEffect(() => {
    if (user && user.data && user.data.role !== 'farmer') {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from:', `${API_URL}/categories?limit=100`);
        const response = await axios.get(`${API_URL}/categories?limit=100`, {
          timeout: 10000 // 10 saniye timeout ekle
        });
        console.log('Categories API response:', response.data);
        
        if (response.data.success) {
          const formattedCategories = response.data.data.map((category: Category) => {
            console.log('Processing category:', category);
            // Kategori adını düzgün bir şekilde belirle
            const categoryName = category.name || category.category_name || 'Bilinmeyen kategori';
            return {
              key: category._id,
              value: categoryName,
            };
          });
          console.log('Formatted categories:', formattedCategories);
          setCategories(formattedCategories);
        } else {
          console.error('Categories API returned success: false');
        }
      } catch (error: any) {
        console.error('Kategoriler yüklenirken hata oluştu:', error);
        
        if (error.response) {
          console.error('Error response:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        
        // Hata durumunda örnek kategoriler ekleyelim
        const dummyCategories = [
          { key: '1', value: 'Sebzeler' },
          { key: '2', value: 'Meyveler' },
          { key: '3', value: 'Süt Ürünleri' },
          { key: '4', value: 'Baklagiller' }
        ];
        console.log('Using dummy categories as fallback');
        setCategories(dummyCategories);
        
        Alert.alert('Hata', 'Kategoriler yüklenirken bir sorun oluştu. Varsayılan kategoriler gösteriliyor.');
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
        base64: false, // Base64 verisi almıyoruz, dosya olarak yükleyeceğiz
      });

      if (!result.canceled) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split('/').pop() || 'image.jpg';
        
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        // FormData oluşturma
        const formData = new FormData();
        
        // @ts-ignore - React Native'de FormData.append özel bir yapıya sahip
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });

        try {
          console.log('Resim yükleme isteği gönderiliyor:', `${API_URL}/products/upload-image`);
          console.log('FormData içeriği:', {
            uri: imageUri,
            name: filename,
            type
          });
          
          // Token header'ı olmadan doğrudan istek yap
          const response = await axios.post(
            `${API_URL}/products/upload-image`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 30000 // 30 saniye timeout
            }
          );

          console.log('Resim yükleme cevabı:', response.data);

          if (response.data.success) {
            setImage(response.data.data.imagePath);
            Alert.alert('Başarılı', 'Resim başarıyla yüklendi.');
          } else {
            Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu: ' + (response.data.message || 'Bilinmeyen hata'));
          }
        } catch (error: any) {
          console.error('Resim yükleme hatası:', error);
          
          // Görüntüyü yeniden boyutlandırma ve sıkıştırma deneyelim
          try {
            console.log('Görüntü sıkıştırma deneniyor...');
            
            // Görüntüyü daha düşük kalitede yeniden seçelim
            const compressedResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5, // Daha düşük kalite
              base64: false,
            });
            
            if (!compressedResult.canceled) {
              const compressedUri = compressedResult.assets[0].uri;
              const compressedFilename = compressedUri.split('/').pop() || 'compressed_image.jpg';
              const compressedType = match ? `image/${match[1]}` : 'image/jpeg';
              
              // Yeni FormData oluştur
              const compressedFormData = new FormData();
              
              // @ts-ignore
              compressedFormData.append('image', {
                uri: compressedUri,
                name: compressedFilename,
                type: compressedType,
              });
              
              console.log('Sıkıştırılmış resim yükleme isteği gönderiliyor');
              
              const compressedResponse = await axios.post(
                `${API_URL}/products/upload-image`,
                compressedFormData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                  timeout: 30000
                }
              );
              
              if (compressedResponse.data.success) {
                setImage(compressedResponse.data.data.imagePath);
                Alert.alert('Başarılı', 'Resim sıkıştırılarak başarıyla yüklendi.');
                return;
              }
            }
          } catch (compressError) {
            console.error('Görüntü sıkıştırma hatası:', compressError);
          }
          
          // Hata mesajlarını göster
          if (error.response) {
            // Sunucu cevabı ile gelen hata
            console.error('Hata detayları:', {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers
            });
            Alert.alert('Hata', `Resim yüklenirken bir sorun oluştu: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}`);
          } else if (error.request) {
            // İstek yapıldı ama cevap alınamadı
            console.error('İstek yapıldı ama cevap alınamadı:', error.request);
            Alert.alert('Hata', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
          } else {
            // İstek oluşturulurken bir hata oluştu
            console.error('İstek hatası:', error.message);
            Alert.alert('Hata', `İstek hatası: ${error.message}`);
          }
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

      // Token kontrolü
      if (!token) {
        Alert.alert('Hata', 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }

      console.log('Token:', token);
      console.log('API URL:', API_URL);

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        countInStock: parseInt(formData.countInStock) || 0,
        image: image,
      };

      console.log('Ürün verisi:', productData);

      const response = await axios.post(
        `${API_URL}/products`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 15000 // 15 saniye timeout
        }
      );

      console.log('Sunucu yanıtı:', response.data);

      if (response.data.success) {
        // AI doğrulama sonucunu kaydet
        if (response.data.verification) {
          setAiVerificationResult(response.data.verification);
        }
        
        // Onay durumuna göre mesaj göster
        let title = 'Başarılı';
        let message = response.data.message || 'Ürün başarıyla kaydedildi.';
        
        if (response.data.data?.approvalStatus === 'approved') {
          title = 'Başarılı - Otomatik Onaylandı';
          message = 'Yapay Zeka ürününüzü onayladı! Ürününüz başarıyla kaydedildi ve satışa hazır.';
        } else if (response.data.verification && response.data.verification.isValid === false) {
          title = 'İncelemeye Gönderildi';
          message = 'Yapay Zeka ürününüzü onaylamadı ve incelemeye gönderildi. Neden: ' + 
            (response.data.verification.reason || 'Belirtilmemiş');
        } else {
          title = 'İncelemeye Gönderildi';
          message = 'Ürününüz başarıyla kaydedildi ve inceleme için gönderildi.';
        }
        
        Alert.alert(
          title,
          message,
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
    } catch (error: any) {
      console.error('Ürün kaydetme hatası:', error);
      
      if (error.response) {
        // Sunucu cevabı ile gelen hata
        console.error('Hata detayları:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.status === 401) {
          Alert.alert(
            'Oturum Hatası', 
            'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.',
            [
              {
                text: 'Giriş Sayfasına Git',
                onPress: () => {
                  // Auth context'ten logout fonksiyonunu çağırabilirsiniz
                  router.replace('/login');
                }
              }
            ]
          );
        } else {
          Alert.alert('Hata', `Ürün kaydedilirken bir sorun oluştu: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}`);
        }
      } else if (error.request) {
        // İstek yapıldı ama cevap alınamadı
        console.error('İstek yapıldı ama cevap alınamadı:', error.request);
        Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        // İstek oluşturulurken bir hata oluştu
        console.error('İstek hatası:', error.message);
        Alert.alert('Hata', `İstek hatası: ${error.message}`);
      }
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
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
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
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

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Organik Ürün</Text>
            <Switch
              trackColor={{ false: "#dddddd", true: "#4CAF50" }}
              thumbColor={formData.isOrganic ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#dddddd"
              onValueChange={(value) => setFormData({ ...formData, isOrganic: value })}
              value={formData.isOrganic}
            />
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
                    source={{ uri: `${API_URL.replace('/api', '')}/uploads/product-images/${image}` }}
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
                  <Text style={styles.uploadSubText}>
                    Ürünü doğru tanımlayan net bir görsel seçin. Yapay zeka ürün görseli ve bilgilerini doğrulayacaktır.
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.aiInfoContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.aiInfoText}>
              Ürün bilgileri ve görseli yapay zeka tarafından doğrulanacaktır. Ürün adı ve görselin uyumlu olması önemlidir.
            </Text>
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
    marginBottom: 80,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  imageUploadBtn: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
  uploadSubText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  aiInfoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  aiInfoText: {
    flex: 1,
    marginLeft: 8,
    color: '#4a8e3a',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 