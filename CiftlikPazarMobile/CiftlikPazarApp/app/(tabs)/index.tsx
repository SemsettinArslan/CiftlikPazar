import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { productAPI, categoryAPI } from '../../src/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDevServerIp } from '../../src/utils/networkUtils';

// Varsayılan ürün resmi
const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/150?text=Ürün+Resmi';

// IP adresini al
const SERVER_IP = getDevServerIp();

// Ürün resmi URL'i oluşturan yardımcı fonksiyon
const getProductImageUrl = (imagePath?: string) => {
  if (!imagePath) return DEFAULT_PRODUCT_IMAGE;
  
  // Eğer URL zaten tam ise (http veya https ile başlıyorsa) direkt kullan
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Aksi takdirde, sunucu URL'ini ekleyerek tam yolu oluştur
  return `http://${SERVER_IP}:5000/uploads/product-images/${imagePath}`;
};

// Tipleri tanımlayalım
interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon?: string;
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
  color?: string;
  category_name?: string;
  slug?: string;
}

interface Product {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  unit: string;
  rating?: number;
  image?: string;
  description?: string;
  countInStock?: number;
  isFeatured?: boolean;
  createdAt?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 25;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State tanımlamaları
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loadingNewProducts, setLoadingNewProducts] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Kategori ikonları ve renkleri için yardımcı obje
  const categoryIcons = {
    'Sebze': { icon: 'food-apple-outline', iconType: 'MaterialCommunityIcons', color: '#4CAF50' },
    'Meyve': { icon: 'fruit-cherries', iconType: 'MaterialCommunityIcons', color: '#FF9800' },
    'Süt Ürünleri': { icon: 'cheese', iconType: 'MaterialCommunityIcons', color: '#2196F3' },
    'Et ve Tavuk': { icon: 'food-drumstick-outline', iconType: 'MaterialCommunityIcons', color: '#F44336' },
    'Bakliyat': { icon: 'bean', iconType: 'MaterialCommunityIcons', color: '#9C27B0' },
    'Kurutulmuş Gıdalar': { icon: 'food-variant', iconType: 'MaterialCommunityIcons', color: '#795548' },
    'default': { icon: 'food', iconType: 'MaterialCommunityIcons', color: '#607D8B' }
  };

  // Sabit kategoriler - Her zaman bu 6 kategoriyi göster
  const fixedCategories: Category[] = [
    { _id: '1', name: 'Sebze', icon: 'carrot', iconType: 'MaterialCommunityIcons', color: '#4CAF50' },
    { _id: '2', name: 'Meyve', icon: 'fruit-cherries', iconType: 'MaterialCommunityIcons', color: '#FF9800' },
    { _id: '3', name: 'Süt Ürünleri', icon: 'cow', iconType: 'MaterialCommunityIcons', color: '#2196F3' },
    { _id: '4', name: 'Et ve Tavuk', icon: 'food-drumstick-outline', iconType: 'MaterialCommunityIcons', color: '#F44336' },
    { _id: '5', name: 'Bakliyat', icon: 'sack', iconType: 'MaterialCommunityIcons', color: '#9C27B0' },
    { _id: '6', name: 'Kurutulmuş Gıdalar', icon: 'package-variant', iconType: 'MaterialCommunityIcons', color: '#795548' }
  ];

  // Kategoriye uygun ikon ve renk seç
  const getCategoryIcon = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryIcons)) {
      if (lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return categoryIcons.default;
  };

  // Verileri yükle
  useEffect(() => {
    // İlk sayfa yüklemesinde çağrılıyor
    fetchFeaturedProducts();
    fetchNewProducts();
    fetchCategories();
  }, []);

  // Her sayfaya dönüşte verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      console.log('Ana sayfa aktif oldu, veriler yenileniyor...');
      fetchFeaturedProducts();
      fetchNewProducts();
      fetchCategories();
      return () => {
        // Fokus kaldırıldığında yapılacak temizlik işlemleri (gerekirse)
      };
    }, [])
  );

  const fetchFeaturedProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await productAPI.getFeaturedProducts(6); // 6 adet öne çıkan ürün al
      console.log('Öne çıkan ürünler:', data);
      
      // Ürün resimlerini logla
      if (Array.isArray(data)) {
        data.forEach(product => {
          console.log(`Ürün: ${product.name}, Resim: ${product.image}`);
        });
      }
      
      setFeaturedProducts(data);
    } catch (error) {
      console.error('Öne çıkan ürünleri yükleme hatası:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchNewProducts = async () => {
    try {
      setLoadingNewProducts(true);
      // Yeni ürünler için API çağrısı (şimdilik geçici olarak tüm ürünleri alıp ters çeviriyoruz)
      const data = await productAPI.getAllProducts();
      let products = [];
      
      if (data && data.success && Array.isArray(data.data)) {
        products = data.data;
      } else if (data && Array.isArray(data)) {
        products = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        products = data.data;
      }
      
      // Ürünleri tarihe göre sırala (son eklenenler önce)
      const sortedProducts = products.sort((a: Product, b: Product) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 6); // İlk 6 ürünü al
      
      setNewProducts(sortedProducts);
    } catch (error) {
      console.error('Yeni ürünleri yükleme hatası:', error);
    } finally {
      setLoadingNewProducts(false);
    }
  };

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryAPI.getAllCategories();
      console.log('Kategoriler API yanıtı:', response);
      
      // Önce API'den gelen kategorileri işle
      let apiCategories: Category[] = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        apiCategories = response.data;
      } else if (response && Array.isArray(response)) {
        apiCategories = response;
      }
      
      // Şimdi her sabit kategori için API'den eşleşen kategori ID'sini bulmaya çalış
      // Böylece API'deki gerçek kategori ID'leri kullanılır
      const finalCategories = fixedCategories.map(fixedCat => {
        // API kategori listesinde isim veya kategori adı eşleşen bir kategori ara
        const matchingCategory = apiCategories.find(apiCat => {
          const apiCatName = apiCat.name || apiCat.category_name || '';
          const fixedCatName = fixedCat.name || fixedCat.category_name || '';
          
          return apiCatName.toLowerCase().includes(fixedCatName.toLowerCase()) || 
                 fixedCatName.toLowerCase().includes(apiCatName.toLowerCase());
        });
        
        // Eğer eşleşen kategori bulunduysa, onun ID'sini kullan, bulunamadıysa sabit ID kullan
        if (matchingCategory) {
          return {
            ...fixedCat,
            _id: matchingCategory._id || matchingCategory.id,
            category_name: matchingCategory.category_name || fixedCat.name
          };
        }
        
        return fixedCat;
      });
      
      setCategories(finalCategories);
    } catch (error) {
      console.error('Kategorileri yükleme hatası:', error);
      // Hata durumunda sabit kategorileri kullan
      setCategories(fixedCategories);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Kategori kartı
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const categoryId = item._id || item.id;
    const categoryName = item.name || item.category_name;
    
    // İkon elementini oluştur (Ionicons veya MaterialCommunityIcons)
    const renderIcon = () => {
      if (item.iconType === 'MaterialCommunityIcons') {
        return (
          <MaterialCommunityIcons name={item.icon as any} size={24} color="#fff" />
        );
      } else {
        return (
          <Ionicons name={(item.icon || 'apps-outline') as any} size={24} color="#fff" />
        );
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => {
          console.log(`Kategori seçildi: ${categoryName}, ID: ${categoryId}`);
          router.push(`/(tabs)/products?categoryId=${categoryId}`);
        }}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
          {renderIcon()}
        </View>
        <Text style={styles.categoryName}>{categoryName}</Text>
      </TouchableOpacity>
    );
  };

  // Ürün kartı
  const renderProductItem = ({ item }: { item: Product }) => {
    // Ürün ID'si için API yanıt formatını kontrol et (_id veya id)
    const productId = item._id || item.id;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          if (productId) {
            router.push(`/product/${productId}` as any);
          }
        }}
      >
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image
              source={{ 
                uri: getProductImageUrl(item.image) 
              }}
              style={styles.productImage}
              resizeMode="cover"
              defaultSource={{ uri: DEFAULT_PRODUCT_IMAGE }}
              onError={(e) => console.log('Image loading error:', e.nativeEvent.error, 'for item:', item.name)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>{item.price?.toFixed(2)} ₺</Text>
            <Text style={styles.productUnit}>/ {item.unit}</Text>
          </View>
          {item.rating ? (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Yükleme göstergesi
  const renderLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );

  // Boş durum göstergesi
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={40} color="#ccc" />
      <Text style={styles.emptyText}>Ürün bulunamadı</Text>
    </View>
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
      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/products')}
      >
        <Ionicons name="search-outline" size={20} color="#666" />
        <Text style={styles.searchText}>Ürün ara...</Text>
      </TouchableOpacity>

      {/* Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Taze Ürünler</Text>
            <Text style={styles.bannerSubtitle}>Direkt çiftlikten sofranıza</Text>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => router.push('/(tabs)/products')}
            >
              <Text style={styles.bannerButtonText}>Keşfet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Kategoriler */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        {loadingCategories ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => `${item._id || item.id || Math.random().toString()}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        )}
      </View>

      {/* Öne Çıkan Ürünler */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        
        {loadingProducts ? (
          renderLoader()
        ) : featuredProducts.length > 0 ? (
          <FlatList
            data={featuredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => `featured-${item._id || item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          renderEmpty()
        )}
      </View>

      {/* Yeni Ürünler */}
      <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yeni Ürünler</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        
        {loadingNewProducts ? (
          renderLoader()
        ) : newProducts.length > 0 ? (
          <FlatList
            data={newProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => `new-${item._id || item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          renderEmpty()
        )}
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
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
  },
});
