import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EditFarmProfileScreen from '../src/screens/farmer/EditFarmProfileScreen';

export default function FarmProfileEditPage() {
  return (
    <SafeAreaProvider>
      <EditFarmProfileScreen />
    </SafeAreaProvider>
  );
} 