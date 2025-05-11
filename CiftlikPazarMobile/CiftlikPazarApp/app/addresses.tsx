import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../src/utils/networkUtils';

// Sabit API URL yerine dinamik API URL
const API_URL = getApiBaseUrl();

// Adres tipi
interface DeliveryAddress {
  _id: string;
  title: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  
  // State tanımlamaları
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Token'ı AsyncStorage'dan al veya user nesnesinden al
  const getToken = async () => {
    try {
      // Önce user nesnesinden token'ı almayı dene
      if (user && user.token) {
        return user.token;
      }
      
      // Yoksa AsyncStorage'dan almayı dene
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  };
  
  // Adresleri yükle
  const loadAddresses = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = await getToken();
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        setIsLoading(false);
        return;
      }
      
      // Adresleri, kullanıcı bilgilerini çekerek getir
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.data) {
        // Kullanıcının adres bilgilerini al
        const userAddresses = response.data.data.deliveryAddresses || [];
        setAddresses(userAddresses);
      } else {
        setError('Adres bilgileri alınamadı.');
      }
    } catch (err: any) {
      console.error('Adres yükleme hatası:', err);
      setError(err.response?.data?.message || 'Adresler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Sayfa odaklandığında adresleri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      console.log('Adresler sayfası odaklandı, adresler yenileniyor...');
      loadAddresses();
      return () => {
        // Temizleme işlemleri (gerekirse)
      };
    }, []) // Boş dependency array, sadece sayfa odaklandığında çalışır
  );
  
  // Sayfa yüklendiğinde de adresleri getir - bu kodu tutuyoruz çünkü ilk yüklemede de çalışması gerekiyor
  useEffect(() => {
    loadAddresses();
  }, []);
  
  // Adresleri yenile
  const onRefresh = () => {
    setIsRefreshing(true);
    loadAddresses();
  };
  
  // Adresi sil
  const handleDeleteAddress = async (addressId: string, isDefault: boolean) => {
    // Varsayılan adres ise uyarı ver
    if (isDefault) {
      Alert.alert(
        "Varsayılan Adres",
        "Varsayılan adres silinemez. Önce başka bir adresi varsayılan olarak ayarlayın.",
        [{ text: "Tamam", style: "default" }]
      );
      return;
    }

    Alert.alert(
      "Adresi Sil",
      "Bu adresi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              
              if (!token) {
                setError('Oturum bilgisi bulunamadı.');
                return;
              }
              
              const response = await axios.delete(
                `${API_URL}/auth/address/${addressId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              
              if (response.data.success) {
                // Adres listesini güncelle
                setAddresses(prevAddresses => 
                  prevAddresses.filter(a => a._id !== addressId)
                );
                
                // Kullanıcı state'ini de güncelle
                if (user && user.data) {
                  const updatedUser = {
                    ...user,
                    data: {
                      ...user.data,
                      deliveryAddresses: user.data.deliveryAddresses.filter(
                        (a: DeliveryAddress) => a._id !== addressId
                      )
                    }
                  };
                  setUser(updatedUser);
                }
                
                setSuccess('Adres başarıyla silindi');
                
                // Başarı mesajını 3 saniye sonra temizle
                setTimeout(() => {
                  setSuccess('');
                }, 3000);
              } else {
                setError('Adres silinirken bir hata oluştu');
              }
            } catch (err: any) {
              console.error('Adres silme hatası:', err);
              
              // Varsayılan adres silinmeye çalışılıyorsa
              if (err.response?.status === 400 && 
                  err.response?.data?.message?.includes('Varsayılan adres')) {
                setError('Varsayılan adres silinemez. Önce başka bir adresi varsayılan yapın.');
              } else {
                setError(err.response?.data?.message || 'Adres silinirken bir hata oluştu');
              }
            }
          }
        }
      ]
    );
  };
  
  // Adresi varsayılan yap
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const token = await getToken();
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı.');
        return;
      }
      
      const response = await axios.put(
        `${API_URL}/auth/address/${addressId}`,
        { isDefault: true },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Adres listesini güncelle - tüm adreslerin varsayılan değerini false yap
        // ve seçilen adresi true yap
        setAddresses(prevAddresses => 
          prevAddresses.map(a => ({
            ...a,
            isDefault: a._id === addressId
          }))
        );
        
        // Kullanıcı state'ini de güncelle
        if (user && user.data) {
          const updatedUser = {
            ...user,
            data: {
              ...user.data,
              deliveryAddresses: user.data.deliveryAddresses.map(
                (a: DeliveryAddress) => ({
                  ...a,
                  isDefault: a._id === addressId
                })
              )
            }
          };
          setUser(updatedUser);
        }
        
        setSuccess('Varsayılan adres başarıyla güncellendi');
        
        // Başarı mesajını 3 saniye sonra temizle
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Adres güncellenirken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Adres güncelleme hatası:', err);
      setError(err.response?.data?.message || 'Adres güncellenirken bir hata oluştu');
    }
  };
  
  // Adres düzenleme sayfasına git
  const handleEditAddress = (address: DeliveryAddress) => {
    router.push({
      pathname: "/edit-address",
      params: { 
        addressId: address._id,
        title: address.title,
        address: address.address,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode || '',
        isDefault: address.isDefault.toString()
      }
    });
  };
  
  // Adres ekleme sayfasına git
  const handleAddAddress = () => {
    router.push("/add-address");
  };
  
  // Adres kartı
  const renderAddressItem = ({ item }: { item: DeliveryAddress }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.addressTitle}>{item.title}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Varsayılan</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditAddress(item)}
          >
            <Ionicons name="create-outline" size={18} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, item.isDefault && styles.disabledButton]}
            onPress={() => handleDeleteAddress(item._id, item.isDefault)}
          >
            <Ionicons name="trash-outline" size={18} color={item.isDefault ? "#ccc" : "#F44336"} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.addressContent}>
        <Text style={styles.addressText}>{item.address}</Text>
        <Text style={styles.addressText}>{item.district}, {item.city}</Text>
        {item.postalCode && <Text style={styles.addressText}>Posta Kodu: {item.postalCode}</Text>}
      </View>
      
      {!item.isDefault && (
        <TouchableOpacity
          style={styles.defaultButton}
          onPress={() => handleSetDefaultAddress(item._id)}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" style={styles.defaultIcon} />
          <Text style={styles.defaultButtonText}>Varsayılan Yap</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Yükleniyor göstergesi
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Adresler yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Adreslerim',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#4CAF50',
          }
        }}
      />
      
      {/* Hata ve başarı mesajları */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {success ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}
      
      {/* Adres listesi */}
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Henüz adres eklemediniz</Text>
            <Text style={styles.emptySubText}>Adres eklemek için aşağıdaki butona tıklayınız</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      />
      
      {/* Yeni adres ekleme butonu */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAddress}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Yeni Adres Ekle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Alt butonun üzerine gelmemesi için
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 6,
    marginRight: 8,
  },
  deleteButton: {
    padding: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addressContent: {
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 8,
  },
  defaultIcon: {
    marginRight: 6,
  },
  defaultButtonText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 