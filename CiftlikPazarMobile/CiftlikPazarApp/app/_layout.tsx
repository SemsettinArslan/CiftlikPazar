import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useColorScheme } from 'react-native';

// Navigasyon öncesinde yüklenmesini sağlamak için SplashScreen'i göster
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Font yükleme durumunu kontrol et - mevcut Space Mono fontunu kullan
  const [fontsLoaded, error] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Fontlar yüklendiğinde SplashScreen'i gizle
  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="verify-code" />
          <Stack.Screen name="farmer-register" />
          <Stack.Screen name="farmer-register-step2" />
          <Stack.Screen name="farmer-register-complete" />
          <Stack.Screen name="personal-info" />
          <Stack.Screen name="farmer-dashboard" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="hidden" />
        </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
