import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const ContactPage = () => {
  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="text-center">
            <h1 className="display-5 fw-bold text-success mb-3">İletişim</h1>
            <p className="lead mx-auto" style={{ maxWidth: '700px' }}>
              Çiftlik Pazar ekibi olarak sorularınıza cevap vermekten ve önerilerinizi dinlemekten mutluluk duyarız. 
              Aşağıdaki iletişim bilgilerimizden bize ulaşabilirsiniz.
            </p>
          </div>
        </Col>
      </Row>
      
      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm hover-card">
            <style jsx="true">{`
              .hover-card {
                transition: all 0.3s ease;
              }
              .hover-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
              }
              .icon-container {
                width: 80px;
                height: 80px;
                background-color: #e8f5e9;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
              }
              .contact-icon {
                font-size: 32px;
                color: #2e7d32;
              }
            `}</style>
            <Card.Body className="text-center p-4">
              <div className="icon-container">
                <FaEnvelope className="contact-icon" />
              </div>
              <h4 className="mb-3">E-posta</h4>
              <p className="text-muted mb-2">Genel Sorular:</p>
              <p className="fw-bold">info@ciftlikpazar.com</p>
              <p className="text-muted mb-2">Üretici Destek:</p>
              <p className="fw-bold">destek@ciftlikpazar.com</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm hover-card">
            <Card.Body className="text-center p-4">
              <div className="icon-container">
                <FaPhone className="contact-icon" />
              </div>
              <h4 className="mb-3">Telefon</h4>
              <p className="text-muted mb-2">Müşteri Hizmetleri:</p>
              <p className="fw-bold">+90 212 123 45 67</p>
              <p className="text-muted mb-2">Teknik Destek:</p>
              <p className="fw-bold">+90 212 123 45 68</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm hover-card">
            <Card.Body className="text-center p-4">
              <div className="icon-container">
                <FaMapMarkerAlt className="contact-icon" />
              </div>
              <h4 className="mb-3">Adres</h4>
              <p className="text-muted mb-2">Ofis:</p>
              <p className="fw-bold">Tarım Caddesi No:123, 34000</p>
              <p className="fw-bold">Kadıköy / İstanbul</p>
              <p className="text-muted mb-0"><FaClock className="me-2" />Pazartesi-Cuma: 09:00 - 18:00</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">Sıkça Sorulan Sorular</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h5 className="mb-3">Nasıl üye olabilirim?</h5>
                    <p className="text-muted">
                      Ana sayfadaki "Üye Ol" butonuna tıklayarak kolayca üyelik oluşturabilirsiniz. 
                      Üyelik aktivasyonu için e-posta adresinize bir doğrulama bağlantısı gönderilecektir.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="mb-3">Ürünler ne kadar sürede teslim edilir?</h5>
                    <p className="text-muted">
                      Teslimat süreleri, ürünün tedarikçisine ve bulunduğunuz konuma bağlı olarak değişiklik gösterir. 
                      Genellikle şehir içi teslimatlar 1-3 iş günü, şehirler arası teslimatlar 3-5 iş günü içinde tamamlanır.
                    </p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="mb-4">
                    <h5 className="mb-3">Üretici olarak nasıl kaydolabilirim?</h5>
                    <p className="text-muted">
                      "Üretici Ol" butonuna tıklayarak üretici başvurusu yapabilirsiniz. 
                      Başvurunuz incelendikten sonra size geri dönüş yapılacaktır.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="mb-3">Ödeme seçenekleri nelerdir?</h5>
                    <p className="text-muted">
                      Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. 
                      Tüm ödemeleriniz 256-bit SSL güvenlik protokolü ile korunmaktadır.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactPage; 