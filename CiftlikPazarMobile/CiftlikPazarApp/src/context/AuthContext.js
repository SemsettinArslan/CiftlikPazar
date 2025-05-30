import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { getApiBaseUrl } from '../utils/networkUtils';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Sabit API URL yerine dinamik API URL kullan
const API_URL = getApiBaseUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Register user
  const register = async (userData) => {
    if (!userData.email || !userData.password) {
      Alert.alert('ErrorResponse', 'Lütfen tüm zorunlu alanları doldurunuz.', [{ text: 'Tamam' }]);
      setError('Tüm zorunlu alanları doldurunuz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout
    
    try {
      // Her istekte güncel API URL'ini al
      const currentApiUrl = getApiBaseUrl();
      console.log(`Register isteği gönderiliyor: ${currentApiUrl}/auth/register`, JSON.stringify(userData));
      
      const response = await fetch(`${currentApiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Hata ayıklama amaçlı log
      console.log('Register yanıtı:', JSON.stringify(data));
      
      if (!response.ok) {
        console.log(`Hata kodu: ${response.status}, Hata mesajı:`, data.message || data.error);
        
        // Özel hata mesajlarını kontrol et ve göster
        const errorMessage = data.message || data.error || 'Kayıt işlemi başarısız oldu.';
        
        if (errorMessage) {
          // Yaygın hata durumları için kontroller
          if (errorMessage.includes("email") && errorMessage.includes("kullanılıyor")) {
            Alert.alert('ErrorResponse', 'Bu e-posta adresi zaten kullanılıyor. Lütfen başka bir e-posta adresi deneyiniz.', [{ text: 'Tamam' }]);
            setError('E-posta adresi zaten kullanılıyor.');
            return;
          }
          
          if (errorMessage.includes("telefon") || errorMessage.includes("phone")) {
            Alert.alert('ErrorResponse', 'Bu telefon numarası zaten kullanılıyor. Lütfen başka bir telefon numarası deneyiniz.', [{ text: 'Tamam' }]);
            setError('Telefon numarası zaten kullanılıyor.');
            return;
          }
          
          if (errorMessage.includes("vergi") || errorMessage.includes("tax")) {
            Alert.alert('ErrorResponse', 'Bu vergi numarası zaten kullanılıyor. Lütfen kontrol ediniz.', [{ text: 'Tamam' }]);
            setError('Vergi numarası zaten kullanılıyor.');
            return;
          }
          
          if (errorMessage.includes("şifre") || errorMessage.includes("password")) {
            Alert.alert('ErrorResponse', 'Şifre gereksinimleri karşılanmıyor. Lütfen daha güçlü bir şifre belirleyiniz.', [{ text: 'Tamam' }]);
            setError('Şifre gereksinimleri karşılanmıyor.');
            return;
          }
          
          // Hiçbir özel eşleşme bulunamazsa, sunucudan gelen ham mesajı göster
          Alert.alert('ErrorResponse', errorMessage, [{ text: 'Tamam' }]);
          setError(errorMessage);
          return;
        } else {
          // Genel hata mesajı göster
          Alert.alert('ErrorResponse', 'Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.', [{ text: 'Tamam' }]);
          setError('Kayıt işlemi başarısız oldu.');
          return;
        }
      }

      // İşlem başarılıysa
      Alert.alert('Başarılı', 'Kayıt işleminiz başarıyla tamamlandı.', [{ text: 'Tamam' }]);
      return data;
    } catch (error) {
      console.log('Register fonksiyonu hata yakaladı:', error);
      
      // Timeout hatası kontrolü
      if (error.name === 'AbortError') {
        const timeoutMessage = 'Sunucu yanıt vermiyor. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.';
        Alert.alert('ErrorResponse', timeoutMessage, [{ text: 'Tamam' }]);
        setError('Bağlantı hatası');
        return;
      }
      
      // JSON parse hatası kontrolü
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        Alert.alert('ErrorResponse', 'Sunucudan geçersiz yanıt alındı. Lütfen daha sonra tekrar deneyiniz.', [{ text: 'Tamam' }]);
        setError('Geçersiz sunucu yanıtı');
        return;
      }
      
      // Diğer tüm hatalar için
      const errorMessage = error.message || 'Kayıt sırasında beklenmeyen bir hata oluştu.';
      Alert.alert('ErrorResponse', errorMessage, [{ text: 'Tamam' }]);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    if (!email || !password) {
      Alert.alert('ErrorResponse', 'Lütfen e-posta ve şifrenizi giriniz.', [{ text: 'Tamam' }]);
      setError('E-posta ve şifre gereklidir.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout

    try {
      // Her istekte güncel API URL'ini al
      const currentApiUrl = getApiBaseUrl();
      console.log(`Login isteği gönderiliyor: ${currentApiUrl}/auth/login`);
      
      const response = await fetch(`${currentApiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Hata ayıklama amaçlı log
      console.log('Login yanıtı:', JSON.stringify(data));
      
      if (!response.ok) {
        console.log(`Hata kodu: ${response.status}, Hata mesajı:`, data.message || data.error);
        
        // Özel hata mesajlarını kontrol et ve göster - data.message veya data.error kontrol et
        const errorMessage = data.message || data.error || 'Giriş başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.';
        
        if (errorMessage) {
          // Kesin eşleşmeler
          if (errorMessage.includes("onay bekliyor") || errorMessage.includes("onaylanmadı")) {
            Alert.alert('ErrorResponse', 'Çiftçi başvurunuz onay bekliyor. Onaylandığında bilgilendirileceksiniz.', [{ text: 'Tamam' }]);
            setError('Çiftçi başvurunuz onay bekliyor.');
            return;
          }
          
          if (errorMessage.includes("reddedil")) {
            Alert.alert('ErrorResponse', 'Çiftlik başvurunuz reddedildi. Lütfen müşteri hizmetleri ile iletişime geçiniz.', [{ text: 'Tamam' }]);
            setError('Çiftlik başvurunuz reddedildi.');
            return;
          }
          
          if (errorMessage.includes("bulunamadı")) {
            Alert.alert('ErrorResponse', 'Bu e-posta adresine sahip kullanıcı bulunamadı. Lütfen bilgilerinizi kontrol ediniz.', [{ text: 'Tamam' }]);
            setError('Kullanıcı bulunamadı.');
            return;
          }
          
          if (errorMessage.includes("şifre") || errorMessage.includes("hatalı") || errorMessage.includes("yanlış")) {
            Alert.alert('ErrorResponse', 'Girdiğiniz şifre hatalı. Lütfen tekrar deneyiniz.', [{ text: 'Tamam' }]);
            setError('Şifre yanlış.');
            return;
          }
          
          // Hiçbir özel eşleşme bulunamazsa, sunucudan gelen ham mesajı göster
          Alert.alert('ErrorResponse', errorMessage, [{ text: 'Tamam' }]);
          setError(errorMessage);
          return;
        } else {
          // data.message yoksa, genel hata mesajı göster
          Alert.alert('ErrorResponse', 'Giriş başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.', [{ text: 'Tamam' }]);
          setError('Giriş başarısız oldu.');
          return;
        }
      }

      // Kullanıcının rolü çiftçi ve onay durumu kontrol et
      if (data.data && data.data.role === 'farmer') {
        if (data.data.approvalStatus === 'pending') {
          Alert.alert(
            'ErrorResponse',
            'Çiftçi başvurunuz onay bekliyor. Onaylandığında bilgilendirileceksiniz.',
            [{ text: 'Tamam' }]
          );
          setError('Çiftçi onayı bekliyor');
          return;
        } else if (data.data.approvalStatus === 'rejected') {
          Alert.alert(
            'ErrorResponse',
            'Çiftlik başvurunuz reddedildi. Lütfen müşteri hizmetleri ile iletişime geçiniz.',
            [{ text: 'Tamam' }]
          );
          setError('Çiftlik başvurusu reddedildi');
          return;
        }
      }

      // Kullanıcının rolü firma ve onay durumu kontrol et
      if (data.data && data.data.role === 'company') {
        if (data.data.approvalStatus === 'pending') {
          Alert.alert(
            'ErrorResponse',
            'Firma başvurunuz onay bekliyor. Onaylandığında bilgilendirileceksiniz.',
            [{ text: 'Tamam' }]
          );
          setError('Firma onayı bekliyor');
          return;
        } else if (data.data.approvalStatus === 'rejected') {
          Alert.alert(
            'ErrorResponse',
            'Firma başvurunuz reddedildi. Lütfen müşteri hizmetleri ile iletişime geçiniz.',
            [{ text: 'Tamam' }]
          );
          setError('Firma başvurusu reddedildi');
          return;
        }
      }

      // İşlem başarılı - kullanıcı verisini kaydet
      console.log('Giriş başarılı, kullanıcı verileri kaydediliyor');
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      
      // Kullanıcı rolüne göre yönlendirme
      console.log('Kullanıcı rolü:', data.data.role);
      
      if (data.data.role === 'admin') {
        router.replace('/admin-dashboard');
      } else if (data.data.role === 'farmer') {
        router.replace('/farmer-dashboard');
      } else if (data.data.role === 'company') {
        router.replace('/company-dashboard');
      } else {
        router.replace('/(tabs)');
      }
      
      return data;
    } catch (error) {
      console.log('Login fonksiyonu hata yakaladı:', error);
      
      // Timeout hatası kontrolü
      if (error.name === 'AbortError') {
        const timeoutMessage = 'Sunucu yanıt vermiyor. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.';
        Alert.alert('ErrorResponse', timeoutMessage, [{ text: 'Tamam' }]);
        setError('Bağlantı hatası');
        return;
      }
      
      // JSON parse hatası kontrolü
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        Alert.alert('ErrorResponse', 'Sunucudan geçersiz yanıt alındı. Lütfen daha sonra tekrar deneyiniz.', [{ text: 'Tamam' }]);
        setError('Geçersiz sunucu yanıtı');
        return;
      }
      
      // Diğer tüm hatalar için
      const errorMessage = error.message || 'Giriş sırasında beklenmeyen bir hata oluştu.';
      Alert.alert('ErrorResponse', errorMessage, [{ text: 'Tamam' }]);
      setError(errorMessage);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      
      // Çıkış yaptıktan sonra login sayfasına yönlendir
      router.replace('/login');
    } catch (error) {
      // Hata oluştuğunda kullanıcıya bildir
      Alert.alert('ErrorResponse', 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.', [{ text: 'Tamam' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı bilgilerini yenile
  const refreshUserData = async () => {
    if (!user || !user.token) return;

    try {
      // Her istekte güncel API URL'ini al
      const currentApiUrl = getApiBaseUrl();
      const response = await fetch(`${currentApiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Mevcut kullanıcı bilgilerini sakla, sadece güncel veriyi güncelle
        const updatedUser = {
          ...user,
          data: data.data
        };
        
        // AsyncStorage ve state'i güncelle
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.log('Kullanıcı bilgileri yenilenirken hata:', error);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
    API_URL,
    refreshUserData,
    token: user?.token || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 