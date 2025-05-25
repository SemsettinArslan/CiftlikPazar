import { Platform, NativeModules } from 'react-native';

// Manuel IP adresi tanımı - bağlantı sorunu yaşadığınızda buraya bilgisayarınızın IP adresini yazın
const MANUAL_IP_ADDRESS = '192.168.208.92';

// Geliştirme sunucusunun IP adresini almanın farklı yolları
export const getDevServerIp = () => {
  try {
    // Debug: Mevcut durumu logla
    console.log('Platform:', Platform.OS);
    console.log('Dev Mode:', __DEV__ ? 'Yes' : 'No');
    console.log('Source Script URL:', NativeModules.SourceCode?.scriptURL || 'Not available');
    
    // Expo Go NOBRIDGE modunda çalışırken otomatik IP tespiti çalışmaz
    // Bu durumda manuel tanımlanan IP adresini kullan
    console.log('Using manually defined IP address:', MANUAL_IP_ADDRESS);
    return MANUAL_IP_ADDRESS;
    
    // Aşağıdaki kod artık kullanılmıyor, fakat gelecekte gerekirse diye muhafaza edildi
    /*
    // Expo Go uygulamasından IP adresini alma
    if (__DEV__) {
      // React Native'in debugger host bilgisinden IP adresini çıkart
      const scriptURL = NativeModules.SourceCode?.scriptURL || '';
      console.log('Script URL for IP detection:', scriptURL);
      
      const match = scriptURL.match(/\/\/([^:]+)/);
      
      if (match && match[1]) {
        console.log('IP address detected from script URL:', match[1]);
        return match[1]; // IP adresini döndür
      }
      console.log('No IP found in script URL, falling back to default');
    }

    // Emülatör için özel IP'yi kullan
    if (Platform.OS === 'android') {
      console.log('Using Android emulator IP: 10.0.2.2');
      return '10.0.2.2'; // Android emülatörü için localhost IP'si
    } else if (Platform.OS === 'ios') {
      console.log('Using iOS simulator IP: localhost');
      return 'localhost'; // iOS simulator
    }

    // Son çare olarak
    console.log('Using fallback IP: localhost');
    return 'localhost';
    */
  } catch (error) {
    console.error('IP adresi belirlenirken hata oluştu:', error);
    // Hata durumunda bile manuel IP adresini kullan
    return MANUAL_IP_ADDRESS;
  }
};

// API taban URL'sini oluştur
export const getApiBaseUrl = () => {
  const serverIp = getDevServerIp();
  const port = '5000';
  const url = `http://${serverIp}:${port}/api`;
  console.log('API URL generated for mobile app:', url);
  return url;
}; 