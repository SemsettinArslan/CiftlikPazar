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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { getApiBaseUrl } from '../../utils/networkUtils';

const API_URL = getApiBaseUrl();

// Firma türleri
const companyTypes = [
  { value: 'restaurant', label: 'Restoran / Kafe' },
  { value: 'hotel', label: 'Otel / Konaklama' },
  { value: 'market', label: 'Market / Bakkal' },
  { value: 'processor', label: 'Gıda İşleyici / Üretici' },
  { value: 'exporter', label: 'İhracatçı' },
  { value: 'other', label: 'Diğer' }
];

const CompanyRegisterStep2Screen = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    city: '',
    district: '',
    address: '',
    contactPerson: {
      name: '',
      position: '',
      phone: '',
      email: ''
    },
    companyType: 'other'
  });
  
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const router = useRouter();
  
  // İl ve ilçe bilgilerini getir
  useEffect(() => {
    const loadCitiesAndUserData = async () => {
      setDataLoading(true);
      try {
        // Kullanıcı verilerini oku
        const storedData = await AsyncStorage.getItem('temp_company_registration');
        if (!storedData) {
          Alert.alert('Hata', 'Kayıt verileri bulunamadı. Lütfen tekrar başlayın.');
          router.push('/company-register');
          return;
        }
        
        const parsedUserData = JSON.parse(storedData);
        setUserData(parsedUserData);
        
        // İlleri getir - Doğrudan API çağrısı
        try {
          console.log('İller yükleniyor');
          const response = await fetch(`${API_URL}/cities`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          console.log('İller yüklendi:', data);
          
          if (data.success && data.data) {
            // Şehirleri alfabetik sıraya göre diz
            const sortedCities = [...data.data].sort((a, b) => {
              const nameA = a.name || a.city || '';
              const nameB = b.name || b.city || '';
              return nameA.localeCompare(nameB, 'tr');
            });
            setCities(sortedCities);
          } else {
            console.error('Cities API response format error:', data);
            Alert.alert('Hata', 'Şehir listesi yüklenirken bir hata oluştu.');
          }
        } catch (cityError) {
          console.error('İl verisi getirme hatası:', cityError);
          setCities([]);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        Alert.alert('Hata', 'Şehir bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setDataLoading(false);
      }
    };
    
    loadCitiesAndUserData();
  }, [router]);
  
  // İl değiştiğinde ilçeleri getir
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.city) {
        setDistricts([]);
        return;
      }
      
      setIsDistrictsLoading(true);
      try {
        // Seçilen şehri bul
        const selectedCity = cities.find(c => (c.city === formData.city || c.name === formData.city));
        if (!selectedCity) {
          setDistricts([]);
          setIsDistrictsLoading(false);
          return;
        }
        
        // İlçeleri alma stratejisini belirle
        let districtsList = [];
        
        // 1. Yöntem: Doğrudan şehir nesnesindeki districts dizisini kullan
        if (selectedCity.districts && Array.isArray(selectedCity.districts) && selectedCity.districts.length > 0) {
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
              return district.name || '';
            }).filter(Boolean);
            
            districtsList = processedDistricts;
          }
        } 
        // 3. Yöntem: API ile şehir adı üzerinden ilçeleri çek (ID kullanmıyoruz)
        else if (selectedCity.name || selectedCity.city) {
          const cityName = selectedCity.name || selectedCity.city;
          
          // URL'deki Türkçe karakterler için encode
          const encodedCityName = encodeURIComponent(cityName);
          const response = await fetch(`${API_URL}/cities/name/${encodedCityName}/districts`);
          const data = await response.json();
          
          if (data.success && data.data && Array.isArray(data.data)) {
            if (data.data.length > 0) {
              if (typeof data.data[0] === 'string') {
                districtsList = [...data.data];
              } else if (typeof data.data[0] === 'object') {
                districtsList = data.data
                  .filter((d) => d && (d.name || d.district))
                  .map((d) => d.name || d.district);
              }
            }
          }
        }
        
        // İlçeleri alfabetik sırala
        if (districtsList.length > 0) {
          const sortedDistricts = districtsList
            .filter(Boolean) // null/undefined değerleri filtrele
            .sort((a, b) => a.localeCompare(b, 'tr'));
          setDistricts(sortedDistricts);
        } else {
          setDistricts([]);
        }
        
      } catch (error) {
        console.error('İlçe yükleme hatası:', error);
        Alert.alert('Hata', 'İlçe bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setIsDistrictsLoading(false);
      }
    };
    
    loadDistricts();
  }, [formData.city, cities]);
  
  const handleChange = (name, value) => {
    // İç içe değer için (contactPerson)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Telefon numarası formatlaması
      if (child === 'phone') {
        const formattedPhone = formatPhoneNumber(value);
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: formattedPhone
          }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        });
      }
    } else {
      // Vergi numarası formatlaması
      if (name === 'taxNumber') {
        // Sadece rakamları al ve uzunluğu kontrol et
        const formattedTaxNumber = value.replace(/\D/g, '').slice(0, 11);
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
    }
  };
  
  // Telefon numarasını formatlayan fonksiyon
  const formatPhoneNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // 10 haneye kısıtla
    return cleaned.slice(0, 10);
  };
  
  // Form gönderme işlemi
  const handleSubmit = async () => {
    const { 
      companyName, 
      taxNumber, 
      taxOffice, 
      city, 
      district, 
      address, 
      contactPerson, 
      companyType 
    } = formData;
    
    // Form validation
    if (!companyName || !taxNumber || !taxOffice || !city || !district || !address) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    
    // Vergi numarası kontrolü
    if (taxNumber.length < 10 || taxNumber.length > 11) {
      Alert.alert('Hata', 'Vergi numarası 10 veya 11 haneli olmalıdır.');
      return;
    }
    
    // İletişim kişisi kontrolü
    if (!contactPerson.name || !contactPerson.phone || !contactPerson.email) {
      Alert.alert('Hata', 'Lütfen iletişim kişisi bilgilerini eksiksiz doldurun.');
      return;
    }
    
    // İletişim kişisi telefon kontrolü
    if (contactPerson.phone.length !== 10) {
      Alert.alert('Hata', 'İletişim kişisi telefon numarası 10 haneli olmalıdır.');
      return;
    }
    
    if (!userData) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı. Lütfen baştan kayıt işlemine başlayın.');
      router.push('/company-register');
      return;
    }
    
    setLoading(true);
    
    try {
      // API'yi çağır
      const response = await fetch(`${API_URL}/companies/register`, {
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
          // Firma verileri
          companyName,
          taxNumber,
          taxOffice,
          city,
          district,
          address,
          contactPerson,
          companyType
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
      await AsyncStorage.removeItem('temp_company_registration');
      
      // Başarı mesajı göster
      Alert.alert(
        'Başarılı', 
        'Firma kaydınız başarıyla oluşturuldu. Hesabınız onaylandıktan sonra giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => router.push('/login') }]
      );
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Şehir ve ilçe seçimi
  const renderCityDistrictSection = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
      
      <Text style={styles.label}>İl *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.city}
          onValueChange={(itemValue) => handleChange('city', itemValue)}
          style={styles.picker}
          enabled={!dataLoading}
        >
          <Picker.Item label="İl Seçin" value="" />
          {cities.map((city, index) => (
            <Picker.Item 
              key={index} 
              label={city.city || city.name} 
              value={city.city || city.name} 
            />
          ))}
        </Picker>
      </View>
      
      <Text style={styles.label}>İlçe *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.district}
          onValueChange={(itemValue) => handleChange('district', itemValue)}
          style={styles.picker}
          enabled={!isDistrictsLoading && formData.city !== ''}
        >
          <Picker.Item label="İlçe Seçin" value="" />
          {districts.map((district, index) => (
            <Picker.Item 
              key={index} 
              label={typeof district === 'string' ? district : (district.name || district.district || '')} 
              value={typeof district === 'string' ? district : (district.name || district.district || '')} 
            />
          ))}
        </Picker>
        {isDistrictsLoading && (
          <ActivityIndicator size="small" color="#1976D2" style={styles.loadingIndicator} />
        )}
      </View>
      
      <Text style={styles.label}>Adres *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Firmanızın açık adresi"
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
        multiline
        numberOfLines={3}
      />
    </View>
  );
  
  // Firma türü seçimi
  const renderCompanyTypeSection = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Firma Türü</Text>
      
      <Text style={styles.label}>Firma Türü *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.companyType}
          onValueChange={(itemValue) => handleChange('companyType', itemValue)}
          style={styles.picker}
        >
          {companyTypes.map((type, index) => (
            <Picker.Item key={index} label={type.label} value={type.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
  
  // İletişim Kişisi Bilgileri
  const renderContactPersonSection = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>İletişim Kişisi Bilgileri</Text>
      
      <Text style={styles.label}>İsim Soyisim *</Text>
      <TextInput
        style={styles.input}
        placeholder="İletişim kurulacak kişinin adı soyadı"
        value={formData.contactPerson.name}
        onChangeText={(text) => handleChange('contactPerson.name', text)}
      />
      
      <Text style={styles.label}>Pozisyon</Text>
      <TextInput
        style={styles.input}
        placeholder="Kişinin firmadaki pozisyonu"
        value={formData.contactPerson.position}
        onChangeText={(text) => handleChange('contactPerson.position', text)}
      />
      
      <Text style={styles.label}>Telefon *</Text>
      <TextInput
        style={styles.input}
        placeholder="İletişim telefonu"
        value={formData.contactPerson.phone}
        onChangeText={(text) => handleChange('contactPerson.phone', text)}
        keyboardType="phone-pad"
        maxLength={10}
      />
      {formData.contactPerson.phone && formData.contactPerson.phone.length < 10 && (
        <Text style={styles.errorText}>Telefon numarası 10 haneli olmalıdır</Text>
      )}
      
      <Text style={styles.label}>E-posta *</Text>
      <TextInput
        style={styles.input}
        placeholder="İletişim e-postası"
        value={formData.contactPerson.email}
        onChangeText={(text) => handleChange('contactPerson.email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Ionicons name="business-outline" size={40} color="#1976D2" />
          <Text style={styles.headerTitle}>Firma Bilgileri</Text>
          <Text style={styles.headerSubtitle}>Lütfen firmanız hakkında bilgi verin</Text>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Bilgiler yükleniyor...</Text>
          </View>
        ) : (
          <>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
              
              <Text style={styles.label}>Firma Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Firmanızın ticari unvanı"
                value={formData.companyName}
                onChangeText={(text) => handleChange('companyName', text)}
              />
              
              <Text style={styles.label}>Vergi Numarası *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vergi numaranız"
                value={formData.taxNumber}
                onChangeText={(text) => handleChange('taxNumber', text)}
                keyboardType="number-pad"
                maxLength={11}
              />
              {formData.taxNumber && (formData.taxNumber.length < 10 || formData.taxNumber.length > 11) && (
                <Text style={styles.errorText}>Vergi numarası 10 veya 11 haneli olmalıdır</Text>
              )}
              
              <Text style={styles.label}>Vergi Dairesi *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vergi daireniz"
                value={formData.taxOffice}
                onChangeText={(text) => handleChange('taxOffice', text)}
              />
            </View>
            
            {renderCityDistrictSection()}
            
            {renderContactPersonSection()}
            
            {renderCompanyTypeSection()}
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kaydı Tamamla</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Önceki Adıma Dön</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  loadingIndicator: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  backButtonText: {
    color: '#1976D2',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 10,
    marginLeft: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default CompanyRegisterStep2Screen; 