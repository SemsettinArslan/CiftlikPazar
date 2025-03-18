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

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { API_URL } = useAuth();
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    setIsLoading(true);
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Şifre sıfırlama işlemi başarısız oldu.');
      }

      setSuccess(true);
      Alert.alert('Başarılı', 'Şifre sıfırlama kodu e-posta adresinize gönderildi.');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="key-outline" size={80} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Şifremi Unuttum</Text>
      </View>

      <View style={styles.formContainer}>
        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.successText}>
              Şifre sıfırlama kodu e-posta adresinize gönderildi.
            </Text>
            <Text style={styles.instructionText}>
              Lütfen e-postanızı kontrol edin ve aldığınız kodu şifre sıfırlama ekranında kullanın.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push({
                pathname: "/verify-code",
                params: { email }
              })}
            >
              <Text style={styles.buttonText}>Kod Giriş Ekranına Git</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backContainer}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.backText}>Giriş Sayfasına Dön</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.instructionText}>
              Şifrenizi sıfırlamak için lütfen kayıtlı e-posta adresinizi girin.
              Şifre sıfırlama kodu e-posta adresinize gönderilecektir.
            </Text>
            
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="E-posta adresinizi girin"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Şifre Sıfırlama Kodu Gönder</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backContainer}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.backText}>Giriş Sayfasına Dön</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
});

export default ForgotPasswordScreen; 