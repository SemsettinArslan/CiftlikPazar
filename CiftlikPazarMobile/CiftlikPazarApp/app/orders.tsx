import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
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

export default function OrdersScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sayfa başlığını ayarla
  useEffect(() => {
    navigation.setOptions({
      headerShown: false // Header'ı gizle, kendi özel header'ımızı kullanacağız
    });
  }, [navigation]);
  
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
      
      const response = await axios.get(
        `${API_URL}/orders/myorders`,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Sipariş getirme hatası:', err);
      setError('Siparişler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
  
  // Sipariş öğesini render et
  const renderOrderItem = ({ item }: { item: any }) => {
    const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const itemCount = item.items ? item.items.length : 0;
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => router.push({
          pathname: `/order/${item._id}`,
        } as any)}
      >
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
      </TouchableOpacity>
    );
  };
  
  // Boş sipariş listesi
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Henüz Siparişiniz Yok</Text>
      <Text style={styles.emptyText}>
        Siparişleriniz burada görüntülenecektir. Alışveriş yapmak için ürünler sayfasını ziyaret edebilirsiniz.
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.push('/(tabs)/products')}
      >
        <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
      </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Siparişlerim</Text>
        </View>
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
  header: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
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
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
}); 