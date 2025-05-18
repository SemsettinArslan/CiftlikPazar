import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { getCartItemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Show loading screen
  if (isLoading) {
    return null;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Kullanıcı admin veya çiftçi ise ilgili dashboard'a yönlendir
  if (user?.data?.role === 'admin') {
    return <Redirect href="/admin-dashboard" />;
  }
  
  if (user?.data?.role === 'farmer') {
    return <Redirect href="/farmer-dashboard" />;
  }

  // Sepetteki ürün sayısını al
  const cartItemCount = getCartItemCount();

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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Ürünler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Sepetim',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={size} color={color} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
