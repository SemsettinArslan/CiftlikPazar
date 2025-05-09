import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, ListGroup, Tab, Tabs, Image, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaHome, FaTree, FaMapMarkerAlt, FaTruck, FaPhone, FaEnvelope, FaCertificate, FaStar, FaInfoCircle, FaTags, FaShoppingBasket } from 'react-icons/fa';
import axios from 'axios';
import { getCategoryNameById } from '../utils/categoryUtils';

const ProducerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producer, setProducer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchProducer = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/farmers/${id}`);
        setProducer(response.data.data);
        setLoading(false);
        
        // Eğer üreticinin kategorileri varsa, bu kategorilerin detaylarını getir
        if (response.data.data && response.data.data.categories && response.data.data.categories.length > 0) {
          fetchCategoryDetails(response.data.data.categories);
        } else {
          setLoadingCategories(false);
        }
      } catch (err) {
        setError('Üretici bilgileri yüklenirken bir hata oluştu');
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        console.log(`Çiftçi ürünleri için API isteği gönderiliyor: http://localhost:5000/api/products/farmer/${id}`);
        
        const response = await axios.get(`http://localhost:5000/api/products/farmer/${id}`);
        console.log('Çiftçi ürünleri yanıtı:', response.data);
        
        // API yanıtının yapısını kontrol etme
        if (response.data && response.data.success && response.data.data) {
          // Yeni API formatı: {success: true, data: [...]}
          setProducts(response.data.data);
        } else if (response.data && Array.isArray(response.data)) {
          // Eski API formatı: direkt dizi
          setProducts(response.data);
        } else {
          console.warn('Beklenmeyen API yanıt formatı:', response.data);
          setProducts([]);
        }
        
        setLoadingProducts(false);
      } catch (err) {
        console.error('Ürünler yüklenirken hata:', err);
        setLoadingProducts(false);
      }
    };
    
    const fetchCategoryDetails = async (categoryIds) => {
      try {
        setLoadingCategories(true);
        const categoryDetails = [];
        
        // Her kategori ID'si için isim getir
        for (const categoryId of categoryIds) {
          let id = categoryId;
          // Eğer categoryId bir obje ise, _id alanını kullan
          if (typeof categoryId === 'object' && categoryId._id) {
            id = categoryId._id;
          }
          
          try {
            const name = await getCategoryNameById(id);
            categoryDetails.push({ _id: id, name });
          } catch (err) {
            console.error(`Kategori bilgisi yüklenirken hata (${id}):`, err);
          }
        }
        
        setCategories(categoryDetails);
        setLoadingCategories(false);
      } catch (err) {
        console.error('Kategoriler yüklenirken hata:', err);
        setLoadingCategories(false);
      }
    };

    fetchProducer();
    fetchProducts();
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success" role="status"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!producer) return <div className="alert alert-warning">Üretici bulunamadı</div>;

  const user = producer.user || {};

  return (
    <Container className="py-5">
      <Button 
        variant="outline-success" 
        className="mb-4 producer-back-btn" 
        onClick={() => navigate('/producers')}
      >
        <style jsx="true">{`
          .producer-back-btn:hover {
            background-color: #198754 !important;
            color: white !important;
            border-color: #198754 !important;
          }
        `}</style>
        &larr; Üreticilere Dön
      </Button>
      
      <Card className="border-0 shadow-sm mb-5">
        <div className="bg-light p-4 text-center farm-header">
          <style jsx="true">{`
            .farm-header {
              background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
              padding: 40px 0;
              border-radius: 8px 8px 0 0;
            }
            .farm-logo-container {
              position: relative;
              width: 200px;
              height: 200px;
              margin: 0 auto;
            }
            .farm-home-icon {
              font-size: 5rem;
              color: #2e7d32;
              position: relative;
              z-index: 2;
            }
            .farm-tree-icon {
              font-size: 4rem;
              color: #43a047;
              position: absolute;
              right: -30px;
              top: -15px;
              z-index: 1;
              opacity: 0.9;
            }
          `}</style>
          {producer.farmLogo ? (
            <Image 
              src={`http://localhost:5000/uploads/farm-logos/${producer.farmLogo}`}
              alt={producer.farmName}
              fluid 
              className="rounded-circle border"
              style={{ width: '200px', height: '200px', objectFit: 'cover' }}
            />
          ) : (
            <div className="farm-logo-container">
              <div className="d-flex align-items-center justify-content-center h-100">
                <FaHome className="farm-home-icon" />
                <FaTree className="farm-tree-icon" />
              </div>
            </div>
          )}
          <h1 className="mt-4 mb-2">{producer.farmName}</h1>
          <div className="text-muted d-flex align-items-center justify-content-center mb-3">
            <FaMapMarkerAlt className="me-2" />
            {producer.city && producer.district 
              ? `${producer.city} / ${producer.district}`
              : producer.city || producer.district || 'Konum belirtilmemiş'}
          </div>
          {producer.isCertified && (
            <Badge bg="success" className="px-3 py-2">
              <FaCertificate className="me-1" /> Sertifikalı Üretici
            </Badge>
          )}
        </div>
        <Card.Body className="p-4">
          <Row>
            <Col md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaInfoCircle className="me-2" /> Hakkında
                  </h5>
                </Card.Header>
                <Card.Body>
                  {producer.description ? (
                    <p>{producer.description}</p>
                  ) : (
                    <p className="text-muted">Bu üretici henüz bir açıklama eklememiş.</p>
                  )}
                  
                  {producer.hasShipping && (
                    <div className="mt-4 p-3 border-start border-success border-3 bg-light">
                      <div className="d-flex align-items-center text-success">
                        <FaTruck className="me-2" size={18} />
                        <span className="fw-bold">Kargo ile teslimat yapılabilir</span>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaPhone className="me-2" /> İletişim Bilgileri
                  </h5>
                </Card.Header>
                <Card.Body>
                  {user.phone && (
                    <div className="mb-3 d-flex">
                      <FaPhone className="me-3 text-success mt-1" />
                      <div>
                        <strong>Telefon:</strong><br />
                        {user.phone}
                      </div>
                    </div>
                  )}
                  {user.email && (
                    <div className="mb-3 d-flex">
                      <FaEnvelope className="me-3 text-success mt-1" />
                      <div>
                        <strong>E-posta:</strong><br />
                        {user.email}
                      </div>
                    </div>
                  )}
                  <div className="mb-3 d-flex">
                    <FaMapMarkerAlt className="me-3 text-success mt-1" />
                    <div>
                      <strong>Adres:</strong><br />
                      {producer.address || 'Adres belirtilmemiş'}<br />
                      {producer.city && producer.district 
                        ? `${producer.city} / ${producer.district}` 
                        : producer.city || producer.district || ''}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaTags className="me-2" /> Üretim Kategorileri
                  </h5>
                </Card.Header>
                <Card.Body>
                  {loadingCategories ? (
                    <div className="text-center py-2">
                      <Spinner animation="border" variant="success" size="sm" />
                      <span className="ms-2">Kategoriler yükleniyor...</span>
                    </div>
                  ) : categories.length > 0 ? (
                    <div className="d-flex flex-wrap">
                      {categories.map((category, idx) => (
                        <Badge 
                          key={idx} 
                          bg="light" 
                          text="dark" 
                          className="me-2 mb-2 py-2 px-3 border"
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Bu üreticiye ait kategori bilgisi bulunmamaktadır.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="border-0 shadow-sm mt-5">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <FaShoppingBasket className="me-2" /> Çiftlik Ürünleri
          </h5>
        </Card.Header>
        <Card.Body>
          {loadingProducts ? (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Bu üreticinin henüz ürünü bulunmuyor.</p>
            </div>
          ) : (
            <Row>
              {products.map((product) => (
                <Col key={product._id} md={4} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm hover-card">
                    <style jsx="true">{`
                      .hover-card {
                        transition: all 0.3s ease;
                      }
                      .hover-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                      }
                    `}</style>
                    {product.image ? (
                      <Card.Img 
                        variant="top" 
                        src={`http://localhost:5000/uploads/product-images/${product.image}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=Resim+Yok';
                        }}
                      />
                    ) : (
                      <div 
                        className="bg-light d-flex align-items-center justify-content-center"
                        style={{ height: '180px' }}
                      >
                        <FaTree size={40} className="text-success opacity-50" />
                      </div>
                    )}
                    <Card.Body>
                      <Card.Title className="h5">{product.name}</Card.Title>
                      <Card.Text className="text-success fw-bold mb-3">
                        {product.price.toFixed(2)} TL
                        {product.unit && <span className="text-muted fw-normal"> / {product.unit}</span>}
                      </Card.Text>
                      <Link to={`/product/${product._id}`}>
                        <Button variant="outline-success" size="sm" className="w-100">
                          Ürün Detayı
                        </Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {producer.certificates && producer.certificates.length > 0 && (
        <>
          <h3 className="mb-4 mt-5">Sertifikalar ve Belgeler</h3>
          <Row>
            {producer.certificates.map((cert, idx) => (
              <Col key={idx} md={6} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-4 d-flex align-items-center">
                    <div className="me-4 bg-light rounded-circle p-3">
                      <FaCertificate className="text-success" size={32} />
                    </div>
                    <div>
                      <h5 className="mb-2">{cert.name}</h5>
                      <div className="text-muted">
                        {cert.issuer} tarafından verilmiş
                        {cert.isVerified && <Badge bg="success" className="ms-2">Doğrulanmış</Badge>}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
};

export default ProducerDetailPage; 