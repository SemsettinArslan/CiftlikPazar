const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const axios = require('axios');

// .env'den GEMINI_API_KEY değişkenini kullanın. Bu değişkeni .env dosyasına eklemeniz gerekecek.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Hata: Gemini API anahtarı .env dosyasında tanımlanmamış (GEMINI_API_KEY)');
}

// Gemini API yapılandırması
const genAI = new GoogleGenerativeAI(apiKey);

// Model kimliği - varsayılan olarak Gemini Pro Vision kullanıyoruz çünkü görsel analizi destekliyor
const MODEL_ID = 'gemini-2.0-flash';

/**
 * Uzak URL'den bir görüntüyü alıp base64 formatına dönüştürür
 * @param {String} url - Görüntünün URL'si
 * @returns {Promise<Object>} - Görüntü verisi objesi
 */
async function fetchImageAsBase64(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    const buffer = Buffer.from(response.data, 'binary');
    const base64Data = buffer.toString('base64');

    return {
      inlineData: {
        data: base64Data,
        mimeType: contentType || 'image/jpeg',
      },
    };
  } catch (error) {
    console.error("Görüntü indirme hatası:", error.message);
    throw new Error(`Görüntü indirilirken hata oluştu: ${error.message}`);
  }
}

/**
 * Ürün doğrulama fonksiyonu
 * Gemini API'yi kullanarak ürün görselini, adını ve açıklamasını analiz eder
 * 
 * @param {String} productName - Ürün adı
 * @param {String} description - Ürün açıklaması
 * @param {String} categoryName - Kategori adı
 * @param {String} imageUrl - Ürün görseli URL'si (base64 veya tam URL)
 * @returns {Object} - Onay durumu ve açıklama içeren bir nesne
 */
