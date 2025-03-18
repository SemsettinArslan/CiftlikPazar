import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import ResetPasswordScreen from '../../src/screens/ResetPasswordScreen';

export default function ResetPassword() {
  const { token } = useLocalSearchParams();
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Şifre Sıfırlama',
          headerShown: false
        }}
      />
      <ResetPasswordScreen token={token as string} />
    </>
  );
} 