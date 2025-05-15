import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLeaf, FaShippingFast, FaHandshake, FaSeedling, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

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
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3001/api/products/featured');
        console.log('Öne çıkan ürünler yanıtı:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          setFeaturedProducts(response.data.data);
        } else if (Array.isArray(response.data)) {
          setFeaturedProducts(response.data);
        } else {
          console.warn('Beklenmeyen API yanıt formatı:', response.data);
          setFeaturedProducts([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Öne çıkan ürünleri yükleme hatası:', err);
        setError('Ürünler yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(
      <div className="d-flex align-items-center">
        <FaShoppingCart className="me-2" />
        <span>{product.name} sepete eklendi!</span>
      </div>
    );
  };

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
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="mt-3">Ürünler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center my-5">{error}</div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">Henüz öne çıkan ürün bulunmuyor.</p>
          </div>
        ) : (
          <Row className="mt-5">
            {featuredProducts.map(product => (
              <Col md={3} className="mb-4" key={product._id}>
                <Card className="h-100 shadow hover-shadow border-0">
                  <Link to={`/product/${product._id}`}>
                    {product.image ? (
                      <Card.Img 
                        variant="top" 
                        src={`http://localhost:3001/uploads/product-images/${product.image}`}
                        alt={product.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=Resim+Yok';
                        }}
                      />
                    ) : (
                      <div style={{ height: '200px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)' }} 
                          className="d-flex align-items-center justify-content-center text-success">
                        <FaLeaf size={50} opacity={0.5} />
                      </div>
                    )}
                  </Link>
                  <Card.Body className="d-flex flex-column">
                    <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
                      <Card.Title className="text-truncate">{product.name}</Card.Title>
                    </Link>
                    <Card.Text className="text-muted small mb-2">
                      {product.farmer && product.farmer.farmName 
                        ? `Üretici: ${product.farmer.farmName}` 
                        : ''}
                    </Card.Text>
                    <Card.Text className="flex-grow-1 small">
                      {product.description && product.description.length > 80 
                        ? `${product.description.substring(0, 80)}...` 
                        : product.description || 'Açıklama bulunmamaktadır.'}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <div className="d-flex flex-column">
                        <span className="text-success fw-bold" style={{ fontSize: '1.25rem' }}>
                          {product.price ? product.price.toFixed(2) : '0.00'} ₺
                        </span>
                        {product.unit && (
                          <small className="text-muted">/ {product.unit}</small>
                        )}
                      </div>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="rounded-pill"
                        onClick={() => handleAddToCart(product)}
                      >
                        <FaShoppingCart className="me-1" /> Sepete Ekle
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        
        <div className="text-center mt-4">
          <Link to="/products">
            <Button variant="success">Tüm Ürünleri Gör</Button>
          </Link>
        </div>
      </Container>

      {/* Stil tanımı */}
      <style jsx="true">{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>

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