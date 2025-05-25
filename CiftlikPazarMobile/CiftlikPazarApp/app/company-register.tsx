import React from 'react';
import { Stack } from 'expo-router';
import CompanyRegisterScreen from '../src/screens/company/CompanyRegisterScreen';

export default function CompanyRegister() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Firma Kaydı',
          headerShown: false
        }}
      />
      <CompanyRegisterScreen />
    </>
  );
} 