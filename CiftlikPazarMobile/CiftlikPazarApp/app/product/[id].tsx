import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { productAPI } from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDevServerIp } from '../../src/utils/networkUtils';
import { useCart } from '../../src/context/CartContext';

// IP adresini al
const SERVER_IP = getDevServerIp();

// Ekran genişliğini al
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    // Ürün detaylarını API'den getir
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        console.log('Ürün detayları getiriliyor - ID:', id);
        
        const data = await productAPI.getProductDetails(id);
        console.log('Ürün detayları API yanıtı:', data);
        
        // API yanıt formatını kontrol et
        if (data && data.success && data.data) {
          // { success: true, data: {...} } formatı
          setProduct(data.data);
        } else if (data && !data.success && data.message) {
          // { success: false, message: '...' } formatı
          throw new Error(data.message);
        } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Doğrudan ürün objesi dönüşü
          setProduct(data);
        } else {
          throw new Error('Ürün bulunamadı veya beklenmeyen veri formatı');
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Ürün detay yükleme hatası:', err);
        setError(err.message || 'Ürün yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    } else {
      setError('Geçersiz ürün ID');
      setLoading(false);
    }
  }, [id]);

  // Quantity artırma/azaltma
  const incrementQuantity = () => {
    if (product && quantity < product.countInStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Favori durumunu değiştir
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Burada API'ye favori durumunu kaydedebilirsiniz
  };

  // Sepete ekle fonksiyonu
  const handleAddToCart = () => {
    if (product && product.countInStock > 0) {
      console.log('Ürün farmer verisi:', product.farmer);
      
      // Çiftçi bilgisini düzgün formatta hazırla
      let farmerData = undefined;
      if (product.farmer) {
        if (typeof product.farmer === 'string') {
          // Eğer farmer bir string ise (ID), düzgün bir obje oluştur
          farmerData = {
            _id: product.farmer,
            farmName: 'Çiftlik'
          };
        } else if (typeof product.farmer === 'object') {
          // Farmer bir obje ise, gerekli alanları al
          farmerData = {
            _id: product.farmer._id || product.farmer.id || 'unknown',
            farmName: product.farmer.farmName || product.farmer.farm_name || 'Çiftlik'
          };
        }
      }
      
      const result = addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        unit: product.unit || 'birim',
        countInStock: product.countInStock,
        image: product.image,
        farmer: farmerData
      });
      
      if (result) {
        // Sepete ekleme başarılı ise
        Alert.alert(
          "Başarılı",
          `${product.name} sepetinize eklendi.`,
          [
            { 
              text: "Alışverişe Devam Et", 
              style: "cancel" 
            },
            { 
              text: "Sepete Git", 
              onPress: () => router.navigate('/(tabs)/cart')
            }
          ]
        );
      }
      // Başarısız olma durumu CartContext içinde hallediliyor
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Ürün Detayı' }} />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Ürün bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Hata' }} />
        <Ionicons name="alert-circle-outline" size={60} color="#FF5252" />
        <Text style={styles.errorText}>{error || 'Ürün bulunamadı'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF5252" : "#FFF"} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => null,
        }} 
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Ürün Resmi */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image
              source={{ 
                uri: `http://${SERVER_IP}:5000/uploads/product-images/${product.image}` 
              }}
              style={styles.productImage}
              resizeMode="cover"
              onError={() => {
                console.log('Resim yüklenemedi:', product.image);
                // Hata durumunda görsel yerine placeholder gösterilecek
              }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={80} color="#E0E0E0" />
            </View>
          )}
          
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Öne Çıkan</Text>
            </View>
          )}
        </View>
        
        {/* Ürün Detayları */}
        <View style={styles.detailsContainer}>
          {/* Kategori */}
          {product.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>
                {typeof product.category === 'string' 
                  ? product.category 
                  : (product.category.category_name || product.category.name || 'Kategori')}
              </Text>
            </View>
          )}
          
          {/* Ürün Adı ve Fiyatı */}
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {typeof product.price === 'number' 
                ? product.price.toFixed(2) 
                : parseFloat(product.price).toFixed(2)} ₺
            </Text>
            <Text style={styles.unit}>/ {product.unit || 'birim'}</Text>
          </View>
          
          {/* Stok Durumu */}
          <View style={styles.stockContainer}>
            <View 
              style={[
                styles.stockBadge, 
                { backgroundColor: (product.countInStock > 0) ? '#E8F5E9' : '#FFEBEE' }
              ]}
            >
              <Ionicons 
                name={(product.countInStock > 0) ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={(product.countInStock > 0) ? '#4CAF50' : '#F44336'} 
              />
              <Text 
                style={[
                  styles.stockText, 
                  { color: (product.countInStock > 0) ? '#4CAF50' : '#F44336' }
                ]}
              >
                {(product.countInStock > 0) ? 'Stokta Var' : 'Tükendi'}
              </Text>
            </View>
            {(product.countInStock > 0) && (
              <Text style={styles.stockCount}>
                Stok: {product.countInStock} {product.unit || 'adet'}
              </Text>
            )}
          </View>
          
          {/* Miktar Seçici */}
          {product.countInStock > 0 && (
            <View style={styles.quantityContainer}>
              <Text style={styles.sectionTitle}>Miktar</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity 
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]} 
                  onPress={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={quantity <= 1 ? '#BDBDBD' : '#333'} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{quantity}</Text>
                
                <TouchableOpacity 
                  style={[
                    styles.quantityButton, 
                    quantity >= product.countInStock && styles.quantityButtonDisabled
                  ]} 
                  onPress={incrementQuantity}
                  disabled={quantity >= product.countInStock}
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={quantity >= product.countInStock ? '#BDBDBD' : '#333'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Ürün Açıklaması */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Ürün Açıklaması</Text>
            <Text style={styles.descriptionText}>
              {product.description || 'Bu ürün için açıklama bulunmamaktadır.'}
            </Text>
          </View>
          
          {/* Üretici Bilgileri */}
          {product.farmer && (
            <View style={styles.farmerContainer}>
              <Text style={styles.sectionTitle}>Üretici</Text>
              <View style={styles.farmerCard}>
                <View style={styles.farmerImagePlaceholder}>
                  <Ionicons name="person" size={24} color="#BDBDBD" />
                </View>
                <View style={styles.farmerInfo}>
                  <Text style={styles.farmerName}>
                    {typeof product.farmer === 'string' 
                      ? 'Çiftlik' 
                      : (product.farmer.farmName || 'Çiftlik Adı')}
                  </Text>
                  {product.farmer && typeof product.farmer !== 'string' && (product.farmer.city || product.farmer.district) && (
                    <Text style={styles.farmerLocation}>
                      <Ionicons name="location-outline" size={14} color="#757575" />
                      {' '}
                      {product.farmer.city || ''}
                      {product.farmer.city && product.farmer.district ? ', ' : ''}
                      {product.farmer.district || ''}
                    </Text>
                  )}
                  <TouchableOpacity 
                    style={styles.farmerLinkButton}
                    onPress={() => {
                      Alert.alert(
                        "Bilgi", 
                        "Üretici profil sayfası henüz mevcut değil.",
                        [{ text: "Tamam", style: "default" }]
                      );
                    }}
                  >
                    <Text style={styles.farmerLinkText}>Üretici Profilini Görüntüle</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Alt Buton Bölgesi */}
      {product.countInStock > 0 && (
        <View style={styles.bottomContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Toplam:</Text>
            <Text style={styles.totalPrice}>
              {(product.price * quantity).toFixed(2)} ₺
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>Sepete Ekle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#757575',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  unit: {
    fontSize: 16,
    color: '#757575',
    marginLeft: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  stockText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  stockCount: {
    fontSize: 14,
    color: '#757575',
  },
  quantityContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
    minWidth: 40,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#616161',
    lineHeight: 24,
  },
  farmerContainer: {
    marginBottom: 24,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  farmerImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  farmerLocation: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  farmerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 4,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 