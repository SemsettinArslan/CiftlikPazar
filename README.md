# ÇİFTLİK PAZAR

<div align="center">
  <h2>🌱 Çiftçiden Direkt Tüketiciye 🥕</h2>
</div>

> **Türkçe açıklamalar için aşağı kaydırın. / Scroll down for English explanation.**

---

## 🇹🇷 TÜRKÇE

### 📝 Proje Hakkında

Çiftlik Pazar, çiftçilerin ürünlerini aracısız olarak doğrudan tüketicilere satabilecekleri bir dijital platform projesidir. Hem web hem de mobil uygulama üzerinden erişilebilir, kullanıcı dostu bir alışveriş deneyimi sunar.

### 🛠️ Teknoloji Yığını

#### Web Uygulaması:
- **Frontend:** React.js, Bootstrap, React-Icons
- **Backend:** Node.js, Express.js, MongoDB
- **Kimlik Doğrulama:** JWT (JSON Web Token)
- **Email Servisi:** Nodemailer

#### Mobil Uygulama:
- **Framework:** React Native, Expo
- **Navigasyon:** Expo Router
- **Veri Yönetimi:** Context API
- **UI Bileşenleri:** Native Base, React Native Paper
- **Form Kontrolleri:** Formik, Yup

### 🚀 Kurulum

#### Ön Gereksinimler:
- Node.js (v14 veya üzeri)
- npm/yarn
- MongoDB
- Expo CLI (mobil geliştirme için)

#### Web Uygulaması Kurulumu:

1. Depoyu klonlayın:
```bash
git clone https://github.com/kullaniciadi/CiftlikPazar.git
cd CiftlikPazar
```

2. Web Frontend kurulumu:
```bash
cd CiftlikPazar/client
npm install
```

3. Web Backend kurulumu:
```bash
cd ../server
npm install
```

4. `.env` dosyasını oluşturun:
```
# Server yapılandırması
PORT=5000
NODE_ENV=development

# MongoDB bağlantısı
MONGO_URI

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=30d

# Email ayarları
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
FROM_NAME=
FROM_EMAIL=
```

5. Web uygulamasını başlatın:
```bash
# Backend
cd server
npm run dev

# Frontend (ayrı bir terminal penceresinde)
cd client
npm start
```

#### Mobil Uygulama Kurulumu:

1. Mobil uygulama bağımlılıklarını yükleyin:
```bash
cd CiftlikPazarMobile/CiftlikPazarApp
npm install
```

2. Expo uygulamasını başlatın:
```bash
npx expo start
```

### 📱 Uygulama Özellikleri

- **Kullanıcı Yönetimi:** Kayıt, giriş, şifre sıfırlama
- **Profil Yönetimi:** Kullanıcı bilgilerini düzenleme
- **Ürün Listeleme:** Kategorilere göre ürünleri görüntüleme
- **Satıcı Paneli:** Ürün ekleme, düzenleme ve takip etme
- **Alışveriş Sepeti:** Ürün ekleme, miktar değiştirme
- **Sipariş Yönetimi:** Sipariş takibi ve geçmişi
- **Değerlendirme Sistemi:** Ürün ve satıcı değerlendirmeleri
- **İl/İlçe Filtreleme:** Bölgeye göre ürün araması

## 🇬🇧 ENGLISH

### 📝 About The Project

Çiftlik Pazar (Farm Market) is a digital platform project that allows farmers to sell their products directly to consumers without intermediaries. It offers a user-friendly shopping experience accessible through both web and mobile applications.

### 🛠️ Technology Stack

#### Web Application:
- **Frontend:** React.js, Bootstrap, React-Icons
- **Backend:** Node.js, Express.js, MongoDB
- **Authentication:** JWT (JSON Web Token)
- **Email Service:** Nodemailer

#### Mobile Application:
- **Framework:** React Native, Expo
- **Navigation:** Expo Router
- **State Management:** Context API
- **UI Components:** Native Base, React Native Paper
- **Form Controls:** Formik, Yup

### 🚀 Installation

#### Prerequisites:
- Node.js (v14 or higher)
- npm/yarn
- MongoDB
- Expo CLI (for mobile development)

#### Web Application Setup:

1. Clone the repository:
```bash
git clone https://github.com/username/CiftlikPazar.git
cd CiftlikPazar
```

2. Install Web Frontend dependencies:
```bash
cd CiftlikPazar/client
npm install
```

3. Install Web Backend dependencies:
```bash
cd ../server
npm install
```

4. Create `.env` file:
```
# Server configuration
PORT=5000
NODE_ENV=development

# MongoDB connection
MONGO_URI

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=30d

# Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
FROM_NAME=
FROM_EMAIL=
```

5. Start the web application:
```bash
# Backend
cd server
npm run dev

# Frontend (in a separate terminal window)
cd client
npm start
```

#### Mobile Application Setup:

1. Install Mobile App dependencies:
```bash
cd CiftlikPazarMobile/CiftlikPazarApp
npm install
```

2. Start Expo application:
```bash
npx expo start
```

### 📱 Application Features

- **User Management:** Registration, login, password reset
- **Profile Management:** Edit user information
- **Product Listing:** View products by categories
- **Seller Dashboard:** Add, edit, and track products
- **Shopping Cart:** Add products, change quantities
- **Order Management:** Track orders and history
- **Rating System:** Product and seller reviews
- **Province/District Filtering:** Search products by region 
