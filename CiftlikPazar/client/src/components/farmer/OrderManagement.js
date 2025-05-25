import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Card, Form, InputGroup, Spinner, Alert, Modal, Row, Col, Image } from 'react-bootstrap';
import { FaSearch, FaFilter, FaExclamationCircle, FaEye, FaBoxOpen, FaTruck, FaCheck, FaTimes, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCreditCard } from 'react-icons/fa';
import { toast } from 'react-toastify';

const OrderManagement = ({ apiClient, farmerId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Siparişler getiriliyor...');
      const response = await apiClient.get('/api/orders/sellerorders');
      
      console.log('Siparişler yanıtı:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.data);
        console.log('Alınan siparişler:', response.data.data);
      } else {
        setError('Siparişler yüklenirken bir hata oluştu.');
        toast.error('Siparişler yüklenirken bir hata oluştu.', {
          position: "bottom-right",
          autoClose: 4000
        });
      }
    } catch (err) {
      setError('Siparişleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      console.error('Sipariş yükleme hatası:', err);
      
      // Hata detaylarını göster
      if (err.response) {
        console.error('Hata yanıtı:', {
          status: err.response.status,
          data: err.response.data
        });
        toast.error(`Siparişler yüklenemedi: ${err.response.data.message || 'Bilinmeyen hata'}`, {
          position: "bottom-right",
          autoClose: 4000
        });
      } else if (err.request) {
        console.error('Yanıt alınamadı:', err.request);
        toast.error('Sunucudan yanıt alınamadı. Lütfen bağlantınızı kontrol edin.', {
          position: "bottom-right",
          autoClose: 4000
        });
      } else {
        console.error('İstek hatası:', err.message);
        toast.error(`Bağlantı hatası: ${err.message}`, {
          position: "bottom-right",
          autoClose: 4000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      
      console.log('Sipariş durumu güncelleniyor:', orderId, newStatus);
      console.log('Çiftçi ID:', farmerId);
      
      // Çiftçi ID'sinin string olduğundan emin olalım
      const farmerIdStr = farmerId.toString();
      
      const response = await apiClient.put(`/api/orders/${orderId}/status`, {
        status: newStatus,
        farmerId: farmerIdStr
      });
      
      console.log('Güncelleme yanıtı:', response.data);
      
      if (response.data.success) {
        // Başarılı mesajı göster
        setError(null);
        
        // Türkçe durum adını al
        const statusText = getStatusText(newStatus);
        
        // Durum tipine göre farklı toast mesajları
        const toastConfig = {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        };
        
        // Sipariş numarası (son 6 karakter)
        const orderNumber = orderId.substring(orderId.length - 6);
        
        switch(newStatus) {
          case 'pending':
            toast.info(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, {
              ...toastConfig,
              icon: <FaExclamationCircle className="text-warning" />
            });
            break;
          case 'processing':
            toast.info(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, {
              ...toastConfig,
              icon: <FaBoxOpen className="text-info" />
            });
            break;
          case 'shipped':
            toast.success(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, {
              ...toastConfig,
              icon: <FaTruck className="text-primary" />
            });
            break;
          case 'delivered':
            toast.success(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, {
              ...toastConfig,
              icon: <FaCheck className="text-success" />
            });
            break;
          case 'cancelled':
            toast.warn(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, {
              ...toastConfig,
              icon: <FaTimes className="text-danger" />
            });
            break;
          default:
            toast.success(`#${orderNumber} numaralı sipariş "${statusText}" durumuna güncellendi.`, toastConfig);
        }
        
        // Sipariş durumunu güncelle
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus } 
              : order
          )
        );
        
        // Seçili sipariş detayını da güncelle
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus
          });
        }
      } else {
        setError(`Sipariş durumu güncellenirken bir hata oluştu: ${response.data.message || 'Bilinmeyen hata'}`);
        toast.error(`Sipariş durumu güncellenemedi: ${response.data.message || 'Bilinmeyen hata'}`, {
          position: "bottom-right",
          autoClose: 5000
        });
      }
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      
      // Hata detaylarını göster
      if (err.response) {
        console.error('Hata yanıtı:', {
          status: err.response.status,
          data: err.response.data
        });
        setError(`Hata: ${err.response.data.message || 'Bilinmeyen hata'}`);
        toast.error(`Hata: ${err.response.data.message || 'Bilinmeyen hata'}`, {
          position: "bottom-right",
          autoClose: 5000
        });
      } else if (err.request) {
        console.error('Yanıt alınamadı:', err.request);
        setError('Sunucudan yanıt alınamadı. Lütfen bağlantınızı kontrol edin.');
        toast.error('Sunucudan yanıt alınamadı. Lütfen bağlantınızı kontrol edin.', {
          position: "bottom-right",
          autoClose: 5000
        });
      } else {
        console.error('İstek hatası:', err.message);
        setError(`İstek hatası: ${err.message}`);
        toast.error(`İstek hatası: ${err.message}`, {
          position: "bottom-right",
          autoClose: 5000
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const showOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // Sipariş durumuna göre renk ve metin belirleme
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Onay Bekliyor</Badge>;
      case 'processing':
        return <Badge bg="info">Hazırlanıyor</Badge>;
      case 'shipped':
        return <Badge bg="primary">Kargoya Verildi</Badge>;
      case 'delivered':
        return <Badge bg="success">Teslim Edildi</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };
  
  // Durum adını Türkçe olarak döndüren yardımcı fonksiyon
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Onay Bekliyor';
      case 'processing':
        return 'Hazırlanıyor';
      case 'shipped':
        return 'Kargoya Verildi';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
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

  // Filtreleme ve arama fonksiyonları
  const filterOrders = () => {
    return orders.filter(order => {
      // Durum filtresi
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Arama filtresi
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const orderIdMatch = order._id.toLowerCase().includes(searchLower);
        const customerMatch = order.user?.firstName?.toLowerCase().includes(searchLower) || order.user?.lastName?.toLowerCase().includes(searchLower);
        const emailMatch = order.user?.email?.toLowerCase().includes(searchLower);
        
        return orderIdMatch || customerMatch || emailMatch;
      }
      
      return true;
    });
  };

  // Çiftçinin ürünlerini içeren siparişleri filtreleme
  const getSellerItems = (order) => {
    if (!order || !order.items) return [];
    
    // Debug için sipariş öğelerini yazdır
    console.log('Sipariş öğeleri:', order.items);
    
    return order.items.filter(item => 
      item.farmer && (
        // String veya obje olarak karşılaştır
        (typeof item.farmer === 'string' && item.farmer === farmerId) || 
        (typeof item.farmer === 'object' && item.farmer._id === farmerId)
      )
    );
  };

  // Çiftçinin ürünlerinin toplam tutarını hesaplama
  const calculateSellerTotal = (order) => {
    const sellerItems = getSellerItems(order);
    const subtotal = sellerItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Eğer indirim yoksa, doğrudan alt toplamı döndür
    if (!order.discountAmount || order.discountAmount <= 0) {
      return subtotal;
    }
    
    // Çiftçinin ürünlerinin toplam siparişe oranını hesapla
    const orderTotal = order.totalPrice || order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const sellerRatio = subtotal / orderTotal;
    
    // Çiftçinin ürünlerine düşen indirim miktarını hesapla
    const sellerDiscount = order.discountAmount * sellerRatio;
    
    // İndirimli toplam tutarı döndür
    return subtotal - sellerDiscount;
  };
  
  // Çiftçinin ürünlerine düşen indirim miktarını hesaplama
  const calculateSellerDiscount = (order) => {
    if (!order.discountAmount || order.discountAmount <= 0) {
      return 0;
    }
    
    const sellerItems = getSellerItems(order);
    const subtotal = sellerItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const orderTotal = order.totalPrice || order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const sellerRatio = subtotal / orderTotal;
    
    return order.discountAmount * sellerRatio;
  };

  const filteredOrders = filterOrders();

  return (
    <>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Siparişler</h5>
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Yükleniyor...
                </>
              ) : (
                <>Yenile</>
              )}
            </Button>
          </div>
          
          <Row className="mb-3">
            <Col lg={8} md={7}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Sipariş no veya müşteri bilgisi ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col lg={4} md={5} className="mt-3 mt-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Onay Bekleyen</option>
                  <option value="processing">Hazırlanan</option>
                  <option value="shipped">Kargolanmış</option>
                  <option value="delivered">Teslim Edilmiş</option>
                  <option value="cancelled">İptal Edilmiş</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationCircle className="me-2" />
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3">Siparişler yükleniyor...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Alert variant="info">
              {searchTerm || statusFilter !== 'all' 
                ? 'Arama kriterlerinize uygun sipariş bulunamadı.' 
                : 'Henüz hiç siparişiniz bulunmuyor.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Sipariş No</th>
                    <th>Tarih</th>
                    <th>Müşteri</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="fw-medium">#{order._id.substring(order._id.length - 6)}</span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-medium">{order.user?.firstName && order.user?.lastName ? `${order.user.firstName} ${order.user.lastName}` : 'İsimsiz Müşteri'}</div>
                            <small className="text-muted">{order.user?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold">
                        {calculateSellerTotal(order).toFixed(2)} ₺
                        {order.discountAmount > 0 && (
                          <div className="small text-success">
                            (İndirimli fiyat)
                          </div>
                        )}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="me-2"
                          onClick={() => showOrderDetail(order)}
                        >
                          <FaEye className="me-1" /> Detay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Sipariş Detay Modalı */}
      <Modal 
        show={showDetailModal} 
        onHide={closeDetailModal}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Sipariş Detayı <span className="text-muted small">#{selectedOrder?._id?.substring(selectedOrder?._id?.length - 6)}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Card className="mb-4 border-0 bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold">Sipariş Durumu</h6>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      disabled={selectedOrder.status === 'pending' || updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'pending')}
                    >
                      Onay Bekliyor
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      disabled={selectedOrder.status === 'processing' || updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                    >
                      <FaBoxOpen className="me-1" /> Hazırlanıyor
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={selectedOrder.status === 'shipped' || updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'shipped')}
                    >
                      <FaTruck className="me-1" /> Kargoya Verildi
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      disabled={selectedOrder.status === 'delivered' || updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                    >
                      <FaCheck className="me-1" /> Teslim Edildi
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      disabled={selectedOrder.status === 'cancelled' || updatingStatus}
                      onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                    >
                      <FaTimes className="me-1" /> İptal Et
                    </Button>
                  </div>
                </Card.Body>
              </Card>
              
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Sipariş Bilgileri</h6>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaCalendarAlt className="text-success" />
                    </div>
                    <div>
                      <div className="fw-medium">Sipariş Tarihi</div>
                      <div>{formatDate(selectedOrder.createdAt)}</div>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Müşteri Bilgileri</h6>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaUser className="text-success" />
                    </div>
                    <div>
                      <div className="fw-medium">Müşteri</div>
                      <div>{selectedOrder.user?.firstName && selectedOrder.user?.lastName ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'İsimsiz Müşteri'}</div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaEnvelope className="text-success" />
                    </div>
                    <div>
                      <div className="fw-medium">E-posta</div>
                      <div>{selectedOrder.user?.email}</div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <h6 className="fw-bold mb-3">Teslimat Bilgileri</h6>
              <Card className="mb-4 border-0">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaMapMarkerAlt className="text-success" />
                        </div>
                        <div>
                          <div className="fw-medium">Adres</div>
                          <div>{selectedOrder.shippingAddress?.address}</div>
                          <div>{selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.city}</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaPhone className="text-success" />
                        </div>
                        <div>
                          <div className="fw-medium">Telefon</div>
                          <div>{selectedOrder.shippingAddress?.phone || 'Belirtilmemiş'}</div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              <h6 className="fw-bold mb-3">Ödeme Bilgileri</h6>
              <Card className="mb-4 border-0">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaCreditCard className="text-success" />
                        </div>
                        <div>
                          <div className="fw-medium">Ödeme Yöntemi</div>
                          <div>{selectedOrder.paymentMethod || 'Kapıda Ödeme'}</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaCheck className="text-success" />
                        </div>
                        <div>
                          <div className="fw-medium">Ödeme Durumu</div>
                          <div>{selectedOrder.isPaid ? `Ödendi (${formatDate(selectedOrder.paidAt)})` : 'Ödenmedi'}</div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              <h6 className="fw-bold mb-3">Ürünler (Sadece sizin ürünleriniz)</h6>
              <Card className="border-0">
                <Card.Body className="p-0">
                  <Table responsive className="table-borderless">
                    <thead className="bg-light">
                      <tr>
                        <th>Ürün</th>
                        <th>Fiyat</th>
                        <th>Miktar</th>
                        <th className="text-end">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSellerItems(selectedOrder).map((item) => (
                        <tr key={item._id || item.product}>
                          <td>
                            <div className="d-flex align-items-center">
                              {(item.image || (item.product && item.product.image)) ? (
                                <Image 
                                  src={`http://localhost:3001/uploads/product-images/${item.image || (item.product && item.product.image)}`}
                                  alt={item.name || (item.product && item.product.name)}
                                  width={40}
                                  height={40}
                                  className="img-thumbnail me-2"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div 
                                  className="img-thumbnail d-flex align-items-center justify-content-center bg-light me-2"
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <FaBoxOpen className="text-muted" />
                                </div>
                              )}
                              <div>{item.name || (item.product && item.product.name) || 'Ürün Adı Yok'}</div>
                            </div>
                          </td>
                          <td>
                            {item.price.toFixed(2)} ₺
                            {selectedOrder.discountAmount > 0 && (
                              <div className="small text-muted">
                                (Toplam tutara {selectedOrder.discountAmount.toFixed(2)} ₺ indirim uygulanmıştır)
                              </div>
                            )}
                          </td>
                          <td>{item.quantity} {item.unit || 'adet'}</td>
                          <td className="text-end fw-bold">{(item.price * item.quantity).toFixed(2)} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-top">
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">Alt Toplam:</td>
                        <td className="text-end fw-bold">
                          {getSellerItems(selectedOrder).reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)} ₺
                        </td>
                      </tr>
                      {selectedOrder.discountAmount > 0 && (
                        <tr>
                          <td colSpan="3" className="text-end text-success">
                            <strong>İndirim:</strong>
                          </td>
                          <td className="text-end text-success">
                            <strong>-{calculateSellerDiscount(selectedOrder).toFixed(2)} ₺</strong>
                          </td>
                        </tr>
                      )}
                      {selectedOrder.discountAmount > 0 && (
                        <tr>
                          <td colSpan="3" className="text-end fw-bold">İndirimli Toplam:</td>
                          <td className="text-end fw-bold text-success">{calculateSellerTotal(selectedOrder).toFixed(2)} ₺</td>
                        </tr>
                      )}
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetailModal}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderManagement; 