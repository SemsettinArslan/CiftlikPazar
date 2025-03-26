import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Redirect, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const { user, API_URL } = useAuth();
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Kullanıcının admin olup olmadığını kontrol et
  useEffect(() => {
    // Kullanıcı bilgileri kontrol
    if (user?.data) {
      const userIsAdmin = user.data.role === 'admin';
      console.log('Admin Screen - User role:', user.data.role);
      console.log('Is admin?', userIsAdmin);
      setIsAdmin(userIsAdmin);

      // Admin değilse ana sayfaya yönlendir
      if (!userIsAdmin) {
        console.log('Non-admin user detected, redirecting to home');
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı verisi yoksa ana sayfaya yönlendir
      console.log('No user data, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [user]);

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
      
      // Diğer istatistikleri al (bu endpoint olmayabilir, gerçek API'a göre düzenlenmeli)
      // Eğer admin stats API endpoint'i yoksa, varsayılan/mockup değerler kullanılabilir
      
      // Örnek: Toplam kullanıcı sayısı, onaylı çiftçi sayısı ve sipariş sayısı için
      // Şu an için mockup değerler kullanıyoruz, gerçek endpoint eklendiğinde güncellenebilir
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
      setError('İstatistikler yüklenirken bir hata oluştu.');
      
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
    // Sadece admin kullanıcısı için verileri getir
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [API_URL, user.token, isAdmin]);

  // Çiftçi başvurularını görüntüleme sayfasına git
  const handleViewFarmerRequests = () => {
    router.push('/admin/farmer-requests' as any);
  };

  // Anında kontrol - Admin değilse hiçbir şekilde bu sayfayı gösterme
  if (!user?.data || user.data.role !== 'admin') {
    console.log('Immediate check - redirecting non-admin user');
    return <Redirect href="/(tabs)" />;
  }

  // Kullanıcı admin değilse sayfayı gösterme
  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  // Admin verilerini yüklerken gösterilecek yükleme ekranı
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Admin verileri yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  // Hata durumunda gösterilecek ekran
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#d9534f" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchAdminStats()}
        >
          <ThemedText style={styles.retryButtonText}>Tekrar Dene</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const getStatusColor = (count: number, threshold: number = 0) => {
    if (count > threshold) return '#ffc107'; // warning
    return '#28a745'; // success
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Admin Paneli</ThemedText>
        <ThemedText style={styles.subtitle}>
          Çiftlik Pazar yönetim paneline hoş geldiniz. Bu panel üzerinden sistemi yönetebilirsiniz.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.cardsContainer}>
        {/* Kullanıcılar Kartı */}
        <ThemedView style={styles.card}>
          <ThemedView style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Kullanıcılar</ThemedText>
            <ThemedView style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="people-outline" size={20} color="#2196F3" />
            </ThemedView>
          </ThemedView>
          <ThemedText style={styles.cardValue}>{stats.totalUsers}</ThemedText>
          <ThemedText style={styles.cardDescription}>Toplam kullanıcı sayısı</ThemedText>
          <ThemedView style={styles.cardFooter}>
            <ThemedText style={[styles.cardNote, { color: '#28a745' }]}>+12% son haftada</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Çiftçiler Kartı */}
        <ThemedView style={styles.card}>
          <ThemedView style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Çiftçiler</ThemedText>
            <ThemedView style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
            </ThemedView>
          </ThemedView>
          <ThemedText style={styles.cardValue}>{stats.approvedFarmers}</ThemedText>
          <ThemedText style={styles.cardDescription}>Onaylı çiftçi sayısı</ThemedText>
          <ThemedView style={styles.cardFooter}>
            <ThemedText 
              style={[styles.cardNote, { 
                color: getStatusColor(stats.pendingFarmers, 0) 
              }]}
            >
              {stats.pendingFarmers} onay bekliyor
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Siparişler Kartı */}
        <ThemedView style={styles.card}>
          <ThemedView style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Siparişler</ThemedText>
            <ThemedView style={[styles.iconContainer, { backgroundColor: '#e0f7fa' }]}>
              <Ionicons name="cart-outline" size={20} color="#00BCD4" />
            </ThemedView>
          </ThemedView>
          <ThemedText style={styles.cardValue}>{stats.totalOrders}</ThemedText>
          <ThemedText style={styles.cardDescription}>Toplam sipariş sayısı</ThemedText>
          <ThemedView style={styles.cardFooter}>
            <ThemedText style={[styles.cardNote, { color: '#28a745' }]}>+8% son ayda</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Bekleyen İşler Kartı */}
        <ThemedView style={[styles.card, { borderColor: getStatusColor(stats.pendingActions, 0) }]}>
          <ThemedView style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Bekleyen İşler</ThemedText>
            <ThemedView style={[styles.iconContainer, { backgroundColor: '#fff8e1' }]}>
              <Ionicons name="alert-outline" size={20} color="#FFC107" />
            </ThemedView>
          </ThemedView>
          <ThemedText style={styles.cardValue}>{stats.pendingActions}</ThemedText>
          <ThemedText style={styles.cardDescription}>Bekleyen işlem sayısı</ThemedText>
          <ThemedView style={styles.cardFooter}>
            <ThemedText 
              style={[styles.cardNote, { 
                color: getStatusColor(3, 0) 
              }]}
            >
              3 acil işlem mevcut
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Çiftçi Başvuruları Uyarı Kutusu */}
      {stats.pendingFarmers > 0 && (
        <ThemedView style={styles.alertBox}>
          <ThemedView style={styles.alertHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#0c5460" />
            <ThemedText style={styles.alertTitle}>Çiftçi Başvuruları</ThemedText>
          </ThemedView>
          <ThemedText style={styles.alertMessage}>
            <ThemedText style={styles.boldText}>{stats.pendingFarmers} adet</ThemedText> yeni çiftçi başvurusu incelemenizi bekliyor.
          </ThemedText>
          <TouchableOpacity 
            onPress={handleViewFarmerRequests}
            style={styles.alertButton}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.alertButtonText}>
              Başvuruları İncele
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const windowWidth = Dimensions.get('window').width;
const cardWidth = (windowWidth - 40) / 2 - 8; // 2 columns with padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    marginVertical: 20,
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#17a2b8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  subtitle: {
    fontSize: 15,
    color: '#6c757d',
    lineHeight: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderLeftWidth: 3,
    borderLeftColor: '#f1f1f1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212529',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardNote: {
    fontSize: 12,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: 'bold',
  },
  alertBox: {
    margin: 16,
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0c5460',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
    color: '#0c5460',
  },
  alertMessage: {
    fontSize: 14,
    color: '#0c5460',
    marginBottom: 16,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#17a2b8',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
}); 