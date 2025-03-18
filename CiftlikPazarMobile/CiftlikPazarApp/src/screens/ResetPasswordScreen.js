import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const ResetPasswordScreen = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { API_URL } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/resetpassword/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Şifre sıfırlama işlemi başarısız oldu.');
      }

      Alert.alert(
        'Başarılı', 
        'Şifreniz başarıyla sıfırlandı. Şimdi yeni şifreniz ile giriş yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Geçersiz veya eksik şifre sıfırlama bağlantısı.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.buttonText}>Giriş Sayfasına Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="lock-open-outline" size={80} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Şifre Sıfırlama</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.instructionText}>
          Lütfen yeni şifrenizi belirleyin. Şifreniz en az 6 karakter uzunluğunda olmalıdır.
        </Text>
        
        <Text style={styles.label}>Yeni Şifre</Text>
        <TextInput
          style={styles.input}
          placeholder="Yeni şifrenizi girin"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Şifre Tekrar</Text>
        <TextInput
          style={styles.input}
          placeholder="Şifrenizi tekrar girin"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Şifremi Sıfırla</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backContainer}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.backText}>Giriş Sayfasına Dön</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#4CAF50',
  },
  formContainer: {
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ResetPasswordScreen; 