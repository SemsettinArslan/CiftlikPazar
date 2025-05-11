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
  SafeAreaView,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { cityAPI, categoryAPI } from '../../services/api';
// DateTimePicker hata verdiği için kaldıralım ve manuel yazalım
// import DateTimePicker from '@react-native-community/datetimepicker';

const FarmerRegisterStep2Screen = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    farmName: '',
    city: '',
    district: '',
    address: '',
    taxNumber: '',
    categories: [],
    hasShipping: false,
    description: ''
  });
  
  // Sertifikalar için state
  const [certificates, setCertificates] = useState([]);
  const [currentCertificate, setCurrentCertificate] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateNumber: '',
    certificateType: 'other',
    description: ''
  });
  
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const router = useRouter();
  
  // Sertifika ve tarih işlemleri için state'ler
  const [showIssueDateModal, setShowIssueDateModal] = useState(false);
  const [showExpiryDateModal, setShowExpiryDateModal] = useState(false);
  
  // Tarih seçici için basit yıl, ay, gün seçenekleri
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 30}, (_, i) => (currentYear - 15 + i).toString());
  const months = [
    { value: '01', label: 'Ocak' },
    { value: '02', label: 'Şubat' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Nisan' },
    { value: '05', label: 'Mayıs' },
    { value: '06', label: 'Haziran' },
    { value: '07', label: 'Temmuz' },
    { value: '08', label: 'Ağustos' },
    { value: '09', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];
  
  // Seçilen ay ve yıla göre gün sayısını hesapla
  const getDaysInMonth = (year, month) => {
    if (!year || !month) return Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
    return Array.from(
      {length: new Date(parseInt(year), parseInt(month), 0).getDate()}, 
      (_, i) => (i + 1).toString().padStart(2, '0')
    );
  };
  
  // Tarih seçiciler için state'ler
  const [selectedIssueDate, setSelectedIssueDate] = useState({
    day: '',
    month: '',
    year: ''
  });
  
  const [selectedExpiryDate, setSelectedExpiryDate] = useState({
    day: '',
    month: '',
    year: ''
  });
  
  // Verilme tarihi için gün sayısı
  const issueDays = getDaysInMonth(selectedIssueDate.year, selectedIssueDate.month);
  
  // Son geçerlilik tarihi için gün sayısı
  const expiryDays = getDaysInMonth(selectedExpiryDate.year, selectedExpiryDate.month);
  
  // Tarih modali gösterme/gizleme
  const toggleIssueDateModal = () => {
    setShowIssueDateModal(!showIssueDateModal);
  };
  
  const toggleExpiryDateModal = () => {
    setShowExpiryDateModal(!showExpiryDateModal);
  };
  
  // Seçilen tarih değişimini handle et
  const handleIssueDateChange = (field, value) => {
    const newDate = { ...selectedIssueDate, [field]: value };
    setSelectedIssueDate(newDate);
    
    // Tüm alanlar doluysa tarih stringini oluştur ve modal'da hemen göster
    if (newDate.year && newDate.month && newDate.day) {
      const dateString = `${newDate.year}-${newDate.month}-${newDate.day}`;
      handleCertificateChange('issueDate', dateString);
      
      // Save butonuyla kaydedilmeden güncel tarih metnini görmek için
      if (field === 'day') {
        // Kayıt işlemi için kısa bir bekleme ekle
        setTimeout(() => {
          console.log("Güncellenmiş tarih: ", dateString);
        }, 200);
      }
    }
  };
  
  const handleExpiryDateChange = (field, value) => {
    const newDate = { ...selectedExpiryDate, [field]: value };
    setSelectedExpiryDate(newDate);
    
    // Tüm alanlar doluysa tarih stringini oluştur ve modal'da hemen göster
    if (newDate.year && newDate.month && newDate.day) {
      const dateString = `${newDate.year}-${newDate.month}-${newDate.day}`;
      handleCertificateChange('expiryDate', dateString);
      
      // Save butonuyla kaydedilmeden güncel tarih metnini görmek için
      if (field === 'day') {
        // Kayıt işlemi için kısa bir bekleme ekle
        setTimeout(() => {
          console.log("Güncellenmiş son tarih: ", dateString);
        }, 200);
      }
    }
  };
  
  // Tarih formatını DD/MM/YYYY şeklinde göstermek için
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  // Sertifika ekleme öncesi temizle
  const resetDateStates = () => {
    setSelectedIssueDate({ year: '', month: '', day: '' });
    setSelectedExpiryDate({ year: '', month: '', day: '' });
  };
  
  // İl ve kategori verilerini yükle
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        // Tüm verileri paralel olarak yükle
        const promises = [];
        
        // 1. AsyncStorage'den kullanıcı verilerini al
        const userDataPromise = AsyncStorage.getItem('temp_farmer_registration');
        promises.push(userDataPromise);
        
        // 2. İlleri yükle - Promise olarak ekle
        const citiesPromise = cityAPI.getAllCities();
        promises.push(citiesPromise);
        
        // 3. Kategorileri yükle - Promise olarak ekle
        const categoriesPromise = categoryAPI.getAllCategories();
        promises.push(categoriesPromise);
        
        // Tüm Promise'ları paralel olarak çalıştır
        const [userData, citiesResponse, categoriesResponse] = await Promise.all(promises);
        
        // Kullanıcı verilerini kontrol et
        if (!userData) {
          Alert.alert('Hata', 'Kayıt bilgileri bulunamadı', [
            { text: 'Tamam', onPress: () => router.push('/farmer-register') }
          ]);
          return;
        }
        
        const parsedData = JSON.parse(userData);
        setUserData(parsedData);
        console.log('Çiftçi kayıt verileri yüklendi:', parsedData);

        // İlleri işle
        if (citiesResponse && citiesResponse.success && citiesResponse.data) {
          // İlleri alfabetik sırala
          const sortedCities = [...citiesResponse.data].sort((a, b) => {
            const nameA = a.name || a.il_adi || '';
            const nameB = b.name || b.il_adi || '';
            return nameA.localeCompare(nameB, 'tr');
          });
          
          console.log(`${sortedCities.length} il başarıyla yüklendi`);
          setCities(sortedCities);
        } else {
          console.error('İller yüklenemedi:', citiesResponse?.message || 'Bilinmeyen hata');
        }
        
        // Kategorileri işle
        if (categoriesResponse && categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
          console.log(`${categoriesResponse.data.length} kategori başarıyla yüklendi`);
        } else {
          // Varsayılan kategorileri kullan
          const defaultCategories = [
            { _id: '1', category_name: 'Sebze', subcategory: [] },
            { _id: '2', category_name: 'Meyve', subcategory: [] },
            { _id: '3', category_name: 'Tahıl', subcategory: [] },
            { _id: '4', category_name: 'Süt Ürünleri', subcategory: [] },
            { _id: '5', category_name: 'Et Ürünleri', subcategory: [] },
            { _id: '6', category_name: 'Organik Ürünler', subcategory: [] },
            { _id: '7', category_name: 'Bal & Arı Ürünleri', subcategory: [] },
            { _id: '8', category_name: 'Diğer', subcategory: [] },
          ];
          setCategories(defaultCategories);
          console.log('Varsayılan kategoriler yüklendi');
        }
        
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        Alert.alert("Hata", "Veriler yüklenirken bir hata oluştu");
      } finally {
        // Yükleme tamamlandı
        setDataLoading(false);
      }
    };

    loadData();
  }, [router]);
  
  // Şehir değişince ilçeleri yükle
  useEffect(() => {
    if (!formData.city) {
      setDistricts([]);
      return;
    }
    
    const fetchDistricts = async () => {
      try {
        setIsDistrictsLoading(true);
        console.log('İlçeler yükleniyor, seçilen il:', formData.city);
        
        // Seçilen şehri bul
        const selectedCity = cities.find(c => 
          c._id === formData.city || 
          c.cityid === formData.city || 
          c.city === formData.city || 
          c.name === formData.city
        );
        
        if (!selectedCity) {
          console.log('Seçilen il bulunamadı:', formData.city);
          setDistricts([]);
          setIsDistrictsLoading(false);
          return;
        }
        
        console.log('Seçilen il objesi:', selectedCity);
        
        // İlçeleri alma stratejisini belirle
        let districtsList = [];
        
        // 1. Yöntem: Doğrudan şehir nesnesindeki districts dizisini kullan
        if (selectedCity.districts && Array.isArray(selectedCity.districts) && selectedCity.districts.length > 0) {
          console.log('İl objesindeki ilçeler kullanılıyor');
          
          // districts verisinin formatını kontrol et
          if (typeof selectedCity.districts[0] === 'string') {
            // Doğrudan string dizisi
            districtsList = [...selectedCity.districts];
          } else if (typeof selectedCity.districts[0] === 'object') {
            // Özel format kontrolü: {"0":"B","1":"o","2":"z"...} formatında ilçe isimleri için
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
              return district.name || district.district || '';
            }).filter(Boolean); // null/undefined değerleri filtrele
            
            districtsList = processedDistricts;
          }
        } 
        // 2. Yöntem: API ile şehir ID'si üzerinden ilçeleri çek
        else if (selectedCity._id || selectedCity.cityid) {
          const cityId = selectedCity._id || selectedCity.cityid;
          console.log('cityId ile ilçeler getiriliyor:', cityId);
          
          const districtResponse = await cityAPI.getDistricts(cityId);
          
          if (districtResponse.success && districtResponse.data && Array.isArray(districtResponse.data)) {
            if (districtResponse.data.length > 0) {
              if (typeof districtResponse.data[0] === 'string') {
                districtsList = [...districtResponse.data];
              } else if (typeof districtResponse.data[0] === 'object') {
                districtsList = districtResponse.data
                  .filter((d) => d && (d.name || d.district))
                  .map((d) => d.district || d.name || '');
              }
            }
          }
        }
        // 3. Yöntem: API ile şehir adı üzerinden ilçeleri çek
        else if (selectedCity.name || selectedCity.city || selectedCity.il_adi) {
          const cityName = selectedCity.name || selectedCity.city || selectedCity.il_adi;
          console.log('İl adıyla ilçeler getiriliyor:', cityName);
          
          // URL'deki Türkçe karakterler için encode
          const encodedCityName = encodeURIComponent(cityName);
          
          // cityAPI kullanarak getir veya manuel fetch
          try {
            const districtResponse = await cityAPI.getDistricts(encodedCityName);
            
            if (districtResponse.success && districtResponse.data && Array.isArray(districtResponse.data)) {
              if (districtResponse.data.length > 0) {
                if (typeof districtResponse.data[0] === 'string') {
                  districtsList = [...districtResponse.data];
                } else if (typeof districtResponse.data[0] === 'object') {
                  districtsList = districtResponse.data
                    .filter((d) => d && (d.name || d.district))
                    .map((d) => d.district || d.name || '');
                }
              }
            }
          } catch (apiError) {
            console.error('İlçe API hatası:', apiError);
            
            // Hata durumunda selectedCity içindeki districts dizisini kontrol et
            if (selectedCity.districts && Array.isArray(selectedCity.districts)) {
              districtsList = selectedCity.districts;
            }
          }
        }
        
        // İlçeleri alfabetik sırala
        if (districtsList.length > 0) {
          console.log('İşlenmemiş ilçe listesi:', districtsList);
          
          const sortedDistricts = districtsList
            .filter(Boolean) // null/undefined değerleri filtrele
            .sort((a, b) => a.localeCompare(b, 'tr'));
          
          setDistricts(sortedDistricts);
          console.log(`${sortedDistricts.length} ilçe başarıyla yüklendi`);
        } else {
          console.log('Seçilen il için ilçe bulunamadı');
          setDistricts([]);
        }
        
        // İlçe seçimini sıfırla
        setFormData(prev => ({ ...prev, district: '' }));
        
      } catch (error) {
        console.error('İlçe yükleme hatası:', error);
        Alert.alert('Hata', 'İlçeler yüklenirken bir hata oluştu.');
        setDistricts([]);
      } finally {
        setIsDistrictsLoading(false);
      }
    };
    
    fetchDistricts();
  }, [formData.city, cities]);

  // Kategori bölümünü yeniden yapalım - kategori ve alt kategorileri gösteren bileşen
  const renderCategorySection = () => {
    return (
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Kategoriler *</Text>
        <Text style={styles.helperText}>Çiftliğinizin üretim kategorilerini seçin</Text>
        
        {categories.length > 0 ? (
          <View>
            {categories.map((category) => (
              <View key={category._id} style={styles.categoryContainer}>
                {/* Ana kategori checkboxu */}
                <View style={styles.checkboxContainer}>
                  <Switch
                    value={formData.categories.includes(category._id)}
                    onValueChange={(value) => handleCategoryChange(category._id, value)}
                    trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
                    thumbColor={formData.categories.includes(category._id) ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.categoryLabel}>
                    {category.category_name}
                    {!category.isActive && <Text style={styles.inactiveText}> (Pasif)</Text>}
                  </Text>
                </View>
                
                {/* Alt kategoriler varsa göster */}
                {category.subcategory && category.subcategory.length > 0 && (
                  <View style={styles.subcategoriesContainer}>
                    {category.subcategory.map((subcat, index) => (
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
    );
  };
  
  // İl/İlçe seçim bileşeni
  const renderCityDistrictSection = () => {
    return (
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
        
        {/* İl Seçimi */}
        <Text style={styles.label}>İl *</Text>
        <View style={styles.pickerContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#4CAF50" style={{padding: 10}} />
          ) : (
            <Picker
              selectedValue={formData.city}
              onValueChange={(value) => handleChange('city', value)}
              style={styles.picker}
              enabled={!isDistrictsLoading}
            >
              <Picker.Item label="İl Seçiniz" value="" />
              {cities.map((city, index) => (
                <Picker.Item 
                  key={index} 
                  label={city.name || city.il_adi || city.city || 'İsimsiz İl'} 
                  value={city.name || city.il_adi || city.city || city._id} 
                />
              ))}
            </Picker>
          )}
        </View>
        
        {/* İlçe Seçimi */}
        <Text style={styles.label}>İlçe *</Text>
        <View style={styles.pickerContainer}>
          {isDistrictsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>İlçeler yükleniyor...</Text>
              <ActivityIndicator 
                size="small" 
                color="#4CAF50" 
                style={styles.districtIndicator}
              />
            </View>
          ) : (
            <Picker
              selectedValue={formData.district}
              onValueChange={(value) => handleChange('district', value)}
              style={styles.picker}
              enabled={districts.length > 0}
            >
              <Picker.Item label={districts.length === 0 ? "Önce İl Seçiniz" : "İlçe Seçiniz"} value="" />
              {districts.map((district, index) => (
                <Picker.Item 
                  key={index} 
                  label={district} 
                  value={district} 
                />
              ))}
            </Picker>
          )}
        </View>
        
        <Text style={styles.label}>Adres *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Çiftliğinizin açık adresi"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          multiline
          numberOfLines={3}
        />
      </View>
    );
  };
  
  // Vergi numarası formatlama fonksiyonu
  const formatTaxNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // 11 haneye kısıtla
    return cleaned.slice(0, 11);
  };

  const handleChange = (name, value) => {
    if (name === 'taxNumber') {
      const formattedTaxNumber = formatTaxNumber(value);
      setFormData({
        ...formData,
        [name]: formattedTaxNumber
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Kategori değişim işleyicisi
  const handleCategoryChange = (categoryId, isSelected) => {
    if (isSelected) {
      // Kategoriyi ekle
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, categoryId]
      }));
    } else {
      // Kategoriyi çıkar
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(id => id !== categoryId)
      }));
    }
  };

  // Sertifika değişimlerini işle
  const handleCertificateChange = (name, value) => {
    if ((name === 'issueDate' || name === 'expiryDate') && value) {
      value = formatDate(value);
    }
    setCurrentCertificate(prev => ({ ...prev, [name]: value }));
  };

  // Yeni sertifika ekleme
  const addCertificate = () => {
    // Zorunlu alanları kontrol et
    if (!currentCertificate.name || !currentCertificate.issuer || !currentCertificate.issueDate) {
      Alert.alert('Hata', 'Lütfen zorunlu sertifika alanlarını doldurun (Sertifika Adı, Veren Kurum, Verilme Tarihi)');
      return;
    }
    
    // Sertifikayı ekle - id alanını kaldırdık, MongoDB otomatik oluşturacak
    setCertificates([...certificates, { ...currentCertificate }]);
    
    // Sertifika formunu temizle
    setCurrentCertificate({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      certificateNumber: '',
      certificateType: 'other',
      description: ''
    });
    
    // Tarih seçicileri temizle
    resetDateStates();
  };

  // Sertifika silme
  const removeCertificate = (index) => {
    // id yerine index ile sil
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  // Tarih formatını düzenleyen fonksiyon
  const formatDate = (dateString) => {
    // Tarihi YYYY-MM-DD formatına çevirir
    if (!dateString) return '';
    
    // Tarih zaten formatlanmışsa döndür
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateString)) return dateString;
    
    try {
      // Input'tan noktaları ve slash'leri tire olarak standardize et
      const normalized = dateString.replace(/[\.\/]/g, '-');
      
      const parts = normalized.split('-');
      if (parts.length === 3) {
        // Farklı giriş formatlarına uyum sağla
        let year, month, day;
        
        // Yıl son kısımda ise (DD-MM-YYYY formatı)
        if (parts[2].length === 4 || parseInt(parts[2]) > 31) {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2].padStart(4, '0');
        }
        // Yıl ilk kısımda ise (YYYY-MM-DD formatı)
        else if (parts[0].length === 4 || parseInt(parts[0]) > 31) {
          year = parts[0].padStart(4, '0');
          month = parts[1].padStart(2, '0');
          day = parts[2].padStart(2, '0');
        }
        // Diğer durumlar için yerel tarih formatına göre varsayılan davran
        else {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2].length === 2 ? `20${parts[2].padStart(2, '0')}` : parts[2].padStart(4, '0');
        }
        
        return `${year}-${month}-${day}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // API URL'ini Platform'a göre belirle
  const getApiUrl = () => {
    // Android emülatörde localhost yerine 10.0.2.2 kullanılır
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api'; // Android için localhost
    } else {
      return 'http://localhost:5000/api'; // iOS için localhost
    }
  };

  let API_URL = getApiUrl();

  // API çağrısı ve hata yönetimi
  const handleSubmit = async () => {
    const { farmName, city, district, address, taxNumber, categories, hasShipping, description } = formData;
    
    // Form validation
    if (!farmName || !city || !district || !address || !taxNumber || categories.length === 0) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    // Vergi numarası kontrolü
    if (taxNumber.length < 10 || taxNumber.length > 11) {
      Alert.alert('Hata', 'Vergi numarası 10 veya 11 haneli olmalıdır.');
      return;
    }

    if (!userData) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı. Lütfen baştan kayıt işlemine başlayın.');
      router.push('/farmer-register');
      return;
    }

    setLoading(true);
    
    try {
      // API'yi çağır
      const response = await fetch(`${API_URL}/farmers/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Kullanıcı verileri
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          // Çiftlik verileri  
          farmInfo: {
            farmName,
            city: city,
            district,
            address,
            taxNumber,
            categories,
            hasShipping,
            description
          },
          // Sertifika verileri
          certificates: certificates
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Özel hata mesajları
        let errorMessage = data.message || 'Bir hata oluştu';
        
        // Yaygın hata türleri için özel mesajlar
        if (errorMessage.includes('e-posta')) {
          Alert.alert('Kayıt Hatası', 'Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi deneyiniz.');
          return;
        } else if (errorMessage.includes('telefon')) {
          Alert.alert('Kayıt Hatası', 'Bu telefon numarası zaten kullanılıyor. Lütfen farklı bir telefon numarası deneyiniz.');
          return;
        } else if (errorMessage.includes('vergi') || errorMessage.includes('taxNumber')) {
          Alert.alert('Kayıt Hatası', 'Bu vergi numarası zaten kullanılıyor. Lütfen vergi numaranızı kontrol ediniz.');
          return;
        }
        
        Alert.alert('Kayıt Hatası', errorMessage);
        return;
      }
      
      // Kayıt tamamlandı
      await AsyncStorage.removeItem('temp_farmer_registration');
      Alert.alert(
        'Başarılı', 
        'Çiftlik kaydınız başarıyla oluşturuldu. Başvurunuz onaylandıktan sonra ürünlerinizi ekleyebilirsiniz.',
        [{ text: 'Tamam', onPress: () => router.push('/farmer-register-complete') }]
      );
    } catch (error) {
      Alert.alert('Kayıt Hatası', 'Çiftlik kaydı sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render etme işlemini güncelle
  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Ionicons name="leaf-outline" size={40} color="#4CAF50" />
          <Text style={styles.headerTitle}>Çiftlik Bilgileri</Text>
          <Text style={styles.headerSubtitle}>Lütfen çiftliğiniz hakkında bilgi verin</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          
          <Text style={styles.label}>Çiftlik Adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="Çiftliğinizin adı"
            value={formData.farmName}
            onChangeText={(text) => handleChange('farmName', text)}
          />
          
          <Text style={styles.label}>Vergi Numarası *</Text>
          <TextInput
            style={styles.input}
            placeholder="Vergi numaranız"
            value={formData.taxNumber}
            onChangeText={(text) => handleChange('taxNumber', text)}
            keyboardType="number-pad"
          />
          {formData.taxNumber && (formData.taxNumber.length < 10 || formData.taxNumber.length > 11) && (
            <Text style={styles.errorText}>Vergi numarası 10 veya 11 haneli olmalıdır</Text>
          )}
        </View>
        
        {renderCityDistrictSection()}
        
        {renderCategorySection()}
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Teslimat Seçeneği</Text>
          <View style={styles.checkboxContainer}>
            <Switch
              value={formData.hasShipping}
              onValueChange={(value) => handleChange('hasShipping', value)}
              trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
              thumbColor={formData.hasShipping ? '#fff' : '#f4f3f4'}
            />
            <Text style={styles.checkboxLabel}>Teslimat Hizmeti Sunuyorum</Text>
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Çiftliğiniz hakkında kısa bir açıklama"
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Sertifikalar Bölümü - Eklendi */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Sertifikalar</Text>
          <Text style={styles.helperText}>Varsa çiftliğinize ait sertifikaları ekleyin</Text>
          
          {certificates.length > 0 && (
            <View style={styles.certificatesList}>
              {certificates.map((cert, index) => (
                <View key={index} style={styles.certificateItem}>
                  <View style={styles.certificateInfo}>
                    <Text style={styles.certificateName}>{cert.name}</Text>
                    <Text style={styles.certificateDetails}>
                      {cert.issuer} • {formatDisplayDate(cert.issueDate)}
                      {cert.expiryDate ? ` - ${formatDisplayDate(cert.expiryDate)}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCertificate(index)}>
                    <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.certificateForm}>
            <Text style={styles.subSectionTitle}>Yeni Sertifika Ekle</Text>
            
            <Text style={styles.label}>Sertifika Adı *</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Organik Tarım Sertifikası"
              value={currentCertificate.name}
              onChangeText={(text) => handleCertificateChange('name', text)}
            />
            
            <Text style={styles.label}>Veren Kurum *</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Tarım Bakanlığı"
              value={currentCertificate.issuer}
              onChangeText={(text) => handleCertificateChange('issuer', text)}
            />
            
            <Text style={styles.label}>Verilme Tarihi *</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={toggleIssueDateModal}
            >
              <Text style={currentCertificate.issueDate ? styles.dateText : styles.dateTextPlaceholder}>
                {currentCertificate.issueDate 
                  ? formatDisplayDate(currentCertificate.issueDate)
                  : "Tarih Seçiniz"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.label}>Son Geçerlilik Tarihi</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={toggleExpiryDateModal}
            >
              <Text style={currentCertificate.expiryDate ? styles.dateText : styles.dateTextPlaceholder}>
                {currentCertificate.expiryDate 
                  ? formatDisplayDate(currentCertificate.expiryDate)
                  : "Tarih Seçiniz (Opsiyonel)"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.label}>Sertifika Türü</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={currentCertificate.certificateType}
                onValueChange={(value) => handleCertificateChange('certificateType', value)}
                style={styles.picker}
              >
                <Picker.Item label="Organik Tarım" value="organic" />
                <Picker.Item label="İyi Tarım Uygulamaları" value="goodAgriculturalPractices" />
                <Picker.Item label="Sürdürülebilirlik" value="sustainability" />
                <Picker.Item label="Kalite Güvence" value="qualityAssurance" />
                <Picker.Item label="Diğer" value="other" />
              </Picker>
            </View>
            
            <Text style={styles.label}>Sertifika Numarası</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: ORG-2023-12345 (Opsiyonel)"
              value={currentCertificate.certificateNumber}
              onChangeText={(text) => handleCertificateChange('certificateNumber', text)}
            />
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={addCertificate}
            >
              <Text style={styles.secondaryButtonText}>Sertifika Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Kaydı Tamamla</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Tarih seçici modal'ları */}
      <Modal
        visible={showIssueDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleIssueDateModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verilme Tarihi Seç</Text>
            
            <View style={styles.datePickerRow}>
              <View style={[styles.datePickerItem, {flex: 2}]}>
                <Text style={styles.datePickerLabel}>Gün</Text>
                <Picker
                  selectedValue={selectedIssueDate.day}
                  onValueChange={(value) => handleIssueDateChange('day', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Gün" value="" />
                  {issueDays.map((day, index) => (
                    <Picker.Item key={index} label={day} value={day} />
                  ))}
                </Picker>
              </View>
              
              <View style={[styles.datePickerItem, {flex: 3}]}>
                <Text style={styles.datePickerLabel}>Ay</Text>
                <Picker
                  selectedValue={selectedIssueDate.month}
                  onValueChange={(value) => handleIssueDateChange('month', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Ay" value="" />
                  {months.map((month, index) => (
                    <Picker.Item key={index} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
              
              <View style={[styles.datePickerItem, {flex: 2.5}]}>
                <Text style={styles.datePickerLabel}>Yıl</Text>
                <Picker
                  selectedValue={selectedIssueDate.year}
                  onValueChange={(value) => handleIssueDateChange('year', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Yıl" value="" />
                  {years.map((year, index) => (
                    <Picker.Item key={index} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={toggleIssueDateModal}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => {
                  if (selectedIssueDate.year && selectedIssueDate.month && selectedIssueDate.day) {
                    const dateString = `${selectedIssueDate.year}-${selectedIssueDate.month}-${selectedIssueDate.day}`;
                    handleCertificateChange('issueDate', dateString);
                  }
                  toggleIssueDateModal();
                }}
              >
                <Text style={[styles.modalButtonText, {color: '#fff'}]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
            
            {/* Seçilen tarihi modal içinde göster */}
            {selectedIssueDate.year && selectedIssueDate.month && selectedIssueDate.day && (
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateText}>
                  Seçilen Tarih: {selectedIssueDate.day}/{selectedIssueDate.month}/{selectedIssueDate.year}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showExpiryDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleExpiryDateModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Son Geçerlilik Tarihi Seç</Text>
            
            <View style={styles.datePickerRow}>
              <View style={[styles.datePickerItem, {flex: 2}]}>
                <Text style={styles.datePickerLabel}>Gün</Text>
                <Picker
                  selectedValue={selectedExpiryDate.day}
                  onValueChange={(value) => handleExpiryDateChange('day', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Gün" value="" />
                  {expiryDays.map((day, index) => (
                    <Picker.Item key={index} label={day} value={day} />
                  ))}
                </Picker>
              </View>
              
              <View style={[styles.datePickerItem, {flex: 3}]}>
                <Text style={styles.datePickerLabel}>Ay</Text>
                <Picker
                  selectedValue={selectedExpiryDate.month}
                  onValueChange={(value) => handleExpiryDateChange('month', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Ay" value="" />
                  {months.map((month, index) => (
                    <Picker.Item key={index} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
              
              <View style={[styles.datePickerItem, {flex: 2.5}]}>
                <Text style={styles.datePickerLabel}>Yıl</Text>
                <Picker
                  selectedValue={selectedExpiryDate.year}
                  onValueChange={(value) => handleExpiryDateChange('year', value)}
                  style={styles.datePicker}
                >
                  <Picker.Item label="Yıl" value="" />
                  {years.map((year, index) => (
                    <Picker.Item key={index} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={toggleExpiryDateModal}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => {
                  if (selectedExpiryDate.year && selectedExpiryDate.month && selectedExpiryDate.day) {
                    const dateString = `${selectedExpiryDate.year}-${selectedExpiryDate.month}-${selectedExpiryDate.day}`;
                    handleCertificateChange('expiryDate', dateString);
                  }
                  toggleExpiryDateModal();
                }}
              >
                <Text style={[styles.modalButtonText, {color: '#fff'}]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
            
            {/* Son geçerlilik tarihini modal içinde göster */}
            {selectedExpiryDate.year && selectedExpiryDate.month && selectedExpiryDate.day && (
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateText}>
                  Seçilen Tarih: {selectedExpiryDate.day}/{selectedExpiryDate.month}/{selectedExpiryDate.year}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    marginTop: 15,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        paddingHorizontal: 10,
      },
    }),
  },
  picker: {
    ...Platform.select({
      android: {
        backgroundColor: 'transparent',
      },
    }),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  certificatesList: {
    marginBottom: 20,
  },
  certificateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  certificateDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  certificateForm: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
  },
  secondaryButton: {
    backgroundColor: '#3d8c40',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  dateTextPlaceholder: {
    color: '#aaa',
    fontSize: 16,
  },
  districtIndicator: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  datePicker: {
    ...Platform.select({
      android: {
        backgroundColor: 'transparent',
      },
    }),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerItem: {
    paddingHorizontal: 5,
  },
  datePickerLabel: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    margin: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  selectedDateContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
    padding: 10,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#4CAF50',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  categoryContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
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
  inactiveText: {
    color: '#999',
    fontStyle: 'italic'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 50,
  },
  loadingText: {
    color: '#666',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default FarmerRegisterStep2Screen; 