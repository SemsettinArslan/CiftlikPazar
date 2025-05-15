import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye, FaArrowLeft, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaIdCard, FaBoxes, FaTractor, FaClipboardCheck, FaUser, FaCalendarAlt, FaInfoCircle, FaTruck, FaCertificate, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Not: Artık bu sabit kategori adlarına gerek yok, API'den gelecek
// Ancak API'den veri gelmediği durumlar için yedek olarak tutuyoruz
const fallbackCategoryNames = {
  'fruits': 'Meyve',
  'vegetables': 'Sebze',
  'dairy': 'Süt Ürünleri',
  'meat': 'Et Ürünleri',
  'organic': 'Organik Ürünler',
  'honey': 'Bal Ürünleri',
  'eggs': 'Yumurta',
  'nuts': 'Kuruyemiş',
  'herbs': 'Baharat',
  'grain': 'Tahıl',
  'bakery': 'Fırın Ürünleri',
  'legumes': 'Baklagiller',
  'oil': 'Yağ Ürünleri',
  'dried': 'Kurutulmuş Gıda',
  'seasonal': 'Mevsimlik Ürünler'
};

// Kategori adını döndüren yardımcı fonksiyon
const getCategoryName = (category) => {
  // Eğer category bir nesne ve category_name özelliği varsa, onu kullan
  if (category && typeof category === 'object' && category.category_name) {
    return category.category_name;
  }
  
  // Eğer sadece string ID ise, yedek isim listesine bak
  if (typeof category === 'string') {
    return fallbackCategoryNames[category] || category;
  }
  
  // Hiçbiri değilse, bilinmeyen kategori döndür
  return 'Bilinmeyen Kategori';
};

// Sertifika tipini insan-dostu formata dönüştüren yardımcı fonksiyon
const getCertificateTypeName = (type) => {
  const types = {
    'organic': 'Organik Tarım',
    'goodAgriculturalPractices': 'İyi Tarım Uygulamaları',
    'sustainability': 'Sürdürülebilirlik', 
    'qualityAssurance': 'Kalite Güvence',
    'other': 'Diğer'
  };
  
  return types[type] || 'Diğer';
};

