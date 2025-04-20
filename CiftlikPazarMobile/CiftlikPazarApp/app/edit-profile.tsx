import React from 'react';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function EditProfilePage() {
  // Loglama ile debug etmeyi kolaylaştırma
  console.log('edit-profile sayfası yükleniyor...');
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Profili Düzenle',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          }
        }}
      />
      <EditProfileScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
}); 