import React from 'react';
import { Stack } from 'expo-router';
import RegisterScreen from '../src/screens/RegisterScreen';

export default function Register() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Kayıt Ol',
          headerShown: false
        }}
      />
      <RegisterScreen />
    </>
  );
} 