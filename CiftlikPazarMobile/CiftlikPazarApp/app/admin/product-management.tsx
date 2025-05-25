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
  Image,
  Platform,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '../../src/utils/networkUtils';

// API URL'ini al
const API_URL = getApiBaseUrl();

// Tip tanımları
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: {
    _id: string;
    name: string;
    category_name: string;
  };
  farmer: {
    _id: string;
    name: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
    }
  };
  unit: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface SectionData {
  title: string;
  data: Product[];
  type: 'pending' | 'rejected';
}

export default function ProductManagementScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [rejectedProducts, setRejectedProducts] = useState<Product[]>([]);
  
  // Tab sistemine aktif sekme için state ekleyelim
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  
  // Android için özel ret modali state'leri
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Ürün detay modalı için state'ler
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  // Kullanıcı admin değilse yönlendir
  useEffect(() => {
    if (user && user.data && user.data.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  // Ürünleri yükle
  const loadProducts = async () => {
    try {
      setLoading(true);
      // Bekleyen (pending) ürünleri çekerken çiftçi ve kategori bilgilerini de çek
      const response = await axios.get(`${API_URL}/products/pending-approval`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('Çekilen ürünler:', response.data.data);
        setPendingProducts(response.data.data);
        
        // Reddedilen ürünleri yeni endpoint ile yükle
        const rejectedResponse = await axios.get(`${API_URL}/products/rejected`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (rejectedResponse.data.success) {
          console.log('Çekilen reddedilen ürünler:', rejectedResponse.data.data);
          setRejectedProducts(rejectedResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
      Alert.alert('Hata', 'Ürünler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleApprove = async (productId: string) => {
    try {
      console.log('Onaylama işlemi başlatılıyor:', productId);
      console.log('Token:', token);
      
      // Önce token kontrolü yapalım
      if (!token) {
        Alert.alert('Hata', 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      setSubmitting(true);
      
      // Doğru API endpoint'i kullan (/:id/approve)
      const apiUrl = `${API_URL}/products/${productId}/approve`;
      console.log('Onaylama URL:', apiUrl);
      
      const response = await axios.put(
        apiUrl,
        {},  // Boş body gönder
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000 // 10 saniye timeout
        }
      );

      console.log('Onaylama cevabı:', response.data);

      if (response.data.success) {
        Alert.alert('Başarılı', 'Ürün başarıyla onaylandı.');
        // Listeyi güncelle
        setPendingProducts(pendingProducts.filter(p => p._id !== productId));
        // Aktif sekmeyi onay bekleyene çevir (onayladığımız için)
        setActiveTab('pending');
        // Tüm ürünleri yeniden yükle
        loadProducts();
      }
    } catch (error: any) {
      console.error('Ürün onaylanırken hata oluştu:', error);
      
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        let errorMessage = `Ürün onaylanırken bir sorun oluştu: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        Alert.alert('Hata', errorMessage);
      } else if (error.request) {
        console.error('İstek yapıldı ama cevap alınamadı:', error.request);
        Alert.alert('Hata', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        console.error('İstek hatası:', error.message);
        Alert.alert('Hata', `İstek hatası: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (productId: string) => {
    // Platform bağımsız ret nedeni alma işlemi
    if (Platform.OS === 'ios') {
      // iOS için Alert.prompt kullan
      Alert.prompt(
        'Ürünü Reddet',
        'Lütfen ret nedenini girin:',
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Reddet',
            onPress: (reason?: string) => processRejection(productId, reason || 'Belirtilmemiş')
          }
        ],
        'plain-text'
      );
    } else {
      // Android için özel modal göster
      setSelectedProductId(productId);
      setRejectReason('');
      setShowRejectModal(true);
    }
  };

  // Detay modalını açma fonksiyonu
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedProductId(product._id);
    setShowDetailModal(true);
  };

  // Reddetme işlemini gerçekleştiren yardımcı fonksiyon
  const processRejection = async (productId: string, reason?: string) => {
    if (!reason) {
      Alert.alert('Hata', 'Lütfen bir ret nedeni girin veya seçin.');
      return;
    }

    try {
      console.log('Reddetme işlemi başlatılıyor:', productId);
      console.log('Ret nedeni:', reason);
      
      // Önce token kontrolü yapalım
      if (!token) {
        Alert.alert('Hata', 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      setSubmitting(true);
      
      // Doğru endpoint'i kullan (/:id/reject)
      const apiUrl = `${API_URL}/products/${productId}/reject`;
      console.log('Reddetme URL:', apiUrl);
      
      const response = await axios.put(
        apiUrl,
        { reason },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000 // 10 saniye timeout
        }
      );

      console.log('Reddetme cevabı:', response.data);

      if (response.data.success) {
        setShowDetailModal(false);
        Alert.alert('Başarılı', 'Ürün başarıyla reddedildi.');
        // Listeyi güncelle
        setPendingProducts(pendingProducts.filter(p => p._id !== productId));
        // Aktif sekmeyi reddedilenler seçeneğine çevir
        setActiveTab('rejected');
        // Reddedilen ürünler listesine ekle
        const product = pendingProducts.find(p => p._id === productId);
        if (product) {
          const updatedProduct = { ...product, rejectionReason: reason };
          setRejectedProducts([...rejectedProducts, updatedProduct]);
        }
        // Tüm ürünleri yeniden yükle
        loadProducts();
      }
    } catch (error: any) {
      console.error('Ürün reddedilirken hata oluştu:', error);
      
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        let errorMessage = `Ürün reddedilirken bir sorun oluştu: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        Alert.alert('Hata', errorMessage);
      } else if (error.request) {
        console.error('İstek yapıldı ama cevap alınamadı:', error.request);
        Alert.alert('Hata', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        console.error('İstek hatası:', error.message);
        Alert.alert('Hata', `İstek hatası: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Seçilen nedenleri işle
  const handleReasonSelect = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  // Birden fazla nedeni birleştir
  const combineReasons = () => {
    let combinedReason = selectedReasons.join('\n• ');
    if (combinedReason) {
      combinedReason = '• ' + combinedReason;
    }
    
    if (rejectReason.trim()) {
      if (combinedReason) {
        combinedReason += '\n• ' + rejectReason.trim();
      } else {
        combinedReason = '• ' + rejectReason.trim();
      }
    }
    
    return combinedReason || 'Belirtilmemiş';
  };

  // Android için ret modali onay işlemi
  const handleRejectModalConfirm = () => {
    if (selectedProductId) {
      const combinedReason = combineReasons();
      processRejection(selectedProductId, combinedReason);
      setShowRejectModal(false);
      setSelectedProductId(null);
      setRejectReason('');
      setSelectedReasons([]);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <View style={[
            styles.statusBadge, 
            item.approvalStatus === 'pending' ? styles.pendingBadge : styles.rejectedBadge
          ]}>
            <Text style={styles.badgeText}>
              {item.approvalStatus === 'pending' ? 'Onay Bekliyor' : 'Reddedildi'}
            </Text>
          </View>
        </View>
        <Text style={styles.productPrice}>{item.price.toFixed(2)} ₺/{item.unit}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: `${API_URL.replace('/api', '')}/uploads/product-images/${item.image}` }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.farmer 
                  ? (item.farmer.farmName || 
                     (item.farmer.user && `${item.farmer.user.firstName} ${item.farmer.user.lastName}`) || 
                     'Çiftçi Bilinmeyen')
                  : 'Çiftçi Bilinmeyen'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <MaterialIcons name="category" size={16} color="#666" />
              <Text style={styles.metaText}>
                {item.category 
                  ? (item.category.name || item.category.category_name || 'Kategori Belirtilmemiş')
                  : 'Kategori Belirtilmemiş'}
              </Text>
            </View>
          </View>
          
          {item.rejectionReason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionLabel}>Ret Nedeni:</Text>
              <Text style={styles.rejectionText} numberOfLines={2}>{item.rejectionReason}</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.approvalStatus === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => openDetailModal(item)}
          >
            <Ionicons name="information-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Detaylar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item._id)}
            disabled={submitting}
          >
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Onayla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item._id)}
            disabled={submitting}
          >
            <Ionicons name="close-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Ürün Bulunamadı</Text>
      <Text style={styles.emptyDescription}>
        {pendingProducts.length === 0 && rejectedProducts.length === 0
          ? 'Henüz hiç ürün bulunmuyor.'
          : 'Seçilen kritere uygun ürün bulunamadı.'}
      </Text>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} ürün</Text>
    </View>
  );

  // Yaygın ret nedenlerini oluştur
  const commonReasons = [
    'Ürün açıklaması yetersiz veya uygunsuz',
    'Ürün görseli yetersiz veya uygunsuz',
    'Fiyatlandırma politikamıza aykırı',
    'Kategori ile ürün uyuşmuyor',
    'Ürün kalite standartlarımıza uygun değil',
    'Ürün adı görselle uyuşmuyor',
    'Ürün organik olarak işaretlenmiş fakat sertifika yok',
    'Görselin kalitesi çok düşük',
    'Ürün miktarı veya birim bilgisi hatalı',
    'Ürün yasak veya kısıtlı ürünler listesinde'
  ];

  // Yükleme durumu
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
      </View>
    );
  }

  // Bölümlere ayrılmış veriler
  const sections: SectionData[] = [
    { title: 'Onay Bekleyen Ürünler', data: pendingProducts, type: 'pending' },
    { title: 'Reddedilen Ürünler', data: rejectedProducts, type: 'rejected' }
  ];

  // Ana içerik
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Ürün Yönetimi',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#3F51B5',
          },
        }}
      />
      
      {/* Duruma göre sekme seçimi */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.tabText}>Onay Bekleyen ({pendingProducts.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'rejected' && styles.activeTab]} 
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={styles.tabText}>Reddedilen ({rejectedProducts.length})</Text>
        </TouchableOpacity>
      </View>
      
      {/* Ana liste */}
      <FlatList
        data={activeTab === 'pending' ? pendingProducts : rejectedProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={['#3F51B5']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Detay modalı */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="leaf-outline" size={24} color="#3F51B5" />
                <Text style={styles.modalTitle}>Ürün Detayları</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.productSummary}>
                  <Image
                    source={{ 
                      uri: selectedProduct.image 
                        ? `${API_URL.replace('/api', '')}/uploads/product-images/${selectedProduct.image}`
                        : 'https://via.placeholder.com/300?text=Ürün+Resmi'
                    }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.productInfoHeader}>
                    <Text style={styles.productTitleLarge}>{selectedProduct.name}</Text>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPriceLarge}>{selectedProduct.price.toFixed(2)} ₺</Text>
                      <Text style={styles.productUnit}>/ {selectedProduct.unit}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="information-circle-outline" size={18} color="#3F51B5" />
                    <Text style={styles.sectionTitle}>Ürün Bilgileri</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ürün Adı:</Text>
                    <Text style={styles.detailValue}>{selectedProduct.name}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Açıklama:</Text>
                    <Text style={styles.detailValue}>{selectedProduct.description}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kategori:</Text>
                    <Text style={styles.detailValue}>
                      {selectedProduct.category 
                        ? (selectedProduct.category.name || selectedProduct.category.category_name || 'Kategori Belirtilmemiş')
                        : 'Kategori Belirtilmemiş'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fiyat:</Text>
                    <Text style={styles.detailValue}>{selectedProduct.price.toFixed(2)} ₺/{selectedProduct.unit}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="person-outline" size={18} color="#3F51B5" />
                    <Text style={styles.sectionTitle}>Çiftçi Bilgileri</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Çiftçi:</Text>
                    <Text style={styles.detailValue}>
                      {selectedProduct.farmer 
                        ? (selectedProduct.farmer.farmName || 
                           (selectedProduct.farmer.user && `${selectedProduct.farmer.user.firstName} ${selectedProduct.farmer.user.lastName}`) || 
                           'Çiftçi Bilinmeyen')
                        : 'Çiftçi Bilinmeyen'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Android için ret nedeni modalı */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
                <Text style={[styles.modalTitle, {color: '#F44336'}]}>Ürünü Reddet</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.rejectSubtitle}>Lütfen en az bir ret nedeni seçin veya belirtin:</Text>
              <View style={styles.reasonOptions}>
                {commonReasons.map((reason, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.reasonOption,
                      selectedReasons.includes(reason) && styles.selectedReason
                    ]}
                    onPress={() => handleReasonSelect(reason)}
                  >
                    <View style={styles.reasonRow}>
                      <Ionicons 
                        name={selectedReasons.includes(reason) ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={selectedReasons.includes(reason) ? "#3F51B5" : "#aaa"} 
                        style={styles.reasonIcon}
                      />
                      <Text 
                        style={[
                          styles.reasonText,
                          selectedReasons.includes(reason) && styles.selectedReasonText
                        ]}
                      >
                        {reason}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.rejectInput}
                placeholder="Özel bir ret nedeni belirtin (isteğe bağlı)"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
              />
              
              <View style={{height: 50}} />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedReasons([]);
                  setRejectReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleRejectModalConfirm}
                disabled={submitting || (selectedReasons.length === 0 && !rejectReason.trim())}
              >
                <Text style={styles.confirmButtonText}>
                  {submitting ? 'İşleniyor...' : 'Reddet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3F51B5',
  },
  tabText: {
    fontWeight: '600',
    color: '#444',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 60,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  pendingBadge: {
    backgroundColor: '#4CAF50',
  },
  rejectedBadge: {
    backgroundColor: '#F44336',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardContent: {
    padding: 12,
  },
  imageContainer: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    margin: 4,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailsButton: {
    backgroundColor: '#607D8B',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  rejectionContainer: {
    marginTop: 8,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3F51B5',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8EAF6',
    marginBottom: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3F51B5',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectModal: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContent: {
    padding: 16,
  },
  productSummary: {
    marginBottom: 20,
  },
  productInfoHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  productTitleLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPriceLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  rejectSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reasonOptions: {
    marginBottom: 16,
  },
  reasonOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonIcon: {
    marginRight: 8,
  },
  selectedReason: {
    borderColor: '#3F51B5',
    backgroundColor: '#E8EAF6',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedReasonText: {
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 