import React from 'react';
import { Stack } from 'expo-router';
import VerifyCodeScreen from '../src/screens/VerifyCodeScreen';

export default function VerifyCode() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Doğrulama Kodu',
          headerShown: false
        }}
      />
      <VerifyCodeScreen />
    </>
  );
} 