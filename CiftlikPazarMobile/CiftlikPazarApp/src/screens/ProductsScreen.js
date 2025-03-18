import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Örnek ürün verileri
const dummyProducts = [
  {
    id: '1',
    name: 'Organik Domates',
    price: 15.99,
    icon: 'nutrition-outline',
    color: '#FF6B6B',
    seller: 'Ahmet Çiftçi',
    location: 'İzmir',
    description: 'Tamamen doğal yöntemlerle yetiştirilmiş organik domatesler.'
  },
  {
    id: '2',
    name: 'Taze Süt',
    price: 12.50,
    icon: 'water-outline',
    color: '#4ECDC4',
    seller: 'Ayşe Hayvancılık',
    location: 'Bursa',
    description: 'Günlük sağılan taze inek sütü.'
  },
  {
    id: '3',
    name: 'Organik Yumurta',
    price: 30.00,
    icon: 'egg-outline',
    color: '#FFD166',
    seller: 'Mehmet Tavukçuluk',
    location: 'Ankara',
    description: 'Gezen tavuk yumurtası, 10\'lu paket.'
  },
  {
    id: '4',
    name: 'Bal',
    price: 120.00,
    icon: 'flower-outline',
    color: '#F9C74F',
    seller: 'Fatma Arıcılık',
    location: 'Muğla',
    description: 'Doğal çiçek balı, 1 kg.'
  },
  {
    id: '5',
    name: 'Zeytinyağı',
    price: 150.00,
    icon: 'leaf-outline',
    color: '#90BE6D',
    seller: 'Ali Zeytincilik',
    location: 'Aydın',
    description: 'Soğuk sıkım naturel sızma zeytinyağı, 1 lt.'
  },
  {
    id: '6',
    name: 'Peynir',
    price: 85.00,
    icon: 'pie-chart-outline',
    color: '#577590',
    seller: 'Veli Mandıra',
    location: 'Tekirdağ',
    description: 'Tam yağlı beyaz peynir, 500 gr.'
  },
];

const ProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState(dummyProducts);
  const [filteredProducts, setFilteredProducts] = useState(dummyProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Arama fonksiyonu
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = products.filter(
        item => item.name.toLowerCase().includes(text.toLowerCase()) ||
               item.description.toLowerCase().includes(text.toLowerCase()) ||
               item.seller.toLowerCase().includes(text.toLowerCase()) ||
               item.location.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  // Ürün detayına gitme
  const handleProductPress = (product) => {
    // Ürün detay sayfasına yönlendirme (henüz oluşturulmadı)
    alert(`${product.name} detayları gösterilecek`);
  };

  // Ürün kartı
  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <View style={[styles.productImagePlaceholder, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={50} color="#fff" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price.toFixed(2)} ₺</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{item.seller}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün, satıcı veya konum ara..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Ürün Listesi */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Ürün bulunamadı.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 17,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sellerName: {
    fontSize: 13,
    color: '#666',
  },
  location: {
    fontSize: 13,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ProductsScreen; 