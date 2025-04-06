import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Redirect, router } from 'expo-router';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Log status for debugging
  useEffect(() => {
    if (user && user.data) {
      const userIsAdmin = user.data.role === 'admin';
      console.log('Admin layout - User role:', user.data?.role);
      console.log('Admin layout - Is admin?', userIsAdmin);
      setIsAdmin(userIsAdmin);
      
      // Admin olmayan kullanıcıyı yönlendir
      if (!userIsAdmin) {
        console.log('Admin layout - Non-admin user detected, redirecting');
        router.replace('/(tabs)');
      }
    } else {
      console.log('Admin layout - No user found');
      setIsAdmin(false);
      
      // Kullanıcı verisi yoksa yönlendir
      if (!isLoading) {
        console.log('Admin layout - Redirecting due to no user data');
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading]);
  
  // Loading screen
  if (isLoading) {
    return null;
  }
  
  // Immediate redirect for non-admin users
  if (!user?.data || user.data.role !== 'admin') {
    console.log('Admin layout - Immediate redirect: Not admin role');
    return <Redirect href="/(tabs)" />;
  }
  
  // İkinci bir kontrol daha - isAdmin state false ise yönlendir
  if (!isAdmin) {
    console.log('Admin layout - Secondary check: isAdmin state is false');
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerTitle: "Admin Paneli",
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            color: '#333',
            fontWeight: 'bold',
          }
        }} 
      />
      <Stack.Screen 
        name="farmer-requests" 
        options={{ 
          headerTitle: "Admin Paneli",
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            color: '#333',
            fontWeight: 'bold',
          }
        }} 
      />
    </Stack>
  );
} 