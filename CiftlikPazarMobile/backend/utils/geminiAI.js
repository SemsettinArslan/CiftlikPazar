const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getApiBaseUrl } = require('./networkUtils');

// Çevre değişkenlerini yükle
dotenv.config();

// API anahtarını al
const apiKey = process.env.GEMINI_API_KEY;

// Model ID - Gemini 2.0 Flash modeline güncellendi
const MODEL_ID = 'gemini-2.0-flash';

// Google Generative AI istemcisini oluştur
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * URL'den görüntüyü alıp base64 formatına dönüştürür
 * @param {String} url - Görüntü URL'si
 * @returns {Promise<Object>} - Base64 formatında görüntü verisi
 */
async function fetchImageAsBase64(url) {
  try {
    // Görüntü verilerini al
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // Görüntünün MIME türünü belirle
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Base64'e dönüştür
    const base64Data = Buffer.from(response.data).toString('base64');

    // Gemini API için uygun formatta döndür - Gemini 2.0 Flash için doğru format
    return {
      inlineData: {
        mimeType: contentType,
        data: base64Data
      }
    };
  } catch (error) {
    console.error('Görüntü alınırken hata oluştu:', error);
    throw new Error(`Görüntü alınamadı: ${error.message}`);
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
    console.log("Ürün doğrulama başlatılıyor:", {
      productName,
      categoryName,
      imageUrlLength: imageUrl ? imageUrl.length : 0
    });

    // API anahtarı kontrolü
    if (!apiKey) {
      console.log("API anahtarı bulunamadı");
      return {
        isValid: false,
        confidence: 0,
        reason: "API anahtarı yapılandırılmamış",
        autoApproved: false
      };
    }

    // Görüntü URL kontrolü
    if (!imageUrl) {
      console.log("Görüntü URL'si bulunamadı");
      return {
        isValid: false,
        confidence: 0,
        reason: "Görüntü URL'si sağlanmadı",
        autoApproved: false
      };
    }

    // Gemini modelini seç
    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    // Görüntüyü ve metni birleştiren multimodal içerik
    let imageData;

    try {
      // Görüntü verisi base64 formatında mı kontrol et
      if (imageUrl.startsWith('data:image')) {
        console.log("Base64 formatında görüntü işleniyor");
        // Zaten base64 formatında, doğrudan kullan
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.match(/data:(.*?);/)[1];
        
        imageData = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        };
      } 
      // HTTP URL mi kontrol et
      else if (imageUrl.startsWith('http')) {
        console.log("HTTP URL'den görüntü alınıyor:", imageUrl.substring(0, 50) + "...");
        // URL'den görüntüyü al ve base64'e dönüştür
        imageData = await fetchImageAsBase64(imageUrl);
      } 
      else {
        // Sadece dosya adı girilmiş olabilir (örn: "domates.jpg")
        // Ana dizindeki uploads klasöründen alacağız
        try {
          // networkUtils'den API URL'ini al
          const apiUrl = getApiBaseUrl();
          const serverUrl = apiUrl.replace('/api', '');
          const productImagesPath = '/uploads/product-images/';
          const fullUrl = `${serverUrl}${productImagesPath}${imageUrl}`;
          
          console.log("Görüntü URL'si dönüştürüldü:", fullUrl);
          
          imageData = await fetchImageAsBase64(fullUrl);
        } catch (fetchError) {
          console.error("Görüntü alınırken hata:", fetchError);
          return {
            isValid: false,
            confidence: 0, 
            reason: "Görüntü dosyası bulunamadı veya erişilemedi: " + fetchError.message,
            autoApproved: false
          };
        }
      }

      if (!imageData || !imageData.inlineData) {
        console.error("Görüntü verisi oluşturulamadı");
        return {
          isValid: false,
          confidence: 0,
          reason: "Görüntü verisi işlenemedi",
          autoApproved: false
        };
      }
    } catch (imageProcessError) {
      console.error("Görüntü işleme hatası:", imageProcessError);
      return {
        isValid: false,
        confidence: 0,
        reason: "Görüntü işlenirken hata oluştu: " + imageProcessError.message,
        autoApproved: false
      };
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

    // Gemini 2.0 Flash için doğru içerik formatını hazırla
    const parts = [
      { text: prompt },
      imageData
    ];

    console.log("Gemini API'ye istek gönderiliyor...");

    try {
      // AI modelini çağır
      const result = await model.generateContent({
        contents: [{ role: "user", parts }]
      });
      
      const response = result.response;
      const text = response.text();
      
      console.log("Gemini API yanıtı alındı:", text.substring(0, 100) + "...");
      
      try {
        // Response içeriğinden JSON kısmını çıkarıp parse et
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
          
          console.log("Doğrulama sonucu:", jsonResponse);
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
    } catch (apiError) {
      console.error("Gemini API çağrısı hatası:", apiError);
      
      return {
        isValid: false,
        confidence: 0, 
        reason: "API çağrısı sırasında hata oluştu: " + apiError.message,
        autoApproved: false
      };
    }
  } catch (error) {
    console.error("Gemini API genel hatası:", error);
    
    return {
      isValid: false,
      confidence: 0, 
      reason: "API hatası: " + error.message,
      autoApproved: false
    };
  }
}

module.exports = { verifyProduct }; 