import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { productAPI, categoryAPI } from '../../src/services/api';
import { getDevServerIp } from '../../src/utils/networkUtils';
import { useCart } from '../../src/context/CartContext';

// IP adresini al
const SERVER_IP = getDevServerIp();

// Ekran genişliği
const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState('default'); // default, price-asc, price-desc, name-asc, name-desc
  const router = useRouter();
  const { addToCart } = useCart();
  const { categoryId } = useLocalSearchParams();

  // Kategori bilgisini alma yardımcı fonksiyonu
  const getCategoryName = (categoryItem: any) => {
    if (!categoryItem) return '';
    
    // Kategori bir string ise direkt ID olarak kullan
    if (typeof categoryItem === 'string') {
      const foundCategory = categories.find(cat => (cat._id || cat.id) === categoryItem);
      return foundCategory ? (foundCategory.name || foundCategory.category_name) : '';
    }
    
    // Kategori bir obje ise name veya category_name'e bak
    return categoryItem.name || categoryItem.category_name || '';
  };

  // Ürünleri ve kategorileri yükle - sadece bir kez
  useEffect(() => {
    // İlk yükleme için
    fetchData();
  }, []);

  // Her sayfaya dönüşte verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      console.log('Ürünler sayfası aktif oldu, veriler yenileniyor...');
      console.log('URL kategori parametresi:', categoryId);
      fetchData();
      return () => {
        // Fokus kaldırıldığında yapılacak temizlik işlemleri (gerekirse)
      };
    }, [categoryId]) // categoryId değiştiğinde tekrar çalıştır
  );

  // Veri yükleme fonksiyonu
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Ürünleri getir
      const productsResponse = await productAPI.getAllProducts();
      console.log('Ürünler API yanıtı:', productsResponse);
      
      // API yanıt formatını kontrol et
      if (productsResponse.success && Array.isArray(productsResponse.data)) {
        setProducts(productsResponse.data);
      } else if (Array.isArray(productsResponse)) {
        setProducts(productsResponse);
      } else if (productsResponse.data && Array.isArray(productsResponse.data)) {
        setProducts(productsResponse.data);
      } else {
        console.warn('Beklenmeyen API yanıt formatı:', productsResponse);
        setProducts([]);
      }
      
      // Kategorileri getir
      const categoriesResponse = await categoryAPI.getAllCategories();
      console.log('Kategoriler API yanıtı:', categoriesResponse);
      
      // Tüm kategoriler seçeneği ekle
      const allCategoriesOption = { _id: 'all', name: 'Tümü', category_name: 'Tümü' };
      
      // Varsayılan kategorilere düşüldüyse bildirim göster
      if (categoriesResponse.isDefault) {
        console.warn('DİKKAT: Varsayılan kategoriler kullanılıyor, veritabanına bağlanılamadı.');
      }
      
      let processedCategories = [];
      
      if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
        // Kategorileri işle ve name alanlarını düzelt
        processedCategories = categoriesResponse.data.map((cat: any) => {
          // Kategori adını garanti altına al
          if (!cat.name && cat.category_name) {
            cat.name = cat.category_name;
          } else if (!cat.category_name && cat.name) {
            cat.category_name = cat.name; 
          }
          return cat;
        });
      } else if (Array.isArray(categoriesResponse)) {
        // Kategorileri işle ve name alanlarını düzelt
        processedCategories = categoriesResponse.map((cat: any) => {
          // Kategori adını garanti altına al
          if (!cat.name && cat.category_name) {
            cat.name = cat.category_name;
          } else if (!cat.category_name && cat.name) {
            cat.category_name = cat.name; 
          }
          return cat;
        });
      } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data.data)) {
        // Kategorileri işle ve name alanlarını düzelt
        processedCategories = categoriesResponse.data.data.map((cat: any) => {
          // Kategori adını garanti altına al
          if (!cat.name && cat.category_name) {
            cat.name = cat.category_name;
          } else if (!cat.category_name && cat.name) {
            cat.category_name = cat.name; 
          }
          return cat;
        });
      }
      
      setCategories([allCategoriesOption, ...processedCategories]);
      
      // URL'den gelen kategori ID varsa onu seç, yoksa tümünü seç
      if (categoryId) {
        console.log('URL parametresinden kategori ID alındı:', categoryId);
        
        // Gelen kategori ID'si ile eşleşen kategoriyi bul
        const matchingCategory = processedCategories.find(
          (cat: any) => (cat._id || cat.id) === categoryId
        );
        
        if (matchingCategory) {
          console.log('Eşleşen kategori bulundu:', matchingCategory.name || matchingCategory.category_name);
          setSelectedCategory(categoryId as string);
        } else {
          console.log('Eşleşen kategori bulunamadı, tümü seçildi');
          setSelectedCategory('all');
        }
      } else {
        // Başlangıçta Tümü kategorisini seçili olarak ayarla
        setSelectedCategory('all');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Veri yükleme hatası:', err);
      setError(err.message || 'Ürünler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Favori ekle/çıkar
  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Kategoriye, arama sorgusuna ve sıralama seçeneğine göre filtreleme
  const getFilteredAndSortedProducts = () => {
    // Önce filtreleme yapalım
    const filtered = products.filter(product => {
      // Tümü seçiliyse veya boş kategori seçiliyse
      const matchesCategory = selectedCategory === 'all' || selectedCategory === '' || 
        (product.category && 
          (typeof product.category === 'string' 
            ? product.category === selectedCategory 
            : product.category._id === selectedCategory));
      
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    // Sonra sıralama yapalım
    switch (sortOption) {
      case 'price-asc':
        return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...filtered].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered;
    }
  };

  // Sıralama seçeneğine göre başlık metni
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'price-asc':
        return 'Fiyat: Düşükten Yükseğe';
      case 'price-desc':
        return 'Fiyat: Yüksekten Düşüğe';
      case 'name-asc':
        return 'İsim: A-Z';
      case 'name-desc':
        return 'İsim: Z-A';
      default:
        return 'Varsayılan Sıralama';
    }
  };

  // Kategori seçildiğinde modalı kapatma - bunu kaldırıyoruz, sadece seçim yapılsın
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Modal kapanmasın, sadece kategori seçilsin
  };

  // Tüm modalı kapat - x tuşuna basılınca
  const closeModal = () => {
    setFilterModalVisible(false);
  };

  // Filtre uygula ve modalı kapat - Uygula butonuna basılınca
  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  // Kategori öğesini render et
  const renderCategoryItem = ({ item }: { item: any }) => {
    // Kategori ID'si, API yanıt yapısına göre _id veya id olabilir
    const categoryId = item._id || item.id;
    const isSelected = categoryId === selectedCategory;
    
    // Kategori ismi, API yanıt yapısına göre name veya category_name olabilir
    const categoryName = item.name || item.category_name;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterCategoryItem,
          isSelected && styles.selectedFilterCategoryItem,
        ]}
        onPress={() => handleCategorySelect(categoryId)}
      >
        <Text
          style={[
            styles.filterCategoryText,
            isSelected && styles.selectedFilterCategoryText,
          ]}
        >
          {categoryName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Ürün kartını render et
  const renderProductItem = ({ item }: { item: any }) => {
    // Ürün ID'si, API yanıt yapısına göre _id veya id olabilir
    const productId = item._id || item.id;
    const isFavorite = favorites.includes(productId);
    
    // Ürünün stok durumunu kontrol et
    const stockCount = item.countInStock || 0;
    const isInStock = stockCount > 0;
    
    // Çiftçi bilgisini düzgün formatta hazırla
    let farmerData = undefined;
    if (item.farmer) {
      if (typeof item.farmer === 'string') {
        // Eğer farmer bir string ise (ID), düzgün bir obje oluştur
        farmerData = {
          _id: item.farmer,
          farmName: 'Çiftlik'
        };
      } else if (typeof item.farmer === 'object') {
        // Farmer bir obje ise, gerekli alanları al
        farmerData = {
          _id: item.farmer._id || item.farmer.id || 'unknown',
          farmName: item.farmer.farmName || item.farmer.farm_name || 'Çiftlik'
        };
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          const href = `/product/${productId}`;
          router.push(href as any);
        }}
      >
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image
              source={{ 
                uri: `http://${SERVER_IP}:5000/uploads/product-images/${item.image}` 
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation(); // Kart tıklamasını engeller
              toggleFavorite(productId);
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#F44336' : '#666'}
            />
          </TouchableOpacity>
          
          {/* Stok durumu belirteci */}
          {!isInStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Tükendi</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.categoryLabel}>{getCategoryName(item.category)}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>{item.price?.toFixed(2)} ₺</Text>
            <Text style={styles.productUnit}>/ {item.unit || 'birim'}</Text>
          </View>
          {item.rating ? (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          ) : null}
          <TouchableOpacity 
            style={[styles.addButton, !isInStock && styles.addButtonDisabled]}
            disabled={!isInStock}
            onPress={(e) => {
              e.stopPropagation(); // Kart tıklamasını engeller
              
              // Stok kontrolü yap
              if (!isInStock) {
                Alert.alert(
                  "Stok Hatası", 
                  `Üzgünüz, "${item.name}" ürünü stokta bulunmamaktadır.`
                );
                return;
              }
              
              // Sepete ekleme işlemi
              addToCart({
                _id: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                unit: item.unit || 'birim',
                countInStock: stockCount,
                image: item.image,
                farmer: farmerData
              });
            }}
          >
            <Ionicons name="cart-outline" size={18} color={isInStock ? "#fff" : "#aaa"} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Filtre Modalı
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrele ve Sırala</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {/* Kategori Seçimi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Kategoriler</Text>
              <View style={styles.filterCategoriesContainer}>
                {categories.map((category) => {
                  const categoryId = category._id || category.id;
                  const isSelected = categoryId === selectedCategory;
                  
                  return (
                    <TouchableOpacity
                      key={`category-${categoryId || Math.random()}`}
                      style={[
                        styles.filterCategoryItem,
                        isSelected && styles.selectedFilterCategoryItem,
                      ]}
                      onPress={() => handleCategorySelect(categoryId)}
                    >
                      <Text
                        style={[
                          styles.filterCategoryText,
                          isSelected && styles.selectedFilterCategoryText,
                        ]}
                      >
                        {category.name || category.category_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Sıralama Seçimi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sıralama</Text>
              <View style={styles.sortOptionsContainer}>
                {[
                  { id: 'default', label: 'Varsayılan Sıralama' },
                  { id: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
                  { id: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
                  { id: 'name-asc', label: 'İsim: A-Z' },
                  { id: 'name-desc', label: 'İsim: Z-A' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.sortOptionItem,
                      sortOption === option.id && styles.selectedSortOptionItem,
                    ]}
                    onPress={() => setSortOption(option.id)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortOption === option.id && styles.selectedSortOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sortOption === option.id && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCategory('all');
                setSortOption('default');
              }}
            >
              <Text style={styles.resetButtonText}>Sıfırla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            // Sayfayı yenile
            router.replace('/products' as any);
          }}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filtre ve sıralama uygulanmış ürünleri al
  const filteredAndSortedProducts = getFilteredAndSortedProducts();

  return (
    <View style={styles.container}>
      {/* Filtre Modalı */}
      <FilterModal />
    
      {/* Başlık ve Filtreleme */}
      <View style={styles.header}>
        <Text style={styles.title}>Ürünler</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
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

      {/* Aktif Filtre Bilgisi */}
      {(selectedCategory !== 'all' || sortOption !== 'default') && (
        <View style={styles.activeFiltersContainer}>
          {selectedCategory !== 'all' && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>
                {categories.find(cat => (cat._id || cat.id) === selectedCategory) 
                  ? getCategoryName(categories.find(cat => (cat._id || cat.id) === selectedCategory))
                  : 'Kategori'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {sortOption !== 'default' && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>{getSortOptionText()}</Text>
              <TouchableOpacity onPress={() => setSortOption('default')}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Ürün Listesi */}
      {filteredAndSortedProducts.length > 0 ? (
        <FlatList
          data={filteredAndSortedProducts}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => `product-${item._id || item.id || index}`}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF5252',
    textAlign: 'center',
    marginHorizontal: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
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
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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
  outOfStockBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
    position: 'relative',
  },
  categoryLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 2,
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
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
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
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterCategoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterCategoryItem: {
    backgroundColor: '#4CAF50',
  },
  filterCategoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOptionsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedSortOptionItem: {
    backgroundColor: '#4CAF50',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#333',
  },
  selectedSortOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    color: '#666',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Aktif Filtre Gösterimi
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#333',
    marginRight: 6,
  },
}); 