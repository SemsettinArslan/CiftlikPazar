import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Image, Form, Alert, InputGroup, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaMinus, FaPlus, FaShoppingCart, FaLeaf, FaTicketAlt, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon, couponLoading, couponError, getShippingFee, getOrderTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponValidationError, setCouponValidationError] = useState('');

  const validateCouponBeforeSubmit = () => {
    // Kupon kodu boş ise
    if (!couponCode.trim()) {
      setCouponValidationError('Lütfen bir kupon kodu girin.');
      return false;
    }
    
    // Sepette ürün yoksa
    if (cart.items.length === 0) {
      setCouponValidationError('Sepetinizde ürün bulunmamaktadır. Kupon uygulanamaz.');
      return false;
    }
    
    // Diğer kontroller (örneğin minimum sepet tutarı kontrolü ön tarafta da yapılabilir)
    setCouponValidationError('');
    return true;
  };

  const handleApplyCoupon = async () => {
    // Form doğrulaması
    if (!validateCouponBeforeSubmit()) {
      return;
    }
    
    const success = await applyCoupon(couponCode);
    
    // Başarılı ise input'u temizle
    if (success) {
      setCouponCode('');
      setCouponValidationError('');
    }
  };

  // Kupon kodunu enter ile uygulama
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  // Minimum alışveriş koşulunun kontrol edilmesi
  const isMinimumPurchaseMet = !cart.coupon || cart.totalPrice >= cart.coupon.minimumPurchase;
  
  // Gerçek indirim tutarı
  const actualDiscountAmount = isMinimumPurchaseMet ? cart.discountAmount : 0;
  
  // Son toplam fiyat (minimum alışveriş koşulunu kontrol ederek)
  const finalTotal = cart.totalPrice - actualDiscountAmount;

  // Ödeme işlemine geçiş kontrolü
  const handleCheckout = () => {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!user) {
      toast.info(
        <div className="d-flex align-items-center">
          <FaInfoCircle className="me-2" size={18} />
          <div>
            <div className="fw-bold">Giriş Yapmalısınız</div>
            <div>Ödeme yapmak için lütfen giriş yapın</div>
          </div>
        </div>, 
        {
          position: "bottom-right",
          autoClose: 3000
        }
      );
      navigate('/login');
      return;
    }

    // Kullanıcı rolü kontrolü
    if (user.role === 'farmer') {
      toast.warning(
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <div>
            <div className="fw-bold">Çiftçi Hesabı İle Alışveriş Yapılamaz</div>
            <div>Çiftçi hesabınız ile ürün satın alamazsınız. Lütfen müşteri hesabı ile giriş yapın.</div>
          </div>
        </div>, 
        {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
      return;
    } else if (user.role === 'admin') {
      toast.warning(
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <div>
            <div className="fw-bold">Admin Hesabı İle Alışveriş Yapılamaz</div>
            <div>Admin hesabınız ile ürün satın alamazsınız. Lütfen müşteri hesabı ile giriş yapın.</div>
          </div>
        </div>, 
        {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
      return;
    }

    // Müşteri rolüne sahip kullanıcılar için ödeme sayfasına yönlendir
    navigate('/checkout');
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Alışveriş Sepetim</h1>
      
      {cart.items.length === 0 ? (
        <Card className="p-5 shadow-sm border-0">
          <div className="text-center py-5">
            <FaShoppingCart size={50} className="text-muted mb-4" />
            <h3>Sepetiniz boş</h3>
            <p className="text-muted mb-4">Sepetinizde ürün bulunmamaktadır.</p>
            <Link to="/products">
              <Button variant="success" className="px-4">
                <FaArrowLeft className="me-2" /> Alışverişe Devam Et
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Table responsive className="table-borderless align-middle">
                  <thead>
                    <tr className="text-muted">
                      <th style={{ width: '100px' }}>Ürün</th>
                      <th>Detay</th>
                      <th className="text-center" style={{ width: '200px' }}>Miktar</th>
                      <th className="text-end" style={{ width: '120px' }}>Fiyat</th>
                      <th className="text-end" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map(item => (
                      <tr key={item._id}>
                        <td>
                          <Link to={`/product/${item._id}`}>
                            {item.image ? (
                              <Image 
                                src={`http://localhost:3001/uploads/product-images/${item.image}`}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="img-thumbnail"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/80?text=Resim+Yok';
                                }}
                              />
                            ) : (
                              <div 
                                className="img-thumbnail d-flex align-items-center justify-content-center bg-light"
                                style={{ width: '80px', height: '80px' }}
                              >
                                <FaLeaf size={30} className="text-success opacity-50" />
                              </div>
                            )}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/product/${item._id}`} className="text-decoration-none text-dark">
                            <h6>{item.name}</h6>
                          </Link>
                          <p className="text-muted small mb-0">
                            {item.farmer && item.farmer.farmName 
                              ? `Üretici: ${item.farmer.farmName}` 
                              : ''}
                          </p>
                          <p className="text-muted small mb-0">
                            Birim: {item.unit || 'adet'}
                          </p>
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center">
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="border" 
                              onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                            >
                              <FaMinus />
                            </Button>
                            <Form.Control
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item, parseInt(e.target.value) || 1)}
                              className="mx-2 text-center"
                              style={{ width: '60px' }}
                            />
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="border"
                              onClick={() => updateQuantity(item, item.quantity + 1)}
                            >
                              <FaPlus />
                            </Button>
                          </div>
                        </td>
                        <td className="text-end">
                          <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} ₺</span>
                          <div className="small text-muted">{item.price.toFixed(2)} ₺ / {item.unit || 'adet'}</div>
                        </td>
                        <td className="text-end">
                          <Button 
                            variant="link" 
                            className="text-danger p-0"
                            onClick={() => removeFromCart(item)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                <div className="d-flex justify-content-between mt-4 mb-2">
                  <Link to="/products">
                    <Button variant="outline-success">
                      <FaArrowLeft className="me-2" /> Alışverişe Devam Et
                    </Button>
                  </Link>
                  <Button 
                    variant="outline-danger" 
                    onClick={clearCart}
                  >
                    <FaTrash className="me-2" /> Sepeti Temizle
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaTicketAlt className="me-2" /> Kupon Kodu
                </h5>
              </Card.Header>
              <Card.Body>
                {cart.coupon ? (
                  // Uygulanan kupon gösterimi
                  <div>
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                      <div>
                        <div className="fw-bold">{cart.coupon.code}</div>
                        <div className="text-muted">{cart.coupon.description}</div>
                        {!isMinimumPurchaseMet && (
                          <div className="mt-2">
                            <Badge bg="danger" className="d-flex align-items-center py-2">
                              <FaExclamationTriangle className="me-1" /> 
                              Minimum tutar: {cart.coupon.minimumPurchase.toFixed(2)} ₺
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="ms-2"
                        onClick={removeCoupon}
                      >
                        <FaTimes />
                      </Button>
                    </div>
                    
                    {/* Kupon Bilgileri */}
                    <div className="mb-3">
                      {cart.coupon.type === 'percentage' ? (
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>İndirim Oranı:</span>
                          <Badge bg="success" className="fs-6">%{cart.coupon.value}</Badge>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>İndirim Tutarı:</span>
                          <Badge bg="success" className="fs-6">{cart.coupon.value.toFixed(2)} ₺</Badge>
                        </div>
                      )}
                      
                      {/* İndirim Durumu */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Uygulanacak İndirim:</span>
                        {isMinimumPurchaseMet ? (
                          <span className="text-success fw-bold">-{actualDiscountAmount.toFixed(2)} ₺</span>
                        ) : (
                          <span className="text-muted">0.00 ₺</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Minimum Alışveriş Bilgisi */}
                    {cart.coupon.minimumPurchase > 0 && (
                      <div className="d-flex align-items-center justify-content-between p-2 border-top pt-2">
                        <small className={isMinimumPurchaseMet ? "text-success" : "text-danger"}>
                          <FaInfoCircle className="me-1" />
                          Minimum sepet tutarı: {cart.coupon.minimumPurchase.toFixed(2)} ₺
                        </small>
                        {!isMinimumPurchaseMet && (
                          <small className="text-danger fw-bold">
                            {(cart.coupon.minimumPurchase - cart.totalPrice).toFixed(2)} ₺ eksik
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Kupon uygulama formu
                  <>
                    <InputGroup className="mb-2">
                      <Form.Control
                        placeholder="Kupon kodunuzu girin"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={couponLoading}
                      />
                      <Button 
                        variant="outline-success" 
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                      >
                        {couponLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          'Uygula'
                        )}
                      </Button>
                    </InputGroup>
                    
                    {/* Form doğrulama hata mesajı */}
                    {couponValidationError && (
                      <Alert variant="danger" className="py-2 mb-2 small">
                        <FaExclamationTriangle className="me-1" />
                        {couponValidationError}
                      </Alert>
                    )}
                    
                    {/* API'den dönen hata mesajı */}
                    {couponError && (
                      <Alert variant="danger" className="py-3 mb-0">
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            className="bg-white rounded-circle d-flex align-items-center justify-content-center border border-danger me-2" 
                            style={{ width: '28px', height: '28px', minWidth: '28px' }}
                          >
                            <FaExclamationTriangle className="text-danger" size={16} />
                          </div>
                          <h6 className="mb-0 fw-bold">
                            {couponError.includes('bulunamadı') && 'Geçersiz Kupon'}
                            {couponError.includes('süresi dolmuş') && 'Süresi Dolmuş Kupon'}
                            {couponError.includes('henüz aktif değil') && 'Aktif Olmayan Kupon'}
                            {couponError.includes('aktif değil') && !couponError.includes('henüz') && 'Pasif Kupon'}
                            {couponError.includes('kullanım limiti') && 'Kullanım Limiti Dolmuş'}
                            {couponError.includes('minimum') && 'Yetersiz Sepet Tutarı'}
                            {couponError.includes('bağlanılamadı') && 'Bağlantı Hatası'}
                            {!couponError.includes('bulunamadı') && 
                             !couponError.includes('süresi dolmuş') && 
                             !couponError.includes('aktif değil') && 
                             !couponError.includes('kullanım limiti') && 
                             !couponError.includes('minimum') &&
                             !couponError.includes('bağlanılamadı') && 'Kupon Hatası'}
                          </h6>
                        </div>
                        <p className="mb-0 ps-4">{couponError}</p>
                      </Alert>
                    )}
                    
                    {/* Minimum alışveriş hatırlatması */}
                    {cart.totalPrice > 0 && (
                      <div className="mt-2 small text-muted">
                        <FaTicketAlt className="me-1" />
                        Mevcut sepet tutarınız: {cart.totalPrice.toFixed(2)} ₺
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Sipariş Özeti</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <span>Ara Toplam</span>
                  <span>{cart.totalPrice.toFixed(2)} ₺</span>
                </div>
                
                {cart.coupon && (
                  <div className="d-flex justify-content-between mb-3">
                    <span>İndirim</span>
                    {isMinimumPurchaseMet ? (
                      <span className="text-success">-{actualDiscountAmount.toFixed(2)} ₺</span>
                    ) : (
                      <span className="text-muted">0.00 ₺</span>
                    )}
                  </div>
                )}
                
                <div className="d-flex justify-content-between mb-3">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Toplam</strong>
                  <strong>{finalTotal.toFixed(2)} ₺</strong>
                </div>
                
                {/* Kupon uyarıları */}
                {cart.coupon && !isMinimumPurchaseMet && (
                  <Alert variant="danger" className="py-2 small mb-3">
                    <div className="d-flex align-items-start">
                      <FaExclamationTriangle className="me-2 mt-1" />
                      <div>
                        <strong>Minimum alışveriş tutarı karşılanmadı</strong>
                        <div>
                          Bu kuponu kullanmak için minimum {cart.coupon.minimumPurchase.toFixed(2)} ₺ tutarında alışveriş yapmalısınız. Şu anki sepet tutarınız: {cart.totalPrice.toFixed(2)} ₺
                        </div>
                        <div className="mt-1">
                          <strong>Eksik tutar: {(cart.coupon.minimumPurchase - cart.totalPrice).toFixed(2)} ₺</strong>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}
                
                <Button 
                  variant="success" 
                  className="w-100"
                  disabled={cart.coupon && !isMinimumPurchaseMet}
                  onClick={handleCheckout}
                >
                  Ödemeyi Tamamla
                </Button>
                
                <Alert variant="info" className="mt-4 mb-0">
                  <small>
                    Siparişinizi tamamladıktan sonra 14 gün içerisinde iade edebilirsiniz.
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage; 