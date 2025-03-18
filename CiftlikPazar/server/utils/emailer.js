const nodemailer = require('nodemailer');

/**
 * E-posta gönderme fonksiyonu
 * @param {Object} options - E-posta seçenekleri
 * @param {string} options.email - Alıcı e-posta adresi
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.message - E-posta içeriği (HTML)
 */
const sendEmail = async (options) => {
  // SMTP ayarları için nodemailer transporter oluştur
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // E-posta içeriğini ayarla
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // E-postayı gönder
  const info = await transporter.sendMail(message);
  console.log(`E-posta gönderildi: ${info.messageId}`);
};

module.exports = sendEmail; 