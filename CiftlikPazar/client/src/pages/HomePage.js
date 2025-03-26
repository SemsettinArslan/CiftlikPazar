import React from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLeaf, FaShippingFast, FaHandshake, FaSeedling } from 'react-icons/fa';

const featuredProducts = [
  {
    id: 1,
    name: 'Organik Domates',
    description: 'Hiçbir kimyasal kullanılmadan yetiştirilen taze domates.',
    image: '/images/products/tomato.jpg',
    price: 12.99,
    producer: 'Ahmet Çiftliği'
  },
  {
    id: 2,
    name: 'Taze Salatalık',
    description: 'Doğal yöntemlerle yetiştirilen salatalık.',
    image: '/images/products/cucumber.jpg',
    price: 8.99,
    producer: 'Yeşil Vadi Çiftliği'
  },
  {
    id: 3,
    name: 'Organik Yumurta',
    description: 'Gezen tavuk yumurtası. Doğal beslenen tavuklardan.',
    image: '/images/products/eggs.jpg',
    price: 25.99,
    producer: 'Köy Lezzeti Çiftliği'
  },
  {
    id: 4,
    name: 'Bal',
    description: 'Doğal çiçek balı. Katkısız ve organik.',
    image: '/images/products/honey.jpg',
    price: 65.99,
    producer: 'Arı Dünyası'
  }
];

const heroStyle = {
  backgroundColor: '#4a8e3a',
  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))',
  color: 'white',
  textAlign: 'center',
  padding: '6rem 2rem',
  borderRadius: 0,
  marginBottom: '3rem'
};

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 className="display-4 fw-bold">Çiftlikten Sofraya Taze Ürünler</h1>
        <p className="lead mb-4">
          Yerel üreticilerden organik ve taze ürünleri aracısız satın alın.
        </p>
        <Link to="/products">
          <Button variant="success" size="lg" className="me-3">
            Alışverişe Başla
          </Button>
        </Link>
        <Link to="/producers">
          <Button variant="outline-light" size="lg">
            Üreticileri Keşfet
          </Button>
        </Link>
      </div>

      {/* Features Section */}
      <Container className="my-5">
        <h2 className="text-center section-title">Neden Çiftlik Pazar?</h2>
        <Row className="mt-5">
          <Col md={3} className="mb-4">
            <div className="text-center">
              <FaLeaf className="text-success mb-3" size={48} />
              <h4>Organik Ürünler</h4>
              <p className="text-muted">
                Doğal yöntemlerle yetiştirilmiş sağlıklı ve taze ürünler
              </p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="text-center">
              <FaShippingFast className="text-success mb-3" size={48} />
              <h4>Hızlı Teslimat</h4>
              <p className="text-muted">
                Taze ürünler aynı gün veya ertesi gün kapınızda
              </p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="text-center">
              <FaHandshake className="text-success mb-3" size={48} />
              <h4>Doğrudan Satış</h4>
              <p className="text-muted">
                Aracı olmadan üreticilerden direkt satın alın
              </p>
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <div className="text-center">
              <FaSeedling className="text-success mb-3" size={48} />
              <h4>Sürdürülebilirlik</h4>
              <p className="text-muted">
                Yerel üretimi destekleyin, çevreye katkıda bulunun
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Featured Products */}
      <Container className="my-5">
        <h2 className="text-center section-title">Öne Çıkan Ürünler</h2>
        <Row className="mt-5">
          {featuredProducts.map(product => (
            <Col md={3} className="mb-4" key={product.id}>
              <Card className="h-100 product-card">
                <Card.Img variant="top" src={'https://via.placeholder.com/300x200'} />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted small mb-2">
                    Üretici: {product.producer}
                  </Card.Text>
                  <Card.Text className="flex-grow-1">
                    {product.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <h5 className="mb-0 text-success">{product.price} ₺</h5>
                    <Button variant="outline-success" size="sm">
                      Sepete Ekle
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-4">
          <Link to="/products">
            <Button variant="success">Tüm Ürünleri Gör</Button>
          </Link>
        </div>
      </Container>

      {/* Testimonials */}
      <Container className="my-5 py-5 bg-light">
        <h2 className="text-center section-title">Müşteri Yorumları</h2>
        <Row className="justify-content-center">
          <Col md={8}>
            <Carousel variant="dark" className="testimonial-carousel">
              <Carousel.Item>
                <div className="text-center p-4">
                  <p className="lead mb-3">
                    "Çiftlik Pazar sayesinde artık sağlıklı, taze ve yerel ürünlere kolayca ulaşabiliyorum. 
                    Üstelik hangi çiftlikte, nasıl üretildiğini de bilmek güven veriyor."
                  </p>
                  <h5>Ayşe Yılmaz</h5>
                  <p className="text-muted">İstanbul</p>
                </div>
              </Carousel.Item>
              <Carousel.Item>
                <div className="text-center p-4">
                  <p className="lead mb-3">
                    "Üreticiler ile doğrudan iletişim kurabilmek harika. Aracılar olmadan alışveriş yapabilmek
                    hem bizim için hem de üreticiler için çok daha avantajlı."
                  </p>
                  <h5>Mehmet Kaya</h5>
                  <p className="text-muted">Ankara</p>
                </div>
              </Carousel.Item>
            </Carousel>
          </Col>
        </Row>
      </Container>

      {/* Call to Action */}
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={10}>
            <div className="bg-success text-white p-5 text-center rounded">
              <h2 className="fw-bold">Siz de üretici olmak ister misiniz?</h2>
              <p className="lead mb-4">
                Ürünlerinizi aracısız bir şekilde müşterilerle buluşturun, daha fazka kazanç elde edin.
              </p>
              <Button as={Link} to="/farmer-register" variant="light" size="lg">
                Çiftçi Başvurusu Yap
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage; 