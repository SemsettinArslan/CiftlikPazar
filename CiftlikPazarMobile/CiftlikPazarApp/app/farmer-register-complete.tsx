import React from 'react';
import { Stack } from 'expo-router';
import FarmerRegisterCompleteScreen from '../src/screens/farmer/FarmerRegisterCompleteScreen';

export default function FarmerRegisterComplete() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Kayıt Tamamlandı',
          headerShown: false
        }}
      />
      <FarmerRegisterCompleteScreen />
    </>
  );
} 