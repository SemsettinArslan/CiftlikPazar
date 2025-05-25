import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '../src/utils/networkUtils';

const API_URL = getApiBaseUrl();

// Request tipini tanımla
interface Request {
  _id: string;
  title: string;
  description: string;
  category: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  city: string;
  district: string;
  budget?: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  isOrganic: boolean;
  specifications?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    _id: string;
    name: string;
  };
  offers?: Offer[];
}

// Teklif tipi
interface Offer {
  _id: string;
  request: string;
  farmer: string;
  price: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Kategori tipi
interface Category {
  _id: string;
  id?: string;
  name?: string;
  category_name?: string;
  parent?: string;
}

export default function FarmerRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Detay modalı için state'ler
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Teklif modalı için state'ler
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  
  // Kategori önbelleği
  const [categories, setCategories] = useState<{[key: string]: string}>({});
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = user?.token;
      
      if (!token) {
        console.error('Token bulunamadı, kategoriler yüklenemedi');
        setCategoriesLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/categories?limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Kategori önbelleğini güncelle
        const categoryCache: {[key: string]: string} = {};
        
        if (Array.isArray(response.data.data)) {
          response.data.data.forEach((category: any) => {
            if (category._id && (category.name || category.category_name)) {
              const categoryName = category.category_name || category.name;
              categoryCache[category._id] = categoryName;
              
              if (category.id && category.id !== category._id) {
                categoryCache[category.id] = categoryName;
              }
            }
          });
        }
        
        setCategories(categoryCache);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Talepleri getir
  const fetchRequests = async () => {
    try {
      setError('');
      setLoading(true);
      
      const token = user?.token;
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı');
        setLoading(false);
        return;
      }
      
      // Aktif talepleri getir (şirketlerin talepleri)
      const response = await axios.get(`${API_URL}/requests?status=active&limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setRequests(response.data.data);
        
        // Eğer kategoriler yüklenmemişse, talepleri yükledikten sonra kategorileri yükle
        if (Object.keys(categories).length === 0 && !categoriesLoading) {
          fetchCategories();
        }
      } else {
        setError('Talepler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Talepler getirilirken hata:', err);
      setError('Talepler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfa yüklendiğinde talepleri getir
  useEffect(() => {
    fetchRequests();
  }, []);

  // Yenileme işlevi
  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Talep detayını görüntüle
  const viewRequestDetail = (request: Request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  // Teklif modalını aç
  const openOfferModal = () => {
    setOfferPrice('');
    setOfferDescription('');
    setOfferModalVisible(true);
  };

  // Modalları kapat
  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const closeOfferModal = () => {
    setOfferModalVisible(false);
  };

  // Teklif gönder
  const submitOffer = async () => {
    if (!selectedRequest) return;
    
    // Fiyat kontrolü
    if (!offerPrice || isNaN(parseFloat(offerPrice)) || parseFloat(offerPrice) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir fiyat giriniz');
      return;
    }
    
    // Açıklama kontrolü
    if (!offerDescription || offerDescription.trim().length < 10) {
      Alert.alert('Hata', 'Lütfen en az 10 karakter içeren bir açıklama giriniz');
      return;
    }
    
    try {
      setOfferLoading(true);
      
      const token = user?.token;
      if (!token) {
        Alert.alert('Hata', 'Oturum bilgisi bulunamadı');
        setOfferLoading(false);
        return;
      }
      
      const offerData = {
        request: selectedRequest._id,
        price: parseFloat(offerPrice),
        description: offerDescription
      };
      
      const response = await axios.post(`${API_URL}/offers`, offerData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        Alert.alert('Başarılı', 'Teklifiniz başarıyla gönderildi');
        closeOfferModal();
        closeModal();
        fetchRequests(); // Talepleri yenile
      } else {
        Alert.alert('Hata', response.data.message || 'Teklif gönderilirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Teklif gönderilirken hata:', err);
      
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        Alert.alert('Hata', err.response.data.message);
      } else {
        Alert.alert('Hata', 'Teklif gönderilirken bir hata oluştu');
      }
    } finally {
      setOfferLoading(false);
    }
  };

  // Durum rengini belirle
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Yeşil
      case 'completed':
        return '#2196F3'; // Mavi
      case 'cancelled':
        return '#F44336'; // Kırmızı
      case 'expired':
        return '#FF9800'; // Turuncu
      default:
        return '#9E9E9E'; // Gri
    }
  };

  // Durum metnini belirle
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Kategori adını getir
  const getCategoryName = (category: any): string => {
    if (!category) return 'Kategori Yok';
    
    // Eğer doğrudan bir isim verilmişse onu kullan
    if (typeof category === 'string') {
      // Önce önbellekte ara
      if (categories[category]) {
        return categories[category];
      }
      return category; // Önbellekte yoksa ID'yi göster
    }
    
    // Eğer nesne olarak verilmişse ve name özelliği varsa
    if (typeof category === 'object' && category.name) {
      return category.name;
    }
    
    // Eğer nesne olarak verilmişse ve id özelliği varsa, önbellekte ara
    if (typeof category === 'object' && (category._id || category.id)) {
      const categoryId = category._id || category.id;
      if (categories[categoryId]) {
        return categories[categoryId];
      }
    }
    
    return 'Kategori Bulunamadı';
  };

  // Talep kartı bileşeni
  const RequestCard = ({ item }: { item: Request }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => viewRequestDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.companyName}>
          <Ionicons name="business-outline" size={14} color="#666" /> {item.company?.name || 'Şirket Adı Yok'}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{getCategoryName(item.category)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.quantity} {item.unit}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.city}/{item.district}</Text>
          </View>
          
          {item.budget && (
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.budget} ₺</Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Son Tarih: {formatDate(item.deadline)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Talep detay modalı
  const RequestDetailModal = () => {
    if (!selectedRequest) return null;
    
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRequest.title}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
                <Text style={styles.companyDetailName}>
                  <Ionicons name="business-outline" size={16} color="#333" /> {selectedRequest.company?.name || 'Şirket Adı Yok'}
                </Text>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Talep Detayları</Text>
                <Text style={styles.detailDescription}>{selectedRequest.description}</Text>
                
                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Kategori</Text>
                    <Text style={styles.detailValue}>{getCategoryName(selectedRequest.category)}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Miktar</Text>
                    <Text style={styles.detailValue}>{selectedRequest.quantity} {selectedRequest.unit}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Konum</Text>
                    <Text style={styles.detailValue}>{selectedRequest.city}/{selectedRequest.district}</Text>
                  </View>
                  
                  {selectedRequest.budget && (
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>Bütçe</Text>
                      <Text style={styles.detailValue}>{selectedRequest.budget} ₺</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Son Tarih</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRequest.deadline)}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(selectedRequest.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedRequest.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Organik</Text>
                    <Text style={styles.detailValue}>{selectedRequest.isOrganic ? 'Evet' : 'Hayır'}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Oluşturulma</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRequest.createdAt)}</Text>
                  </View>
                </View>
                
                {selectedRequest.specifications && (
                  <View style={styles.specificationsContainer}>
                    <Text style={styles.detailLabel}>Özel İstekler</Text>
                    <Text style={styles.detailValue}>{selectedRequest.specifications}</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.offerButton}
                onPress={openOfferModal}
              >
                <Ionicons name="pricetag-outline" size={20} color="#fff" />
                <Text style={styles.offerButtonText}>Teklif Ver</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Teklif modalı
  const OfferModal = () => {
    return (
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeOfferModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Teklif Ver</Text>
              <TouchableOpacity onPress={closeOfferModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Teklif Bilgileri</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Fiyat (₺)</Text>
                  <TextInput
                    style={styles.input}
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                    placeholder="Teklif fiyatınız"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={offerDescription}
                    onChangeText={setOfferDescription}
                    placeholder="Teklifiniz hakkında detaylı bilgi verin"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={submitOffer}
                  disabled={offerLoading}
                >
                  {offerLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Teklifi Gönder</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Talep Listesi',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
        }}
      />
      
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Talepler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRequests}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>Henüz aktif talep bulunmuyor</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={({ item }) => <RequestCard item={item} />}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4CAF50']}
              />
            }
          />
        )}
      </View>
      
      {/* Detay Modalı */}
      <RequestDetailModal />
      
      {/* Teklif Modalı */}
      <OfferModal />
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 14,
    color: '#666',
  },
  cardBody: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  companyDetailName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailGridItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  specificationsContainer: {
    marginTop: 16,
  },
  offerButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  offerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 