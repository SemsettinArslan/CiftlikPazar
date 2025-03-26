const nodemailer = require('nodemailer');

/**
 * E-posta gönderme işlevi
 * @param {Object} options - E-posta seçenekleri
 * @param {string} options.email - Alıcı e-posta adresi
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.message - E-posta içeriği (HTML)
 * @param {string} options.html - E-posta içeriği alternatif (HTML)
 */
const sendEmail = async (options) => {
  // SMTP ayarları için transporter oluştur
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // HTML içeriği kontrol et (message veya html kullan)
  const htmlContent = options.html || options.message;

  if (!htmlContent) {
    console.warn('E-posta gönderilirken içerik bulunamadı:', options);
  }

  // E-posta seçenekleri
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: htmlContent,
  };

  try {
    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    console.log('E-posta gönderildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    // Hata fırlat ama uygulamanın çökmesini engelle
    return { error: error.message, status: 'failed' };
  }
};

module.exports = sendEmail; 