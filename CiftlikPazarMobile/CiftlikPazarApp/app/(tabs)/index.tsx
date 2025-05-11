import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

// Tipleri tanımlayalım
interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  unit: string;
  rating: number;
}

// Geçici örnek veri
const CATEGORIES: Category[] = [
  { id: '1', name: 'Sebzeler', icon: 'leaf-outline', color: '#4CAF50' },
  { id: '2', name: 'Meyveler', icon: 'nutrition-outline', color: '#FF9800' },
  { id: '3', name: 'Süt Ürünleri', icon: 'water-outline', color: '#2196F3' },
  { id: '4', name: 'Et Ürünleri', icon: 'fast-food-outline', color: '#F44336' },
  { id: '5', name: 'Baklagiller', icon: 'egg-outline', color: '#9C27B0' },
  { id: '6', name: 'Organik', icon: 'flower-outline', color: '#8BC34A' },
];

const FEATURED_PRODUCTS: Product[] = [
  { id: '1', name: 'Taze Domates', price: '12.90', unit: 'kg', rating: 4.8 },
  { id: '2', name: 'Organik Elma', price: '15.50', unit: 'kg', rating: 4.5 },
  { id: '3', name: 'Köy Peyniri', price: '80.00', unit: 'kg', rating: 4.9 },
  { id: '4', name: 'Çiftlik Yumurtası', price: '40.00', unit: '30 adet', rating: 4.7 },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 25;

export default function HomeScreen() {
  const { user } = useAuth();

  // Kategori kartı
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Ürün kartı
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>{item.price} ₺</Text>
          <Text style={styles.productUnit}>/ {item.unit}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Karşılama Mesajı */}
      <View style={styles.welcomeContainer}>
        <View>
          <Text style={styles.welcomeText}>Merhaba,</Text>
          <Text style={styles.userName}>{user?.data?.firstName || 'Ziyaretçi'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Arama Çubuğu */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <Text style={styles.searchText}>Ürün ara...</Text>
      </TouchableOpacity>

      {/* Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Taze Ürünler</Text>
            <Text style={styles.bannerSubtitle}>Direkt çiftlikten sofranıza</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Keşfet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Kategoriler */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Öne Çıkan Ürünler */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={FEATURED_PRODUCTS}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      </View>

      {/* Yeni Ürünler */}
      <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yeni Ürünler</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={FEATURED_PRODUCTS.slice().reverse()}
          renderItem={renderProductItem}
          keyExtractor={(item) => `new-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  searchText: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  bannerContainer: {
    marginBottom: 20,
  },
  banner: {
    height: 150,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bannerContent: {
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  categoriesList: {
    paddingTop: 5,
    paddingBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  productsList: {
    paddingTop: 5,
    paddingBottom: 10,
  },
  productCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productUnit: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
});
