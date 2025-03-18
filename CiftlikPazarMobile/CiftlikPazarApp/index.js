import 'expo-router/entry';

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