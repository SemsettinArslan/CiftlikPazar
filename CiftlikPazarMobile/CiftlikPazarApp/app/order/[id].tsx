import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';
import { getDevServerIp } from '../../src/utils/networkUtils';

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
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Tarih kısmı: GG.AA.YYYY formatında
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  
  // Saat kısmı: SS:DD formatında
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  // Tarih ve saat birleşimi
  return `${formattedDate} - ${formattedTime}`;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sayfa başlığını ayarla
  useEffect(() => {
    navigation.setOptions({
      headerShown: false // Header'ı gizle, kendi özel header'ımızı kullanacağız
    });
  }, [navigation]);
  
  // Sipariş detaylarını getir
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userToken = user?.token;
        
        if (!userToken) {
          setError('Oturum bilgileriniz bulunamadı');
          setLoading(false);
          return;
        }
        
        console.log("Sipariş detayı için API isteği yapılıyor:", `${API_URL}/orders/${id}`);
        
        const response = await axios.get(
          `${API_URL}/orders/${id}`,
          {
            headers: { Authorization: `Bearer ${userToken}` }
          }
        );
        
        console.log("API yanıtı:", response.data);
        
        if (response.data.success) {
          setOrder(response.data.data);
        }
      } catch (err: any) {
        console.error('Sipariş detayı getirme hatası:', err);
        
        // Daha detaylı hata mesajı göster
        if (err.response) {
          // Sunucudan gelen hata mesajı
          const serverErrorMsg = err.response.data?.message || err.response.data?.error;
          if (serverErrorMsg) {
            setError(`Sunucu hatası: ${serverErrorMsg}`);
          } else if (err.response.status === 500) {
            setError('Sunucu hatası: Lütfen daha sonra tekrar deneyin');
          } else if (err.response.status === 404) {
            setError('Sipariş bulunamadı');
          } else if (err.response.status === 403) {
            setError('Bu siparişi görüntüleme izniniz yok');
          } else {
            setError(`Hata kodu: ${err.response.status}. Lütfen daha sonra tekrar deneyin.`);
          }
        } else if (err.request) {
          // İstek yapıldı ama cevap alınamadı
          setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          // İstek oluşturulurken hata oluştu
          setError(err.message || 'Bilinmeyen bir hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id, user?.token]);
  
  
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={60} color="#F44336" />
        <Text style={styles.errorText}>Sipariş bulunamadı</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sipariş Detayı</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Sipariş Başlık */}
        <View style={styles.headerCard}>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumberLabel}>Sipariş No:</Text>
            <Text style={styles.orderNumber}>{order.orderNumber || order._id}</Text>
          </View>
          
          <View style={styles.orderDateRow}>
            <Text style={styles.orderDateLabel}>Sipariş Tarihi:</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Ionicons name={status.icon} size={16} color="#fff" style={styles.statusIcon} />
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>
        
        {/* Sipariş Öğeleri */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sipariş Öğeleri</Text>
          
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.productImageContainer}>
                {item.image ? (
                  <Image
                    source={{ uri: `http://${SERVER_IP}:5000/uploads/product-images/${item.image}` }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImageContainer}>
                    <Ionicons name="image-outline" size={24} color="#ccc" />
                  </View>
                )}
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price.toFixed(2)} ₺/{item.unit}</Text>
                <Text style={styles.itemQuantity}>
                  Miktar: {item.quantity} {item.unit}
                </Text>
              </View>
              
              <Text style={styles.itemTotal}>
                {(item.price * item.quantity).toFixed(2)} ₺
              </Text>
            </View>
          ))}
        </View>
        
        {/* Teslimat Adresi */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
          
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color="#4CAF50" style={styles.addressIcon} />
            <View style={styles.addressDetails}>
              <Text style={styles.addressName}>{order.shippingAddress.fullName}</Text>
              <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
              <Text style={styles.addressText}>
                {order.shippingAddress.district}, {order.shippingAddress.city}
                {order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}
              </Text>
              <Text style={styles.addressText}>Tel: {order.shippingAddress.phone}</Text>
            </View>
          </View>
        </View>
        
        {/* Ödeme Bilgileri */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Ödeme Yöntemi</Text>
            <View style={styles.paymentMethodBadge}>
              <Ionicons 
                name={order.paymentMethod === 'Kredi Kartı' ? 'card-outline' : 'cash-outline'} 
                size={16} 
                color="#4CAF50" 
                style={styles.paymentIcon} 
              />
              <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
            </View>
          </View>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Ödeme Durumu</Text>
            <View style={[
              styles.paymentStatusBadge, 
              { backgroundColor: order.isPaid ? '#4CAF50' : '#FF9800' }
            ]}>
              <Ionicons 
                name={order.isPaid ? 'checkmark-circle-outline' : 'time-outline'} 
                size={16} 
                color="#fff" 
                style={styles.paymentIcon} 
              />
              <Text style={styles.paymentStatusText}>
                {order.isPaid ? 'Ödendi' : 'Bekliyor'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Sipariş Özeti */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ara Toplam</Text>
            <Text style={styles.summaryValue}>{order.totalPrice.toFixed(2)} ₺</Text>
          </View>
          
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>İndirim</Text>
              <Text style={styles.discountValue}>-{order.discountAmount.toFixed(2)} ₺</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kargo</Text>
            <Text style={styles.summaryValue}>
              {order.shippingFee === 0 ? 'Ücretsiz' : `${order.shippingFee.toFixed(2)} ₺`}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Genel Toplam</Text>
            <Text style={styles.totalValue}>{order.totalAmount.toFixed(2)} ₺</Text>
          </View>
        </View>
        
        
      </ScrollView>
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
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDateLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
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
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    alignSelf: 'flex-end',
    marginLeft: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  paymentIcon: {
    marginRight: 4,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#333',
  },
  paymentStatusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
}); 