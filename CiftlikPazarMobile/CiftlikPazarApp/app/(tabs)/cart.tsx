import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
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
    getOrderTotal
  } = useCart();
  const router = useRouter();

  // Ürün miktarını arttır
  const increaseQuantity = (id: string) => {
    const item = cart.items.find(item => item._id === id);
    if (item) {
      updateQuantity({ _id: id }, item.quantity + (item.unit === 'kg' ? 0.5 : 1));
    }
  };

  // Ürün miktarını azalt
  const decreaseQuantity = (id: string) => {
    const item = cart.items.find(item => item._id === id);
    if (item) {
      const newQuantity = item.quantity - (item.unit === 'kg' ? 0.5 : 1);
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
              {item.unit === 'kg' ? item.quantity.toFixed(1) : item.quantity} {item.unit}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sepetim</Text>
        <Text style={styles.itemCount}>{cart.items.length} ürün</Text>
      </View>

      {cart.items.length > 0 ? (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.cartList}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam</Text>
              <Text style={styles.summaryValue}>{getCartTotal().toFixed(2)} ₺</Text>
            </View>
            
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
            
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Siparişi Tamamla</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartTitle}>Sepetiniz Boş</Text>
          <Text style={styles.emptyCartText}>
            Sepetinizde hiç ürün bulunmuyor. Alışverişe başlamak için ürünler sayfasını ziyaret edebilirsiniz.
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.navigate('/(tabs)/products')}
          >
            <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  cartList: {
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
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
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginTop: 'auto',
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
    color: '#333',
    fontWeight: '500',
  },
  freeShippingNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 