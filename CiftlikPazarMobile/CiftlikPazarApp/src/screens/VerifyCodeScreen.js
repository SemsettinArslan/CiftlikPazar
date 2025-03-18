import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';

const VerifyCodeScreen = () => {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { API_URL } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (params?.email) {
      setEmail(params.email.toString());
    }
  }, [params]);

  const handleResetPassword = async () => {
    if (!code || !password || !confirmPassword) {
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
      const response = await fetch(`${API_URL}/auth/resetpassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code, 
          password 
        }),
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

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı');
      return;
    }

    setIsLoading(true);

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
        throw new Error(data.message || 'Kod gönderme işlemi başarısız oldu.');
      }

      Alert.alert('Başarılı', 'Yeni şifre sıfırlama kodu e-posta adresinize gönderildi.');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>E-posta adresi bulunamadı.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.buttonText}>Şifremi Unuttum Sayfasına Dön</Text>
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
        <Text style={styles.title}>Doğrulama Kodu</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.instructionText}>
          <Text style={styles.emailText}>{email}</Text> adresine gönderilen 6 haneli doğrulama kodunu ve yeni şifrenizi girin.
        </Text>
        
        <Text style={styles.label}>Doğrulama Kodu</Text>
        <TextInput
          style={styles.input}
          placeholder="6 haneli kodu girin"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity 
          style={styles.resendContainer}
          onPress={handleResendCode}
          disabled={isLoading}
        >
          <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
        </TouchableOpacity>

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
    lineHeight: 20,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#4CAF50',
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
  resendContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  resendText: {
    color: '#4CAF50',
    fontSize: 14,
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

export default VerifyCodeScreen; 