const nodemailer = require('nodemailer');

/**
 * E-posta gönderme işlevi
 * @param {Object} options - E-posta seçenekleri
 * @param {string} options.email - Alıcı e-posta adresi
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.html - E-posta içeriği (HTML)
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

  // E-posta seçenekleri
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // E-postayı gönder
  const info = await transporter.sendMail(mailOptions);
  console.log('E-posta gönderildi:', info.messageId);
};

module.exports = sendEmail; 