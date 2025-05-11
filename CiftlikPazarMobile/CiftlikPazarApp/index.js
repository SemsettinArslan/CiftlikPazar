import 'expo-router/entry';
import { getDevServerIp, getApiBaseUrl } from './src/utils/networkUtils';
import { Platform, NativeModules } from 'react-native';

// Daha detaylı bilgi için konsola yazdır
console.log('==========================================');
console.log('💻 IP DETECTION DIAGNOSTICS 💻');
console.log('==========================================');
console.log('Platform OS:', Platform.OS);
console.log('Is Dev Mode:', __DEV__ ? 'Yes' : 'No');
if (NativeModules.SourceCode && NativeModules.SourceCode.scriptURL) {
  console.log('Script URL:', NativeModules.SourceCode.scriptURL);
}
console.log('Detected IP Address:', getDevServerIp());
console.log('API Base URL:', getApiBaseUrl());
console.log('==========================================');

// setImmediate ve clearImmediate polyfill'leri
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = function(callback, ...args) {
    return setTimeout(() => callback(...args), 0);
  };
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = function(id) {
    return clearTimeout(id);
  };
} 