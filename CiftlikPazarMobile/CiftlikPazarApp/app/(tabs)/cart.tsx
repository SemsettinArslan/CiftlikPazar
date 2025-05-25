import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { useRouter } from 'expo-router';
import { getDevServerIp } from '../../src/utils/networkUtils';

// IP adresini al
const SERVER_IP = getDevServerIp();

export default function CartScreen() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart,
    getCartTotal,
    getShippingFee,
    getOrderTotal,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError
  } = useCart();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');

  // Ürün miktarını arttır
  const increaseQuantity = (id: string) => {
    const item = cart.items.find(item => item._id === id);
    if (item) {
      updateQuantity({ _id: id }, item.quantity + 1);
    }
  };

  // Ürün miktarını azalt
  const decreaseQuantity = (id: string) => {
    const item = cart.items.find(item => item._id === id);
    if (item) {
      const newQuantity = item.quantity - 1;
      if (newQuantity <= 0) {
        // Onay soralım
        Alert.alert(
          "Ürünü Kaldır",
          "Bu ürünü sepetten kaldırmak istediğinize emin misiniz?",
          [
            {
              text: "İptal",
              style: "cancel"
            },
            { 
              text: "Kaldır", 
              onPress: () => removeFromCart({ _id: id }),
              style: "destructive"
            }
          ]
        );
      } else {
        updateQuantity({ _id: id }, newQuantity);
      }
    }
  };

  // Kupon uygula
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kupon kodu girin");
      return;
    }

    const success = await applyCoupon(couponCode);
    
    if (success) {
      Alert.alert("Başarılı", "Kupon başarıyla uygulandı");
      setCouponCode(''); // Input'u temizle
    } else if (couponError) {
      Alert.alert("Hata", couponError);
    }
  };

  // Kuponu kaldır
  const handleRemoveCoupon = () => {
    removeCoupon();
    Alert.alert("Bilgi", "Kupon kaldırıldı");
  };

  // Minimum alışveriş koşulunun kontrol edilmesi
  const isMinimumPurchaseMet = !cart.coupon || cart.totalPrice >= cart.coupon.minimumPurchase;
  
  // Gerçek indirim tutarı
  const actualDiscountAmount = isMinimumPurchaseMet ? cart.discountAmount : 0;

  // Sepet öğesini render et
  const renderCartItem = ({ item }: { item: any }) => {
    const itemTotal = item.price * item.quantity;
    
    return (
      <View style={styles.cartItem}>
        <View style={styles.productImagePlaceholder}>
          {item.image ? (
            <Image
              source={{ 
                uri: `http://${SERVER_IP}:5000/uploads/product-images/${item.image}` 
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={30} color="#ccc" />
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Ürünü Kaldır",
                  "Bu ürünü sepetten kaldırmak istediğinize emin misiniz?",
                  [
                    {
                      text: "İptal",
                      style: "cancel"
                    },
                    { 
                      text: "Kaldır", 
                      onPress: () => removeFromCart({ _id: item._id }),
                      style: "destructive"
                    }
                  ]
                );
              }}
              style={styles.removeButton}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.itemPrice}>{item.price.toFixed(2)} ₺/{item.unit}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => decreaseQuantity(item._id)}
            >
              <Ionicons name="remove" size={18} color="#4CAF50" />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>
              {item.quantity} {item.unit}
            </Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => increaseQuantity(item._id)}
            >
              <Ionicons name="add" size={18} color="#4CAF50" />
            </TouchableOpacity>
            
            <Text style={styles.itemTotalPrice}>{itemTotal.toFixed(2)} ₺</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sepetim</Text>
        <Text style={styles.itemCount}>{cart.items.length} ürün</Text>
      </View>

      {cart.items.length > 0 ? (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Ürün Listesi */}
          {cart.items.map((item) => (
            <React.Fragment key={item._id}>
              {renderCartItem({ item })}
            </React.Fragment>
          ))}
          
          {/* Kupon Bölümü */}
          <View style={styles.couponContainer}>
            <Text style={styles.couponTitle}>İndirim Kuponu</Text>
            
            {cart.coupon ? (
              // Uygulanan kupon gösterimi
              <View style={styles.appliedCouponContainer}>
                <View style={styles.appliedCouponInfo}>
                  <Text style={styles.couponCode}>{cart.coupon.code}</Text>
                  <Text style={styles.couponDescription}>{cart.coupon.description}</Text>
                  
                  {cart.coupon.type === 'percentage' ? (
                    <View style={styles.couponValueContainer}>
                      <Text style={styles.couponLabel}>İndirim: </Text>
                      <Text style={styles.couponValue}>%{cart.coupon.value}</Text>
                    </View>
                  ) : (
                    <View style={styles.couponValueContainer}>
                      <Text style={styles.couponLabel}>İndirim: </Text>
                      <Text style={styles.couponValue}>{cart.coupon.value.toFixed(2)} ₺</Text>
                    </View>
                  )}
                  
                  {!isMinimumPurchaseMet && (
                    <View style={styles.minimumPurchaseWarning}>
                      <Ionicons name="warning-outline" size={16} color="#FF9800" />
                      <Text style={styles.minimumPurchaseText}>
                        Minimum sepet tutarı: {cart.coupon.minimumPurchase.toFixed(2)} ₺
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.removeCouponButton}
                  onPress={handleRemoveCoupon}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ) : (
              // Kupon uygulama formu
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Kupon kodunuzu girin"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCouponButton}
                  onPress={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyCouponButtonText}>Uygula</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Boşluk Ekleyici */}
          <View style={{ height: 16 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartTitle}>Sepetiniz Boş</Text>
          <Text style={styles.emptyCartText}>
            Sepetinizde hiç ürün bulunmuyor. Alışverişe başlamak için ürünler sayfasını ziyaret edebilirsiniz.
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/products')}
          >
            <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Alt kısımdaki özet bölümü (sabit pozisyonda) */}
      {cart.items.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam</Text>
            <Text style={styles.summaryValue}>{cart.totalPrice.toFixed(2)} ₺</Text>
            </View>
          
          {cart.coupon && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>İndirim</Text>
              <Text style={styles.discountValue}>
                {isMinimumPurchaseMet 
                  ? `-${actualDiscountAmount.toFixed(2)} ₺` 
                  : '0.00 ₺'}
              </Text>
            </View>
          )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kargo</Text>
              <Text style={styles.summaryValue}>
                {getShippingFee() === 0 
                  ? 'Ücretsiz Kargo!' 
                  : `${getShippingFee().toFixed(2)} ₺`}
              </Text>
            </View>
            
            {getShippingFee() > 0 && (
              <Text style={styles.freeShippingNote}>
                * 150 ₺ ve üzeri alışverişlerde kargo ücretsiz
              </Text>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Genel Toplam</Text>
              <Text style={styles.totalValue}>{getOrderTotal().toFixed(2)} ₺</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => router.push({
                pathname: '/checkout',
              } as any)}
            >
              <Text style={styles.checkoutButtonText}>Siparişi Tamamla</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemCount: {
    fontSize: 14,
    color: '#777',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 10,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotalPrice: {
    marginLeft: 'auto',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4,
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
  freeShippingNote: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 5,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  couponContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  applyCouponButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 10,
  },
  appliedCouponInfo: {
    flex: 1,
  },
  couponCode: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  couponValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponLabel: {
    fontSize: 14,
    color: '#666',
  },
  couponValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  removeCouponButton: {
    padding: 5,
  },
  minimumPurchaseWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    padding: 5,
    backgroundColor: '#FFF8E1',
    borderRadius: 4,
  },
  minimumPurchaseText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 5,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
  },
}); 