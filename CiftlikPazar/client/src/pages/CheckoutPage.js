import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaHome, FaBuilding, FaCheck, FaExclamationTriangle, FaShoppingCart, FaCreditCard, FaMoneyBill } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const CheckoutPage = () => {
  const { cart, getCartTotal, getShippingFee, getOrderTotal, createOrder } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State tanımlamaları
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Kapıda Ödeme');
  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sipariş başarılı olduğunda yönlendirme
  useEffect(() => {
    if (cart.orderSuccess && cart.orderId) {
      navigate(`/order/${cart.orderId}`);
    }
  }, [cart.orderSuccess, cart.orderId, navigate]);
  
  // Kullanıcı giriş yapmadıysa login sayfasına yönlendir
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/login?redirect=checkout');
    }
  }, [isAuthenticated, navigate, authLoading]);
  
  // Kullanıcı rolü kontrolü - sadece müşteriler ödeme yapabilir
  useEffect(() => {
    if (user && (user.role === 'farmer' || user.role === 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Sepet boşsa ana sayfaya yönlendir
  useEffect(() => {
    if (cart.items.length === 0 && !cart.orderSuccess) {
      navigate('/cart');
    }
  }, [cart.items, cart.orderSuccess, navigate]);
  
  // Teslimat adreslerini yükle
  const loadDeliveryAddresses = async () => {
    setAddressesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/delivery-addresses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const addressesData = response.data.data;
        setAddresses(addressesData);
        
        // Varsayılan adres varsa seç
        const defaultAddress = addressesData.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (addressesData.length > 0) {
          setSelectedAddressId(addressesData[0]._id);
        }
      }
    } catch (err) {
      console.error('Adresler yüklenirken hata:', err);
      setError('Teslimat adresleri yüklenirken bir hata oluştu');
    } finally {
      setAddressesLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde adresleri getir
  useEffect(() => {
    if (isAuthenticated) {
      loadDeliveryAddresses();
    }
  }, [isAuthenticated]);
  
  // Siparişi tamamla
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Lütfen bir teslimat adresi seçin');
      return;
    }
    
    setLoading(true);
    try {
      // Seçilen adresi bul
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        setError('Seçilen adres bulunamadı');
        setLoading(false);
        return;
      }
      
      // Adresin tüm gerekli alanları içerdiğinden emin ol
      // Eksik alanları kullanıcı bilgilerinden doldur
      const completeAddress = { ...selectedAddress };
      
      // Eğer fullName eksikse, kullanıcının adını kullan
      if (!completeAddress.fullName && user) {
        completeAddress.fullName = `${user.firstName} ${user.lastName}`;
      }
      
      // Eğer telefon eksikse, kullanıcının telefonunu kullan
      if (!completeAddress.phone && user && user.phone) {
        completeAddress.phone = user.phone;
      }
      
      // Hala eksik alanlar var mı kontrol et
      const requiredFields = ['fullName', 'address', 'city', 'district', 'phone'];
      const missingFields = requiredFields.filter(field => !completeAddress[field]);
      
      if (missingFields.length > 0) {
        setError(`Teslimat adresi için gerekli alanlar eksik: ${missingFields.join(', ')}. Lütfen adres bilgilerinizi güncelleyin.`);
        setLoading(false);
        return;
      }
      
      // Sipariş oluştur
      const result = await createOrder(completeAddress, paymentMethod);
      
      if (result.success) {
        // Başarılı sipariş, yönlendirme useEffect ile yapılacak
      } else {
        setError('Sipariş oluşturulurken bir hata oluştu');
      }
    } catch (err) {
      console.error('Sipariş oluşturma hatası:', err);
      setError('Sipariş işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Yükleme durumunda
  if (authLoading || addressesLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Bilgiler yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Ödeme Bilgileri</h1>
      
      <Row>
        <Col lg={8}>
          {/* Teslimat Adresi Seçimi */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Teslimat Adresi</h5>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-4">
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}
              
              {addresses.length > 0 ? (
                <div className="mb-4">
                  <Form>
                    {addresses.map(address => (
                      <Card 
                        key={address._id} 
                        className={`mb-3 border ${selectedAddressId === address._id ? 'border-success' : ''}`}
                        onClick={() => setSelectedAddressId(address._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <Form.Check
                            type="radio"
                            id={`address-${address._id}`}
                            name="addressSelection"
                            checked={selectedAddressId === address._id}
                            onChange={() => setSelectedAddressId(address._id)}
                            label={
                              <div>
                                <h6 className="mb-1 d-flex align-items-center">
                                  {address.title} 
                                  {address.isDefault && (
                                    <Badge bg="success" className="ms-2">Varsayılan</Badge>
                                  )}
                                </h6>
                                <p className="mb-1"><strong>{address.fullName}</strong> - {address.phone}</p>
                                <p className="mb-0 text-muted">
                                  {address.address}, {address.district}, {address.city}
                                  {address.postalCode && `, ${address.postalCode}`}
                                </p>
                              </div>
                            }
                          />
                        </Card.Body>
                      </Card>
                    ))}
                  </Form>
                </div>
              ) : (
                <Alert variant="info" className="mb-4">
                  Kayıtlı teslimat adresiniz bulunmuyor. Lütfen yeni bir adres ekleyin.
                </Alert>
              )}
              
              <Link to="/profile?section=addresses" className="text-decoration-none">
                <Button 
                  variant="success" 
                  className="d-flex align-items-center"
                >
                  <FaHome className="me-2" /> Yeni Adres Ekle
                </Button>
              </Link>
            </Card.Body>
          </Card>
          
          {/* Ödeme Yöntemi */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 fw-bold">Ödeme Yöntemi</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  id="payment-cash"
                  name="paymentMethod"
                  checked={paymentMethod === 'Kapıda Ödeme'}
                  onChange={() => setPaymentMethod('Kapıda Ödeme')}
                  label={
                    <div className="d-flex align-items-center">
                      <FaMoneyBill className="me-2 text-success" />
                      <span>Kapıda Ödeme</span>
                    </div>
                  }
                  className="mb-3"
                />
                <Form.Check
                  type="radio"
                  id="payment-card"
                  name="paymentMethod"
                  checked={paymentMethod === 'Kredi Kartı'}
                  onChange={() => setPaymentMethod('Kredi Kartı')}
                  label={
                    <div className="d-flex align-items-center">
                      <FaCreditCard className="me-2 text-primary" />
                      <span>Kredi Kartı</span>
                    </div>
                  }
                  className="mb-3"
                />
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          {/* Sipariş Özeti */}
          <Card className="shadow-sm border-0 mb-4 sticky-lg-top" style={{ top: '20px' }}>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Sipariş Özeti</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Ürünler ({cart.items.length})</span>
                <span>{getCartTotal().toFixed(2)} ₺</span>
              </div>
              
              {cart.coupon && (
                <div className="d-flex justify-content-between mb-3">
                  <span>İndirim ({cart.coupon.code})</span>
                  <span className="text-success">-{cart.discountAmount.toFixed(2)} ₺</span>
                </div>
              )}
              
              <div className="d-flex justify-content-between mb-3">
                <span>Kargo</span>
                <span>
                  {getShippingFee() === 0 
                    ? 'Ücretsiz' 
                    : `${getShippingFee().toFixed(2)} ₺`}
                </span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Toplam</strong>
                <strong className="text-success">{getOrderTotal().toFixed(2)} ₺</strong>
              </div>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddressId || cart.items.length === 0}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart className="me-2" /> Siparişi Tamamla
                    </>
                  )}
                </Button>
                <Link to="/cart">
                  <Button variant="outline-secondary" className="w-100">
                    <FaArrowLeft className="me-2" /> Sepete Dön
                  </Button>
                </Link>
              </div>
              
              <div className="mt-4">
                <h6>Sipariş Detayı</h6>
                <hr className="my-2" />
                {cart.items.map(item => (
                  <div key={item._id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage; 