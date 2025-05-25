import React, { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { useFonts } from 'expo-font';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add any custom fonts here
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
      <AuthProvider>
        <CartProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="farmer-register" options={{ headerShown: false }} />
          <Stack.Screen name="farmer-register-step2" options={{ headerShown: false }} />
          <Stack.Screen name="company-register" options={{ headerShown: false }} />
          <Stack.Screen name="company-register-step2" options={{ headerShown: false }} />
          <Stack.Screen name="farmer-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="company-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: true, title: "Ürün Detayı" }} />
          <Stack.Screen name="product/add" options={{ headerShown: true, title: "Ürün Ekle" }} />
          <Stack.Screen name="cart" options={{ headerShown: true, title: "Sepetim" }} />
          <Stack.Screen name="checkout" options={{ headerShown: true, title: "Sipariş Onayı" }} />
          <Stack.Screen name="order-success" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: true, title: "Siparişlerim" }} />
        </Stack>
        </CartProvider>
      </AuthProvider>
  );
}
