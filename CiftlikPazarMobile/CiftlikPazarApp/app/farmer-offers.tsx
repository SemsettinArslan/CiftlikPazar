import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '../src/utils/networkUtils';

const API_URL = getApiBaseUrl();

// Teklif tipi tanımla
interface Offer {
  _id: string;
  request: {
    _id: string;
    title: string;
    description: string;
    quantity: number;
    unit: string;
    deadline: string;
    status: string;
    company: {
      _id: string;
      name: string;
    };
  };
  price: number;
  quantity: number;
  description: string;
  estimatedDelivery: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function FarmerOffersScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Detay modalı için state'ler
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Teklifleri getir
  const fetchOffers = async () => {
    try {
      setError('');
      setLoading(true);
      
      const token = user?.token;
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı');
        setLoading(false);
        return;
      }
      
      // Teklifleri getir
      const response = await axios.get(`${API_URL}/offers/my-offers?limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setOffers(response.data.data);
      } else {
        setError('Teklifler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Teklifler getirilirken hata:', err);
      setError('Teklifler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfa yüklendiğinde teklifleri getir
  useEffect(() => {
    fetchOffers();
  }, []);

  // Yenileme işlevi
  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  // Teklif detayını görüntüle
  const viewOfferDetail = (offer: Offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  // Modal kapat
  const closeModal = () => {
    setModalVisible(false);
    setSelectedOffer(null);
  };

  // Teklifi iptal et
  const cancelOffer = async (offerId: string) => {
    try {
      const token = user?.token;
      
      if (!token) {
        Alert.alert('Hata', 'Oturum bilgisi bulunamadı');
        return;
      }
      
      Alert.alert(
        'Teklifi İptal Et',
        'Bu teklifi iptal etmek istediğinize emin misiniz?',
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Evet, İptal Et',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await axios.delete(`${API_URL}/offers/${offerId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.data.success) {
                  Alert.alert('Başarılı', 'Teklifiniz başarıyla iptal edildi');
                  closeModal();
                  fetchOffers(); // Teklifleri yenile
                } else {
                  Alert.alert('Hata', 'Teklif iptal edilirken bir hata oluştu');
                }
              } catch (err) {
                console.error('Teklif iptal edilirken hata:', err);
                
                if (axios.isAxiosError(err) && err.response?.data?.message) {
                  Alert.alert('Hata', err.response.data.message);
                } else {
                  Alert.alert('Hata', 'Teklif iptal edilirken bir hata oluştu');
                }
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Teklif iptal edilirken hata:', err);
      Alert.alert('Hata', 'Teklif iptal edilirken bir hata oluştu');
    }
  };

  // Durum rengini belirle
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800'; // Turuncu
      case 'accepted':
        return '#4CAF50'; // Yeşil
      case 'rejected':
        return '#F44336'; // Kırmızı
      default:
        return '#9E9E9E'; // Gri
    }
  };

  // Durum metnini belirle
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
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

  // Teklif kartı bileşeni
  const OfferCard = ({ item }: { item: Offer }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => viewOfferDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.request?.title || 'Talep Başlığı Yok'}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.companyName}>
          <Ionicons name="business-outline" size={14} color="#666" /> {item.request?.company?.name || 'Şirket Adı Yok'}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Teklif: {item.price} ₺</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Miktar: {item.quantity} {item.request?.unit}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Teslim: {formatDate(item.estimatedDelivery)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Oluşturulma: {formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Teklif detay modalı
  const OfferDetailModal = () => {
    if (!selectedOffer) return null;
    
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
              <Text style={styles.modalTitle}>Teklif Detayı</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Talep Bilgileri</Text>
                <Text style={styles.detailTitle}>{selectedOffer.request?.title || 'Talep Başlığı Yok'}</Text>
                <Text style={styles.companyDetailName}>
                  <Ionicons name="business-outline" size={16} color="#333" /> {selectedOffer.request?.company?.name || 'Şirket Adı Yok'}
                </Text>
                <Text style={styles.detailDescription}>{selectedOffer.request?.description || 'Açıklama yok'}</Text>
                
                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Talep Miktarı</Text>
                    <Text style={styles.detailValue}>{selectedOffer.request?.quantity} {selectedOffer.request?.unit}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Son Tarih</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOffer.request?.deadline)}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Talep Durumu</Text>
                    <Text style={styles.detailValue}>{selectedOffer.request?.status}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Teklif Bilgileri</Text>
                
                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Teklif Fiyatı</Text>
                    <Text style={styles.detailValue}>{selectedOffer.price} ₺</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Teklif Miktarı</Text>
                    <Text style={styles.detailValue}>{selectedOffer.quantity} {selectedOffer.request?.unit}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Tahmini Teslimat</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOffer.estimatedDelivery)}</Text>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Teklif Durumu</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(selectedOffer.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedOffer.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailLabel}>Oluşturulma Tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOffer.createdAt)}</Text>
                  </View>
                </View>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.detailLabel}>Teklif Açıklaması</Text>
                  <Text style={styles.detailDescription}>{selectedOffer.description}</Text>
                </View>
                
                {selectedOffer.notes && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.detailLabel}>Notlar</Text>
                    <Text style={styles.detailDescription}>{selectedOffer.notes}</Text>
                  </View>
                )}
              </View>
              
              {selectedOffer.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => cancelOffer(selectedOffer._id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.cancelButtonText}>Teklifi İptal Et</Text>
                </TouchableOpacity>
              )}
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
          title: 'Tekliflerim',
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
            <Text style={styles.loadingText}>Teklifler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchOffers}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>Henüz teklif vermemişsiniz</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/farmer-requests')}
            >
              <Text style={styles.browseButtonText}>Taleplere Göz At</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={offers}
            renderItem={({ item }) => <OfferCard item={item} />}
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
      <OfferDetailModal />
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
    marginBottom: 20,
  },
  browseButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
  descriptionContainer: {
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 