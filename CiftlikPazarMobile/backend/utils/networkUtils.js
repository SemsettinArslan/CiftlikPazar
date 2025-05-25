// Node.js backend için network utils
const os = require('os');

// Manuel IP adresi tanımı - bağlantı sorunu yaşadığınızda buraya bilgisayarınızın IP adresini yazın
const MANUAL_IP_ADDRESS = '192.168.20.92';

// Geliştirme sunucusunun IP adresini al
const getDevServerIp = () => {
  try {
    // Ortam değişkeninden IP adresi alınabilir
    if (process.env.SERVER_IP) {
      console.log('Using SERVER_IP from environment:', process.env.SERVER_IP);
      return process.env.SERVER_IP;
    }
    
    // Bilgisayarın IP adresini otomatik tespit etmeye çalış
    const networkInterfaces = os.networkInterfaces();
    console.log('Detecting network interfaces...');
    
    // Önce Wi-Fi veya Ethernet gibi harici bağlantıları kontrol et
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      
      for (const iface of interfaces) {
        // IPv4 ve harici (non-internal) adresleri ara
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Found external IP address: ${iface.address} on interface ${interfaceName}`);
          return iface.address;
        }
      }
    }
    
    // Harici IP bulunamazsa, herhangi bir IPv4 adresi kullan
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      
      for (const iface of interfaces) {
        if (iface.family === 'IPv4') {
          console.log(`Found internal IP address: ${iface.address} on interface ${interfaceName}`);
          return iface.address;
        }
      }
    }
    
    console.log('No IP address detected, using manual IP:', MANUAL_IP_ADDRESS);
    return MANUAL_IP_ADDRESS;
  } catch (error) {
    console.error('IP adresi belirlenirken hata oluştu:', error);
    console.log('Using manual IP address after error:', MANUAL_IP_ADDRESS);
    return MANUAL_IP_ADDRESS;
  }
};

// API taban URL'sini oluştur
const getApiBaseUrl = () => {
  const serverIp = getDevServerIp();
  const port = process.env.PORT || '5000';
  const url = `http://${serverIp}:${port}/api`;
  console.log('API URL generated for backend:', url);
  return url;
};

module.exports = { getApiBaseUrl, getDevServerIp }; 