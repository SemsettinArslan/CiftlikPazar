import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FarmerRegisterCompleteScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
        </View>
        
        <Text style={styles.title}>Başvurunuz Alındı!</Text>
        
        <Text style={styles.message}>
          Çiftlik kaydınız başarıyla tamamlandı. Başvurunuz şu anda inceleme aşamasındadır.
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Onay Süreci</Text>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={24} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Başvurunuz genellikle 1-3 iş günü içinde incelenir.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Başvurunuzun sonucu e-posta yoluyla bildirilecektir.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={24} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Onay süreciyle ilgili herhangi bir sorunuz varsa, 0212 123 4567 numarasından bize ulaşabilirsiniz.
            </Text>
          </View>
        </View>
        
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>Sonraki Adımlar</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Başvurunuz onaylandıktan sonra aynı e-posta ve şifrenizle giriş yapabileceksiniz.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Hesabınıza giriş yaptıktan sonra çiftlik profilinizi düzenleyebilir ve ürünlerinizi ekleyebilirsiniz.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Ürünleriniz onaylandıktan sonra müşterilerimiz tarafından görüntülenebilecek ve satın alınabilecektir.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.buttonText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FarmerRegisterCompleteScreen; 