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
  TextInput
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

  // İkinci kontrol - isAdmin state'i false ise yönlendir
  if (!isAdmin) {
    console.log('FarmerRequests - Secondary check: isAdmin state is false');
    return <Redirect href="/(tabs)" />;
  }

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

  // API'den bekleyen çiftçi başvurularını getiren fonksiyon
  const fetchPendingFarmers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = user.token;
      
      console.log('API URL:', `${API_URL}/farmers/pending`);
      
      const response = await fetch(`${API_URL}/farmers/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Bekleyen çiftçi verileri alınamadı');
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
      console.error('Bekleyen çiftçileri alırken hata oluştu:', err);
      setError('Çiftçi başvuruları yüklenirken bir hata oluştu.');
      
      // Hata durumunda mockup veriler kullan
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
        [{ text: 'Tamam', onPress: () => fetchPendingFarmers() }]
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
        [{ text: 'Tamam', onPress: () => fetchPendingFarmers() }]
      );
    } catch (err) {
      console.error('Çiftçi reddedilirken hata oluştu:', err);
      Alert.alert('Hata', 'Çiftçi reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
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

  // Komponent yüklendiğinde ve API_URL, token değiştiğinde verileri çek
  useEffect(() => {
    // Sadece admin kullanıcılar için verileri yükle
    if (isAdmin && user?.token) {
      console.log('FarmerRequests - Loading data for admin user');
      fetchPendingFarmers();
    }
  }, [API_URL, user?.token, isAdmin]);

  // Geri butonuna basıldığında admin paneline dön
  const handleBack = () => {
    router.back();
  };

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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Çiftçi başvuruları yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#d9534f" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchPendingFarmers()}
        >
          <ThemedText style={styles.retryButtonText}>Tekrar Dene</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Çiftçi Başvuruları',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBack}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Çiftçi Başvuruları</ThemedText>
          <ThemedText style={styles.subtitle}>
            Çiftçi başvurularını inceleyip onaylayabilir veya reddedebilirsiniz.
          </ThemedText>
        </ThemedView>

        {farmers.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#4CAF50" />
            <ThemedText style={styles.emptyText}>İncelenecek çiftçi başvurusu bulunmuyor.</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.requestsContainer}>
            {farmers.map((farmer) => (
              <ThemedView key={farmer._id} style={styles.requestCard}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedView style={styles.farmerInfoHeader}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <ThemedView style={styles.nameContainer}>
                      <ThemedText style={styles.farmerName}>{farmer.user.firstName} {farmer.user.lastName}</ThemedText>
                      <ThemedText style={styles.farmName}>{farmer.farmName}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.requestDate}>
                    {formatDate(farmer.createdAt)}
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.cardContent}>
                  <ThemedView style={styles.cardRow}>
                    <Ionicons name="location-outline" size={18} color="#4CAF50" />
                    <ThemedText style={styles.cardText}>
                      {farmer.city}, {farmer.district}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.cardRow}>
                    <Ionicons name="call-outline" size={18} color="#4CAF50" />
                    <ThemedText style={styles.cardText}>
                      {farmer.user.phone}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.cardRow}>
                    <Ionicons name="mail-outline" size={18} color="#4CAF50" />
                    <ThemedText style={styles.cardText}>
                      {farmer.user.email}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.cardRow}>
                    <Ionicons name="leaf-outline" size={18} color="#4CAF50" />
                    <ThemedText style={styles.cardText}>
                      {formatCategories(farmer.categories)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.cardActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.detailsButton]}
                    onPress={() => viewFarmerDetails(farmer)}
                  >
                    <Ionicons name="information-circle-outline" size={18} color="#6c757d" />
                    <ThemedText style={styles.detailsButtonText}>Detaylar</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => approveFarmer(farmer._id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                    <ThemedText style={styles.approveButtonText}>Onayla</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => openRejectionModal(farmer)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#f44336" />
                    <ThemedText style={styles.rejectButtonText}>Reddet</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
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
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxHeight: 'auto' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Ret Sebebi Belirtin
                </ThemedText>
                <TouchableOpacity onPress={closeRejectionModal}>
                  <Ionicons name="close-outline" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <ThemedText style={styles.reasonHeader}>
                  <ThemedText style={{fontWeight: 'bold'}}>{selectedFarmer.farmName}</ThemedText> isimli çiftliğin başvurusunu reddetme sebebinizi detaylı olarak açıklayınız:
                </ThemedText>
                
                <ThemedView style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={6}
                    placeholder="Ret sebebini yazın..."
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                  />
                </ThemedView>
                
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
                  style={styles.confirmRejectButton}
                  onPress={() => rejectFarmer(selectedFarmer._id)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <ThemedText style={styles.modalButtonText}>Reddet</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Çiftçi Başvuru Detayı
                </ThemedText>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close-outline" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <ThemedView style={styles.farmerSummary}>
                  <View style={styles.avatarLarge}>
                    <Ionicons name="person" size={32} color="#fff" />
                  </View>
                  <ThemedView style={styles.summaryInfo}>
                    <ThemedText style={styles.summaryName}>
                      {selectedFarmer.user.firstName} {selectedFarmer.user.lastName}
                    </ThemedText>
                    <ThemedText style={styles.summaryFarmName}>
                      {selectedFarmer.farmName}
                    </ThemedText>
                    <ThemedText style={styles.summaryLocation}>
                      {selectedFarmer.city}, {selectedFarmer.district}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              
                <ThemedView style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Çiftlik Bilgileri</ThemedText>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Çiftlik Adı:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.farmName}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Şehir:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.city}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>İlçe:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.district}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Adres:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.address}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Vergi No:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.taxNumber}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Kategoriler:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatCategories(selectedFarmer.categories)}
                    </ThemedText>
                  </ThemedView>

                  {selectedFarmer.description && (
                    <ThemedView style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Açıklama:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedFarmer.description || 'Belirtilmemiş'}
                      </ThemedText>
                    </ThemedView>
                  )}

                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Kargo:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {selectedFarmer.hasShipping ? 'Evet' : 'Hayır'}
                    </ThemedText>
                  </ThemedView>

                  {selectedFarmer.minOrderAmount !== undefined && (
                    <ThemedView style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Min. Sipariş:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedFarmer.minOrderAmount} ₺
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
                
                <ThemedView style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Çiftçi Bilgileri</ThemedText>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Ad Soyad:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {selectedFarmer.user.firstName} {selectedFarmer.user.lastName}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>E-posta:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.user.email}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Telefon:</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedFarmer.user.phone}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Başvuru Tarihi:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatDate(selectedFarmer.createdAt)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Sertifikalar Bölümü */}
                <ThemedView style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Sertifikalar</ThemedText>
                  
                  {selectedFarmer.certificates && selectedFarmer.certificates.length > 0 ? (
                    selectedFarmer.certificates.map((certificate, index) => (
                      <ThemedView key={certificate._id || index} style={styles.certificateItem}>
                        <ThemedView style={styles.certificateHeader}>
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
                        </ThemedView>
                        
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Veren Kurum:</ThemedText>
                          <ThemedText style={styles.detailValue}>{certificate.issuer}</ThemedText>
                        </ThemedView>
                        
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Veriliş Tarihi:</ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {formatDate(certificate.issueDate)}
                          </ThemedText>
                        </ThemedView>
                        
                        {certificate.expiryDate && (
                          <ThemedView style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Geçerlilik:</ThemedText>
                            <ThemedText style={styles.detailValue}>
                              {formatDate(certificate.expiryDate)}
                            </ThemedText>
                          </ThemedView>
                        )}
                        
                        <ThemedView style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>Tür:</ThemedText>
                          <ThemedText style={styles.detailValue}>{certificate.certificateType}</ThemedText>
                        </ThemedView>
                        
                        {certificate.image && (
                          <TouchableOpacity style={styles.viewCertificateButton}>
                            <Ionicons name="document-outline" size={16} color="#0d6efd" />
                            <ThemedText style={styles.viewCertificateText}>Sertifikayı Görüntüle</ThemedText>
                          </TouchableOpacity>
                        )}
                      </ThemedView>
                    ))
                  ) : (
                    <ThemedView style={styles.emptyCertificates}>
                      <Ionicons name="document-outline" size={32} color="#adb5bd" />
                      <ThemedText style={styles.emptyCertificatesText}>
                        Henüz sertifika bulunmuyor
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
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
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  requestsContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  farmerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nameContainer: {
    flexDirection: 'column',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  farmName: {
    fontSize: 14,
    color: '#666',
  },
  requestDate: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 15,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButton: {
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  detailsButtonText: {
    color: '#6c757d',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  approveButton: {
    backgroundColor: '#e8f5e9',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  approveButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  rejectButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  farmerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  summaryFarmName: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 2,
  },
  summaryLocation: {
    fontSize: 14,
    color: '#666',
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    width: '35%',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalApproveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
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
    borderRadius: 8,
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
  textAreaContainer: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 120,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  reasonHeader: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
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
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  certificateItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
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
    paddingVertical: 3,
    borderRadius: 12,
  },
  viewCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f5ff',
    padding: 8,
    borderRadius: 6,
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
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyCertificatesText: {
    color: '#6c757d',
    marginTop: 8,
    fontSize: 14,
  }
}); 