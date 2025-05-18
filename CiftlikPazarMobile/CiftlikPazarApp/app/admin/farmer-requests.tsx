import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  View,
  Alert,
  Image,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Redirect, router, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

// Kategori tipi
interface Category {
  _id: string;
  category_name: string;
}

// Farmer User tipi
interface FarmerUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  approvalStatus: string;
  accountStatus: string;
  createdAt: string;
}

// Farmer tipi
interface Farmer {
  _id: string;
  user: FarmerUser;
  farmName: string;
  city: string;
  district: string;
  address: string;
  taxNumber: string;
  categories: Category[] | string[];
  certificates?: Certificate[];
  createdAt: string;
  hasShipping?: boolean;
  minOrderAmount?: number;
  description?: string;
  rejectionReason?: string;
}

// Sertifika tipi
interface Certificate {
  _id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateType: string;
  image?: string;
  verified: boolean;
}

// Tab türleri
type TabType = 'pending' | 'approved' | 'rejected';

export default function FarmerRequestsScreen() {
  const { user, API_URL } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // Kullanıcının admin olup olmadığını kontrol et
  useEffect(() => {
    if (user && user.data) {
      const userIsAdmin = user.data.role === 'admin';
      console.log('FarmerRequests - User role:', user.data.role);
      console.log('FarmerRequests - Is admin?', userIsAdmin);
      setIsAdmin(userIsAdmin);
      
      // Admin olmayan kullanıcıyı yönlendir
      if (!userIsAdmin) {
        console.log('FarmerRequests - Non-admin user detected, redirecting');
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı verisi yoksa admin değil
      console.log('FarmerRequests - No user data, redirecting');
      setIsAdmin(false);
      router.replace('/(tabs)');
    }
  }, [user]);

  // Komponent yüklendiğinde ve API_URL, token değiştiğinde verileri çek
  useEffect(() => {
    // Sadece admin kullanıcılar için verileri yükle
    if (isAdmin && user?.token) {
      console.log('FarmerRequests - Loading data for admin user');
      fetchFarmers(activeTab);
    }
  }, [API_URL, user?.token, isAdmin, activeTab]);

  // Kategori isimlerini formatlı şekilde çıkaran yardımcı fonksiyon
  const formatCategories = (categories: any[]): string => {
    if (!categories || categories.length === 0) return "Belirtilmemiş";

    // Kategori verisi nesne ise (JSON formatında)
    if (typeof categories[0] === 'object') {
      return categories.map(cat => 
        cat.category_name || (cat.name ? cat.name : 'Belirtilmemiş')
      ).join(', ');
    }
    
    // Kategori verisi string dizisi ise
    return categories.join(', ');
  };

  // Tarihi Türkçe formatında gösterme
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString || 'Geçersiz tarih';
    }
  };

  // API'den çiftçileri getiren fonksiyon
  const fetchFarmers = async (tabType: TabType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = user.token;
      
      // URL'yi endpoint tipine göre oluştur
      let endpoint = '';
      if (tabType === 'pending') {
        endpoint = '/farmers/pending';
      } else if (tabType === 'approved') {
        endpoint = '/farmers/approved';
      } else if (tabType === 'rejected') {
        endpoint = '/farmers/rejected';
      }
      
      console.log('API URL:', `${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Çiftçi verileri alınamadı (${tabType})`);
      }
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data));
      
      // API yanıt formatına göre çiftçi verilerini çıkar
      let farmers: Farmer[] = [];
      
      if (data.farmers && Array.isArray(data.farmers)) {
        farmers = data.farmers;
      } else if (data.data && Array.isArray(data.data)) {
        farmers = data.data;
      } else if (Array.isArray(data)) {
        farmers = data;
      }
      
      console.log('Extracted farmers count:', farmers.length);
      if (farmers.length > 0) {
        console.log('First farmer example:', JSON.stringify(farmers[0]));
      }
      
      // Çiftçi verilerini state'e kaydet
      setFarmers(farmers);
      setIsLoading(false);
    } catch (err) {
      console.error(`${tabType} çiftçileri alırken hata oluştu:`, err);
      setError(`Çiftçi verileri yüklenirken bir hata oluştu.`);
      
      // Hata durumunda mockup veriler kullan
      if (tabType === 'pending') {
        setFarmers([
          {
            _id: '1',
            user: {
              _id: '101',
              firstName: 'Ahmet',
              lastName: 'Yılmaz',
              email: 'ahmet.yilmaz@example.com',
              phone: '5551234567',
              role: 'farmer',
              approvalStatus: 'pending',
              accountStatus: 'active',
              createdAt: '2023-06-15T10:30:00Z'
            },
            farmName: 'Yılmaz Çiftliği',
            city: 'Antalya',
            district: 'Serik',
            address: 'Çandır Köyü No:123',
            taxNumber: '1234567890',
            categories: [{ _id: '1', category_name: 'Sebze' }, { _id: '2', category_name: 'Meyve' }],
            createdAt: '2023-06-15T10:30:00Z'
          },
          {
            _id: '2',
            user: {
              _id: '102',
              firstName: 'Ayşe',
              lastName: 'Demir',
              email: 'ayse.demir@example.com',
              phone: '5559876543',
              role: 'farmer',
              approvalStatus: 'pending',
              accountStatus: 'active',
              createdAt: '2023-06-16T14:20:00Z'
            },
            farmName: 'Demir Tarım',
            city: 'İzmir',
            district: 'Urla',
            address: 'Zeytinlik Mah. No:45',
            taxNumber: '9876543210',
            categories: [{ _id: '3', category_name: 'Zeytin' }, { _id: '4', category_name: 'Zeytinyağı' }],
            createdAt: '2023-06-16T14:20:00Z'
          }
        ]);
      } else if (tabType === 'approved') {
        setFarmers([
          {
            _id: '3',
            user: {
              _id: '103',
              firstName: 'Mehmet',
              lastName: 'Kaya',
              email: 'mehmet.kaya@example.com',
              phone: '5553456789',
              role: 'farmer',
              approvalStatus: 'approved',
              accountStatus: 'active',
              createdAt: '2023-05-10T09:15:00Z'
            },
            farmName: 'Kaya Organik',
            city: 'Bursa',
            district: 'Nilüfer',
            address: 'Organik Tarım Bölgesi No:78',
            taxNumber: '5678901234',
            categories: [{ _id: '1', category_name: 'Sebze' }, { _id: '5', category_name: 'Organik Ürünler' }],
            createdAt: '2023-05-10T09:15:00Z'
          }
        ]);
      } else {
        setFarmers([
          {
            _id: '4',
            user: {
              _id: '104',
              firstName: 'Ali',
              lastName: 'Öztürk',
              email: 'ali.ozturk@example.com',
              phone: '5557890123',
              role: 'farmer',
              approvalStatus: 'rejected',
              accountStatus: 'active',
              createdAt: '2023-06-05T16:45:00Z'
            },
            farmName: 'Öztürk Tarla',
            city: 'Konya',
            district: 'Meram',
            address: 'Tarla Mah. No:56',
            taxNumber: '3456789012',
            categories: [{ _id: '6', category_name: 'Tahıllar' }],
            createdAt: '2023-06-05T16:45:00Z'
          }
        ]);
      }
      
      setIsLoading(false);
    }
  };
  
  // Çiftçi başvurusunu onaylama fonksiyonu
  const approveFarmer = async (farmerId: string) => {
    try {
      const token = user.token;
      
      console.log('Approving farmer with ID:', farmerId);
      console.log('API URL:', `${API_URL}/farmers/${farmerId}/approve`);
      
      const response = await fetch(`${API_URL}/farmers/${farmerId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Çiftçi onaylama işlemi başarısız oldu');
      }
      
      const responseData = await response.json();
      
      Alert.alert(
        'Başarılı',
        'Çiftçi başvurusu onaylandı.',
        [{ text: 'Tamam', onPress: () => fetchFarmers(activeTab) }]
      );
    } catch (err) {
      console.error('Çiftçi onaylanırken hata oluştu:', err);
      Alert.alert('Hata', 'Çiftçi onaylanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Çiftçi başvurusunu reddetme fonksiyonu
  const rejectFarmer = async (farmerId: string) => {
    try {
      if (!rejectionReason.trim()) {
        Alert.alert('Uyarı', 'Lütfen bir ret sebebi belirtin.');
        return;
      }
      
      const token = user.token;
      
      console.log('Rejecting farmer with ID:', farmerId);
      console.log('API URL:', `${API_URL}/farmers/${farmerId}/approve`);
      
      const response = await fetch(`${API_URL}/farmers/${farmerId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Çiftçi reddetme işlemi başarısız oldu');
      }
      
      const responseData = await response.json();
      
      // Reddetme işlemi başarılı olunca, modalları kapat ve state'i temizle
      setShowRejectionModal(false);
      setRejectionReason('');
      
      Alert.alert(
        'Başarılı',
        'Çiftçi başvurusu reddedildi.',
        [{ text: 'Tamam', onPress: () => fetchFarmers(activeTab) }]
      );
    } catch (err) {
      console.error('Çiftçi reddedilirken hata oluştu:', err);
      Alert.alert('Hata', 'Çiftçi reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Tab değiştirme işlevi
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Çiftçi başvuru detaylarını görüntüleme fonksiyonu
  const viewFarmerDetails = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsModalVisible(true);
  };

  // Reddetme modalını aç
  const openRejectionModal = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  // Reddetme modalını kapat
  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
  };

  // Geri butonuna basıldığında admin paneline dön
  const handleBack = () => {
    router.back();
  };

  // Pull to refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFarmers(activeTab).finally(() => setRefreshing(false));
  }, [activeTab]);

  // İlk ve kesin kontrol - Admin değilse hiçbir şekilde bu sayfayı gösterme
  if (!user?.data || user.data.role !== 'admin') {
    console.log('FarmerRequests - Immediate check: Not admin, redirecting');
    return <Redirect href="/(tabs)" />;
  }
  
  // İkinci kontrol - isAdmin state'i false ise yönlendir
  if (!isAdmin) {
    console.log('FarmerRequests - Secondary check: isAdmin state is false');
    return <Redirect href="/(tabs)" />;
  }

  // Yükleme ekranı
  if (isLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: '#fff' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={[styles.loadingText, { color: '#333' }]}>Çiftçi verileri yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor: '#fff' }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#d9534f" />
        <ThemedText style={[styles.errorText, { color: '#333' }]}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchFarmers(activeTab)}
        >
          <ThemedText style={styles.retryButtonText}>Tekrar Dene</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#3F51B5" barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Çiftçi Yönetimi',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#3F51B5',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBack}
              style={{ marginLeft: 8, padding: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Tab Butonları */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'pending' && styles.activeTabButton
          ]}
          onPress={() => handleTabChange('pending')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'pending' ? '#fff' : '#3F51B5'} 
          />
          <ThemedText 
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText
            ]}
          >
            Bekleyen
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'approved' && styles.activeTabButton
          ]}
          onPress={() => handleTabChange('approved')}
        >
          <Ionicons 
            name="checkmark-circle-outline" 
            size={18} 
            color={activeTab === 'approved' ? '#fff' : '#4CAF50'} 
          />
          <ThemedText 
            style={[
              styles.tabText,
              activeTab === 'approved' && styles.activeTabText
            ]}
          >
            Onaylanan
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'rejected' && styles.activeTabButton
          ]}
          onPress={() => handleTabChange('rejected')}
        >
          <Ionicons 
            name="close-circle-outline" 
            size={18} 
            color={activeTab === 'rejected' ? '#fff' : '#F44336'} 
          />
          <ThemedText 
            style={[
              styles.tabText,
              activeTab === 'rejected' && styles.activeTabText
            ]}
          >
            Reddedilen
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[activeTab === 'pending' ? '#3F51B5' : activeTab === 'approved' ? '#4CAF50' : '#F44336']}
            tintColor={activeTab === 'pending' ? '#3F51B5' : activeTab === 'approved' ? '#4CAF50' : '#F44336'}
            title="Yenileniyor..."
            titleColor="#757575"
          />
        }
      >
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <Ionicons 
              name={
                activeTab === 'pending' ? 'time-outline' : 
                activeTab === 'approved' ? 'checkmark-circle-outline' : 
                'close-circle-outline'
              } 
              size={24} 
              color={
                activeTab === 'pending' ? '#3F51B5' : 
                activeTab === 'approved' ? '#4CAF50' : 
                '#F44336'
              } 
            />
            <ThemedText style={styles.statusNumber}>{farmers.length}</ThemedText>
            <ThemedText style={styles.statusLabel}>
              {activeTab === 'pending' ? 'Bekleyen Başvuru' : 
               activeTab === 'approved' ? 'Onaylanmış Çiftçi' : 
               'Reddedilmiş Başvuru'}
            </ThemedText>
          </View>
        </View>

        {farmers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={
                activeTab === 'pending' ? 'checkmark-circle-outline' : 
                activeTab === 'approved' ? 'people-outline' : 
                'alert-circle-outline'
              } 
              size={70} 
              color={
                activeTab === 'pending' ? '#4CAF50' : 
                activeTab === 'approved' ? '#3F51B5' : 
                '#F44336'
              } 
            />
            <ThemedText style={styles.emptyText}>
              {activeTab === 'pending' ? 'İncelenecek çiftçi başvurusu bulunmuyor.' : 
               activeTab === 'approved' ? 'Henüz onaylanmış çiftçi bulunmuyor.' : 
               'Reddedilmiş çiftçi başvurusu bulunmuyor.'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            {farmers.map((farmer) => (
              <View key={farmer._id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.farmerInfoHeader}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <View style={styles.nameContainer}>
                      <ThemedText style={styles.farmerName}>{farmer.user.firstName} {farmer.user.lastName}</ThemedText>
                      <ThemedText style={styles.farmName}>{farmer.farmName}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#6c757d" />
                    <ThemedText style={styles.requestDate}>
                      {formatDate(farmer.createdAt)}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Ionicons name="location-outline" size={18} color="#3F51B5" />
                    <ThemedText style={styles.cardText}>
                      {farmer.city}, {farmer.district}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Ionicons name="call-outline" size={18} color="#3F51B5" />
                    <ThemedText style={styles.cardText}>
                      {farmer.user.phone}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Ionicons name="mail-outline" size={18} color="#3F51B5" />
                    <ThemedText style={styles.cardText}>
                      {farmer.user.email}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Ionicons name="leaf-outline" size={18} color="#3F51B5" />
                    <ThemedText style={styles.cardText}>
                      {formatCategories(farmer.categories)}
                    </ThemedText>
                  </View>
                  
                  {activeTab === 'rejected' && (
                    <View style={styles.rejectionReasonContainer}>
                      <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
                      <ThemedText style={styles.rejectionReasonText}>
                        Ret Sebebi: {farmer.rejectionReason || 'Belirtilmemiş'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => viewFarmerDetails(farmer)}
                  >
                    <Ionicons name="information-circle-outline" size={18} color="#fff" />
                    <ThemedText style={styles.buttonText}>Detaylar</ThemedText>
                  </TouchableOpacity>
                  
                  {activeTab === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.approveButton}
                        onPress={() => approveFarmer(farmer._id)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => openRejectionModal(farmer)}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Reddetme Sebebi Modalı */}
      {selectedFarmer && (
        <Modal
          visible={showRejectionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closeRejectionModal}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOuterContainer}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="alert-circle" size={24} color="#f44336" />
                  <ThemedText style={styles.modalTitle}>
                    Başvuru Reddetme
                  </ThemedText>
                  <TouchableOpacity 
                    onPress={closeRejectionModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-outline" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.farmerSummary}>
                    <View style={styles.avatarLarge}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <View>
                      <ThemedText style={styles.summaryName}>
                        {selectedFarmer.user.firstName} {selectedFarmer.user.lastName}
                      </ThemedText>
                      <ThemedText style={styles.summaryFarmName}>
                        {selectedFarmer.farmName}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <ThemedText style={styles.reasonHeader}>
                    Reddetme sebebini detaylı olarak açıklayınız:
                  </ThemedText>
                  
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={6}
                      placeholder="Ret sebebini yazın..."
                      placeholderTextColor="#aaa"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                    />
                  </View>
                  
                  <ThemedText style={styles.noteText}>
                    Not: Bu sebep çiftçiye e-posta ile iletilecektir. Çiftçi bu geribildirime göre bilgilerini düzenleyip tekrar başvurabilir.
                  </ThemedText>
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={closeRejectionModal}
                  >
                    <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.confirmRejectButton,
                      !rejectionReason ? styles.disabledButton : {}
                    ]}
                    onPress={() => rejectFarmer(selectedFarmer._id)}
                    disabled={!rejectionReason}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={styles.modalButtonText}>Reddet</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Çiftçi Detay Modalı */}
      {selectedFarmer && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOuterContainer}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.detailModalContent]}>
                <View style={styles.modalHeader}>
                  <Ionicons name="person-circle-outline" size={24} color="#3F51B5" />
                  <ThemedText style={styles.modalTitle}>
                    Çiftlik Detayları
                  </ThemedText>
                  <TouchableOpacity 
                    onPress={() => setIsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-outline" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.farmerSummary}>
                    <View style={styles.avatarLarge}>
                      <Ionicons name="person" size={32} color="#fff" />
                    </View>
                    <View style={styles.summaryInfo}>
                      <ThemedText style={styles.summaryName}>
                        {selectedFarmer.user.firstName} {selectedFarmer.user.lastName}
                      </ThemedText>
                      <ThemedText style={styles.summaryFarmName}>
                        {selectedFarmer.farmName}
                      </ThemedText>
                      <ThemedText style={styles.summaryLocation}>
                        {selectedFarmer.city}, {selectedFarmer.district}
                      </ThemedText>
                    </View>
                  </View>
                
                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="business-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>Çiftlik Bilgileri</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Çiftlik Adı:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.farmName}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Şehir:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.city}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>İlçe:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.district}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Adres:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.address}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Vergi No:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.taxNumber}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Kategoriler:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {formatCategories(selectedFarmer.categories)}
                      </ThemedText>
                    </View>

                    {selectedFarmer.description && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Açıklama:</ThemedText>
                        <ThemedText style={styles.detailValue}>
                          {selectedFarmer.description || 'Belirtilmemiş'}
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Kargo:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedFarmer.hasShipping ? 'Evet' : 'Hayır'}
                      </ThemedText>
                    </View>

                    {selectedFarmer.minOrderAmount !== undefined && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Min. Sipariş:</ThemedText>
                        <ThemedText style={styles.detailValue}>
                          {selectedFarmer.minOrderAmount} ₺
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="person-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>Çiftçi Bilgileri</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Ad Soyad:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedFarmer.user.firstName} {selectedFarmer.user.lastName}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>E-posta:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.user.email}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Telefon:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedFarmer.user.phone}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Başvuru Tarihi:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {formatDate(selectedFarmer.createdAt)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Sertifikalar Bölümü */}
                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="ribbon-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>Sertifikalar</ThemedText>
                    </View>
                    
                    {selectedFarmer.certificates && selectedFarmer.certificates.length > 0 ? (
                      selectedFarmer.certificates.map((certificate, index) => (
                        <View key={certificate._id || index} style={styles.certificateItem}>
                          <View style={styles.certificateHeader}>
                            <ThemedText style={styles.certificateName}>{certificate.name}</ThemedText>
                            <View style={[
                              styles.certificateStatus, 
                              {backgroundColor: certificate.verified ? '#e8f5e9' : '#fff3cd'}
                            ]}>
                              <ThemedText style={{
                                color: certificate.verified ? '#4CAF50' : '#856404',
                                fontSize: 12
                              }}>
                                {certificate.verified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                              </ThemedText>
                            </View>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Veren Kurum:</ThemedText>
                            <ThemedText style={styles.detailValue}>{certificate.issuer}</ThemedText>
                          </View>
                          
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Veriliş Tarihi:</ThemedText>
                            <ThemedText style={styles.detailValue}>
                              {formatDate(certificate.issueDate)}
                            </ThemedText>
                          </View>
                          
                          {certificate.expiryDate && (
                            <View style={styles.detailRow}>
                              <ThemedText style={styles.detailLabel}>Geçerlilik:</ThemedText>
                              <ThemedText style={styles.detailValue}>
                                {formatDate(certificate.expiryDate)}
                              </ThemedText>
                            </View>
                          )}
                          
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Tür:</ThemedText>
                            <ThemedText style={styles.detailValue}>{certificate.certificateType}</ThemedText>
                          </View>
                          
                          {certificate.image && (
                            <TouchableOpacity style={styles.viewCertificateButton}>
                              <Ionicons name="document-outline" size={16} color="#0d6efd" />
                              <ThemedText style={styles.viewCertificateText}>Sertifikayı Görüntüle</ThemedText>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyCertificates}>
                        <Ionicons name="document-outline" size={32} color="#adb5bd" />
                        <ThemedText style={styles.emptyCertificatesText}>
                          Henüz sertifika bulunmuyor
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalApproveButton}
                    onPress={() => {
                      approveFarmer(selectedFarmer._id);
                      setIsModalVisible(false);
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={styles.modalButtonText}>Onayla</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalRejectButton}
                    onPress={() => {
                      setIsModalVisible(false);
                      openRejectionModal(selectedFarmer);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={styles.modalButtonText}>Reddet</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Ekran genişliğini al
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusCard: {
    backgroundColor: '#e8eaf6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#3F51B5',
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3F51B5',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  requestsContainer: {
    padding: 12,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  farmerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  farmName: {
    fontSize: 14,
    color: '#3F51B5',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F51B5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Styles
  modalOuterContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  detailModalContent: {
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  modalBody: {
    padding: 16,
  },
  farmerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3F51B5',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  summaryFarmName: {
    fontSize: 15,
    color: '#3F51B5',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryLocation: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: '35%',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  reasonHeader: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  textAreaContainer: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  textArea: {
    height: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmRejectButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ffcdd2',
    opacity: 0.7,
  },
  modalApproveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalRejectButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  certificateItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  certificateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  certificateStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  viewCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f5ff',
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    marginTop: 10,
  },
  viewCertificateText: {
    color: '#0d6efd',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCertificates: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyCertificatesText: {
    color: '#6c757d',
    marginTop: 8,
    fontSize: 14,
  },
  // Yeni tab stiller
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3F51B5',
    backgroundColor: '#3F51B5',
  },
  tabText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 13,
  },
  activeTabText: {
    color: '#fff',
  },
  
  // Ret sebebi için ek stiller
  rejectionReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  rejectionReasonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
    flex: 1,
  },
}); 