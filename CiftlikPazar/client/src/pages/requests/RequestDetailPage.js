import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExclamationCircle, FaList, FaCalendarAlt, FaMapMarkerAlt, FaHandshake, FaCheck, FaBuilding, FaClock } from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [userType, setUserType] = useState(null); // 'farmer', 'company', or null
  
  // Teklif formu ve durumları
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    price: '',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonrası
    notes: '',
    quantity: '',
  });
  const [offerValidated, setOfferValidated] = useState(false);
  const [offerCreating, setOfferCreating] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState('');

  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const response = await axios.get('/api/categories');
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Talebi getiren fonksiyon
  const fetchRequest = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bulunamadı. Lütfen giriş yapın.');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Talep detayını getir
      const response = await axios.get(`/api/requests/${id}`, config);
      
      if (response.data && response.data.success) {
        console.log('Talep verisi:', response.data.data);
        console.log('Teklifler:', response.data.data.offers);
        
        setRequest(response.data.data);
        
        // Varsayılan miktar değerini ayarla
        setOfferForm(prev => ({
          ...prev,
          quantity: response.data.data.quantity
        }));
      } else {
        setError('Talep detayı yüklenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Talep detayı getirilirken hata:', err);
      
      if (err.response) {
        setError(err.response.data?.message || 'Talep detayı alınırken bir API hatası oluştu');
      } else if (err.request) {
        setError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        setError(`İstek sırasında hata: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı tipini kontrol eden fonksiyon
  const checkUserType = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUserType(null);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get('/api/auth/me', config);
      
      if (response.data && response.data.success) {
        setUserType(response.data.data.role);
      } else {
        setUserType(null);
      }
    } catch (err) {
      console.error('Kullanıcı tipi kontrolü hatası:', err);
      setUserType(null);
    }
  };

  // Sayfa yüklendiğinde talebi ve kategorileri getir
  useEffect(() => {
    checkUserType();
    fetchCategories();
    fetchRequest();
  }, [id]);

  // Kategori adını güvenli şekilde almak için yardımcı fonksiyon
  const getCategoryName = (category) => {
    // Kategori verisi yoksa
    if (!category) return 'Belirtilmemiş';
    
    // Kategori ID'sini string'e çevir
    let categoryId = '';
    
    // Eğer kategori bir obje ve id'si varsa
    if (typeof category === 'object' && category._id) {
      categoryId = category._id.toString();
      
      // Obje olarak gelenin içinde category_name varsa direk döndür
      if (category.category_name) {
        return category.category_name;
      }
    } 
    // String ise direkt al
    else if (typeof category === 'string') {
      categoryId = category;
    }
    
    // Kategoriler listesinden ara
    if (categories && categories.length > 0) {
      const foundCategory = categories.find(cat => 
        cat._id === categoryId || cat._id?.toString() === categoryId
      );
      
      if (foundCategory) {
        return foundCategory.category_name;
      }
    }
    
    // Eğer kategoriler yükleniyor ya da ID henüz bulunamadıysa yükleniyor mesajı göster
    if (categoryLoading) {
      return 'Kategori Yükleniyor...';
    }
    
    return `Kategori (${categoryId ? categoryId.substring(0, 8) + '...' : 'Bilinmiyor'})`;
  };

  // Durum badge'i döndüren fonksiyon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Aktif</Badge>;
      case 'completed':
        return <Badge bg="primary">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      case 'expired':
        return <Badge bg="secondary">Süresi Doldu</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };
  
  // Tarih formatını düzenleyen fonksiyon
  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih belirtilmemiş';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('tr-TR', options);
    } catch (error) {
      console.error('Tarih biçimlendirme hatası:', error);
      return 'Geçersiz tarih';
    }
  };
  
  // Teklif formu alanı değişikliği
  const handleOfferInputChange = (e) => {
    const { name, value } = e.target;
    
    setOfferForm({
      ...offerForm,
      [name]: value
    });
  };
  
  // Tarih değişikliği - Teklif formu için
  const handleDateChange = (date) => {
    setOfferForm({
      ...offerForm,
      estimatedDelivery: date
    });
  };
  
  // Teklif gönderme
  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setOfferValidated(true);
      return;
    }
    
    setOfferValidated(true);
    setOfferCreating(true);
    setOfferSuccess(false);
    setOfferError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Teklif gönder
      const offerData = {
        requestId: request._id,
        price: parseFloat(offerForm.price),
        quantity: parseInt(offerForm.quantity),
        estimatedDelivery: offerForm.estimatedDelivery,
        notes: offerForm.notes
      };
      
      console.log('Gönderilen teklif verisi:', offerData);
      
      const response = await axios.post('/api/offers', offerData, config);
      
      if (response.data && response.data.success) {
        console.log('API yanıtı (başarılı):', response.data);
        setOfferSuccess(true);
        
        // Talep bilgilerini güncelle (teklifler dahil)
        fetchRequest();
        
        // Teklif başarılıysa modalı hemen kapat
        setShowOfferModal(false);
        
        // Toast bildirimi ekle (gerekiyorsa)
        // toast.success('Teklifiniz başarıyla gönderildi');
      } else {
        console.warn('API yanıtı (başarısız):', response.data);
        setOfferError(response.data?.message || 'Teklif oluşturulurken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Teklif oluşturma hatası:', err);
      
      if (err.response) {
        console.error('API hata yanıtı:', err.response.data);
        setOfferError(err.response.data?.message || 'Teklif oluşturulurken bir API hatası oluştu');
      } else if (err.request) {
        console.error('Yanıt alınamadı, istek:', err.request);
        setOfferError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        console.error('İstek yapılamadı:', err.message);
        setOfferError(`İstek sırasında hata: ${err.message}`);
      }
    } finally {
      setOfferCreating(false);
    }
  };
  
  // Teklif modalını açma/kapama
  const openOfferModal = () => setShowOfferModal(true);
  const closeOfferModal = () => {
    setShowOfferModal(false);
    setOfferValidated(false);
    setOfferError('');
  };

  // Teklifi kabul etme
  const handleAcceptOffer = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/offers/${offerId}/accept`, {}, config);
      
      if (response.data && response.data.success) {
        // Talebi yeniden yükle
        fetchRequest();
        alert('Teklif başarıyla kabul edildi');
      }
    } catch (err) {
      console.error('Teklif kabul etme hatası:', err);
      alert(err.response?.data?.message || 'Teklif kabul edilirken bir hata oluştu');
    }
  };
  
  // Teklifi reddetme
  const handleRejectOffer = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/offers/${offerId}/reject`, {}, config);
      
      if (response.data && response.data.success) {
        // Talebi yeniden yükle
        fetchRequest();
        alert('Teklif başarıyla reddedildi');
      }
    } catch (err) {
      console.error('Teklif reddetme hatası:', err);
      alert(err.response?.data?.message || 'Teklif reddedilirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Talep detayı yükleniyor...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
        <div className="text-center mt-3">
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Geri Dön
          </Button>
        </div>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="d-flex align-items-center">
          <FaExclamationCircle className="me-2" />
          Talep bulunamadı.
        </Alert>
        <div className="text-center mt-3">
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Geri Dön
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <Button variant="outline-primary" className="mb-3" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Talepler Listesine Dön
          </Button>
          <h2 className="mb-0 text-primary">Talep Detayı <span className="text-muted small">#{request._id.substring(request._id.length - 6)}</span></h2>
        </div>
        
        {userType === 'farmer' && request.status === 'active' && (
          <Button 
            variant="primary" 
            className="d-flex align-items-center"
            onClick={openOfferModal}
          >
            <FaHandshake className="me-2" /> Teklif Ver
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">{request.title}</h5>
              <div className="d-flex align-items-center text-muted">
                <FaBuilding className="me-1" />
                <span>{request.company ? request.company.companyName : 'İsimsiz Firma'}</span>
                <span className="mx-2">•</span>
                <FaClock className="me-1" />
                <span>Oluşturulma: {formatDate(request.createdAt)}</span>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
          
          <Row>
            <Col md={6} className="mb-4">
              <Card className="border-0 bg-light h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Talep Bilgileri</h6>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaList className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Kategori</div>
                      <div>
                        {categoryLoading ? (
                          <span>
                            <Spinner animation="border" size="sm" variant="primary" className="me-1" /> 
                            Kategori yükleniyor...
                          </span>
                        ) : (
                          getCategoryName(request.category)
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaCalendarAlt className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Son Tarih</div>
                      <div>{formatDate(request.deadline)}</div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaList className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Miktar</div>
                      <div>{request.quantity} {request.unit}</div>
                    </div>
                  </div>
                  {request.budget && (
                    <div className="mb-2 d-flex">
                      <div className="me-2">
                        <FaList className="text-primary" />
                      </div>
                      <div>
                        <div className="fw-medium">Bütçe</div>
                        <div>{request.budget} ₺</div>
                      </div>
                    </div>
                  )}
                  <div className="mb-0 d-flex">
                    <div className="me-2">
                      <FaMapMarkerAlt className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Konum</div>
                      <div>{request.city}, {request.district}</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Açıklama</h6>
                  <p>{request.description}</p>
                  
                  {request.isOrganic && (
                    <Badge bg="info" className="mt-2">Organik Ürün</Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {request.specifications && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Özel Gereksinimler</h6>
                <p>{request.specifications}</p>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Teklif Oluşturma Modalı */}
      <Modal 
        show={showOfferModal} 
        onHide={closeOfferModal}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHandshake className="me-2" /> Teklif Oluştur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {offerSuccess && (
            <Alert variant="success" className="d-flex align-items-center">
              <FaCheck className="me-2" />
              Teklifiniz başarıyla oluşturuldu!
            </Alert>
          )}
          
          {offerError && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationCircle className="me-2" />
              {offerError}
            </Alert>
          )}
          
          <Form noValidate validated={offerValidated} onSubmit={handleOfferSubmit}>
            <div className="mb-4">
              <h6 className="mb-3">Talep Bilgileri</h6>
              <Card className="bg-light border-0">
                <Card.Body>
                  <p className="mb-1"><strong>Başlık:</strong> {request.title}</p>
                  <p className="mb-1"><strong>Kategori:</strong> {getCategoryName(request.category)}</p>
                  <p className="mb-1"><strong>Miktar:</strong> {request.quantity} {request.unit}</p>
                  <p className="mb-0"><strong>Son Tarih:</strong> {formatDate(request.deadline)}</p>
                </Card.Body>
              </Card>
            </div>
            
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="price">
                  <Form.Label>Toplam Fiyat (₺)</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    name="price"
                    value={offerForm.price}
                    onChange={handleOfferInputChange}
                    placeholder="Toplam fiyat girin"
                  />
                  <Form.Control.Feedback type="invalid">
                    Geçerli bir fiyat girin.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Tüm ürünler için toplam fiyat (birim fiyat × miktar)
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group controlId="quantity">
                  <Form.Label>Miktar ({request.unit})</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min="1"
                    name="quantity"
                    value={offerForm.quantity}
                    onChange={handleOfferInputChange}
                    placeholder="Miktar girin"
                  />
                  <Form.Control.Feedback type="invalid">
                    Geçerli bir miktar girin.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Karşılayabileceğiniz miktar (talep: {request.quantity} {request.unit})
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group controlId="estimatedDelivery" className="mb-3">
              <Form.Label>Tahmini Teslimat Tarihi</Form.Label>
              <div className="position-relative">
                <DatePicker
                  selected={offerForm.estimatedDelivery}
                  onChange={handleDateChange}
                  className="form-control"
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  required
                />
                <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                  <FaCalendarAlt className="text-muted" />
                </div>
              </div>
              <Form.Control.Feedback type="invalid">
                Tahmini teslimat tarihi gereklidir.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group controlId="notes" className="mb-3">
              <Form.Label>Notlar (Opsiyonel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={offerForm.notes}
                onChange={handleOfferInputChange}
                placeholder="Teklifinizle ilgili ek bilgi ekleyin"
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {offerForm.notes.length}/500 karakter
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeOfferModal}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOfferSubmit}
            disabled={offerCreating}
          >
            {offerCreating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Gönderiliyor...
              </>
            ) : (
              <>
                <FaHandshake className="me-2" />
                Teklif Gönder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RequestDetailPage; 