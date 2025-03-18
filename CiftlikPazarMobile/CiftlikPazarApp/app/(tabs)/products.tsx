import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Örnek kategoriler
const CATEGORIES = [
  { id: 'all', name: 'Tümü' },
  { id: 'vegetables', name: 'Sebzeler' },
  { id: 'fruits', name: 'Meyveler' },
  { id: 'dairy', name: 'Süt Ürünleri' },
  { id: 'meat', name: 'Et Ürünleri' },
  { id: 'organic', name: 'Organik' },
];

// Örnek ürünler
const PRODUCTS = [
  { id: '1', name: 'Taze Domates', price: '12.90', unit: 'kg', category: 'vegetables', isFavorite: false, rating: 4.8 },
  { id: '2', name: 'Organik Elma', price: '15.50', unit: 'kg', category: 'fruits', isFavorite: true, rating: 4.5 },
  { id: '3', name: 'Köy Peyniri', price: '80.00', unit: 'kg', category: 'dairy', isFavorite: false, rating: 4.9 },
  { id: '4', name: 'Çiftlik Yumurtası', price: '40.00', unit: '30 adet', category: 'dairy', isFavorite: true, rating: 4.7 },
  { id: '5', name: 'Kuzu Eti', price: '185.00', unit: 'kg', category: 'meat', isFavorite: false, rating: 4.6 },
  { id: '6', name: 'Ispanak', price: '10.90', unit: 'demet', category: 'vegetables', isFavorite: false, rating: 4.3 },
  { id: '7', name: 'Organik Bal', price: '150.00', unit: 'kg', category: 'organic', isFavorite: true, rating: 4.9 },
  { id: '8', name: 'Keçi Sütü', price: '25.00', unit: 'litre', category: 'dairy', isFavorite: false, rating: 4.4 },
  { id: '9', name: 'Çilek', price: '30.00', unit: 'kg', category: 'fruits', isFavorite: false, rating: 4.7 },
  { id: '10', name: 'Patates', price: '8.50', unit: 'kg', category: 'vegetables', isFavorite: false, rating: 4.2 },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Favori ekle/çıkar
  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Kategoriye ve arama sorgusuna göre filtreleme
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Kategori öğesini render et
  const renderCategoryItem = ({ item }: { item: { id: string; name: string } }) => {
    const isSelected = item.id === selectedCategory;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.selectedCategoryItem,
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.selectedCategoryText,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Ürün kartını render et
  const renderProductItem = ({ item }: { item: typeof PRODUCTS[0] }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#F44336' : '#666'}
            />
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Başlık ve Filtreleme */}
      <View style={styles.header}>
        <Text style={styles.title}>Ürünler</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Listesi */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Ürün Listesi */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Ürün bulunamadı</Text>
          <Text style={styles.emptySubtext}>Lütfen başka bir arama terimi deneyin veya farklı bir kategori seçin.</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryItem: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  productsList: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: CARD_WIDTH,
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
    height: 150,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
    position: 'relative',
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
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 