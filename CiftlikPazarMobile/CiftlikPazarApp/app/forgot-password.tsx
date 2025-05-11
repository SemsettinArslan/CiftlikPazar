import React from 'react';
import { Stack } from 'expo-router';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';

export default function ForgotPassword() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Şifremi Unuttum',
          headerShown: false
        }}
      />
      <ForgotPasswordScreen />
    </>
  );
} 