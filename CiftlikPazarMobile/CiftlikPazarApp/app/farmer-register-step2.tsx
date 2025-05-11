import React from 'react';
import { Stack } from 'expo-router';
import FarmerRegisterStep2Screen from '../src/screens/farmer/FarmerRegisterStep2Screen';

export default function FarmerRegisterStep2() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Çiftlik Bilgileri',
          headerShown: false
        }}
      />
      <FarmerRegisterStep2Screen />
    </>
  );
} 