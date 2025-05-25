import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminCompanyRequestsPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const { data } = await axios.get('/api/companies', config);
      
      if (data && data.success) {
        // Onay bekleyen firmaları en üste getir
        const sortedCompanies = data.data.sort((a, b) => {
          if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
          if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setCompanies(sortedCompanies);
      } else {
        setError('Firma listesi alınırken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Firma listesi alma hatası:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Firma listesi alınırken bir hata oluştu');
      } else {
        setError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };
  
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCompany(null);
  };
  
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setProcessingId(null);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const { data } = await axios.put(`/api/companies/${id}/approval`, {
        approvalStatus: 'approved'
      }, config);
      
      if (data && data.success) {
        toast.success('Firma başarıyla onaylandı', {
          position: "bottom-right",
          autoClose: 3000
        });
        
        // Firmanın durumunu güncelle
        setCompanies(prevCompanies => 
          prevCompanies.map(company => 
            company._id === id 
              ? { ...company, approvalStatus: 'approved' } 
              : company
          )
        );
      } else {
        toast.error('Firma onaylanırken bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Firma onaylama hatası:', err);
      
      if (err.response && err.response.data) {
        toast.error(err.response.data.message || 'Firma onaylanırken bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      } else {
        toast.error('Sunucuya bağlanırken bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      }
    } finally {
      setProcessingId(null);
    }
  };
  
  const openRejectModal = (id) => {
    setProcessingId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setShowRejectModal(false);
        setProcessingId(null);
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const { data } = await axios.put(`/api/companies/${processingId}/approval`, {
        approvalStatus: 'rejected'
      }, config);
      
      if (data && data.success) {
        toast.success('Firma başvurusu reddedildi', {
          position: "bottom-right",
          autoClose: 3000
        });
        
        // Firmanın durumunu güncelle
        setCompanies(prevCompanies => 
          prevCompanies.map(company => 
            company._id === processingId 
              ? { ...company, approvalStatus: 'rejected' } 
              : company
          )
        );
        
        setShowRejectModal(false);
      } else {
        toast.error('Firma reddetme işlemi sırasında bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Firma reddetme hatası:', err);
      
      if (err.response && err.response.data) {
        toast.error(err.response.data.message || 'Firma reddetme işlemi sırasında bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      } else {
        toast.error('Sunucuya bağlanırken bir hata oluştu', {
          position: "bottom-right",
          autoClose: 3000
        });
      }
    } finally {
      setProcessingId(null);
      setShowRejectModal(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Onay Bekliyor</Badge>;
      case 'approved':
        return <Badge bg="success">Onaylandı</Badge>;
      case 'rejected':
        return <Badge bg="danger">Reddedildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };
  
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
  
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-0">Firma Başvuruları</h1>
          <p className="text-muted">Firma hesap başvurularını yönetin</p>
        </Col>
      </Row>
      
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Firma Listesi</h5>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={fetchCompanies}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Yükleniyor...
                </>
              ) : (
                'Yenile'
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              <FaExclamationCircle className="me-2" />
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Firma listesi yükleniyor...</p>
            </div>
          ) : companies.length === 0 ? (
            <Alert variant="info">
              Henüz hiç firma başvurusu bulunmuyor.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Firma Adı</th>
                    <th>İletişim Bilgileri</th>
                    <th>Vergi No</th>
                    <th>Kayıt Tarihi</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company._id}>
                      <td>
                        <div className="fw-medium">{company.companyName}</div>
                        <small className="text-muted">{company.city}/{company.district}</small>
                      </td>
                      <td>
                        <div>{company.user?.firstName} {company.user?.lastName}</div>
                        <small className="text-muted">{company.user?.email}</small>
                      </td>
                      <td>{company.taxNumber}</td>
                      <td>{formatDate(company.createdAt)}</td>
                      <td>{getStatusBadge(company.approvalStatus)}</td>
                      <td>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewDetails(company)}
                        >
                          <FaEye className="me-1" /> Detay
                        </Button>
                        
                        {company.approvalStatus === 'pending' && (
                          <>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="me-2"
                              onClick={() => handleApprove(company._id)}
                              disabled={processingId === company._id}
                            >
                              {processingId === company._id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <><FaCheck className="me-1" /> Onayla</>
                              )}
                            </Button>
                            
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => openRejectModal(company._id)}
                              disabled={processingId === company._id}
                            >
                              <FaTimes className="me-1" /> Reddet
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Firma Detay Modalı */}
      <Modal 
        show={showDetailModal} 
        onHide={handleCloseDetailModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Firma Detayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompany && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h5 className="mb-3">Firma Bilgileri</h5>
                  <p><strong>Firma Adı:</strong> {selectedCompany.companyName}</p>
                  <p><strong>Vergi Numarası:</strong> {selectedCompany.taxNumber}</p>
                  <p><strong>Vergi Dairesi:</strong> {selectedCompany.taxOffice}</p>
                  <p><strong>Firma Türü:</strong> {selectedCompany.companyType}</p>
                  <p><strong>Adres:</strong> {selectedCompany.address}, {selectedCompany.district}/{selectedCompany.city}</p>
                </Col>
                <Col md={6}>
                  <h5 className="mb-3">İletişim Bilgileri</h5>
                  <p><strong>Yetkili:</strong> {selectedCompany.user?.firstName} {selectedCompany.user?.lastName}</p>
                  <p><strong>E-posta:</strong> {selectedCompany.user?.email}</p>
                  <p><strong>Telefon:</strong> {selectedCompany.user?.phone || 'Belirtilmemiş'}</p>
                  <p><strong>İletişim Kişisi:</strong> {selectedCompany.contactPerson?.name}</p>
                  <p><strong>İletişim Telefonu:</strong> {selectedCompany.contactPerson?.phone}</p>
                  <p><strong>İletişim E-posta:</strong> {selectedCompany.contactPerson?.email}</p>
                </Col>
              </Row>
              <Row>
                <Col>
                  <h5 className="mb-3">Durum Bilgisi</h5>
                  <p><strong>Kayıt Tarihi:</strong> {formatDate(selectedCompany.createdAt)}</p>
                  <p><strong>Durum:</strong> {getStatusBadge(selectedCompany.approvalStatus)}</p>
                </Col>
              </Row>
              
              {selectedCompany.approvalStatus === 'pending' && (
                <div className="mt-4 d-flex justify-content-end">
                  <Button 
                    variant="success" 
                    className="me-2"
                    onClick={() => {
                      handleCloseDetailModal();
                      handleApprove(selectedCompany._id);
                    }}
                  >
                    <FaCheck className="me-1" /> Onayla
                  </Button>
                  
                  <Button 
                    variant="danger"
                    onClick={() => {
                      handleCloseDetailModal();
                      openRejectModal(selectedCompany._id);
                    }}
                  >
                    <FaTimes className="me-1" /> Reddet
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Reddetme Modalı */}
      <Modal
        show={showRejectModal}
        onHide={() => {
          setShowRejectModal(false);
          setProcessingId(null);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Firma Başvurusunu Reddet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bu firma başvurusunu reddetmek istediğinizden emin misiniz?</p>
          <Form.Group className="mb-3">
            <Form.Label>Red Sebebi (İsteğe Bağlı)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Firmaya iletilecek red sebebini yazabilirsiniz"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowRejectModal(false);
              setProcessingId(null);
            }}
          >
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleReject}
            disabled={processingId === null}
          >
            {processingId !== null && showRejectModal ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : null}
            Reddet
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminCompanyRequestsPage; 