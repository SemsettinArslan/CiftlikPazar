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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '../../utils/networkUtils';

const API_URL = getApiBaseUrl();

const CompanyRegisterScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingUserExistence, setCheckingUserExistence] = useState(false);
  const router = useRouter();

  // E-posta formatını kontrol eden fonksiyon
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Telefon numarasını formatlayan ve kontrol eden fonksiyon
  const formatPhoneNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // 10 haneye kısıtla
    return cleaned.slice(0, 10);
  };

  const handleChange = (name, value) => {
    // Telefon numarası için özel formatlamayı uygula
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formattedPhone,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // E-posta değiştiğinde
  const handleEmailChange = (text) => {
    handleChange('email', text);
  };

  // Telefon numarası değiştiğinde
  const handlePhoneChange = (text) => {
    handleChange('phone', text);
  };

  // Kullanıcının zaten var olup olmadığını kontrol et
  const checkUserExists = async (email, phone) => {
    setCheckingUserExistence(true);
    try {
      // E-posta kontrolü
      try {
        const emailCheckResponse = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
        
        // Content type kontrolü
        const contentType = emailCheckResponse.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const emailData = await emailCheckResponse.json();
          
          if (emailData.exists) {
            Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi kullanın.');
            setCheckingUserExistence(false);
            return true;
          }
        } else {
          console.log('E-posta kontrolü: JSON olmayan yanıt alındı');
        }
      } catch (emailError) {
        console.error('E-posta kontrolü hatası:', emailError);
        // E-posta kontrolü başarısız oldu, ancak devam edebiliriz
      }
      
      // Telefon kontrolü
      try {
        const phoneCheckResponse = await fetch(`${API_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`);
        
        // Content type kontrolü
        const contentType = phoneCheckResponse.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const phoneData = await phoneCheckResponse.json();
          
          if (phoneData.exists) {
            Alert.alert('Hata', 'Bu telefon numarası zaten kullanılıyor. Lütfen farklı bir telefon numarası kullanın.');
            setCheckingUserExistence(false);
            return true;
          }
        } else {
          console.log('Telefon kontrolü: JSON olmayan yanıt alındı');
        }
      } catch (phoneError) {
        console.error('Telefon kontrolü hatası:', phoneError);
        // Telefon kontrolü başarısız oldu, ancak devam edebiliriz
      }
      
      // Kullanıcı mevcut değil veya kontroller başarısız oldu ama kullanıcı devam etmek istiyor olabilir
      return false;
    } catch (error) {
      console.error('Kullanıcı kontrolü sırasında hata:', error);
      // Hatayı kullanıcıya gösterme, çünkü bu kritik bir hata değil
      // Alert.alert('Hata', 'Kullanıcı kontrolü sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setCheckingUserExistence(false);
      return false; // Hata durumunda kullanıcının devam edebilmesine izin ver
    } finally {
      setCheckingUserExistence(false);
    }
  };

  const handleSubmit = async () => {
    const { firstName, lastName, email, password, confirmPassword, phone } = formData;

    // Form validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
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

    // Password validation
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    // Kullanıcı kontrolü yap
    const userExists = await checkUserExists(email, phone);
    if (userExists) {
      return;
    }

    setLoading(true);

    try {
      // Kullanıcı verilerini geçici olarak kaydet
      await AsyncStorage.setItem('temp_company_registration', JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: 'company'
      }));
      
      // İkinci adıma geç
      router.push('/company-register-step2');
    } catch (error) {
      Alert.alert('Hata', 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business-outline" size={80} color="#1976D2" />
          </View>
          <Text style={styles.title}>Çiftlik Pazar</Text>
          <Text style={styles.subtitle}>Firma Kayıt</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Ad</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınızı girin"
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
          />

          <Text style={styles.label}>Soyad</Text>
          <TextInput
            style={styles.input}
            placeholder="Soyadınızı girin"
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
          />

          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="E-posta adresinizi girin"
            value={formData.email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Telefon</Text>
          <View>
            <TextInput
              style={styles.input}
              placeholder="Telefon Numarası"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
            {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
              <Text style={styles.errorText}>Telefon numarası 10 haneli olmalıdır</Text>
            )}
          </View>

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifrenizi girin"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
          />

          <Text style={styles.label}>Şifre Tekrar</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifrenizi tekrar girin"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading || checkingUserExistence}
          >
            {loading || checkingUserExistence ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Devam Et</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
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
    color: '#1976D2',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 5,
    color: '#666',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 10,
    marginLeft: 5,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#333',
    marginRight: 5,
  },
  loginLink: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

export default CompanyRegisterScreen; 