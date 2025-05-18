import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Stack, useRouter, Redirect } from 'expo-router';

export default function AdminDashboardScreen() {
  const { user, logout, API_URL } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedFarmers: 0,
    pendingFarmers: 0,
    totalOrders: 0,
    pendingActions: 0,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Normal kullanıcı ise ana sayfaya yönlendir
  useEffect(() => {
    if (user && user.data && user.data.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  // Admin olmayan kullanıcıları yönlendir
  if (user && user.data && user.data.role !== 'admin') {
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

  // API'den admin istatistiklerini getiren fonksiyon
  const fetchAdminStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // İstatistikleri toplamak için gerekli API çağrıları
      const token = user.token;
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Önce bekleyen çiftçi sayısını al
      const pendingFarmersResponse = await fetch(`${API_URL}/farmers/pending`, config);
      
      if (!pendingFarmersResponse.ok) {
        throw new Error('Bekleyen çiftçi verileri alınamadı');
      }
      
      const pendingFarmersData = await pendingFarmersResponse.json();
      
      // API yanıt yapısına göre count değerini bul
      let pendingFarmersCount = 0;
      if (pendingFarmersData.count) {
        pendingFarmersCount = pendingFarmersData.count;
      } else if (pendingFarmersData.data && Array.isArray(pendingFarmersData.data)) {
        pendingFarmersCount = pendingFarmersData.data.length;
      } else if (pendingFarmersData.farmers && Array.isArray(pendingFarmersData.farmers)) {
        pendingFarmersCount = pendingFarmersData.farmers.length;
      }
      
      // Diğer istatistikleri al (mockup değerler)
      const totalUsersCount = 245;
      const approvedFarmersCount = 38;
      const totalOrdersCount = 189;
      const pendingActionsCount = 7;

      setStats({
        totalUsers: totalUsersCount,
        approvedFarmers: approvedFarmersCount,
        pendingFarmers: pendingFarmersCount,
        totalOrders: totalOrdersCount,
        pendingActions: pendingActionsCount
      });
      
      setIsLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Admin istatistikleri alınırken hata oluştu:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
      
      // Hata durumunda mockup veriler kullan
      setStats({
        totalUsers: 245,
        approvedFarmers: 38,
        pendingFarmers: 5,
        totalOrders: 189,
        pendingActions: 7
      });
      
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAdminStats();
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [API_URL, user?.token]);
  
  // Admin verilerini yüklerken gösterilecek yükleme ekranı
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Admin verileri yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Admin Paneli',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#3F51B5',
          },
        }}
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3F51B5']} />
        }
      >
        {/* Hoşgeldin Mesajı */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="shield" size={24} color="#fff" />
          </View>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Merhaba, {user?.data?.firstName}</Text>
            <Text style={styles.welcomeText}>
              Admin paneline hoş geldiniz. Buradan sistem ayarlarını ve kullanıcı yönetimini yapabilirsiniz.
            </Text>
          </View>
        </View>
        
        {/* İstatistik Kartları */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: 'rgba(33, 150, 243, 0.2)'}]}>
              <Ionicons name="people-outline" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Kullanıcı</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: 'rgba(76, 175, 80, 0.2)'}]}>
              <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{stats.approvedFarmers}</Text>
            <Text style={styles.statLabel}>Onaylı Çiftçi</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: 'rgba(255, 152, 0, 0.2)'}]}>
              <Ionicons name="time-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{stats.pendingFarmers}</Text>
            <Text style={styles.statLabel}>Onay Bekleyen</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, {backgroundColor: 'rgba(156, 39, 176, 0.2)'}]}>
              <Ionicons name="cart-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Toplam Sipariş</Text>
          </View>
        </View>
        
        {/* Menü Kartları */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Admin İşlemleri</Text>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/farmer-requests' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#3F51B5' }]}>
                <Ionicons name="person-add-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Çiftçi Başvuruları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/users' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="people-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Kullanıcı Yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/products' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="leaf-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Ürün Yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/orders' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Sipariş Takibi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/categories' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="list-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Kategori Yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/settings' as any)}>
              <View style={[styles.menuIcon, { backgroundColor: '#607D8B' }]}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>Site Ayarları</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  welcomeContainer: {
    backgroundColor: '#3F51B5',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Yeni çıkış butonu stili
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 