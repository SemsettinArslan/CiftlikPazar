import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, Redirect } from 'expo-router';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check user data and set admin status
  useEffect(() => {
    if (user && user.data) {
      // Daha katı bir kontrol yapalım
      const userIsAdmin = user.data.role === 'admin';
      console.log('TabLayout - User role:', user.data.role);
      console.log('Is admin?', userIsAdmin);
      setIsAdmin(userIsAdmin);
      
      // Redirect non-admin users away from admin page
      if (!userIsAdmin && pathname?.includes('/admin')) {
        console.log('Redirecting non-admin user from admin page');
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı verisi yoksa admin değil
      setIsAdmin(false);
      
      // Kullanıcı verisi yoksa ve admin sayfasındaysa yönlendir
      if (pathname?.includes('/admin')) {
        console.log('No user data, redirecting from admin page');
        router.replace('/(tabs)');
      }
    }
  }, [user, pathname]);

  // Show loading screen
  if (isLoading) {
    return null;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Kullanıcı rolüne dayalı olarak tab yapılandırması
  // Koşullu olarak admin tabını içerme veya içermeme
  const userRole = user?.data?.role || 'user';
  const isUserAdmin = userRole === 'admin';

  // Tab ekranlarını tanımla
  const tabScreens = () => {
    const commonScreens = [
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />,
      <Tabs.Screen
        key="products"
        name="products"
        options={{
          title: 'Ürünler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />,
      <Tabs.Screen
        key="cart"
        name="cart"
        options={{
          title: 'Sepetim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />,
      <Tabs.Screen
        key="profile"
        name="profile"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    ];

    // Sadece admin için admin tab ekranını ekle
    if (isUserAdmin) {
      // Admin tabını index ve products arasına ekle
      commonScreens.splice(2, 0, 
        <Tabs.Screen
          key="admin"
          name="admin"
          options={{
            title: 'Admin Panel',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      );
    }

    return commonScreens;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333',
        },
      }}
    >
      {tabScreens()}
    </Tabs>
  );
}
