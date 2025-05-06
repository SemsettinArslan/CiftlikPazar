import React from 'react';
import { Container, Row, Col, Card, Badge, Button, Image } from 'react-bootstrap';
import { FaLeaf, FaHandshake, FaRecycle, FaSeedling, FaHeart, FaUsers, FaHistory, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5 text-center">
        <Col>
          <h1 className="display-4 fw-bold text-success mb-4">
            <FaLeaf className="me-3" style={{ verticalAlign: 'middle' }} />
            Hakkımızda
          </h1>
          <p className="lead text-muted mb-5" style={{ maxWidth: '800px', margin: '0 auto' }}>
            Doğadan sofraya, aracısız ve taze ürünlerin güvenilir adresi.
          </p>
          <div className="d-flex justify-content-center">
            <Badge 
              pill 
              bg="light" 
              text="success" 
              className="fs-6 px-4 py-2 shadow-sm me-2"
            >
              Kuruluş: 2025
            </Badge>
            <Badge 
              pill 
              bg="light" 
              text="success" 
              className="fs-6 px-4 py-2 shadow-sm me-2"
            >
              100+ Çiftlik
            </Badge>
            <Badge 
              pill 
              bg="light" 
              text="success" 
              className="fs-6 px-4 py-2 shadow-sm"
            >
              500+ Ürün
            </Badge>
          </div>
        </Col>
      </Row>

      {/* Misyon ve Değerler */}
      <Row className="mb-5">
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h2 className="text-success mb-4">Hikayemiz</h2>
              <p>
                Çiftlik Pazar, 2025 yılında Türkiye'nin dört bir yanındaki yerel üreticileri tüketicilerle buluşturmak amacıyla kuruldu. 
                Kuruluş amacımız, Anadolu'nun bereketli topraklarında yetişen ürünlerin taze ve doğal hallerini, aracısız bir şekilde 
                tüketicilere ulaştırmaktı.
              </p>
              <p>
                Yolculuğumuza küçük bir ekip ve büyük hayallerle başladık. Bugün, yüzlerce çiftçi ve binlerce müşterinin 
                güvenini kazanmış bir platform olarak, yerel üretimi desteklemeye ve doğal tarımı teşvik etmeye devam ediyoruz.
              </p>
              <p className="mb-0">
                Çiftçilere adil gelir sağlamak, tüketicilere ise taze ve sağlıklı gıdalara erişim imkanı sunmak için çalışıyoruz.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h2 className="text-success mb-4">Misyon & Vizyon</h2>
              <p>
                <strong>Misyonumuz:</strong> Türkiye'nin dört bir yanındaki yerel üreticileri destekleyerek, tüketicilerin doğal ve taze 
                ürünlere doğrudan erişimini sağlamak; adil bir gıda sistemi kurmak ve sürdürülebilir tarımı teşvik etmek.
              </p>
              <p>
                <strong>Vizyonumuz:</strong> Türkiye'nin en büyük çiftçi-tüketici buluşma noktası olmak, yerel üretimi güçlendirmek ve 
                herkesin sağlıklı, güvenilir gıdaya erişebildiği bir gelecek yaratmak.
              </p>
              <p className="mb-0">
                Her geçen gün büyüyen ailemizle, doğaya saygılı tarım uygulamalarını yaygınlaştırmak ve toplumda gıda bilincini 
                artırmak için çalışıyoruz.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Değerlerimiz */}
      <Row className="mb-5">
        <Col xs={12} className="mb-4 text-center">
          <h2 className="text-success">Değerlerimiz</h2>
          <p className="text-muted">Çiftlik Pazar olarak tüm faaliyetlerimizi aşağıdaki temel değerler ışığında yürütüyoruz</p>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100 text-center hover-effect">
            <Card.Body className="p-4">
              <div className="text-success mb-3">
                <FaHandshake size={36} />
              </div>
              <h5>Güven & Şeffaflık</h5>
              <p className="small text-muted">
                Çiftçilerimiz ve müşterilerimiz arasında güvene dayalı, şeffaf bir ilişki kuruyoruz
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100 text-center hover-effect">
            <Card.Body className="p-4">
              <div className="text-success mb-3">
                <FaSeedling size={36} />
              </div>
              <h5>Sürdürülebilirlik</h5>
              <p className="small text-muted">
                Doğaya saygılı üretim yöntemlerini destekliyor, ekolojik dengeyi koruyoruz
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100 text-center hover-effect">
            <Card.Body className="p-4">
              <div className="text-success mb-3">
                <FaHeart size={36} />
              </div>
              <h5>Toplum Sağlığı</h5>
              <p className="small text-muted">
                Sağlıklı, doğal ve besleyici gıdaların erişilebilir olmasını önemsiyoruz
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100 text-center hover-effect">
            <Card.Body className="p-4">
              <div className="text-success mb-3">
                <FaUsers size={36} />
              </div>
              <h5>Yerel Ekonomi</h5>
              <p className="small text-muted">
                Yerel üreticileri destekleyerek bölgesel ekonomiyi güçlendiriyoruz
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Nasıl Çalışır */}
      <Row className="mb-5">
        <Col xs={12} className="mb-4 text-center">
          <h2 className="text-success">Nasıl Çalışır?</h2>
          <p className="text-muted">Çiftçileri ve tüketicileri doğrudan buluşturan basit sürecimiz</p>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                  1
                </div>
                <h4 className="mb-0">Çiftçi Kaydı</h4>
              </div>
              <p className="text-muted">
                Çiftçiler platformumuza kayıt olur ve gerekli doğrulama süreçlerini tamamlar. Güvenilir üreticiler onaylanır.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                  2
                </div>
                <h4 className="mb-0">Ürün Listesi</h4>
              </div>
              <p className="text-muted">
                Onaylanan çiftçiler, ürünlerini detaylı açıklamalar, fiyatlar ve fotoğraflarla platforma eklerler.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                  3
                </div>
                <h4 className="mb-0">Satın Alma</h4>
              </div>
              <p className="text-muted">
                Müşteriler istedikleri ürünleri sepete ekler, sipariş verir ve çiftçiden doğrudan taze ürünlerini alır.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CTA */}
      <Row className="mt-5">
        <Col className="text-center">
          <Card className="border-0 bg-success text-white p-5 shadow">
            <Card.Body>
              <h2 className="mb-3">Sizinle Büyüyoruz</h2>
              <p className="mb-4">
                Yerel üreticileri destekleyerek, doğal ve taze ürünlere erişimi kolaylaştırıyoruz. 
                Ailemize katılmak ister misiniz?
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Button variant="light" size="lg" as={Link} to="/register" className="text-success fw-bold">
                  Müşteri Ol <FaArrowRight className="ms-2" />
                </Button>
                <Button variant="outline-light" size="lg" as={Link} to="/farmer-register" className="fw-bold">
                  Çiftçi Ol <FaArrowRight className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutPage; 