import EditProfileScreen from '../src/screens/EditProfileScreen';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function EditProfilePage() {
  const navigation = useNavigation();
  
  console.log('edit-profile sayfası yükleniyor...');
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Profili Düzenle',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          }
        }}
      />
      <EditProfileScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
}); 