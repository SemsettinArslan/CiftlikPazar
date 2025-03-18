import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

// ProfileMenuItem için prop tipleri
interface ProfileMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  showBadge?: boolean;
  isLogout?: boolean;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        { 
          text: "Çıkış Yap", 
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };

  // Profil menü öğesi
  const ProfileMenuItem = ({ icon, title, onPress, showBadge = false, isLogout = false }: ProfileMenuItemProps) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLogout && styles.logoutMenuItem]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, isLogout && styles.logoutIcon]}>
        <Ionicons name={icon} size={22} color={isLogout ? "#F44336" : "#4CAF50"} />
      </View>
      <Text style={[styles.menuTitle, isLogout && styles.logoutText]}>{title}</Text>
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={isLogout ? "#F44336" : "#ccc"} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profil Başlık */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'kullanici@ornek.com'}</Text>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Profili Düzenle</Text>
        </TouchableOpacity>
      </View>

      {/* Profil Bilgileri */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="bag-check-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoLabel}>Toplam Sipariş</Text>
          <Text style={styles.infoValue}>8</Text>
        </View>
        
        <View style={styles.infoItemDivider} />
        
        <View style={styles.infoItem}>
          <Ionicons name="heart-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoLabel}>Favoriler</Text>
          <Text style={styles.infoValue}>12</Text>
        </View>
        
        <View style={styles.infoItemDivider} />
        
        <View style={styles.infoItem}>
          <Ionicons name="star-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoLabel}>Değerlendirmeler</Text>
          <Text style={styles.infoValue}>6</Text>
        </View>
      </View>

      {/* Sipariş Menüsü */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Siparişlerim</Text>
        
        <ProfileMenuItem 
          icon="bag-check-outline" 
          title="Aktif Siparişler" 
          onPress={() => {}} 
          showBadge 
        />
        
        <ProfileMenuItem 
          icon="time-outline" 
          title="Sipariş Geçmişi" 
          onPress={() => {}} 
        />
      </View>

      {/* Hesap Menüsü */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Hesabım</Text>
        
        <ProfileMenuItem 
          icon="person-outline" 
          title="Kişisel Bilgiler" 
          onPress={() => {}} 
        />
        
        <ProfileMenuItem 
          icon="home-outline" 
          title="Adreslerim" 
          onPress={() => {}} 
        />
        
        <ProfileMenuItem 
          icon="card-outline" 
          title="Ödeme Yöntemlerim" 
          onPress={() => {}} 
        />
      </View>

      {/* Diğer Menü */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Diğer</Text>
        
        <ProfileMenuItem 
          icon="heart-outline" 
          title="Favorilerim" 
          onPress={() => {}} 
        />
        
        <ProfileMenuItem 
          icon="notifications-outline" 
          title="Bildirim Ayarları" 
          onPress={() => {}} 
        />
        
        <ProfileMenuItem 
          icon="chatbubble-outline" 
          title="Yardım ve Destek" 
          onPress={() => {}} 
        />
        
        <ProfileMenuItem 
          icon="document-text-outline" 
          title="Kullanım Koşulları" 
          onPress={() => {}} 
        />
      </View>

      {/* Çıkış Butonu */}
      <View style={styles.sectionContainer}>
        <ProfileMenuItem 
          icon="log-out-outline" 
          title="Çıkış Yap" 
          onPress={handleLogout} 
          isLogout 
        />
      </View>

      {/* Uygulama Bilgisi */}
      <View style={styles.appInfoContainer}>
        <Text style={styles.appVersion}>Çiftlik Pazar v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoItemDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    backgroundColor: '#FFEBEE',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  logoutText: {
    color: '#F44336',
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
  },
}); 