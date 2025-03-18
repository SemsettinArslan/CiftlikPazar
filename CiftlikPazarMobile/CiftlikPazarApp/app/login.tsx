import React from 'react';
import { Stack } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';

export default function Login() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Giriş',
          headerShown: false
        }}
      />
      <LoginScreen />
    </>
  );
} 