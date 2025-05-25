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

// İletişim kişisi tipi
interface ContactPerson {
  name: string;
  position?: string;
  phone: string;
  email: string;
}

// Company User tipi
interface CompanyUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  approvalStatus: string;
  accountStatus?: string;
  createdAt: string;
}

// Company tipi
interface Company {
  _id: string;
  user: CompanyUser;
  companyName: string;
  city: string;
  district: string;
  address: string;
  taxNumber: string;
  taxOffice: string;
  contactPerson: ContactPerson;
  companyType: string;
  companySize?: string;
  description?: string;
  approvalStatus: string;
  createdAt: string;
  rejectionReason?: string;
}

// Tab türleri
type TabType = 'pending' | 'approved' | 'rejected';

export default function CompanyRequestsScreen() {
  const { user, API_URL } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
      console.log('CompanyRequests - User role:', user.data.role);
      console.log('CompanyRequests - Is admin?', userIsAdmin);
      setIsAdmin(userIsAdmin);
      
      // Admin olmayan kullanıcıyı yönlendir
      if (!userIsAdmin) {
        console.log('CompanyRequests - Non-admin user detected, redirecting');
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı verisi yoksa admin değil
      console.log('CompanyRequests - No user data, redirecting');
      setIsAdmin(false);
      router.replace('/(tabs)');
    }
  }, [user]);

  // Komponent yüklendiğinde ve API_URL, token değiştiğinde verileri çek
  useEffect(() => {
    // Sadece admin kullanıcılar için verileri yükle
    if (isAdmin && user?.token) {
      console.log('CompanyRequests - Loading data for admin user');
      fetchCompanies(activeTab);
    }
  }, [API_URL, user?.token, isAdmin, activeTab]);

  // Şirket tipini kullanıcı dostu formata çevir
  const formatCompanyType = (type: string): string => {
    const types: Record<string, string> = {
      'restaurant': 'Restoran',
      'hotel': 'Otel',
      'market': 'Market',
      'processor': 'İşleyici',
      'exporter': 'İhracatçı',
      'other': 'Diğer'
    };
    
    return types[type] || type;
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

  // API'den firmaları getiren fonksiyon
  const fetchCompanies = async (tabType: TabType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = user.token;
      
      // URL'yi endpoint tipine göre oluştur
      let endpoint = '';
      if (tabType === 'pending') {
        endpoint = '/companies/pending';
      } else if (tabType === 'approved') {
        endpoint = '/companies/approved';
      } else if (tabType === 'rejected') {
        endpoint = '/companies/rejected';
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
        throw new Error(`Firma verileri alınamadı (${tabType})`);
      }
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data));
      
      // API yanıt formatına göre firma verilerini çıkar
      let companies: Company[] = [];
      
      if (data.companies && Array.isArray(data.companies)) {
        companies = data.companies;
      } else if (data.data && Array.isArray(data.data)) {
        companies = data.data;
      } else if (Array.isArray(data)) {
        companies = data;
      }
      
      console.log('Extracted companies count:', companies.length);
      if (companies.length > 0) {
        console.log('First company example:', JSON.stringify(companies[0]));
      }
      
      // Firma verilerini state'e kaydet
      setCompanies(companies);
      setIsLoading(false);
    } catch (err) {
      console.error(`${tabType} firmaları alırken hata oluştu:`, err);
      setError(`Firma verileri yüklenirken bir hata oluştu.`);
      
      // Hata durumunda mockup veriler kullan
      if (tabType === 'pending') {
        setCompanies([
          {
            _id: '1',
            user: {
              _id: '101',
              firstName: 'Ahmet',
              lastName: 'Yılmaz',
              email: 'ahmet.yilmaz@example.com',
              phone: '5551234567',
              role: 'company',
              approvalStatus: 'pending',
              createdAt: '2023-06-15T10:30:00Z'
            },
            companyName: 'Yılmaz Gıda Ltd. Şti.',
            city: 'İstanbul',
            district: 'Beşiktaş',
            address: 'Levent Mah. No:123',
            taxNumber: '1234567890',
            taxOffice: 'Beşiktaş Vergi Dairesi',
            contactPerson: {
              name: 'Ahmet Yılmaz',
              position: 'Genel Müdür',
              phone: '5551234567',
              email: 'ahmet.yilmaz@example.com'
            },
            companyType: 'restaurant',
            approvalStatus: 'pending',
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
              role: 'company',
              approvalStatus: 'pending',
              createdAt: '2023-06-16T14:20:00Z'
            },
            companyName: 'Demir Market A.Ş.',
            city: 'İzmir',
            district: 'Bornova',
            address: 'Atatürk Mah. No:45',
            taxNumber: '9876543210',
            taxOffice: 'Bornova Vergi Dairesi',
            contactPerson: {
              name: 'Ayşe Demir',
              position: 'Satın Alma Müdürü',
              phone: '5559876543',
              email: 'ayse.demir@example.com'
            },
            companyType: 'market',
            approvalStatus: 'pending',
            createdAt: '2023-06-16T14:20:00Z'
          }
        ]);
      } else if (tabType === 'approved') {
        setCompanies([
          {
            _id: '3',
            user: {
              _id: '103',
              firstName: 'Mehmet',
              lastName: 'Kaya',
              email: 'mehmet.kaya@example.com',
              phone: '5553456789',
              role: 'company',
              approvalStatus: 'approved',
              createdAt: '2023-05-10T09:15:00Z'
            },
            companyName: 'Kaya Otel İşletmeleri',
            city: 'Antalya',
            district: 'Kemer',
            address: 'Sahil Cad. No:78',
            taxNumber: '5678901234',
            taxOffice: 'Kemer Vergi Dairesi',
            contactPerson: {
              name: 'Mehmet Kaya',
              position: 'Satın Alma Direktörü',
              phone: '5553456789',
              email: 'mehmet.kaya@example.com'
            },
            companyType: 'hotel',
            approvalStatus: 'approved',
            createdAt: '2023-05-10T09:15:00Z'
          }
        ]);
      } else {
        setCompanies([
          {
            _id: '4',
            user: {
              _id: '104',
              firstName: 'Ali',
              lastName: 'Öztürk',
              email: 'ali.ozturk@example.com',
              phone: '5557890123',
              role: 'company',
              approvalStatus: 'rejected',
              createdAt: '2023-06-05T16:45:00Z'
            },
            companyName: 'Öztürk İhracat Ltd. Şti.',
            city: 'Mersin',
            district: 'Akdeniz',
            address: 'Liman Mah. No:56',
            taxNumber: '3456789012',
            taxOffice: 'Akdeniz Vergi Dairesi',
            contactPerson: {
              name: 'Ali Öztürk',
              position: 'İhracat Müdürü',
              phone: '5557890123',
              email: 'ali.ozturk@example.com'
            },
            companyType: 'exporter',
            approvalStatus: 'rejected',
            rejectionReason: 'Firma evrakları eksik olduğu için başvuru reddedildi.',
            createdAt: '2023-06-05T16:45:00Z'
          }
        ]);
      }
      
      setIsLoading(false);
    }
  };

  // Firma başvurusunu onaylama fonksiyonu
  const approveCompany = async (companyId: string) => {
    try {
      const token = user.token;
      
      console.log('Approving company with ID:', companyId);
      console.log('API URL:', `${API_URL}/companies/${companyId}/approve`);
      
      const response = await fetch(`${API_URL}/companies/${companyId}/approve`, {
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
        throw new Error('Firma onaylama işlemi başarısız oldu');
      }
      
      const responseData = await response.json();
      
      Alert.alert(
        'Başarılı',
        'Firma başvurusu onaylandı.',
        [{ text: 'Tamam', onPress: () => fetchCompanies(activeTab) }]
      );
    } catch (err) {
      console.error('Firma onaylanırken hata oluştu:', err);
      Alert.alert('Hata', 'Firma onaylanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Firma başvurusunu reddetme fonksiyonu
  const rejectCompany = async (companyId: string) => {
    try {
      if (!rejectionReason.trim()) {
        Alert.alert('Uyarı', 'Lütfen bir ret sebebi belirtin.');
        return;
      }
      
      const token = user.token;
      
      console.log('Rejecting company with ID:', companyId);
      console.log('API URL:', `${API_URL}/companies/${companyId}/approve`);
      
      const response = await fetch(`${API_URL}/companies/${companyId}/approve`, {
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
        throw new Error('Firma reddetme işlemi başarısız oldu');
      }
      
      const responseData = await response.json();
      
      // Reddetme işlemi başarılı olunca, modalları kapat ve state'i temizle
      setShowRejectionModal(false);
      setRejectionReason('');
      
      Alert.alert(
        'Başarılı',
        'Firma başvurusu reddedildi.',
        [{ text: 'Tamam', onPress: () => fetchCompanies(activeTab) }]
      );
    } catch (err) {
      console.error('Firma reddedilirken hata oluştu:', err);
      Alert.alert('Hata', 'Firma reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };
  
  // Tab değişikliğini yönet
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  // Firma detaylarını görüntüle
  const viewCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setIsModalVisible(true);
  };
  
  // Reddetme modalını aç
  const openRejectionModal = (company: Company) => {
    setSelectedCompany(company);
    setRejectionReason('');
    setShowRejectionModal(true);
  };
  
  // Reddetme modalını kapat
  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
  };
  
  // Geri dön
  const handleBack = () => {
    router.back();
  };
  
  // Yenileme fonksiyonu
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCompanies(activeTab).finally(() => setRefreshing(false));
  }, [activeTab]);
  
  // İlk ve kesin kontrol - Admin değilse hiçbir şekilde bu sayfayı gösterme
  if (!user?.data || user.data.role !== 'admin') {
    console.log('CompanyRequests - Immediate check: Not admin, redirecting');
    return <Redirect href="/(tabs)" />;
  }
  
  // İkinci kontrol - isAdmin state'i false ise yönlendir
  if (!isAdmin) {
    console.log('CompanyRequests - Secondary check: isAdmin state is false');
    return <Redirect href="/(tabs)" />;
  }

  // Yükleme ekranı
  if (isLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: '#fff' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={[styles.loadingText, { color: '#333' }]}>Firma verileri yükleniyor...</ThemedText>
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
          onPress={() => fetchCompanies(activeTab)}
        >
          <ThemedText style={styles.retryButtonText}>Tekrar Dene</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  // UI Render
  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#3F51B5" barStyle="light-content" />
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Firma Yönetimi',
          headerTitle: 'Firma Yönetimi',
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
            color={activeTab === 'pending' ? '#3F51B5' : '#777'} 
          />
          <ThemedText style={[
            styles.tabButtonText,
            activeTab === 'pending' && styles.activeTabButtonText
          ]}>Bekleyen</ThemedText>
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
            color={activeTab === 'approved' ? '#3F51B5' : '#777'} 
          />
          <ThemedText style={[
            styles.tabButtonText,
            activeTab === 'approved' && styles.activeTabButtonText
          ]}>Onaylanan</ThemedText>
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
            color={activeTab === 'rejected' ? '#3F51B5' : '#777'} 
          />
          <ThemedText style={[
            styles.tabButtonText,
            activeTab === 'rejected' && styles.activeTabButtonText
          ]}>Reddedilen</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Firma Listesi */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color="#999" />
            <ThemedText style={styles.emptyText}>
              {activeTab === 'pending' 
                ? 'Bekleyen firma başvurusu bulunmuyor.' 
                : activeTab === 'approved' 
                ? 'Onaylanmış firma bulunmuyor.' 
                : 'Reddedilmiş firma başvurusu bulunmuyor.'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {companies.map((company) => (
              <View key={company._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.companyName}>{company.companyName}</ThemedText>
                  <ThemedText style={styles.companyType}>{formatCompanyType(company.companyType)}</ThemedText>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <ThemedText style={styles.infoText}>{company.user.firstName} {company.user.lastName}</ThemedText>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <ThemedText style={styles.infoText}>{company.district}, {company.city}</ThemedText>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <ThemedText style={styles.infoText}>{company.contactPerson.phone}</ThemedText>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={16} color="#666" />
                    <ThemedText style={styles.infoText}>{company.user.email}</ThemedText>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <ThemedText style={styles.infoText}>Başvuru: {formatDate(company.createdAt)}</ThemedText>
                  </View>
                  
                  {company.rejectionReason && (
                    <View style={styles.rejectionBox}>
                      <ThemedText style={styles.rejectionTitle}>Red Sebebi:</ThemedText>
                      <ThemedText style={styles.rejectionText}>{company.rejectionReason}</ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => viewCompanyDetails(company)}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3F51B5" />
                    <ThemedText style={styles.detailButtonText}>Detay</ThemedText>
                  </TouchableOpacity>
                  
                  {activeTab === 'pending' && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => approveCompany(company._id)}
                      >
                        <Ionicons name="checkmark-outline" size={16} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Onayla</ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => openRejectionModal(company)}
                      >
                        <Ionicons name="close-outline" size={16} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Reddet</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Firma Detay Modalı */}
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
                <Ionicons name="business-outline" size={24} color="#3F51B5" />
                <ThemedText style={styles.modalTitle}>
                  Firma Detayları
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-outline" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {selectedCompany && (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.companySummary}>
                    <View style={styles.avatarLarge}>
                      <Ionicons name="business" size={32} color="#fff" />
                    </View>
                    <View style={styles.summaryInfo}>
                      <ThemedText style={styles.summaryName}>
                        {selectedCompany.companyName}
                      </ThemedText>
                      <ThemedText style={styles.summaryCompanyType}>
                        {formatCompanyType(selectedCompany.companyType)}
                      </ThemedText>
                      <ThemedText style={styles.summaryLocation}>
                        {selectedCompany.city}, {selectedCompany.district}
                      </ThemedText>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      selectedCompany.approvalStatus === 'approved' ? styles.approvedBadge :
                      selectedCompany.approvalStatus === 'rejected' ? styles.rejectedBadge :
                      styles.pendingBadge
                    ]}>
                      <ThemedText style={[
                        styles.statusBadgeText,
                        {
                          color: selectedCompany.approvalStatus === 'approved' ? '#2e7d32' :
                                selectedCompany.approvalStatus === 'rejected' ? '#d32f2f' :
                                '#f57f17'
                        }
                      ]}>
                        {selectedCompany.approvalStatus === 'approved' ? 'Onaylandı' :
                        selectedCompany.approvalStatus === 'rejected' ? 'Reddedildi' :
                        'Beklemede'}
                      </ThemedText>
                    </View>
                  </View>
                
                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="business-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>Firma Bilgileri</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Firma Adı:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.companyName}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Firma Türü:</ThemedText>
                      <ThemedText style={styles.detailValue}>{formatCompanyType(selectedCompany.companyType)}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Vergi No:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.taxNumber}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Vergi Dairesi:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.taxOffice}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Şehir:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.city}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>İlçe:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.district}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Adres:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.address}</ThemedText>
                    </View>
                    
                    {selectedCompany.description && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Açıklama:</ThemedText>
                        <ThemedText style={styles.detailValue}>
                          {selectedCompany.description || 'Belirtilmemiş'}
                        </ThemedText>
                      </View>
                    )}

                    {selectedCompany.companySize && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Firma Boyutu:</ThemedText>
                        <ThemedText style={styles.detailValue}>
                          {selectedCompany.companySize === 'micro' ? 'Mikro' :
                           selectedCompany.companySize === 'small' ? 'Küçük' :
                           selectedCompany.companySize === 'medium' ? 'Orta' :
                           selectedCompany.companySize === 'large' ? 'Büyük' : 'Belirtilmemiş'}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="person-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>Kullanıcı Bilgileri</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Ad Soyad:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedCompany.user.firstName} {selectedCompany.user.lastName}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>E-posta:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.user.email}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Telefon:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.user.phone}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Başvuru Tarihi:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {formatDate(selectedCompany.createdAt)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="call-outline" size={18} color="#3F51B5" />
                      <ThemedText style={styles.sectionTitle}>İletişim Kişisi</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Ad Soyad:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.contactPerson.name}</ThemedText>
                    </View>
                    
                    {selectedCompany.contactPerson.position && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Pozisyon:</ThemedText>
                        <ThemedText style={styles.detailValue}>{selectedCompany.contactPerson.position}</ThemedText>
                      </View>
                    )}
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Telefon:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.contactPerson.phone}</ThemedText>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>E-posta:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedCompany.contactPerson.email}</ThemedText>
                    </View>
                  </View>

                  {selectedCompany.rejectionReason && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
                        <ThemedText style={[styles.sectionTitle, { color: '#F44336' }]}>Red Sebebi</ThemedText>
                      </View>
                      
                      <View style={styles.rejectionContainer}>
                        <ThemedText style={styles.rejectionReasonText}>{selectedCompany.rejectionReason}</ThemedText>
                      </View>
                    </View>
                  )}

                  {selectedCompany.approvalStatus === 'pending' && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.approveButtonLarge}
                        onPress={() => {
                          setIsModalVisible(false);
                          approveCompany(selectedCompany._id);
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                        <ThemedText style={styles.modalButtonText}>Onayla</ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.rejectButtonLarge}
                        onPress={() => {
                          setIsModalVisible(false);
                          openRejectionModal(selectedCompany);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#F44336" style={styles.buttonIcon} />
                        <ThemedText style={styles.rejectButtonLargeText}>Reddet</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Reddetme Sebebi Modalı */}
      <Modal
        visible={showRejectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRejectionModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.rejectionModalContainer}
        >
          <View style={styles.rejectionModalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle-outline" size={24} color="#F44336" />
              <ThemedText style={[styles.modalTitle, { color: '#333' }]}>Reddetme Sebebi</ThemedText>
              <TouchableOpacity 
                onPress={closeRejectionModal}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedCompany && (
              <ScrollView 
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
              >
                <View style={styles.rejectCompanyInfo}>
                  <ThemedText style={styles.rejectCompanyName}>{selectedCompany.companyName}</ThemedText>
                  <ThemedText style={styles.rejectCompanyDetail}>
                    {formatCompanyType(selectedCompany.companyType)} | {selectedCompany.city}
                  </ThemedText>
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
                  Not: Bu sebep firmaya e-posta ile iletilecektir. Firma bu geribildirime göre bilgilerini düzenleyip tekrar başvurabilir.
                </ThemedText>
                
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
                      !rejectionReason.trim() ? styles.disabledButton : {}
                    ]}
                    onPress={() => rejectCompany(selectedCompany._id)}
                    disabled={!rejectionReason.trim()}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={styles.modalButtonText}>Reddet</ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Stiller
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3F51B5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  companyType: {
    fontSize: 14,
    color: '#666',
  },
  cardBody: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  rejectionBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 5,
  },
  rejectionText: {
    fontSize: 14,
    color: '#555',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#E3F2FD',
  },
  detailButtonText: {
    marginLeft: 5,
    color: '#3F51B5',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginRight: 10,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F44336',
    borderRadius: 5,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOuterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '90%',
  },
  modalContent: {
    padding: 15,
  },
  detailModalContent: {
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#3F51B5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
  },
  companySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 10,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCompanyType: {
    fontSize: 14,
    color: '#666',
  },
  summaryLocation: {
    fontSize: 14,
    color: '#666',
  },
  detailSection: {
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#3F51B5',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginLeft: 'auto',
  },
  pendingBadge: {
    backgroundColor: '#FFF9C4',
  },
  approvedBadge: {
    backgroundColor: '#C8E6C9',
  },
  rejectedBadge: {
    backgroundColor: '#FFCDD2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectionContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 15,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  approveButtonLarge: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rejectButtonLarge: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#F44336',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rejectButtonLargeText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rejectionModalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    maxHeight: '70%',
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    minHeight: 120,
  },
  textArea: {
    flex: 1,
    color: '#333',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmRejectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F44336',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  rejectCompanyInfo: {
    marginBottom: 15,
  },
  rejectCompanyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rejectCompanyDetail: {
    fontSize: 14,
    color: '#666',
  },
  reasonHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3F51B5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 5,
  },
  activeTabButtonText: {
    color: '#3F51B5',
    fontWeight: '700',
  },
}); 