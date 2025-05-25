import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Button,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { getApiBaseUrl } from '../src/utils/networkUtils';

const API_URL = getApiBaseUrl();

// İnterfaceleri tanımla
interface Category {
  _id: string;
  name: string;
}

interface City {
  _id: string;
  city?: string;
  name?: string;
  districts?: any[]; // İlçe listesi için eklendi
}

interface FormData {
  title: string;
  description: string;
  category: string;
  quantity: string;
  unit: string;
  city: string;
  district: string;
  budget: string;
  deadline: Date;
  isOrganic: boolean;
  specifications: string;
}

export default function CreateRequestScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    city: '',
    district: '',
    budget: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonrası
    isOrganic: false,
    specifications: ''
  });

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);

  // Tarih seçimi için gerekli state'ler
  const [selectedDate, setSelectedDate] = useState({
    day: formData.deadline.getDate().toString(),
    month: (formData.deadline.getMonth() + 1).toString(),
    year: formData.deadline.getFullYear().toString()
  });

  // Şu anki tarihten itibaren 30 gün için günler
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Aylar
  const months = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  // Yıllar (şimdiki yıldan itibaren 10 yıl)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

  // Verileri yükle
  useEffect(() => {
    fetchCategories();
    fetchCities();
  }, []);

  // İl değiştiğinde ilçeleri getir
  useEffect(() => {
    if (formData.city) {
      fetchDistricts(formData.city);
    }
  }, [formData.city]);

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      console.log(`Kategoriler getiriliyor: ${API_URL}/categories?limit=1000`);
      
      const response = await axios.get(`${API_URL}/categories?limit=1000`);
      
      // Response'u logla
      console.log('Kategori API yanıtı:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // API yanıtındaki kategori yapısını logla
        if (response.data.data.length > 0) {
          console.log('İlk kategori örneği:', response.data.data[0]);
          console.log(`Toplam ${response.data.data.length} kategori alındı`);
        }
        
        // Kategori verilerini düzenle (name ve category_name alanlarına göre)
        const formattedCategories = response.data.data.map((category: any) => ({
          _id: category._id,
          name: category.name || category.category_name || 'İsimsiz Kategori' // name veya category_name alanını kullan
        }));
        
        console.log(`${formattedCategories.length} kategori işlendi`);
        setCategories(formattedCategories);
      } else if (response.data.data) {
        // Alternatif API yanıt yapısı
        console.log('Alternatif API yanıt yapısı bulundu');
        const data = response.data.data;
        
        if (Array.isArray(data)) {
          const formattedCategories = data.map((category: any) => ({
            _id: category._id,
            name: category.name || category.category_name || 'İsimsiz Kategori'
          }));
          
          console.log(`${formattedCategories.length} kategori işlendi (alternatif)`);
          setCategories(formattedCategories);
        } else {
          console.error('Kategori verisi dizi değil:', data);
          // Varsayılan kategorileri kullan
          setCategories(getDefaultCategories());
        }
      } else {
        console.error('API yanıtında başarı durumu veya veri yok:', response.data);
        // Varsayılan kategorileri kullan
        setCategories(getDefaultCategories());
      }
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios hata detayı:', err.response?.data);
      }
      // Hata durumunda varsayılan kategorileri kullan
      setCategories(getDefaultCategories());
    } finally {
      setCategoryLoading(false);
    }
  };

  // Varsayılan kategoriler
  const getDefaultCategories = (): Category[] => {
    return [
      { _id: '1', name: 'Sebze' },
      { _id: '2', name: 'Meyve' },
      { _id: '3', name: 'Tahıl' },
      { _id: '4', name: 'Süt Ürünleri' },
      { _id: '5', name: 'Et Ürünleri' },
      { _id: '6', name: 'Organik Ürünler' },
      { _id: '7', name: 'Baklagiller' },
      { _id: '8', name: 'Diğer' }
    ];
  };

  // İlleri getir
  const fetchCities = async () => {
    try {
      setCityLoading(true);
      console.log(`İller getiriliyor: ${API_URL}/cities`);
      
      const response = await axios.get(`${API_URL}/cities`);
      
      // Response'u logla
      console.log('Şehir API yanıtı:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // API yanıtındaki şehir yapısını logla
        if (response.data.data.length > 0) {
          console.log('İlk şehir örneği:', response.data.data[0]);
        }
        
        setCities(response.data.data);
        console.log(`${response.data.data.length} şehir başarıyla yüklendi`);
      } else {
        console.error('API yanıtında başarı durumu veya veri yok:', response.data);
        // Varsayılan şehirleri kullan (boş dizi yerine)
        setCities(getDefaultCities());
      }
    } catch (err) {
      console.error('İller yüklenirken hata:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios hata detayı:', err.response?.data);
      }
      // Hata durumunda varsayılan şehirleri kullan
      setCities(getDefaultCities());
    } finally {
      setCityLoading(false);
    }
  };

  // İlçeleri getir
  const fetchDistricts = async (city: string) => {
    try {
      setDistrictLoading(true);
      setDistricts([]);
      
      // Şehir ID'sini bul
      const selectedCity = cities.find(c => 
        (c.city && c.city.toLowerCase() === city.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === city.toLowerCase())
      );
      
      if (!selectedCity) {
        console.error(`"${city}" şehri için eşleşen kayıt bulunamadı`);
        console.log('Mevcut şehir listesi:', cities.map(c => c.city || c.name));
        setDistrictLoading(false);
        return;
      }
      
      const cityId = selectedCity._id;
      console.log(`İlçeler getiriliyor (${city} - ID: ${cityId}): ${API_URL}/cities/${cityId}/districts`);
      
      // İlçeleri alma stratejisini belirle
      let districtsList: string[] = [];
      
      // 1. Yöntem: Doğrudan şehir nesnesindeki districts dizisini kullan
      if (selectedCity.districts && Array.isArray(selectedCity.districts) && selectedCity.districts.length > 0) {
        console.log('İl objesindeki ilçeler kullanılıyor');
        
        // districts verisinin formatını kontrol et
        if (typeof selectedCity.districts[0] === 'string') {
          // Doğrudan string dizisi
          districtsList = [...selectedCity.districts];
        } else if (typeof selectedCity.districts[0] === 'object') {
          // Obje formatındaki districts
          const processedDistricts = selectedCity.districts.map((district: any) => {
            if (district.name) return district.name;
            if (district.district) return district.district;
            
            // Karakter bazlı indekslenmiş ilçe isimleri için
            const keys = Object.keys(district).filter(key => !isNaN(Number(key)));
            if (keys.length > 0) {
              const sortedKeys = keys.sort((a, b) => Number(a) - Number(b));
              return sortedKeys.map(key => district[key]).join('');
            }
            
            return '';
          }).filter(Boolean);
          
          districtsList = processedDistricts;
        }
      } 
      // 2. Yöntem: API ile şehir ID'si üzerinden ilçeleri çek
      else {
        const response = await axios.get(`${API_URL}/cities/${cityId}/districts`);
        
        // Response'u logla
        console.log('İlçe API yanıtı:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          if (response.data.data.length > 0) {
            if (typeof response.data.data[0] === 'string') {
              districtsList = [...response.data.data];
            } else if (typeof response.data.data[0] === 'object') {
              districtsList = response.data.data
                .filter((d: any) => d && (d.name || d.district))
                .map((d: any) => d.district || d.name || '');
            }
          }
        }
      }
      
      // 3. Yöntem: Eğer ilçe listesi boşsa, API'ye şehir adı ile sor
      if (districtsList.length === 0 && (selectedCity.name || selectedCity.city)) {
        const cityName = selectedCity.name || selectedCity.city;
        const encodedCityName = encodeURIComponent(cityName || '');
        
        console.log(`İlçeler ad ile getiriliyor: ${API_URL}/cities/name/${encodedCityName}/districts`);
        
        try {
          const response = await axios.get(`${API_URL}/cities/name/${encodedCityName}/districts`);
          
          if (response.data.success && Array.isArray(response.data.data)) {
            if (response.data.data.length > 0) {
              if (typeof response.data.data[0] === 'string') {
                districtsList = [...response.data.data];
              } else if (typeof response.data.data[0] === 'object') {
                districtsList = response.data.data
                  .filter((d: any) => d && (d.name || d.district))
                  .map((d: any) => d.district || d.name || '');
              }
            }
          }
        } catch (nameError) {
          console.error('Şehir adına göre ilçe getirme hatası:', nameError);
        }
      }
      
      // İlçeleri alfabetik sırala
      if (districtsList.length > 0) {
        const sortedDistricts = districtsList
          .filter(Boolean) // null/undefined değerleri filtrele
          .sort((a, b) => a.localeCompare(b, 'tr'));
        
        setDistricts(sortedDistricts);
        console.log(`${sortedDistricts.length} ilçe başarıyla yüklendi (${city} için)`);
      } else {
        console.log('Hiç ilçe bulunamadı, varsayılan ilçeleri kullanıyorum');
        setDistricts(getDefaultDistricts(city));
      }
    } catch (err) {
      console.error('İlçeler yüklenirken hata:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios hata detayı:', err.response?.data);
      }
      // Hata durumunda varsayılan ilçeleri kullan
      setDistricts(getDefaultDistricts(city));
    } finally {
      setDistrictLoading(false);
    }
  };
  
  // Varsayılan şehirler
  const getDefaultCities = (): City[] => {
    return [
      { _id: '1', city: 'İstanbul' },
      { _id: '2', city: 'Ankara' },
      { _id: '3', city: 'İzmir' },
      { _id: '4', city: 'Bursa' },
      { _id: '5', city: 'Antalya' },
      { _id: '6', city: 'Adana' },
      { _id: '7', city: 'Konya' },
      { _id: '8', city: 'Kayseri' }
    ];
  };
  
  // Varsayılan ilçeler (şehre göre)
  const getDefaultDistricts = (city: string): string[] => {
    const lowerCity = city.toLowerCase();
    
    if (lowerCity === 'istanbul') {
      return ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Fatih'];
    } else if (lowerCity === 'ankara') {
      return ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut'];
    } else if (lowerCity === 'izmir') {
      return ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli'];
    } else {
      return ['Merkez']; // Diğer şehirler için basit bir değer
    }
  };

  // Input değişikliği
  const handleChange = (name: keyof FormData, value: string | boolean) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    // İl değişince ilçeyi sıfırla
    if (name === 'city') {
      setFormData(prevState => ({
        ...prevState,
        district: ''
      }));
    }
  };

  // Tarih seçimini güncelle
  const handleDatePartChange = (field: 'day' | 'month' | 'year', value: string) => {
    // Önce state'i güncelle
    setSelectedDate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Tarihi kaydet ve formData'yı güncelle
  const saveDateSelection = () => {
    try {
      // Seçilen tarih parçalarını integer'a çevir
      const day = parseInt(selectedDate.day);
      const month = parseInt(selectedDate.month) - 1; // JavaScript'te ay 0-11 arasında
      const year = parseInt(selectedDate.year);
      
      // Geçerli tarih kontrolü
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const newDate = new Date(year, month, day);
        
        // Geçerli bir tarih mi diye kontrol et
        if (!isNaN(newDate.getTime())) {
          // formData'yı güncelle
          setFormData({
            ...formData,
            deadline: newDate
          });
          console.log('Tarih güncellendi:', newDate.toLocaleDateString());
        } else {
          console.error('Geçersiz tarih oluşturuldu');
        }
      } else {
        console.error('Geçersiz tarih bileşenleri:', selectedDate);
      }
    } catch (err) {
      console.error('Tarih güncellenirken hata:', err);
    }
    
    // Modalı kapat
    setShowDatePicker(false);
  };

  // Form gönderme
  const handleSubmit = async () => {
    // Validasyon
    if (!formData.title) {
      setError('Talep başlığı gereklidir');
      return;
    }
    
    if (!formData.description) {
      setError('Açıklama gereklidir');
      return;
    }
    
    if (!formData.category) {
      setError('Kategori seçimi gereklidir');
      return;
    }
    
    if (!formData.quantity || isNaN(Number(formData.quantity))) {
      setError('Geçerli bir miktar giriniz');
      return;
    }
    
    if (!formData.city) {
      setError('İl seçimi gereklidir');
      return;
    }
    
    if (!formData.district) {
      setError('İlçe seçimi gereklidir');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const token = user?.token;
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı');
        setLoading(false);
        return;
      }
      
      // API'ye gönderilecek veri
      const requestData = {
        ...formData,
        quantity: Number(formData.quantity),
        budget: formData.budget ? Number(formData.budget) : undefined
      };
      
      console.log(`API isteği gönderiliyor: ${API_URL}/requests`);
      console.log('İstek verisi:', JSON.stringify(requestData));
      
      const response = await axios.post(
        `${API_URL}/requests`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        console.log('Talep başarıyla oluşturuldu:', response.data.data._id);
        setSuccess('Talep başarıyla oluşturuldu');
        
        // Form verilerini sıfırla
        setFormData({
          title: '',
          description: '',
          category: '',
          quantity: '',
          unit: 'kg',
          city: '',
          district: '',
          budget: '',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isOrganic: false,
          specifications: ''
        });
        
        // 2 saniye sonra talep listesine dön
        setTimeout(() => {
          // Yenileme parametresiyle geri dön
          router.push({
            pathname: 'company-requests',
            params: { refresh: 'true', timestamp: Date.now() }
          } as any);
        }, 2000);
      } else {
        console.error('API başarılı yanıt vermedi:', response.data);
        setError(response.data.message || 'Talep oluşturulurken bir hata oluştu');
      }
    } catch (err) {
      console.error('Talep oluşturma hatası:', err);
      if (axios.isAxiosError(err)) {
        console.error('Hata detayı:', err.response?.data || 'Yanıt verisi yok');
        console.error('Hata kodu:', err.response?.status || 'Durum kodu yok');
      }
      setError('Talep oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatlama
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('tr-TR', options);
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
          title: 'Yeni Talep Oluştur',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#FF9800',
          },
        }}
      />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Bilgi Kutusu */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#1976D2" />
          <Text style={styles.infoText}>
            Tedarik talebinizi oluşturarak çiftçilerden teklif alabilirsiniz. Talebinizi mümkün olduğunca detaylı açıklayın.
          </Text>
        </View>
        
        {/* Hata Mesajı */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {/* Başarı Mesajı */}
        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}
        
        <View style={styles.formContainer}>
          {/* Talep Başlığı */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="document-text-outline" size={16} color="#FF9800" /> Talep Başlığı
            </Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              placeholder="Talebinizi kısaca adlandırın"
              placeholderTextColor="#aaa"
              maxLength={100}
            />
          </View>
          
          {/* Kategori */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="layers-outline" size={16} color="#FF9800" /> Kategori
            </Text>
            <View style={styles.pickerContainer}>
              {categoryLoading ? (
                <View style={styles.loadingContainerInline}>
                  <ActivityIndicator size="small" color="#FF9800" />
                  <Text style={styles.loadingText}>Kategoriler yükleniyor...</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Kategori Seçin" value="" />
                  {categories.map((category) => (
                    <Picker.Item 
                      key={category._id} 
                      label={category.name} 
                      value={category._id} 
                    />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          
          {/* Miktar ve Birim */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>
                <Ionicons name="cube-outline" size={16} color="#FF9800" /> Miktar
              </Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(value) => handleChange('quantity', value)}
                placeholder="Miktar girin"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>
                <Ionicons name="options-outline" size={16} color="#FF9800" /> Birim
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => handleChange('unit', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Kg" value="kg" />
                  <Picker.Item label="G" value="g" />
                  <Picker.Item label="Adet" value="adet" />
                  <Picker.Item label="Litre" value="litre" />
                  <Picker.Item label="Demet" value="demet" />
                  <Picker.Item label="Paket" value="paket" />
                </Picker>
              </View>
            </View>
          </View>
          
          {/* İl */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location-outline" size={16} color="#FF9800" /> İl
            </Text>
            <View style={styles.pickerContainer}>
              {cityLoading ? (
                <View style={styles.loadingContainerInline}>
                  <ActivityIndicator size="small" color="#FF9800" />
                  <Text style={styles.loadingText}>İller yükleniyor...</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={formData.city}
                  onValueChange={(value) => handleChange('city', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="İl Seçin" value="" />
                  {cities.map((city) => (
                    <Picker.Item 
                      key={city._id} 
                      label={city.city || city.name || ''} 
                      value={city.city || city.name || ''} 
                    />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          
          {/* İlçe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="navigate-outline" size={16} color="#FF9800" /> İlçe
            </Text>
            <View style={styles.pickerContainer}>
              {districtLoading ? (
                <View style={styles.loadingContainerInline}>
                  <ActivityIndicator size="small" color="#FF9800" />
                  <Text style={styles.loadingText}>İlçeler yükleniyor...</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={formData.district}
                  onValueChange={(value) => handleChange('district', value)}
                  style={styles.picker}
                  enabled={formData.city !== '' && districts.length > 0}
                >
                  <Picker.Item label={formData.city === '' ? "Önce İl Seçin" : "İlçe Seçin"} value="" />
                  {districts.map((district, index) => (
                    <Picker.Item key={index} label={district} value={district} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          
          {/* Bütçe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="cash-outline" size={16} color="#FF9800" /> Bütçe (₺, Opsiyonel)
            </Text>
            <TextInput
              style={styles.input}
              value={formData.budget}
              onChangeText={(value) => handleChange('budget', value)}
              placeholder="Bütçe girin"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
          
          {/* Son Teslim Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="calendar-outline" size={16} color="#FF9800" /> Son Teslim Tarihi
            </Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(formData.deadline)}</Text>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Tarih Seçin</Text>
                    
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'center', marginBottom: 8 }}>Gün</Text>
                        <ScrollView style={{ height: 120 }}>
                          {days.map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={{
                                padding: 10,
                                backgroundColor: d === selectedDate.day ? '#FF9800' : 'transparent',
                                borderRadius: 4,
                                margin: 2,
                              }}
                              onPress={() => handleDatePartChange('day', d)}
                            >
                              <Text style={{ color: d === selectedDate.day ? '#fff' : '#333', textAlign: 'center' }}>{d}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                      
                      <View style={{ flex: 2 }}>
                        <Text style={{ textAlign: 'center', marginBottom: 8 }}>Ay</Text>
                        <ScrollView style={{ height: 120 }}>
                          {months.map((m) => (
                            <TouchableOpacity
                              key={m.value}
                              style={{
                                padding: 10,
                                backgroundColor: m.value === selectedDate.month ? '#FF9800' : 'transparent',
                                borderRadius: 4,
                                margin: 2,
                              }}
                              onPress={() => handleDatePartChange('month', m.value)}
                            >
                              <Text style={{ color: m.value === selectedDate.month ? '#fff' : '#333', textAlign: 'center' }}>{m.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'center', marginBottom: 8 }}>Yıl</Text>
                        <ScrollView style={{ height: 120 }}>
                          {years.map((y) => (
                            <TouchableOpacity
                              key={y}
                              style={{
                                padding: 10,
                                backgroundColor: y === selectedDate.year ? '#FF9800' : 'transparent',
                                borderRadius: 4,
                                margin: 2,
                              }}
                              onPress={() => handleDatePartChange('year', y)}
                            >
                              <Text style={{ color: y === selectedDate.year ? '#fff' : '#333', textAlign: 'center' }}>{y}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: '#f0f0f0' }]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={{ color: '#333' }}>İptal</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: '#FF9800' }]}
                        onPress={saveDateSelection}
                      >
                        <Text style={{ color: '#fff' }}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
          
          {/* Organik Ürün */}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="leaf-outline" size={16} color="#FF9800" /> Organik Ürün İstiyorum
            </Text>
            <Switch
              value={formData.isOrganic}
              onValueChange={(value) => handleChange('isOrganic', value)}
              trackColor={{ false: '#ddd', true: '#81C784' }}
              thumbColor={formData.isOrganic ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          
          {/* Açıklama */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="create-outline" size={16} color="#FF9800" /> Açıklama
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Talebinizi detaylı açıklayın"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{formData.description.length}/1000</Text>
          </View>
          
          {/* Özel Gereksinimler */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="list-outline" size={16} color="#FF9800" /> Özel Gereksinimler (Opsiyonel)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.specifications}
              onChangeText={(value) => handleChange('specifications', value)}
              placeholder="Özel isteklerinizi belirtin"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{formData.specifications.length}/500</Text>
          </View>
          
          {/* Gönder Butonu */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Talebi Oluştur</Text>
              </>
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
  formContainer: {
    padding: 16,
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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%',
  },
}); 