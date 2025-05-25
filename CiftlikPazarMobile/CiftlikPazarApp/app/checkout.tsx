import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useCart } from '../src/context/CartContext';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import { getDevServerIp } from '../src/utils/networkUtils';
import { RadioButton } from 'react-native-paper';

// API URL'ini al
const SERVER_IP = getDevServerIp();
const API_URL = `http://${SERVER_IP}:5000/api`;

// Adres türü tanımlaması
interface Address {
  _id: string;
  title: string;
  address: string;
  city: string;
  district?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export default function CheckoutScreen() {
  const { 
    cart, 
    getCartTotal, 
    getShippingFee, 
    getOrderTotal,
    clearCart
  } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Kapıda Ödeme');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Sayfa başlığını ayarla
  useEffect(() => {
    navigation.setOptions({
      headerShown: false // Header'ı gizle, kendi özel header'ımızı kullanacağız
    });
  }, [navigation]);
  
  // Kullanıcının adreslerini getir
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);
        
        // Token'in tanımlı olup olmadığını kontrol et
        const userToken = user?.token;
        
        if (!userToken) {
          console.log('Kimlik doğrulama bilgisi bulunamadı');
          setAddressLoading(false);
          Alert.alert('Hata', 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
          router.replace('/login');
          return;
        }
        
        console.log("Adres API isteği yapılıyor...");
        console.log("API URL:", `${API_URL}/users/delivery-addresses`);
        console.log("Token:", userToken);
        
        const response = await axios.get(
          `${API_URL}/users/delivery-addresses`,
          {
            headers: { Authorization: `Bearer ${userToken}` }
          }
        );
        
        console.log("API Yanıtı:", response.data);
        
        if (response.data.success) {
          setAddresses(response.data.data);
          console.log("Adresler yüklendi:", response.data.data);
          
          // Varsayılan adresi seç
          const defaultAddress = response.data.data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            console.log("Varsayılan adres seçildi:", defaultAddress);
          } else if (response.data.data.length > 0) {
            setSelectedAddress(response.data.data[0]);
            console.log("İlk adres seçildi:", response.data.data[0]);
          }
        } else {
          console.log("API başarılı değil:", response.data);
        }
      } catch (error: any) {
        console.error('Adres getirme hatası:', error);
        console.log("Hata detayları:", error.response ? error.response.data : "Yanıt yok");
        Alert.alert(
          'Hata',
          'Adresler yüklenirken bir sorun oluştu.'
        );
      } finally {
        setAddressLoading(false);
      }
    };
    
    fetchAddresses();
  }, [user?.token]);
  
  // Siparişi oluştur
  const createOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Uyarı', 'Lütfen bir teslimat adresi seçin.');
      return;
    }
    
    // Token'in tanımlı olup olmadığını kontrol et
    const userToken = user?.token;
    
    if (!userToken) {
      Alert.alert('Hata', 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Kullanıcının telefon numarasını al
      const userPhone = user?.data?.phone || '';
      
      const orderData = {
        items: cart.items.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          unit: item.unit,
          farmer: item.farmer
        })),
        shippingAddress: {
          fullName: selectedAddress.title,
          address: selectedAddress.address,
          city: selectedAddress.city,
          district: selectedAddress.district || '',
          postalCode: selectedAddress.postalCode || '',
          phone: userPhone
        },
        paymentMethod,
        totalPrice: getCartTotal(),
        shippingFee: getShippingFee(),
        discountAmount: cart.discountAmount || 0,
        totalAmount: getOrderTotal(),
        coupon: cart.coupon ? cart.coupon._id : null
      };
      
      console.log("Sipariş oluşturma isteği yapılıyor...");
      console.log("Sipariş verileri:", orderData);
      
      const response = await axios.post(
        `${API_URL}/orders`,
        orderData,
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      
      console.log("Sipariş API yanıtı:", response.data);
      
      if (response.data.success) {
        setOrderNumber(response.data.data.orderNumber || response.data.data._id);
        setOrderSuccess(true);
        clearCart();
      } else {
        console.log("Sipariş oluşturma başarısız:", response.data);
        Alert.alert('Hata', response.data.message || 'Sipariş oluşturulurken bir sorun oluştu.');
      }
    } catch (error: any) {
      console.error('Sipariş oluşturma hatası:', error);
      let errorMessage = 'Sipariş oluşturulurken bir sorun oluştu.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Başarılı sipariş modalı
  const renderSuccessModal = () => (
    <Modal
      visible={orderSuccess}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.successTitle}>Siparişiniz Alındı!</Text>
          
          <Text style={styles.orderNumber}>
            Sipariş Numarası: {orderNumber}
          </Text>
          
          <Text style={styles.successMessage}>
            Siparişiniz başarıyla oluşturuldu. Siparişinizin durumunu "Siparişlerim" sayfasından takip edebilirsiniz.
          </Text>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              setOrderSuccess(false);
              router.push('/(tabs)');
            }}
          >
            <Text style={styles.continueButtonText}>Alışverişe Devam Et</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.viewOrderButton}
            onPress={() => {
              setOrderSuccess(false);
              router.push('/orders');
            }}
          >
            <Text style={styles.viewOrderButtonText}>Siparişlerimi Görüntüle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Sepet boşsa ana sayfaya yönlendir
  useEffect(() => {
    if (cart.items.length === 0 && !orderSuccess) {
      router.replace('/(tabs)');
    }
  }, [cart.items, orderSuccess]);
  
  if (cart.items.length === 0 && !orderSuccess) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Tek büyük header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sipariş Detayları</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Teslimat Adresi Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
          
          {addressLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : addresses.length > 0 ? (
            <View style={styles.addressList}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address._id}
                  style={[
                    styles.addressCard,
                    selectedAddress && selectedAddress._id === address._id && styles.selectedAddressCard
                  ]}
                  onPress={() => setSelectedAddress(address)}
                >
                  <View style={styles.addressHeader}>
                    <View style={styles.addressTitleContainer}>
                      <Ionicons name="location" size={18} color="#4CAF50" />
                      <Text style={styles.addressTitle}>{address.title}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Varsayılan</Text>
                        </View>
                      )}
                    </View>
                    
                    <RadioButton
                      value={address._id}
                      status={selectedAddress && selectedAddress._id === address._id ? 'checked' : 'unchecked'}
                      onPress={() => setSelectedAddress(address)}
                      color="#4CAF50"
                    />
                  </View>
                  
                  <View style={styles.addressDetails}>
                    <Text style={styles.addressText}>{address.address}</Text>
                    <Text style={styles.addressText}>{address.district}, {address.city}</Text>
                    {address.postalCode && (
                      <Text style={styles.addressText}>Posta Kodu: {address.postalCode}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => router.push('/profile?section=addresses')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.addAddressText}>Yeni Adres Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAddressContainer}>
              <Ionicons name="location-outline" size={40} color="#ccc" />
              <Text style={styles.noAddressText}>Kayıtlı adresiniz bulunmuyor.</Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => router.push('/profile?section=addresses')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.addAddressText}>Yeni Adres Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Ödeme Yöntemi Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
          
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'Kapıda Ödeme' && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentMethod('Kapıda Ödeme')}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons name="cash-outline" size={24} color="#4CAF50" />
                <View style={styles.paymentOptionTextContainer}>
                  <Text style={styles.paymentOptionTitle}>Kapıda Ödeme</Text>
                  <Text style={styles.paymentOptionDescription}>Siparişinizi teslim alırken ödeme yapın</Text>
                </View>
              </View>
              
              <RadioButton
                value="Kapıda Ödeme"
                status={paymentMethod === 'Kapıda Ödeme' ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod('Kapıda Ödeme')}
                color="#4CAF50"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'Kredi Kartı' && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentMethod('Kredi Kartı')}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons name="card-outline" size={24} color="#4CAF50" />
                <View style={styles.paymentOptionTextContainer}>
                  <Text style={styles.paymentOptionTitle}>Kredi Kartı</Text>
                  <Text style={styles.paymentOptionDescription}>Kredi kartı ile güvenli ödeme yapın</Text>
                </View>
              </View>
              
              <RadioButton
                value="Kredi Kartı"
                status={paymentMethod === 'Kredi Kartı' ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod('Kredi Kartı')}
                color="#4CAF50"
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Sipariş Özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          
          <View style={styles.orderSummaryCard}>
            {cart.items.map((item) => (
              <View key={item._id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemQuantity}>
                    {item.quantity} {item.unit} x {item.price.toFixed(2)} ₺
                  </Text>
                </View>
                <Text style={styles.orderItemPrice}>
                  {(item.price * item.quantity).toFixed(2)} ₺
                </Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam</Text>
              <Text style={styles.summaryValue}>{getCartTotal().toFixed(2)} ₺</Text>
            </View>
            
            {cart.coupon && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>İndirim</Text>
                <Text style={styles.discountValue}>-{cart.discountAmount.toFixed(2)} ₺</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kargo</Text>
              <Text style={styles.summaryValue}>
                {getShippingFee() === 0 
                  ? 'Ücretsiz' 
                  : `${getShippingFee().toFixed(2)} ₺`}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Genel Toplam</Text>
              <Text style={styles.totalValue}>{getOrderTotal().toFixed(2)} ₺</Text>
            </View>
          </View>
        </View>
        
        {/* Boşluk */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Sipariş Oluştur Butonu */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>Toplam</Text>
          <Text style={styles.bottomTotalValue}>{getOrderTotal().toFixed(2)} ₺</Text>
        </View>
        
        <TouchableOpacity
          style={styles.createOrderButton}
          onPress={createOrder}
          disabled={loading || !selectedAddress}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.createOrderButtonText}>Siparişi Oluştur</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Başarılı Sipariş Modalı */}
      {renderSuccessModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  addressList: {
    marginBottom: 8,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedAddressCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressDetails: {
    marginLeft: 26,
  },
  addressText: {
    color: '#666',
    marginBottom: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addAddressText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noAddressContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  noAddressText: {
    color: '#666',
    marginVertical: 12,
  },
  paymentOptions: {
    marginBottom: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedPaymentOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionTextContainer: {
    marginLeft: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentOptionDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  orderSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemQuantity: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '500',
  },
  discountValue: {
    fontWeight: '500',
    color: '#F44336',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  bottomTotalLabel: {
    color: '#666',
    fontSize: 12,
  },
  bottomTotalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4CAF50',
  },
  createOrderButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 160,
  },
  createOrderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    color: '#4CAF50',
  },
  successMessage: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  viewOrderButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}); 