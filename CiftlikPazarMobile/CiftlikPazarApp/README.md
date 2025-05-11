# Çiftlik Pazar Mobil Uygulaması

Bu proje, Çiftlik Pazar web sitesinin mobil versiyonudur. React Native ve Expo kullanılarak geliştirilmiştir.

## Özellikler

- Kullanıcı kimlik doğrulama (giriş, kayıt, çıkış)
- Ürün listeleme ve arama
- Kategori bazlı ürün filtreleme
- Kullanıcı profil yönetimi
- Sipariş oluşturma ve takip etme

## Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI

### Adımlar

1. Projeyi klonlayın:
```
git clone <repo-url>
cd CiftlikPazarMobile/CiftlikPazarApp
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. Uygulamayı başlatın:
```
npm start
```

4. Expo Go uygulamasını kullanarak QR kodu tarayın veya bir emülatör kullanın.

## Proje Yapısı

```
src/
  ├── assets/         # Görseller, fontlar ve diğer statik dosyalar
  ├── components/     # Yeniden kullanılabilir bileşenler
  ├── context/        # Context API dosyaları
  ├── navigation/     # Navigasyon yapılandırması
  ├── screens/        # Uygulama ekranları
  ├── services/       # API servisleri
  └── utils/          # Yardımcı fonksiyonlar
```

## Backend Bağlantısı

Uygulama, Node.js, Express ve MongoDB kullanılarak geliştirilmiş bir backend API'sine bağlanır. API URL'sini `src/context/AuthContext.js` ve `src/services/api.js` dosyalarında yapılandırabilirsiniz.

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Özellik dalınızı oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Dalınıza push edin (`git push origin feature/amazing-feature`)
5. Bir Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 