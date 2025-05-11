import React from 'react';
import { Stack } from 'expo-router';
import FarmerRegisterScreen from '../src/screens/farmer/FarmerRegisterScreen';

export default function FarmerRegister() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Çiftçi Kaydı',
          headerShown: false
        }}
      />
      <FarmerRegisterScreen />
    </>
  );
} 