const AdminFarmerRequestsPage = () => {
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, variant: '', message: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Onay bekleyen çiftçileri getir
  useEffect(() => {
    const fetchPendingFarmers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const { data } = await axios.get('/api/farmers/pending', config);
        
        setPendingFarmers(data.data);
        setLoading(false);
      } catch (error) {
        console.error('Onay bekleyen çiftçiler getirilemedi:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchPendingFarmers();
  }, []);

  // Çiftçi detaylarını göster
  const handleViewDetails = (farmer) => {
    setSelectedFarmer(farmer);
    setShowModal(true);
  };

  // Modalı kapat
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFarmer(null);
  };

  // Reddetme modalını aç
  const handleShowRejectionModal = (farmer) => {
    setSelectedFarmer(farmer);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  // Reddetme modalını kapat
  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
  };

  // Çiftçi onaylama işlemi
  const handleApproveFarmer = async (id, approved, reason = '') => {
    try {
      setActionInProgress(true);
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const payload = { 
        approved,
        rejectionReason: reason // Ret sebebi (varsa)
      };
      
      const { data } = await axios.put(`/api/farmers/${id}/approve`, payload, config);
      
      // Başarı mesajını göster
      setAlertInfo({
        show: true,
        variant: 'success',
        message: approved 
          ? 'Çiftçi başvurusu başarıyla onaylandı!' 
          : 'Çiftçi başvurusu reddedildi!'
      });
      
      // Listeyi güncelle
      setPendingFarmers(pendingFarmers.filter(farmer => farmer._id !== id));
      
      // Modalları kapat
      if (showModal) {
        handleCloseModal();
      }
      if (showRejectionModal) {
        handleCloseRejectionModal();
      }
      
      setActionInProgress(false);
    } catch (error) {
      console.error('Çiftçi onaylama hatası:', error);
      setAlertInfo({
        show: true,
        variant: 'danger',
        message: `İşlem sırasında bir hata oluştu: ${error.response?.data?.message || error.message}`
      });
      setActionInProgress(false);
    }
  };

  // Reddetme işlemi
  const handleRejectFarmer = () => {
    if (selectedFarmer) {
      handleApproveFarmer(selectedFarmer._id, false, rejectionReason);
    }
  };

  // Function displayCategories to render categories
  const displayCategories = (categories) => {
    if (!categories || categories.length === 0) {
      return <Badge bg="secondary">Kategori Belirtilmemiş</Badge>;
    }

    return categories.map((category, index) => (
      <Badge 
        bg="success" 
        className="me-1 mb-1" 
        key={index}
        style={{ fontWeight: 'normal', opacity: 0.9 }}
      >
        {getCategoryName(category)}
      </Badge>
    ));
  };

  return (
    <div className="admin-dashboard bg-light min-vh-100">
      <Container fluid className="py-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0 text-gray-800 fw-bold">Çiftçi Başvuruları</h1>
            <p className="text-muted small">Onay bekleyen başvuruları buradan yönetebilirsiniz</p>
          </div>
          <Button as={Link} to="/admin/dashboard" variant="outline-dark" className="rounded-pill px-3 d-flex align-items-center">
            <FaArrowLeft className="me-2" /> Admin Paneline Dön
          </Button>
        </div>
        
        <Alert variant="info" className="d-flex align-items-center mb-4">
          <FaExclamationCircle className="me-2" size={16} />
          <div>
            <strong>Bilgi:</strong> Çiftçi başvuru yönetimi artık Admin Paneli içerisine taşınmıştır. 
            <Button 
              as={Link} 
              to="/admin/dashboard" 
              variant="outline-info" 
              size="sm" 
              className="ms-3"
              onClick={(e) => {
                // Admin panelindeki farmer-approvals sekmesini açmak için sessionStorage'a bilgi ekleyelim
                sessionStorage.setItem('adminActiveTab', 'farmer-approvals');
              }}
            >
              Admin Panelindeki Çiftçi Onay Sayfasına Git
            </Button>
          </div>
        </Alert>
        
        {alertInfo.show && (
          <Alert 
            variant={alertInfo.variant} 
            onClose={() => setAlertInfo({...alertInfo, show: false})} 
            dismissible
            className="border-0 shadow-sm"
          >
            {alertInfo.message}
          </Alert>
        )}
        
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-white py-3 border-0">
            <h5 className="mb-0 text-dark">Başvuru Listesi</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                <span className="text-muted">Veriler yükleniyor...</span>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-3 border-0">
                <FaTimes className="me-2" /> {error}
              </Alert>
            ) : pendingFarmers.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <FaClipboardCheck size={32} className="text-muted" />
                </div>
                <p className="text-muted mb-0">Şu anda onay bekleyen çiftçi başvurusu bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Çiftçi Adı</th>
                      <th className="py-3">E-posta</th>
                      <th className="py-3">Çiftlik Adı</th>
                      <th className="py-3">Konum</th>
                      <th className="py-3">Başvuru Tarihi</th>
                      <th className="py-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFarmers.map(farmer => (
                      <tr key={farmer._id} className="border-top">
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-light rounded-circle p-2 me-3 text-center">
                              <FaUser className="text-dark" />
                            </div>
                            <div>
                              <h6 className="mb-0">{farmer.user?.firstName} {farmer.user?.lastName}</h6>
                              <span className="text-muted small">{farmer.user?.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <FaEnvelope className="text-muted me-2" size={14} />
                            <span>{farmer.user?.email}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="fw-medium">{farmer.farmName}</span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="text-muted me-2" size={14} />
                            <span>{farmer.city}, {farmer.district}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {new Date(farmer.user?.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3">
                          <div className="d-flex justify-content-center gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => handleViewDetails(farmer)}
                            >
                              <FaEye className="me-1" /> Detaylar
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => handleApproveFarmer(farmer._id, true)}
                              disabled={actionInProgress}
                            >
                              <FaCheck className="me-1" /> Onayla
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => handleShowRejectionModal(farmer)}
                              disabled={actionInProgress}
                            >
                              <FaTimes className="me-1" /> Reddet
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Çiftçi Detay Modalı - Modern Tasarım */}
        <Modal 
          show={showModal} 
          onHide={handleCloseModal} 
          size="lg" 
          centered
          contentClassName="border-0 shadow"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title as="h5">
              Çiftçi Başvuru Detayları
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="px-4 pt-0">
            {selectedFarmer && (
              <div>
                {/* Çiftlik Bilgileri Başlık */}
                <div className="text-center my-4 py-2">
                  <h3 className="h4 mb-3">{selectedFarmer.farmName}</h3>
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <FaMapMarkerAlt className="text-muted me-2" />
                    <span className="text-muted">{selectedFarmer.city}, {selectedFarmer.district}</span>
                  </div>
                  <div className="mb-2">
                    <Badge bg="dark" pill className="me-1">Vergi No: {selectedFarmer.taxNumber}</Badge>
                    {selectedFarmer.hasShipping && (
                      <Badge bg="info" pill className="ms-1">
                        <FaTruck className="me-1" /> Kargo Hizmeti
                      </Badge>
                    )}
                  </div>
                </div>
                
                <hr className="my-4" />
                
                {/* İki Sütunlu Bölüm */}
                <Row>
                  {/* Sol Sütun - Kişisel Bilgiler */}
                  <Col md={6} className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <FaUser className="me-2 text-primary" /> 
                      Kişisel Bilgiler
                    </h5>
                    
                    <div className="card border-0 bg-light mb-3">
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <div className="text-muted small mb-1">Ad Soyad</div>
                          <div className="fw-medium">
                            {selectedFarmer.user?.firstName} {selectedFarmer.user?.lastName}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-muted small mb-1">E-posta</div>
                          <div className="fw-medium">
                            {selectedFarmer.user?.email}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-muted small mb-1">Telefon</div>
                          <div className="fw-medium">
                            {selectedFarmer.user?.phone || 'Belirtilmemiş'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-muted small mb-1">Başvuru Tarihi</div>
                          <div className="fw-medium">
                            {new Date(selectedFarmer.user?.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                  
                  {/* Sağ Sütun - Çiftlik Detayları */}
                  <Col md={6} className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <FaTractor className="me-2 text-success" /> 
                      Çiftlik Detayları
                    </h5>
                    
                    <div className="card border-0 bg-light mb-3">
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <div className="text-muted small mb-1">Adres</div>
                          <div className="fw-medium">
                            {selectedFarmer.address}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-muted small mb-1">Üretim Kategorileri</div>
                          <div className="mt-2">
                            {displayCategories(selectedFarmer.categories)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                
                {/* Sertifikalar Bölümü (Varsa) */}
                {selectedFarmer.certificates && selectedFarmer.certificates.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <FaCertificate className="me-2 text-info" /> 
                      Sertifikalar
                    </h5>
                    <div className="card border-0 bg-light">
                      <div className="card-body p-3">
                        <Row>
                          {selectedFarmer.certificates.map((cert, index) => (
                            <Col md={6} key={index} className="mb-3">
                              <div className="border rounded p-3 bg-white h-100">
                                <div className="d-flex justify-content-between mb-2">
                                  <h6 className="mb-0 fw-bold">{cert.name}</h6>
                                  <Badge 
                                    bg={cert.verified ? "success" : "warning"} 
                                    className="ms-2"
                                  >
                                    {cert.verified ? "Doğrulanmış" : "Doğrulanmamış"}
                                  </Badge>
                                </div>
                                <div className="small mb-2">
                                  <div><strong>Kurum:</strong> {cert.issuer}</div>
                                  <div><strong>Tarih:</strong> {new Date(cert.issueDate).toLocaleDateString('tr-TR')}</div>
                                  {cert.expiryDate && (
                                    <div><strong>Geçerlilik:</strong> {new Date(cert.expiryDate).toLocaleDateString('tr-TR')} kadar</div>
                                  )}
                                  <div><strong>Tür:</strong> {getCertificateTypeName(cert.certificateType)}</div>
                                  {cert.certificateNumber && (
                                    <div><strong>Sertifika No:</strong> {cert.certificateNumber}</div>
                                  )}
                                </div>
                                {cert.description && (
                                  <div className="mt-2 small text-muted fst-italic">
                                    "{cert.description}"
                                  </div>
                                )}
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Açıklama Bölümü (Varsa) */}
                {selectedFarmer.description && (
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <FaInfoCircle className="me-2 text-info" /> 
                      Çiftlik Açıklaması
                    </h5>
                    <div className="card border-0 bg-light">
                      <div className="card-body p-3">
                        <p className="mb-0">{selectedFarmer.description}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Onay/Ret Butonları */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button 
                    variant="success" 
                    onClick={() => handleApproveFarmer(selectedFarmer?._id, true)}
                    disabled={actionInProgress}
                    className="px-4 rounded-pill"
                  >
                    {actionInProgress ? <Spinner size="sm" animation="border" className="me-2" /> : <FaCheck className="me-2" />} 
                    Başvuruyu Onayla
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => handleShowRejectionModal(selectedFarmer)}
                    disabled={actionInProgress}
                    className="px-4 rounded-pill"
                  >
                    {actionInProgress ? <Spinner size="sm" animation="border" className="me-2" /> : <FaTimes className="me-2" />} 
                    Başvuruyu Reddet
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Reddetme Gerekçesi Modalı */}
        <Modal
          show={showRejectionModal}
          onHide={handleCloseRejectionModal}
          centered
          contentClassName="border-0 shadow"
          size="md"
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title as="h5">
              <FaTimes className="me-2 text-danger" />
              Başvuruyu Reddet
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-4">
              <div className="avatar-lg bg-light rounded-circle p-3 mx-auto mb-3">
                <FaTractor className="text-dark" size={32} />
              </div>
              <h5 className="mb-1">{selectedFarmer?.farmName}</h5>
              <p className="text-muted">Bu çiftlik başvurusunu reddetmek üzeresiniz.</p>
            </div>
            
            <Form.Group className="mb-4">
              <Form.Label>Ret Sebebi (Opsiyonel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Başvurunun reddedilme sebebini yazın..."
                className="border-0 bg-light"
              />
              <Form.Text className="text-muted small">
                Bu bilgi, başvuru sahibine e-posta olarak gönderilecektir.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-center gap-2 mt-4">
              <Button 
                variant="light" 
                onClick={handleCloseRejectionModal}
                className="rounded-pill px-4"
              >
                İptal
              </Button>
              <Button 
                variant="danger" 
                onClick={handleRejectFarmer}
                disabled={actionInProgress}
                className="rounded-pill px-4"
              >
                {actionInProgress ? <Spinner size="sm" animation="border" className="me-2" /> : <FaTimes className="me-2" />} 
                Reddet
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminFarmerRequestsPage; 