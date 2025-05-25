import React from 'react';
import { Stack } from 'expo-router';
import CompanyRegisterStep2Screen from '../src/screens/company/CompanyRegisterStep2Screen';

export default function CompanyRegisterStep2() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Firma Bilgileri',
          headerShown: false
        }}
      />
      <CompanyRegisterStep2Screen />
    </>
  );
} 