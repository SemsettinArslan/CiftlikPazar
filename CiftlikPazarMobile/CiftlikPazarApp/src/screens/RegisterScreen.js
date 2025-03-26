import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, login, isLoading, API_URL } = useAuth();
  const router = useRouter();

  // E-posta formatını kontrol eden fonksiyon
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Telefon numarası formatlayan fonksiyon
  const formatPhoneNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // 10 haneye kısıtla
    return cleaned.slice(0, 10);
  };

  // Telefon numarası değiştiğinde
  const handlePhoneChange = (text) => {
    const formattedPhone = formatPhoneNumber(text);
    setPhone(formattedPhone);
  };

  // Şehirleri çekme
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/cities`);
        const data = await response.json();
        
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
      } catch (error) {
        console.error('Error fetching cities:', error);
        Alert.alert('Hata', 'Şehir listesi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
  }, [API_URL]);

  // Şehir değiştiğinde ilçeleri getir
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!city) {
        setDistricts([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // Seçilen şehri bul
        const selectedCity = cities.find(c => (c.city === city || c.name === city));
        if (!selectedCity) {
          setDistricts([]);
          setLoading(false);
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
        // 2. Yöntem: API ile şehir ID'si üzerinden ilçeleri çek
        else if (selectedCity._id || selectedCity.cityid) {
          const cityId = selectedCity._id || selectedCity.cityid;
          
          const response = await fetch(`${API_URL}/cities/${cityId}/districts`);
          const data = await response.json();
          
          if (data.success && data.data && Array.isArray(data.data)) {
            if (data.data.length > 0) {
              if (typeof data.data[0] === 'string') {
                districtsList = [...data.data];
              } else if (typeof data.data[0] === 'object') {
                districtsList = data.data
                  .filter((d) => d && d.name)
                  .map((d) => d.name);
              }
            }
          }
        }
        // 3. Yöntem: API ile şehir adı üzerinden ilçeleri çek
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
                  .filter((d) => d && d.name)
                  .map((d) => d.name);
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
        
        // İlçe seçimini sıfırla
        setDistrict('');
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistricts();
  }, [city, cities, API_URL]);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phone || !city || !district || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    // E-posta formatı kontrolü
    if (!isValidEmail(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    // Telefon numarası kontrolü
    if (phone.length < 10) {
      Alert.alert('Hata', 'Telefon numarası 10 haneli olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      await register({ 
        firstName, 
        lastName, 
        email, 
        password, 
        phone, 
        city, 
        district, 
        address 
      });
      
      Alert.alert(
        'Başarılı', 
        'Kayıt işlemi başarıyla tamamlandı. Şimdi giriş yapabilirsiniz.',
        [
          { 
            text: 'Giriş Yap', 
            onPress: async () => {
              try {
                await login(email, password);
              } catch (error) {
                router.push('/login');
              }
            } 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Kayıt Hatası', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="leaf-outline" size={80} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Çiftlik Pazar</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Ad</Text>
        <TextInput
          style={styles.input}
          placeholder="Adınızı girin"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Soyad</Text>
        <TextInput
          style={styles.input}
          placeholder="Soyadınızı girin"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="E-posta adresinizi girin"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Telefon</Text>
        <TextInput
          style={styles.input}
          placeholder="Telefon Numarası"
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Şehir</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={city}
            style={styles.picker}
            onValueChange={(itemValue) => setCity(itemValue)}
          >
            <Picker.Item label="Şehir Seçiniz" value="" />
            {cities.map((city, index) => (
              <Picker.Item 
                key={index} 
                label={city.name || city.city} 
                value={city.name || city.city} 
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>İlçe</Text>
        <View style={[
          styles.pickerContainer, 
          !city ? styles.disabledPicker : null
        ]}>
          <Picker
            enabled={city !== ''}
            selectedValue={district}
            style={[
              styles.picker, 
              !city ? styles.disabledPickerText : null
            ]}
            onValueChange={(itemValue) => setDistrict(itemValue)}
          >
            <Picker.Item label={!city ? "Önce İl Seçiniz" : (districts.length === 0 ? "İlçe Bulunamadı" : "İlçe Seçiniz")} value="" />
            {districts.map((district, index) => (
              <Picker.Item 
                key={index} 
                label={district} 
                value={district} 
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Adres (İsteğe Bağlı)</Text>
        <TextInput
          style={styles.input}
          placeholder="Adresinizi girin"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          placeholder="Şifrenizi girin"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Şifre Tekrar</Text>
        <TextInput
          style={styles.input}
          placeholder="Şifrenizi tekrar girin"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.farmerContainer}>
          <Text style={styles.farmerText}>Çiftlik sahibi misiniz?</Text>
          <TouchableOpacity onPress={() => router.push('/farmer-register')}>
            <Text style={styles.farmerLink}>Çiftçi Olarak Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#4CAF50',
  },
  formContainer: {
    width: '100%',
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
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  disabledPicker: {
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
  },
  disabledPickerText: {
    color: '#aaa',
  },
  button: {
    backgroundColor: '#4CAF50',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333',
    marginRight: 5,
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  farmerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  farmerText: {
    color: '#333',
    marginRight: 5,
  },
  farmerLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 