import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Stack, useRouter } from 'expo-router';

export default function CompanyDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Firma olmayan kullanıcıları yönlendir
  useEffect(() => {
    if (user && user.data && user.data.role !== 'company') {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  // Firma olmayan kullanıcıları yönlendir
  if (user && user.data && user.data.role !== 'company') {
    return null;
  }
  
  // Çıkış fonksiyonu - Alert ile onay alarak
  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        { 
          text: "Çıkış Yap", 
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };
  
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Firma Yönetimi',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#1976D2',
          },
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Hoşgeldin Mesajı */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="business" size={24} color="#fff" />
          </View>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Merhaba, {user?.data?.firstName}</Text>
            <Text style={styles.welcomeText}>
              Firma yönetim paneline hoş geldiniz. Buradan firma işlemlerinizi yapabilirsiniz.
            </Text>
          </View>
        </View>
        
        {/* Menü Kartları */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/company-settings')}>
              <View style={[styles.menuIcon, { backgroundColor: '#1976D2' }]}>
                <Ionicons name="business-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Firma Bilgileri</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('company-requests' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="list-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Talepler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="stats-chart-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>İstatistikler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="people-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Tedarikçiler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard}>
              <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Çıkış Butonu - Sayfa sonuna eklendi */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
        
        {/* Boşluk ekle */}
        <View style={{height: 20}} />
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  welcomeContainer: {
    backgroundColor: '#1976D2',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
  },
  menuCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    margin: '2%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    borderRadius: 10,
    padding: 15,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 