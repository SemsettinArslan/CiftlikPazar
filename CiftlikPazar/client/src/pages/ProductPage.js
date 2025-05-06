import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Image, ListGroup, Card, Button, Container, Badge, Form } from 'react-bootstrap';
import axios from 'axios';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Ürün yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const addToCartHandler = () => {
    // Sepete ekleme fonksiyonu (ileride implementasyon yapılacak)
    console.log('Sepete eklendi', id, quantity);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger text-center py-4 mx-auto" style={{ maxWidth: '600px' }}>
      <i className="fas fa-exclamation-circle me-2"></i>
      {error}
    </div>
  );
  
  if (!product) return (
    <div className="alert alert-warning text-center py-4 mx-auto" style={{ maxWidth: '600px' }}>
      <i className="fas fa-search me-2"></i>
      Ürün bulunamadı
    </div>
  );

  return (
    <Container className="py-5">
      <div className="d-flex align-items-center mb-4">
        <Link to="/products" className="btn btn-success rounded-pill me-3 d-flex align-items-center justify-content-center">
          <i className="fas fa-arrow-left me-2"></i>
          Ürünlere Dön
        </Link>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
            <li className="breadcrumb-item"><Link to="/products">Ürünler</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="bg-white shadow-sm rounded-3 overflow-hidden">
        <Row className="g-0">
          <Col lg={6} className="p-0 product-image-container">
            <div className="position-relative h-100">
              {product.isFeatured && (
                <span className="badge bg-warning position-absolute top-0 end-0 m-3 py-2 px-3 rounded-pill z-index-1">
                  Öne Çıkan
                </span>
              )}
              <Image 
                src={`/uploads/product-images/${product.image}`} 
                alt={product.name} 
                className="img-fluid h-100 object-fit-cover"
                style={{ objectPosition: 'center' }}
              />
            </div>
          </Col>
          <Col lg={6}>
            <div className="p-4 p-lg-5">
              <h2 className="fw-bold mb-2">{product.name}</h2>
              <Link to={`/farmer/${product.farmer._id}`} className="text-decoration-none text-muted d-inline-block mb-3">
                <i className="fas fa-store me-2"></i>
                {product.farmer.farmName}
              </Link>
              
              <div className="my-4">
                <h3 className="text-success fw-bold mb-0">
                  {product.price.toFixed(2)} ₺
                  <span className="text-muted fs-6 fw-normal ms-2">/ {product.unit}</span>
                </h3>
              </div>
              
              <div className="mb-4">
                <Badge 
                  bg={product.countInStock > 0 ? 'success' : 'danger'}
                  className="py-2 px-3 rounded-pill"
                >
                  {product.countInStock > 0 ? 'Stokta Var' : 'Tükendi'}
                </Badge>
                <span className="ms-3 text-muted">
                  Stok: {product.countInStock} {product.unit}
                </span>
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">Ürün Açıklaması</h5>
                <p className="text-muted">{product.description}</p>
              </div>
              
              {product.countInStock > 0 && (
                <div className="d-flex align-items-center mb-4">
                  <div className="d-flex align-items-center border rounded me-3">
                    <Button 
                      variant="light" 
                      className="border-0 btn-sm py-2 px-3"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <i className="fas fa-minus"></i>
                    </Button>
                    <Form.Control
                      type="number"
                      min="1"
                      max={product.countInStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(product.countInStock, Math.max(1, Number(e.target.value))))}
                      className="text-center border-0 shadow-none"
                      style={{ width: '60px' }}
                    />
                    <Button 
                      variant="light" 
                      className="border-0 btn-sm py-2 px-3"
                      onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))}
                    >
                      <i className="fas fa-plus"></i>
                    </Button>
                  </div>
                  <div className="flex-grow-1">
                    <Button 
                      variant="success" 
                      className="w-100 py-2 rounded-pill"
                      disabled={product.countInStock === 0}
                      onClick={addToCartHandler}
                    >
                      <i className="fas fa-shopping-cart me-2"></i>
                      Sepete Ekle
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <Row className="mt-5">
        <Col lg={8} className="mx-auto">
          <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
            <Card.Header className="bg-success text-white py-3 px-4">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Üretici Hakkında
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Card.Title className="fs-4 mb-3">{product.farmer.farmName}</Card.Title>
              <Card.Text className="mb-3">
                <i className="fas fa-map-marker-alt me-2 text-success"></i>
                <strong>Konum:</strong> {product.farmer.city || 'Belirtilmemiş'}
                {product.farmer.district ? `, ${product.farmer.district}` : ''}
              </Card.Text>
              <Card.Text>
                {product.farmer.description || 'Üretici hakkında açıklama bulunmamaktadır.'}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductPage; 