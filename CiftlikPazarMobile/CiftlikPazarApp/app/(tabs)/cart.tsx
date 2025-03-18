import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Örnek sepet verileri
const INITIAL_CART_ITEMS = [
  { id: '1', name: 'Taze Domates', price: 12.90, quantity: 2, unit: 'kg' },
  { id: '2', name: 'Organik Elma', price: 15.50, quantity: 1, unit: 'kg' },
  { id: '3', name: 'Köy Peyniri', price: 80.00, quantity: 0.5, unit: 'kg' },
  { id: '4', name: 'Çiftlik Yumurtası', price: 40.00, quantity: 1, unit: '30 adet' },
];

export default function CartScreen() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);

  // Ürün miktarını arttır
  const increaseQuantity = (id: string) => {
    setCartItems(
      cartItems.map(item => 
        item.id === id 
          ? { ...item, quantity: item.quantity + (item.unit === 'kg' ? 0.5 : 1) }
          : item
      )
    );
  };

  // Ürün miktarını azalt
  const decreaseQuantity = (id: string) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity - (item.unit === 'kg' ? 0.5 : 1);
          return newQuantity <= 0 
            ? { ...item, quantity: item.unit === 'kg' ? 0.5 : 1 }
            : { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Ürünü sepetten kaldır
  const removeFromCart = (id: string) => {
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
          onPress: () => setCartItems(cartItems.filter(item => item.id !== id)),
          style: "destructive"
        }
      ]
    );
  };

  // Toplam ürün tutarı
  const getItemTotal = (price: number, quantity: number) => {
    return price * quantity;
  };

  // Sepet toplamı
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + getItemTotal(item.price, item.quantity), 0);
  };

  // Kargo ücreti
  const getShippingFee = () => {
    const cartTotal = getCartTotal();
    return cartTotal < 150 ? 20 : 0;
  };

  // Genel toplam
  const getOrderTotal = () => {
    return getCartTotal() + getShippingFee();
  };

  // Sepet öğesini render et
  const renderCartItem = ({ item }: { item: typeof INITIAL_CART_ITEMS[0] }) => {
    const itemTotal = getItemTotal(item.price, item.quantity);
    
    return (
      <View style={styles.cartItem}>
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => removeFromCart(item.id)}
              style={styles.removeButton}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.itemPrice}>{item.price.toFixed(2)} ₺/{item.unit}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => decreaseQuantity(item.id)}
            >
              <Ionicons name="remove" size={18} color="#4CAF50" />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>
              {item.unit === 'kg' ? item.quantity.toFixed(1) : item.quantity} {item.unit}
            </Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => increaseQuantity(item.id)}
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
        <Text style={styles.itemCount}>{cartItems.length} ürün</Text>
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
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
          <TouchableOpacity style={styles.shopButton}>
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
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginHorizontal: 10,
    minWidth: 60,
    textAlign: 'center',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 'auto',
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
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
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
}); 