import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PRODUCTS } from './(tabs)/products';

const { width } = Dimensions.get('window');

// Örnek yorumlar
const SAMPLE_COMMENTS = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Ahmet Y.',
    rating: 5,
    comment: 'Çok taze ve lezzetli, kesinlikle tavsiye ederim!',
    date: '10.05.2023',
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Ayşe K.',
    rating: 4,
    comment: 'Kaliteli ürün ama kargo biraz gecikti.',
    date: '15.05.2023',
  },
];

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const productId = params.id as string;

  // Ürün bulma
  const product = PRODUCTS.find(p => p.id === productId);
  
  // States
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState(SAMPLE_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(product?.isFavorite || false);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Ürün bulunamadı</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    Alert.alert('Bilgi', `${quantity} adet ${product.name} sepete eklendi`);
    // Sepete ekle işlemi
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Favorilere ekleme/çıkarma işlemi
  };

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const submitComment = () => {
    if (newComment.trim() === '') {
      Alert.alert('Hata', 'Lütfen bir yorum yazınız.');
      return;
    }

    const newCommentObj = {
      id: Date.now().toString(),
      userId: 'currentUser', // Gerçek uygulamada kullanıcı ID'si kullanılacak
      userName: 'Siz', // Gerçek uygulamada kullanıcı adı kullanılacak
      rating: newRating,
      comment: newComment,
      date: new Date().toLocaleDateString('tr-TR'),
    };

    setComments([newCommentObj, ...comments]);
    setNewComment('');
    setNewRating(5);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ürün Detayı',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Ürün Görseli */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#F44336' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Ürün Bilgileri */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name="star" 
                size={16} 
                color={star <= product.rating ? "#FFD700" : "#e0e0e0"} 
                style={{ marginRight: 2 }}
              />
            ))}
            <Text style={styles.ratingText}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({comments.length} değerlendirme)</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{product.price} ₺</Text>
            <Text style={styles.unitText}>/ {product.unit}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Ürün Hakkında</Text>
          <Text style={styles.description}>
            Bu ürün tamamen doğal yöntemlerle üretilmiştir. Çiftlikten doğrudan size ulaştırılmaktadır. 
            Herhangi bir katkı maddesi içermez. Taze ve lezzetlidir.
          </Text>
          
          <View style={styles.divider} />
          
          {/* Adet Seçimi */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Adet</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                <Ionicons name="remove" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Sepete Ekle</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Yorumlar ve Değerlendirmeler */}
          <Text style={styles.sectionTitle}>Yorumlar ve Değerlendirmeler</Text>
          
          {/* Yeni Yorum Ekleme */}
          <View style={styles.newCommentContainer}>
            <Text style={styles.ratingLabel}>Puanınız:</Text>
            <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                  <Ionicons 
                    name="star" 
                    size={24} 
                    color={star <= newRating ? "#FFD700" : "#e0e0e0"} 
                    style={{ marginRight: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Yorumunuzu yazın..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            
            <TouchableOpacity style={styles.submitButton} onPress={submitComment}>
              <Text style={styles.submitButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
          
          {/* Mevcut Yorumlar */}
          <View style={styles.commentsContainer}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitial}>{comment.userName.charAt(0)}</Text>
                    </View>
                    <Text style={styles.userName}>{comment.userName}</Text>
                  </View>
                  <Text style={styles.commentDate}>{comment.date}</Text>
                </View>
                
                <View style={styles.commentRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name="star" 
                      size={14} 
                      color={star <= comment.rating ? "#FFD700" : "#e0e0e0"} 
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                
                <Text style={styles.commentText}>{comment.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 250,
    width: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  unitText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newCommentContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  starRatingContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsContainer: {
    marginTop: 4,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentRating: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
}); 