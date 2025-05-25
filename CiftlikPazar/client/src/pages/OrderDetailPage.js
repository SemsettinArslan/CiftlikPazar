import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaExclamationCircle, FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaTruck, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError('Sipariş detayları yüklenirken bir hata oluştu.');
        }
      } catch (err) {
        setError('Sipariş detayları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        console.error('Sipariş detay yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Sipariş durumuna göre renk ve metin belirleme
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" className="fs-6 py-2 px-3">Onay Bekliyor</Badge>;
      case 'processing':
        return <Badge bg="info" className="fs-6 py-2 px-3">Hazırlanıyor</Badge>;
      case 'shipped':
        return <Badge bg="primary" className="fs-6 py-2 px-3">Kargoya Verildi</Badge>;
      case 'delivered':
        return <Badge bg="success" className="fs-6 py-2 px-3">Teslim Edildi</Badge>;
      case 'cancelled':
        return <Badge bg="danger" className="fs-6 py-2 px-3">İptal Edildi</Badge>;
      default:
        return <Badge bg="secondary" className="fs-6 py-2 px-3">Bilinmiyor</Badge>;
    }
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Sipariş detayları yükleniyor...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="d-flex align-items-start">
          <FaExclamationCircle className="me-2 mt-1" />
          <div>{error}</div>
        </Alert>
        <div className="text-center mt-3">
          <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
            <FaArrowLeft className="me-2" /> Siparişlerime Dön
          </Button>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Sipariş bulunamadı. Siparişin var olduğundan ve erişim izninizin olduğundan emin olun.
        </Alert>
        <div className="text-center mt-3">
          <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
            <FaArrowLeft className="me-2" /> Siparişlerime Dön
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="mb-0">Sipariş Detayları</h2>
              <p className="text-muted mb-0">Sipariş No: #{order._id.substring(order._id.length - 6)}</p>
            </div>
            <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
              <FaArrowLeft className="me-2" /> Siparişlerime Dön
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Sipariş Özeti</h5>
                {getStatusBadge(order.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col sm={6} className="mb-3 mb-sm-0">
                  <div className="d-flex align-items-center mb-2">
                    <FaCalendarAlt className="me-2 text-success" />
                    <strong>Sipariş Tarihi:</strong>
                  </div>
                  <p>{formatDate(order.createdAt)}</p>
                </Col>
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    <FaTruck className="me-2 text-success" />
                    <strong>Tahmini Teslimat:</strong>
                  </div>
                  <p>{order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'Belirtilmemiş'}</p>
                </Col>
              </Row>

              <hr />

              <h6 className="fw-bold mb-3">Sipariş Edilen Ürünler</h6>
              <Table responsive className="table-borderless align-middle">
                <thead className="text-muted small">
                  <tr>
                    <th style={{ width: '80px' }}>Ürün</th>
                    <th>Detay</th>
                    <th className="text-center">Miktar</th>
                    <th className="text-end">Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item._id || item.product}>
                      <td>
                        {item.image ? (
                          <Image 
                            src={`${BASE_URL}/uploads/product-images/${item.image}`}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="img-thumbnail"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/60?text=Resim+Yok';
                            }}
                          />
                        ) : (
                          <div 
                            className="img-thumbnail d-flex align-items-center justify-content-center bg-light"
                            style={{ width: '60px', height: '60px' }}
                          >
                            <FaBoxOpen size={20} className="text-muted" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-medium">{item.name}</div>
                        <small className="text-muted">
                          {item.farmer?.farmName || 'Çiftlik bilgisi yok'}
                        </small>
                      </td>
                      <td className="text-center">
                        {item.quantity} {item.unit || 'adet'}
                      </td>
                      <td className="text-end">
                        <div className="fw-bold">{(item.price * item.quantity).toFixed(2)} ₺</div>
                        <small className="text-muted">{item.price.toFixed(2)} ₺ / {item.unit || 'adet'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Teslimat Bilgileri</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <FaUser className="me-2 text-success" />
                  <strong>Alıcı:</strong>
                </div>
                <p className="mb-1">{order.shippingAddress?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
              </div>
              
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <FaMapMarkerAlt className="me-2 text-success" />
                  <strong>Adres:</strong>
                </div>
                <p className="mb-1">{order.shippingAddress?.address}</p>
                <p className="mb-0">
                  {order.shippingAddress?.district}, {order.shippingAddress?.city}
                </p>
              </div>
              
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <FaPhone className="me-2 text-success" />
                  <strong>Telefon:</strong>
                </div>
                <p className="mb-0">{order.shippingAddress?.phone || user?.phone || 'Belirtilmemiş'}</p>
              </div>
              
              <div>
                <div className="d-flex align-items-center mb-2">
                  <FaEnvelope className="me-2 text-success" />
                  <strong>E-posta:</strong>
                </div>
                <p className="mb-0">{user?.email}</p>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Ödeme Özeti</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Ara Toplam:</span>
                <span>{order.totalPrice?.toFixed(2) || '0.00'} ₺</span>
              </div>
              
              {order.discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>İndirim:</span>
                  <span className="text-success">-{order.discountAmount.toFixed(2)} ₺</span>
                </div>
              )}
              
              <div className="d-flex justify-content-between mb-2">
                <span>Kargo:</span>
                <span>{order.shippingFee > 0 ? `${order.shippingFee.toFixed(2)} ₺` : 'Ücretsiz'}</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between">
                <strong>Toplam:</strong>
                <strong className="text-success">{order.totalAmount?.toFixed(2) || '0.00'} ₺</strong>
              </div>
              
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex align-items-center mb-2">
                  <strong>Ödeme Yöntemi:</strong>
                </div>
                <p className="mb-0">{order.paymentMethod || 'Kapıda Ödeme'}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailPage; 