async function verifyProduct(productName, description, categoryName, imageUrl) {
  try {
    // API isteği başarısız olursa otomatik onaylamasın
    if (!apiKey) {
      return {
        isValid: false,
        confidence: 0,
        reason: "API anahtarı yapılandırılmamış",
        autoApproved: false
      };
    }

    // Gemini modelini seç
    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    // Görüntüyü ve metni birleştiren multimodal içerik
    let imageData;

    // Görüntü base64 ise doğrudan kullan, aksi takdirde URL'den oku
    if (imageUrl.startsWith('data:image')) {
      // Base64 görüntüsü zaten mevcut, formatı düzenle
      imageData = {
        inlineData: {
          data: imageUrl.split(',')[1], // base64 kısmını al
          mimeType: imageUrl.split(';')[0].split(':')[1], // MIME türünü al
        },
      };
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Uzak URL'den görüntüyü indir ve base64'e dönüştür
      try {
        imageData = await fetchImageAsBase64(imageUrl);
      } catch (fetchError) {
        return {
          isValid: false,
          confidence: 0, 
          reason: "Görüntü URL'sinden veri alınamadı: " + fetchError.message,
          autoApproved: false
        };
      }
    } else if (imageUrl.startsWith('/uploads/')) {
      // Sunucudaki bir görüntü yolu - tam URL'yi oluştur ve indir
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
      const fullUrl = `${serverUrl}${imageUrl}`;
      
      try {
        imageData = await fetchImageAsBase64(fullUrl);
      } catch (fetchError) {
        return {
          isValid: false,
          confidence: 0, 
          reason: "Sunucu görüntüsünden veri alınamadı: " + fetchError.message,
          autoApproved: false
        };
      }
    } else if (imageUrl.startsWith('product-images/')) {
      // Düzeltilmiş dosya yolu - başına /uploads/ ekleyerek tam URL'yi oluştur
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
      const fullUrl = `${serverUrl}/uploads/${imageUrl}`;
      
      console.log("Görüntü URL'si dönüştürüldü:", fullUrl);
      
      try {
        imageData = await fetchImageAsBase64(fullUrl);
      } catch (fetchError) {
        return {
          isValid: false,
          confidence: 0, 
          reason: "Görüntü dosyasından veri alınamadı: " + fetchError.message,
          autoApproved: false
        };
      }
    } else {
      // Sadece dosya adı girilmiş olabilir (örn: "domates.jpg")
      // Bu durumda uploads/product-images/ klasöründe olduğunu varsayalım
      try {
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
        const productImagesPath = '/uploads/product-images/';
        const fullUrl = `${serverUrl}${productImagesPath}${imageUrl}`;
        
        console.log("Görüntü URL'si dönüştürüldü:", fullUrl);
        
        imageData = await fetchImageAsBase64(fullUrl);
      } catch (fetchError) {
        return {
          isValid: false,
          confidence: 0, 
          reason: "Görüntü dosyası bulunamadı veya erişilemedi: " + fetchError.message,
          autoApproved: false
        };
      }
    }

    // AI'ya göndereceğimiz istek
    const prompt = `Lütfen bu ürün görseline bak ve aşağıdaki kontrolleri yap:
    
    Ürün Adı: "${productName}"
    Ürün Açıklaması: "${description}"
    Kategori: "${categoryName}"
    
    Görseldeki ürün için şunları kontrol et:
    1. Görsel gerçekten tarımsal bir ürünü/yiyeceği gösteriyor mu?
    2. Görseldeki ürün, belirtilen ürün adı ile uyumlu mu? (ÖNEMLİ: Ürün adı anlamsız veya görselle uyumsuz ise, isValid=false olmalı)
    3. Görseldeki ürün, belirtilen açıklama ile uyumlu mu?
    4. Ürün belirtilen kategoriye uygun mu?
    5. Görsel kalitesi ve netliği yeterli mi?
    6. Görsel yasak veya uygunsuz bir içerik içeriyor mu?
    
    DEĞERLENDİRME KRİTERLERİ:
    - Eğer ürün adı anlamsız (örn: "asdsad", "test", "xyz" gibi), gerçek ürün adıyla uyumsuz veya görseldeki ürünü doğru tanımlamıyorsa, isValid=false olmalı.
    - Tüm kriterlerden geçen ürünler için isValid=true olabilir.
    - Görseldeki ürün tarımsal değilse, isValid=false olmalı.
    
    Sonuçları şu JSON formatında ver:
    {
      "isValid": Boolean, // Ürün görseli ve TÜM bilgileri (özellikle ürün adı) doğru eşleşiyor mu
      "confidence": Number, // 0-1 arasında güven skoru 
      "reason": String, // Kısa bir açıklama, özellikle uyumsuzluk varsa detay ver
      "autoApproved": Boolean // Ürün otomatik olarak onaylanabilir mi (isValid=true ve güven skoru 0.85+ ise)
    }`;

    // AI modelini çağır
    const result = await model.generateContent([prompt, imageData]);
    const response = result.response;
    
    try {
      // Response içeriğinden JSON kısmını çıkarıp parse et
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        
        // Otomatik onaylama mantığını düzelt
        // Güven skorunun yüksek olması yanında isValid true olmalı
        if (jsonResponse.isValid === true && jsonResponse.confidence >= 0.85) {
          jsonResponse.autoApproved = true;
        } else {
          jsonResponse.autoApproved = false;
        }
        
        return jsonResponse;
      }
      
      throw new Error("Geçerli JSON yanıtı alınamadı");
    } catch (parseError) {
      console.error("JSON ayrıştırma hatası:", parseError);
      
      // Analiz sonuçlarını işlemede hata oluştuğu durumlarda varsayılan yanıt
      return {
        isValid: false,
        confidence: 0,
        reason: "Sonuç analizi sırasında hata oluştu: " + parseError.message,
        autoApproved: false
      };
    }
  } catch (error) {
    console.error("Gemini API hatası:", error);
    
    return {
      isValid: false,
      confidence: 0, 
      reason: "API hatası: " + error.message,
      autoApproved: false
    };
  }
}

module.exports = {
  verifyProduct
}; 