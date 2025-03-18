import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Örnek ürün verileri
const dummyProducts = [
  {
    id: '1',
    name: 'Organik Domates',
    price: 15.99,
    icon: 'nutrition-outline',
    color: '#FF6B6B',
    seller: 'Ahmet Çiftçi',
    location: 'İzmir'
  },
  {
    id: '2',
    name: 'Taze Süt',
    price: 12.50,
    icon: 'water-outline',
    color: '#4ECDC4',
    seller: 'Ayşe Hayvancılık',
    location: 'Bursa'
  },
  {
    id: '3',
    name: 'Organik Yumurta',
    price: 30.00,
    icon: 'egg-outline',
    color: '#FFD166',
    seller: 'Mehmet Tavukçuluk',
    location: 'Ankara'
  },
  {
    id: '4',
    name: 'Bal',
    price: 120.00,
    icon: 'flower-outline',
    color: '#F9C74F',
    seller: 'Fatma Arıcılık',
    location: 'Muğla'
  },
];

// Örnek kategori verileri
const categories = [
  { id: '1', name: 'Sebzeler', icon: '🥦' },
  { id: '2', name: 'Meyveler', icon: '🍎' },
  { id: '3', name: 'Süt Ürünleri', icon: '🥛' },
  { id: '4', name: 'Et Ürünleri', icon: '🥩' },
  { id: '5', name: 'Bal & Reçel', icon: '🍯' },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState(dummyProducts);

  // Kategori öğesi
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Ürün kartı
  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={[styles.productImagePlaceholder, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={40} color="#fff" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price.toFixed(2)} ₺</Text>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{item.seller}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Karşılama Mesajı */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Merhaba, {user ? user.name : 'Misafir'}!
        </Text>
        <Text style={styles.subText}>
          Bugün ne almak istersiniz?
        </Text>
      </View>

      {/* Kategoriler */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Kategoriler</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Öne Çıkan Ürünler */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <FlatList
            data={featuredProducts}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </View>

      {/* Yeni Ürünler */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Yeni Ürünler</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <FlatList
            data={featuredProducts.slice().reverse()}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  categoriesList: {
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  categoryName: {
    textAlign: 'center',
    fontSize: 14,
  },
  productsList: {
    paddingVertical: 10,
  },
  productCard: {
    width: width * 0.6,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sellerName: {
    fontSize: 12,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#888',
  },
});

export default HomeScreen; 