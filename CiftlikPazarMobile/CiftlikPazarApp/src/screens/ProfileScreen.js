import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          onPress: () => logout()
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'orders',
      title: 'Siparişlerim',
      icon: 'cart-outline',
      onPress: () => alert('Siparişlerim sayfası yapım aşamasında')
    },
    {
      id: 'addresses',
      title: 'Adreslerim',
      icon: 'location-outline',
      onPress: () => alert('Adreslerim sayfası yapım aşamasında')
    },
    {
      id: 'payment',
      title: 'Ödeme Bilgilerim',
      icon: 'card-outline',
      onPress: () => alert('Ödeme bilgilerim sayfası yapım aşamasında')
    },
    {
      id: 'favorites',
      title: 'Favorilerim',
      icon: 'heart-outline',
      onPress: () => alert('Favorilerim sayfası yapım aşamasında')
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      icon: 'settings-outline',
      onPress: () => alert('Ayarlar sayfası yapım aşamasında')
    },
    {
      id: 'help',
      title: 'Yardım ve Destek',
      icon: 'help-circle-outline',
      onPress: () => alert('Yardım sayfası yapım aşamasında')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profil Başlık */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Kullanıcı'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'kullanici@ornek.com'}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menü Öğeleri */}
      <View style={styles.menuContainer}>
        {menuItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={24} color="#4CAF50" style={styles.menuIcon} />
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Çıkış Yap Butonu */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      {/* Uygulama Bilgisi */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Çiftlik Pazar v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 12,
    color: '#555',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen; 