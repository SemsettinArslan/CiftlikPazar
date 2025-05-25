import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation, Stack } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import { getDevServerIp } from '../src/utils/networkUtils';

// IP adresini al
const SERVER_IP = getDevServerIp();
const API_URL = `http://${SERVER_IP}:5000/api`;

// Ionicons için tip tanımı
type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Sipariş durumu için renk ve simge eşleştirmeleri
const statusConfig = {
  pending: { color: '#FF9800', icon: 'time-outline' as IconName, text: 'Onay Bekliyor' },
  processing: { color: '#2196F3', icon: 'construct-outline' as IconName, text: 'Hazırlanıyor' },
  shipped: { color: '#9C27B0', icon: 'car-outline' as IconName, text: 'Kargoya Verildi' },
  delivered: { color: '#4CAF50', icon: 'checkmark-circle-outline' as IconName, text: 'Teslim Edildi' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline' as IconName, text: 'İptal Edildi' }
};

// Tarih formatı
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Tarih kısmı: GG.AA.YYYY formatında
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  
  // Saat kısmı: SS:DD formatında
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // Tarih ve saat birleşimi
  return `${formattedDate} - ${hours}:${minutes}`;
};

export default function FarmerOrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Filtreleme state'leri
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [originalOrders, setOriginalOrders] = useState<any[]>([]);
  
  // Siparişleri getir
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userToken = user?.token;
      
      if (!userToken) {
        setError('Kimlik doğrulama bilgisi bulunamadı');
        setLoading(false);
        return;
      }
      
      console.log('Çiftçi siparişleri için API isteği yapılıyor:', `${API_URL}/orders/sellerorders`);
      console.log('Kullanıcı rolü:', user?.data?.role);
      
      const response = await axios.get(
        `${API_URL}/orders/sellerorders`,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      
      console.log('API yanıtı:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        const fetchedOrders = response.data.data;
        setOrders(fetchedOrders);
        setOriginalOrders(fetchedOrders);
        
        if (fetchedOrders.length === 0) {
          console.log('Hiç sipariş bulunamadı.');
        }
      }
    } catch (err: any) {
      console.error('Sipariş getirme hatası:', err);
      
      // Daha detaylı hata mesajı göster
      if (err.response) {
        console.error('Hata yanıtı:', JSON.stringify(err.response.data, null, 2));
        const serverErrorMsg = err.response.data?.message || err.response.data?.error;
        if (serverErrorMsg) {
          setError(`Sunucu hatası: ${serverErrorMsg}`);
        } else {
          setError(`Hata kodu: ${err.response.status}. Lütfen daha sonra tekrar deneyin.`);
        }
      } else if (err.request) {
        console.error('İstek hatası:', err.request);
        setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        console.error('Genel hata:', err.message);
        setError(err.message || 'Siparişler yüklenirken bir sorun oluştu.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      const userToken = user?.token;
      
      if (!userToken) {
        Alert.alert('Hata', 'Kimlik doğrulama bilgisi bulunamadı');
        setLoading(false);
        return;
      }
      
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      
      if (response.data.success) {
        // Sipariş listesini yenile
        fetchOrders();
        Alert.alert('Başarılı', `Sipariş durumu "${statusConfig[newStatus as keyof typeof statusConfig].text}" olarak güncellendi.`);
      }
    } catch (err: any) {
      console.error('Sipariş durumu güncelleme hatası:', err);
      
      let errorMsg = 'Sipariş durumu güncellenirken bir sorun oluştu.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMsg = err.response.data.message;
      }
      
      Alert.alert('Hata', errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // Sipariş durumu değiştirme dialog'u
  const showStatusUpdateDialog = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };
  
  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filteredResults = [...originalOrders];
    
    // Metne göre arama
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filteredResults = filteredResults.filter(order => {
        const orderNumber = order.orderNumber || order._id;
        const customerName = order.shippingAddress?.fullName || '';
        const customerEmail = order.user?.email || order.shippingAddress?.email || '';
        
        return (
          orderNumber.toLowerCase().includes(searchLower) ||
          customerName.toLowerCase().includes(searchLower) ||
          customerEmail.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Sipariş durumuna göre filtreleme
    if (statusFilter) {
      filteredResults = filteredResults.filter(order => order.status === statusFilter);
    }
    
    // Ödeme yöntemine göre filtreleme
    if (paymentMethodFilter) {
      filteredResults = filteredResults.filter(order => order.paymentMethod === paymentMethodFilter);
    }
    
    // Ödeme durumuna göre filtreleme
    if (paymentStatusFilter) {
      const isPaid = paymentStatusFilter === 'paid';
      filteredResults = filteredResults.filter(order => order.isPaid === isPaid);
    }
    
    setOrders(filteredResults);
    setFilterModalVisible(false);
  };
  
  // Filtreleri temizle
  const clearFilters = () => {
    setStatusFilter(null);
    setPaymentMethodFilter(null);
    setPaymentStatusFilter(null);
    setSearchText('');
    setOrders(originalOrders);
    setFilterModalVisible(false);
  };
  
  // Sipariş durumu değiştirme modal'ı
  const StatusUpdateModal = () => {
    if (!selectedOrder) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Sipariş Durumu Güncelle</Text>
            <Text style={styles.modalText}>Lütfen yeni durumu seçin:</Text>
            
            {Object.keys(statusConfig)
              .filter(key => key !== selectedOrder.status)
              .map((key, index) => {
                const status = statusConfig[key as keyof typeof statusConfig];
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.statusOption, { backgroundColor: status.color }]}
                    onPress={() => updateOrderStatus(selectedOrder._id, key)}
                  >
                    <Ionicons name={status.icon} size={16} color="#fff" style={styles.statusIcon} />
                    <Text style={styles.statusOptionText}>{status.text}</Text>
                  </TouchableOpacity>
                );
              })}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Filtreleme modal'ı
  const FilterModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, styles.filterModalView]}>
            <Text style={styles.modalTitle}>Siparişleri Filtrele</Text>
            
            {/* Sipariş Durumu Filtreleme */}
            <Text style={styles.filterSectionTitle}>Sipariş Durumu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsScroll}>
              <View style={styles.filterOptions}>
                <TouchableOpacity 
                  style={[
                    styles.filterChip, 
                    !statusFilter ? styles.filterChipSelected : null
                  ]}
                  onPress={() => setStatusFilter(null)}
                >
                  <Text style={[
                    styles.filterChipText, 
                    !statusFilter ? styles.filterChipTextSelected : null
                  ]}>Tümü</Text>
                </TouchableOpacity>
                
                {Object.keys(statusConfig).map((key) => {
                  const status = statusConfig[key as keyof typeof statusConfig];
                  return (
                    <TouchableOpacity 
                      key={key} 
                      style={[
                        styles.filterChip, 
                        statusFilter === key ? styles.filterChipSelected : null,
                        { borderColor: status.color }
                      ]}
                      onPress={() => setStatusFilter(key)}
                    >
                      <Ionicons name={status.icon} size={14} color={statusFilter === key ? '#fff' : status.color} style={{marginRight: 4}} />
                      <Text style={[
                        styles.filterChipText, 
                        statusFilter === key ? styles.filterChipTextSelected : null,
                        { color: statusFilter === key ? '#fff' : status.color }
                      ]}>{status.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            {/* Ödeme Yöntemi Filtreleme */}
            <Text style={styles.filterSectionTitle}>Ödeme Yöntemi</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  !paymentMethodFilter ? styles.filterChipSelected : null
                ]}
                onPress={() => setPaymentMethodFilter(null)}
              >
                <Text style={[
                  styles.filterChipText, 
                  !paymentMethodFilter ? styles.filterChipTextSelected : null
                ]}>Tümü</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  paymentMethodFilter === 'Kredi Kartı' ? styles.filterChipSelected : null
                ]}
                onPress={() => setPaymentMethodFilter('Kredi Kartı')}
              >
                <Ionicons name="card-outline" size={14} color={paymentMethodFilter === 'Kredi Kartı' ? '#fff' : '#333'} style={{marginRight: 4}} />
                <Text style={[
                  styles.filterChipText, 
                  paymentMethodFilter === 'Kredi Kartı' ? styles.filterChipTextSelected : null
                ]}>Kredi Kartı</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  paymentMethodFilter === 'Kapıda Ödeme' ? styles.filterChipSelected : null
                ]}
                onPress={() => setPaymentMethodFilter('Kapıda Ödeme')}
              >
                <Ionicons name="cash-outline" size={14} color={paymentMethodFilter === 'Kapıda Ödeme' ? '#fff' : '#333'} style={{marginRight: 4}} />
                <Text style={[
                  styles.filterChipText, 
                  paymentMethodFilter === 'Kapıda Ödeme' ? styles.filterChipTextSelected : null
                ]}>Kapıda Ödeme</Text>
              </TouchableOpacity>
            </View>
            
            {/* Ödeme Durumu Filtreleme */}
            <Text style={styles.filterSectionTitle}>Ödeme Durumu</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  !paymentStatusFilter ? styles.filterChipSelected : null
                ]}
                onPress={() => setPaymentStatusFilter(null)}
              >
                <Text style={[
                  styles.filterChipText, 
                  !paymentStatusFilter ? styles.filterChipTextSelected : null
                ]}>Tümü</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  paymentStatusFilter === 'paid' ? styles.filterChipSelected : null,
                  { borderColor: '#4CAF50' }
                ]}
                onPress={() => setPaymentStatusFilter('paid')}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color={paymentStatusFilter === 'paid' ? '#fff' : '#4CAF50'} style={{marginRight: 4}} />
                <Text style={[
                  styles.filterChipText, 
                  paymentStatusFilter === 'paid' ? styles.filterChipTextSelected : null,
                  { color: paymentStatusFilter === 'paid' ? '#fff' : '#4CAF50' }
                ]}>Ödendi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  paymentStatusFilter === 'unpaid' ? styles.filterChipSelected : null,
                  { borderColor: '#FF9800' }
                ]}
                onPress={() => setPaymentStatusFilter('unpaid')}
              >
                <Ionicons name="time-outline" size={14} color={paymentStatusFilter === 'unpaid' ? '#fff' : '#FF9800'} style={{marginRight: 4}} />
                <Text style={[
                  styles.filterChipText, 
                  paymentStatusFilter === 'unpaid' ? styles.filterChipTextSelected : null,
                  { color: paymentStatusFilter === 'unpaid' ? '#fff' : '#FF9800' }
                ]}>Bekliyor</Text>
              </TouchableOpacity>
            </View>
            
            {/* Filtre Butonları */}
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyFiltersButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Sayfa yüklendiğinde siparişleri getir
  useEffect(() => {
    if (user?.token) {
      fetchOrders();
    }
  }, [user?.token]);
  
  // Yenileme işlemi
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Sipariş detayına git
  const navigateToOrderDetail = (orderId: string) => {
    router.push({
      pathname: `/farmer-order-detail/${orderId}`,
    } as any);
  };
  
  // Sipariş öğesini render et
  const renderOrderItem = ({ item }: { item: any }) => {
    const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const itemCount = item.items ? item.items.length : 0;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumberLabel}>Sipariş No:</Text>
            <Text style={styles.orderNumber}>{item.orderNumber || item._id.substring(0, 8)}</Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.orderContent}>
          {firstItem && (
            <View style={styles.productImageContainer}>
              {firstItem.image ? (
                <Image
                  source={{ uri: `http://${SERVER_IP}:5000/uploads/product-images/${firstItem.image}` }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <Ionicons name="image-outline" size={24} color="#ccc" />
                </View>
              )}
              
              {itemCount > 1 && (
                <View style={styles.itemCountBadge}>
                  <Text style={styles.itemCountText}>+{itemCount - 1}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.orderDetails}>
            <Text style={styles.orderItems} numberOfLines={2} ellipsizeMode="tail">
              {item.items && item.items.map((i: any) => i.name).join(', ')}
            </Text>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Ionicons name={status.icon} size={14} color="#fff" style={styles.statusIcon} />
                <Text style={styles.statusText}>{status.text}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.orderPrice}>
            <Text style={styles.priceLabel}>Toplam</Text>
            <Text style={styles.priceValue}>{item.totalAmount?.toFixed(2) || '0.00'} ₺</Text>
          </View>
        </View>
        
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigateToOrderDetail(item._id)}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Detay</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: status.color }]}
            onPress={() => showStatusUpdateDialog(item)}
          >
            <Ionicons name="options-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Durum Değiştir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Boş sipariş listesi
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Henüz Sipariş Yok</Text>
      <Text style={styles.emptyText}>
        Çiftlik ürünlerinize ait siparişler burada görüntülenecektir.
      </Text>
    </View>
  );
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Çiftlik Siparişleri',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      
      <StatusUpdateModal />
      <FilterModal />
      
      {/* Arama ve Filtreleme Bölümü */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Sipariş no, müşteri adı veya e-posta ara..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={applyFilters}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchText ? (
            <TouchableOpacity 
              style={styles.clearSearchButton} 
              onPress={() => {
                setSearchText('');
                if (statusFilter || paymentMethodFilter || paymentStatusFilter) {
                  applyFilters();
                } else {
                  setOrders(originalOrders);
                }
              }}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons 
            name="options-outline" 
            size={22} 
            color="#fff" 
          />
          
          {/* Aktif Filtre Sayısı Badge */}
          {(statusFilter || paymentMethodFilter || paymentStatusFilter) ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {(statusFilter ? 1 : 0) + 
                 (paymentMethodFilter ? 1 : 0) + 
                 (paymentStatusFilter ? 1 : 0)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Arama ve filtreleme stilleri
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  clearSearchButton: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Filtreleme Modal stilleri
  filterModalView: {
    width: '90%',
    maxHeight: '80%',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsScroll: {
    maxWidth: '100%',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 12,
    color: '#333',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  clearFiltersButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 100,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  applyFiltersButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    minWidth: 100,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fbfbfb',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumberLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
    fontWeight: '500',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  orderContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  productImageContainer: {
    width: 65,
    height: 65,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCountBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderTopLeftRadius: 6,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    height: 65,
  },
  orderItems: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderPrice: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginLeft: 10,
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  statusOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusOptionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
}); 