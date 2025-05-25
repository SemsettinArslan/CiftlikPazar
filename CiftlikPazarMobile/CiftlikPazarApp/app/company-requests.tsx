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
  company: string;
  offers?: string[];
}

// Kategori tipi
interface Category {
  _id: string;
  id?: string;
  name?: string;
  category_name?: string;
  parent?: string;
}

export default function CompanyRequestsScreen() {
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
      
      console.log("Kategoriler API'den alınıyor...");
      
      // Debug: Token kontrolü
      console.log("Token ile istek yapılıyor:", `${API_URL}/categories`);
      
      // Limit ve pagination parametrelerini ekleyelim (50 yerine 100 kategori)
      const response = await axios.get(`${API_URL}/categories?limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // API yanıtını detaylı logla
      console.log("Kategori API yanıtı:", JSON.stringify(response.data).substring(0, 200) + "...");
      
      if (response.data.success) {
        console.log('Kategoriler başarıyla alındı. Toplam:', response.data.count);
        
        // Kategori önbelleğini güncelle
        const categoryCache: {[key: string]: string} = {};
        
        if (Array.isArray(response.data.data)) {
          // Tüm kategori verilerini logla
          console.log("İlk kategori örneği:", response.data.data.length > 0 ? JSON.stringify(response.data.data[0]) : "Kategori yok");
          console.log("Toplam kategori sayısı:", response.data.data.length);
          
          response.data.data.forEach((category: any, index: number) => {
            // Kategori nesnesinde name veya category_name alanlarını kontrol et
            if (category._id && (category.name || category.category_name)) {
              // name veya category_name hangisi varsa onu kullan
              const categoryName = category.category_name || category.name;
              categoryCache[category._id] = categoryName;
              
              // ID alanını da ekle çünkü bazen id olarak da geliyor olabilir
              if (category.id && category.id !== category._id) {
                categoryCache[category.id] = categoryName;
              }
              
              // Debug: İlk 3 kategoriyi göster
              if (index < 3) {
                console.log(`Kategori ${index+1}: ID=${category._id}, İsim=${categoryName}`);
              }
            } else {
              console.warn("Eksik kategori verisi:", JSON.stringify(category));
            }
          });
          
          console.log(`Toplam ${Object.keys(categoryCache).length} kategori önbelleğe alındı`);
        } else {
          console.error("Kategori verisi dizi değil:", typeof response.data.data);
        }
        
        setCategories(categoryCache);
      } else {
        console.error('Kategoriler API başarılı yanıt vermedi:', response.data);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios hatası:', err.message);
        console.error('Hata detayı:', err.response?.data);
      }
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
      
      console.log(`API isteği gönderiliyor: ${API_URL}/requests/my-requests`);
      
      // Limit parametresi ekleyelim (tüm talepleri almak için büyük bir değer)
      const response = await axios.get(`${API_URL}/requests/my-requests?limit=100&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('Talepler başarıyla alındı:', response.data.count);
        console.log('Gelen talep sayısı:', response.data.data.length);
        setRequests(response.data.data);
        
        // Eğer kategoriler yüklenmemişse, talepleri yükledikten sonra kategorileri yükle
        if (Object.keys(categories).length === 0 && !categoriesLoading) {
          fetchCategories();
        }
      } else {
        console.error('API başarılı yanıt vermedi:', response.data);
        setError('Talepler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Talepler getirilirken hata:', err);
      if (axios.isAxiosError(err)) {
        console.error('Hata detayı:', err.response?.data || 'Yanıt verisi yok');
        console.error('Hata kodu:', err.response?.status || 'Durum kodu yok');
      }
      setError('Talepler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfa yüklendiğinde ilk iş olarak kategorileri getir
  useEffect(() => {
    fetchCategories();
    fetchRequests();
  }, []);
  
  // URL parametresi değiştiğinde yenile
  useEffect(() => {
    if (params.refresh === 'true') {
      console.log('Yenileme parametresi algılandı, talepler yenileniyor...');
      fetchRequests();
    }
  }, [params.refresh, params.timestamp]);

  // Yenileme işlemi
  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Talep detayı göster
  const viewRequestDetail = (request: Request) => {
    console.log("Talep detayı görüntüleniyor:", request._id);
    console.log("Kategori verisi:", JSON.stringify(request.category));
    
    setSelectedRequest(request);
    setModalVisible(true);
    
    // Eğer kategoriler henüz yüklenmemişse, hemen yükle
    if (Object.keys(categories).length === 0 && !categoriesLoading) {
      console.log("Kategoriler yüklü değil, yükleniyor...");
      fetchCategories();
    } else {
      console.log("Yüklü kategori sayısı:", Object.keys(categories).length);
      
      // Kategori ID'si kategoriler içinde var mı kontrol et
      if (typeof request.category === 'string') {
        console.log("Kategori ID'si önbellekte var mı:", request.category, "->", categories[request.category] || "Bulunamadı");
      } else if (request.category && typeof request.category === 'object' && (request.category as any)._id) {
        console.log("Kategori objesi önbellekte var mı:", (request.category as any)._id, "->", categories[(request.category as any)._id] || "Bulunamadı");
      }
    }
  };

  // Modal kapat
  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  // Talep iptal et
  const cancelRequest = async (requestId: string) => {
    Alert.alert(
      'Talebi İptal Et',
      'Bu talebi iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = user?.token;
              
              if (!token) {
                Alert.alert('Hata', 'Oturum bilgisi bulunamadı');
                return;
              }
              
              const response = await axios.put(
                `${API_URL}/requests/my-requests/${requestId}/cancel`,
                {},
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              
              if (response.data.success) {
                Alert.alert('Başarılı', 'Talep başarıyla iptal edildi');
                fetchRequests(); // Listeyi yenile
                closeModal(); // Modal açıksa kapat
              } else {
                Alert.alert('Hata', response.data.message || 'Talep iptal edilirken bir hata oluştu');
              }
            } catch (err) {
              console.error('Talep iptal hatası:', err);
              Alert.alert('Hata', 'Talep iptal edilirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  // Talep durumuna göre badge rengi
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      case 'expired':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // Talep durumunun Türkçe karşılığı
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
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Kategori adını güvenli bir şekilde alma
  const getCategoryName = (category: any): string => {
    console.log("getCategoryName çağrıldı, kategori:", category);

    // Değer null veya undefined ise
    if (!category) {
      return 'Bilinmiyor';
    }

    // API'den gelen categoryName doğrudan kullanılabilir
    if (selectedRequest?.categoryName) {
      return selectedRequest.categoryName;
    }
    
    // Eğer doğrudan bir kategori adı geliyorsa kullan
    if (typeof category === 'string') {
      // Önce önbellekte kontrol et
      if (categories[category]) {
        return categories[category]; 
      }
      
      // Kategori ID'sini döndür, ama sadece kısa ID kısmını (24 karakter çok uzun)
      if (category.length > 8) {
        return `${category.substring(0, 8)}...`;
      }
      return category;
    }
    
    // Eğer bir nesne olarak geliyorsa
    if (typeof category === 'object') {
      // Kategori nesnesi içinde name alanı olabilir
      if (category.category_name && typeof category.category_name === 'string') {
        return category.category_name;
      }
      
      // Kategori nesnesi içinde name alanı olabilir
      if (category.name && typeof category.name === 'string') {
        return category.name;
      }
      
      // _id alanına sahip bir nesneyse ve bu ID önbellekte bulunuyorsa
      if (category._id) {
        // Kategori önbelleğinde bu ID var mı?
        if (categories[category._id]) {
          return categories[category._id];
        }
        
        // Kategori ID'sini döndür ama kısaltılmış olarak
        if (typeof category._id === 'string' && category._id.length > 8) {
          return `${category._id.substring(0, 8)}...`;
        }
        return String(category._id);
      }
      
      // ID alanına sahip bir nesneyse
      if (category.id) {
        // Kategori önbelleğinde bu ID var mı?
        if (categories[category.id]) {
          return categories[category.id];
        }
        
        // Kategori ID'sini döndür ama kısaltılmış olarak
        if (typeof category.id === 'string' && category.id.length > 8) {
          return `${category.id.substring(0, 8)}...`;
        }
        return String(category.id);
      }
    }
    
    // Hiçbir koşulu karşılamıyorsa
    return 'Bilinmiyor';
  };

  // Talep kartı bileşeni
  const RequestCard = ({ item }: { item: Request }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => viewRequestDetail(item)}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.requestInfo}>
        <Text style={styles.requestInfoText}>
          <Ionicons name="calendar-outline" size={14} color="#666" /> {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.requestInfoText}>
          <Ionicons name="location-outline" size={14} color="#666" /> {item.city}, {item.district}
        </Text>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestDetailText}>
          <Ionicons name="cube-outline" size={14} color="#666" /> {item.quantity} {item.unit}
        </Text>
        <Text style={styles.requestDetailText}>
          <Ionicons name="leaf-outline" size={14} color="#4CAF50" /> {getCategoryName(item.category)}
        </Text>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestDetailText}>
          <Ionicons name="time-outline" size={14} color="#666" /> Son: {formatDate(item.deadline)}
        </Text>
        {item.budget && (
          <Text style={styles.requestDetailText}>
            <Ionicons name="cash-outline" size={14} color="#4CAF50" /> Bütçe: ₺{item.budget}
          </Text>
        )}
      </View>
      
      {item.status === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => cancelRequest(item._id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // Detay Modalı
  const RequestDetailModal = () => {
    if (!selectedRequest) return null;
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Başlık */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Talep Detayı</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* İçerik */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Durum Banner */}
              <View style={[styles.statusBanner, { backgroundColor: getStatusBadgeColor(selectedRequest.status) }]}>
                <Ionicons name={
                  selectedRequest.status === 'active' ? "checkmark-circle" : 
                  selectedRequest.status === 'completed' ? "checkmark-done-circle" : 
                  selectedRequest.status === 'cancelled' ? "close-circle" : "time"
                } size={20} color="#fff" />
                <Text style={styles.statusBannerText}>{getStatusText(selectedRequest.status)}</Text>
              </View>
              
              {/* Başlık Kartı */}
              <View style={styles.titleCard}>
                <Text style={styles.requestTitleText}>{selectedRequest.title}</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{formatDate(selectedRequest.createdAt).split(' ')[0]}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{selectedRequest.city}</Text>
                  </View>
                </View>
              </View>
              
              {/* Temel Bilgiler Kartı */}
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
                  <Text style={styles.cardTitle}>Temel Bilgiler</Text>
                </View>
                
                <View style={styles.cardDivider} />
                
                <View style={styles.infoGrid}>
                  {/* Kategori */}
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Kategori</Text>
                    <Text style={styles.gridValue} onPress={() => {
                      // Debug: Kategori verisini konsola yazdır
                      console.log("Kategori veri tipi:", typeof selectedRequest.category);
                      console.log("Kategori içeriği:", JSON.stringify(selectedRequest.category));
                      
                      // Kategorileri kontrol et
                      console.log("Kategori önbelleği:", Object.keys(categories).length, "kayıt var");
                      console.log("Kategoriler:", JSON.stringify(categories).substring(0, 200));
                    }}>
                      {getCategoryName(selectedRequest.category)}
                    </Text>
                  </View>
                  
                  {/* Miktar */}
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Miktar</Text>
                    <View style={styles.qtyContainer}>
                      <Text style={styles.gridValue}>{selectedRequest.quantity}</Text>
                      <Text style={styles.unitText}>{selectedRequest.unit}</Text>
                    </View>
                  </View>
                  
                  {/* Bütçe */}
                  {selectedRequest.budget && (
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Bütçe</Text>
                      <Text style={styles.priceValue}>₺{selectedRequest.budget}</Text>
                    </View>
                  )}
                  
                  {/* Organik */}
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Organik Ürün</Text>
                    <View style={[styles.badge, {
                      backgroundColor: selectedRequest.isOrganic ? '#4CAF50' : '#F44336'
                    }]}>
                      <Text style={styles.badgeText}>
                        {selectedRequest.isOrganic ? 'Evet' : 'Hayır'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Konum Kartı */}
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="location-outline" size={20} color="#2196F3" />
                  <Text style={styles.cardTitle}>Konum Bilgileri</Text>
                </View>
                
                <View style={styles.cardDivider} />
                
                <View style={styles.locationContainer}>
                  <View style={styles.locationItem}>
                    <Text style={styles.locationLabel}>İl:</Text>
                    <Text style={styles.locationValue}>{selectedRequest.city}</Text>
                  </View>
                  
                  <View style={styles.locationItem}>
                    <Text style={styles.locationLabel}>İlçe:</Text>
                    <Text style={styles.locationValue}>{selectedRequest.district}</Text>
                  </View>
                </View>
              </View>
              
              {/* Açıklama Kartı */}
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="document-text-outline" size={20} color="#673AB7" />
                  <Text style={styles.cardTitle}>Açıklama</Text>
                </View>
                
                <View style={styles.cardDivider} />
                
                <Text style={styles.descriptionText}>
                  {selectedRequest.description}
                </Text>
              </View>
              
              {/* Özel Gereksinimler Kartı */}
              {selectedRequest.specifications && (
                <View style={styles.detailCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="list-outline" size={20} color="#E91E63" />
                    <Text style={styles.cardTitle}>Özel Gereksinimler</Text>
                  </View>
                  
                  <View style={styles.cardDivider} />
                  
                  <Text style={styles.descriptionText}>
                    {selectedRequest.specifications}
                  </Text>
                </View>
              )}
              
              {/* Tarih Bilgileri Kartı */}
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="time-outline" size={20} color="#009688" />
                  <Text style={styles.cardTitle}>Tarih Bilgileri</Text>
                </View>
                
                <View style={styles.cardDivider} />
                
                <View style={styles.dateContainer}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Oluşturulma:</Text>
                    <Text style={styles.dateValue}>{formatDate(selectedRequest.createdAt)}</Text>
                  </View>
                  
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Son Teslim:</Text>
                    <Text style={[styles.dateValue, {fontWeight: 'bold'}]}>
                      {formatDate(selectedRequest.deadline)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Teklifler Kartı */}
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="pricetag-outline" size={20} color="#FF5722" />
                  <Text style={styles.cardTitle}>Teklifler</Text>
                </View>
                
                <View style={styles.cardDivider} />
                
                <View style={styles.offerContainer}>
                  <View style={[styles.badge, {
                    backgroundColor: selectedRequest.offers && Array.isArray(selectedRequest.offers) && selectedRequest.offers.length > 0 
                      ? '#4CAF50' : '#9E9E9E',
                    alignSelf: 'flex-start'
                  }]}>
                    <Text style={styles.badgeText}>
                      {selectedRequest.offers && Array.isArray(selectedRequest.offers) && selectedRequest.offers.length > 0
                        ? `${selectedRequest.offers.length} Teklif Alındı`
                        : 'Henüz Teklif Yok'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            {/* İşlem Butonları */}
            <View style={styles.modalFooter}>
              {selectedRequest.status === 'active' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => cancelRequest(selectedRequest._id)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Talebi İptal Et</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={closeModal}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Ana UI render
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Taleplerim',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#FF9800',
          },
        }}
      />
      
      {/* Yeni Talep Oluştur Butonu */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('create-request' as any)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Yeni Talep Oluştur</Text>
      </TouchableOpacity>
      
      {/* Talepler Listesi */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Talepler yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRequests}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-outline" size={40} color="#9E9E9E" />
          <Text style={styles.emptyText}>Henüz bir talep oluşturmadınız</Text>
          <Text style={styles.emptySubText}>Yeni talep oluşturmak için yukarıdaki butona tıklayın</Text>
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
              colors={['#FF9800']}
            />
          }
        />
      )}
      
      <RequestDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  createButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 4,
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  requestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestInfoText: {
    fontSize: 14,
    color: '#666',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestDetailText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  titleCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  requestTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  priceValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    width: 50,
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  dateContainer: {
    marginBottom: 8,
  },
  dateItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  offerContainer: {
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
}); 