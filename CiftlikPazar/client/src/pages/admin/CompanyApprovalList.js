import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col, Nav, Tab } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye, FaUser, FaMapMarkerAlt, FaEnvelope, FaBuilding, FaSync, FaFilter, FaSearch, FaExclamationCircle, FaInfo, FaCalendarAlt, FaPhone, FaInfoCircle } from 'react-icons/fa';

// Görünürlüğü takip eden custom hook
function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return isVisible;
}

const CompanyApprovalList = ({ apiClient, onApprovalUpdate }) => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [rejectedCompanies, setRejectedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filteredPendingCompanies, setFilteredPendingCompanies] = useState([]);
  const [filteredApprovedCompanies, setFilteredApprovedCompanies] = useState([]);
  const [filteredRejectedCompanies, setFilteredRejectedCompanies] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  const isPageVisible = usePageVisibility();
  
  // Tüm sekme sayılarını güncelleme fonksiyonu
  const fetchAllTabCounts = async () => {
    try {
      // Tüm firmaları getir ve durumlarına göre filtreleme yap
      const response = await apiClient.get('/api/companies');
      
      if (response.data && response.data.success) {
        const allCompanies = response.data.data || [];
        
        // User modelindeki approvalStatus'a göre filtreleme
        const pending = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'pending'
        ).length;
        
        const approved = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'approved'
        ).length;
        
        const rejected = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'rejected'
        ).length;
        
        setTabCounts({
          pending,
          approved,
          rejected
        });
        
        // Admin panelindeki sayıları güncelle
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      }
    } catch (err) {
      console.error('Tab sayıları getirilirken hata:', err);
    }
  };
  
  // Component yüklendiğinde verileri getir
  const initPage = async () => {
    try {
      // Önce tüm sekme sayılarını getir
      await fetchAllTabCounts();
      
      // Aktif tab ne ise ona ait verileri yükle
      if (activeTab === 'pending') {
        setLoading(true);
        await fetchPendingCompanies();
      } else if (activeTab === 'approved') {
        setLoadingApproved(true);
        await fetchApprovedCompanies();
      } else if (activeTab === 'rejected') {
        setLoadingRejected(true);
        await fetchRejectedCompanies();
      }
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
      setError("Firma verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
    }
  };

  // Onay bekleyen firmaları getir
  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Onay bekleyen firmalar için API çağrısı yapılıyor...');
      // Users koleksiyonundaki duruma göre filtreleme yapalım
      const response = await apiClient.get('/api/companies');
      console.log('Firmalar API yanıtı:', response.data);
      
      if (response.data && response.data.success) {
        // User modelindeki approvalStatus'a göre filtreleme yapalım
        const allCompanies = response.data.data || [];
        const pendingData = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'pending'
        );
        
        setPendingCompanies(pendingData);
        setFilteredPendingCompanies(pendingData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          pending: pendingData.length
        }));
      } else {
        throw new Error('Onay bekleyen firmalar getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onay bekleyen firmaları getirme hatası:', err);
      setError('Onay bekleyen firmalar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Onaylanmış firmaları getir
  const fetchApprovedCompanies = async () => {
    try {
      setLoadingApproved(true);
      setError(null);
      
      console.log('Onaylanmış firmalar için API çağrısı yapılıyor...');
      // Users koleksiyonundaki duruma göre filtreleme yapalım
      const response = await apiClient.get('/api/companies');
      console.log('Firmalar API yanıtı:', response.data);
      
      if (response.data && response.data.success) {
        // User modelindeki approvalStatus'a göre filtreleme yapalım
        const allCompanies = response.data.data || [];
        const approvedData = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'approved'
        );
        
        setApprovedCompanies(approvedData);
        setFilteredApprovedCompanies(approvedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          approved: approvedData.length
        }));
      } else {
        throw new Error('Onaylanmış firmalar getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onaylanmış firmaları getirme hatası:', err);
      setError('Onaylanmış firmalar yüklenirken bir hata oluştu.');
    } finally {
      setLoadingApproved(false);
    }
  };

  // Reddedilen firmaları getir
  const fetchRejectedCompanies = async () => {
    try {
      setLoadingRejected(true);
      setError(null);
      
      console.log('Reddedilen firmalar için API çağrısı yapılıyor...');
      // Users koleksiyonundaki duruma göre filtreleme yapalım
      const response = await apiClient.get('/api/companies');
      console.log('Firmalar API yanıtı:', response.data);
      
      if (response.data && response.data.success) {
        // User modelindeki approvalStatus'a göre filtreleme yapalım
        const allCompanies = response.data.data || [];
        const rejectedData = allCompanies.filter(company => 
          company.user && company.user.approvalStatus === 'rejected'
        );
        
        setRejectedCompanies(rejectedData);
        setFilteredRejectedCompanies(rejectedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          rejected: rejectedData.length
        }));
      } else {
        throw new Error('Reddedilen firmalar getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Reddedilen firmaları getirme hatası:', err);
      setError('Reddedilen firmalar yüklenirken bir hata oluştu.');
    } finally {
      setLoadingRejected(false);
    }
  };

  // Tab değişikliği
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    // Her tab değişiminde ilgili verileri yeniden yükle
    if (tabKey === 'pending') {
      fetchPendingCompanies();
    } else if (tabKey === 'approved') {
      fetchApprovedCompanies();
    } else if (tabKey === 'rejected') {
      fetchRejectedCompanies();
    }
  };

  // Firma detaylarını görüntüle
  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  // Detay modalını kapat
  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    setSelectedCompany(null);
  };

  // Reddetme modalını aç
  const handleShowRejectModal = (company) => {
    setSelectedCompany(company);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Reddetme modalını kapat
  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
  };

  // Aktif sekmeyi yenile
  const handleRefreshTab = () => {
    initPage();
  };

  // Filtre değişikliği
  const handleFilterChange = (e) => {
    const keyword = e.target.value.toLowerCase();
    setFilterKeyword(keyword);
    
    if (activeTab === 'pending') {
      setFilteredPendingCompanies(
        pendingCompanies.filter(company => 
          company.companyName?.toLowerCase().includes(keyword) ||
          company.user?.firstName?.toLowerCase().includes(keyword) ||
          company.user?.lastName?.toLowerCase().includes(keyword) ||
          company.user?.email?.toLowerCase().includes(keyword) ||
          company.city?.toLowerCase().includes(keyword) ||
          company.district?.toLowerCase().includes(keyword) ||
          company.taxNumber?.toLowerCase().includes(keyword)
        )
      );
    } else if (activeTab === 'approved') {
      setFilteredApprovedCompanies(
        approvedCompanies.filter(company => 
          company.companyName?.toLowerCase().includes(keyword) ||
          company.user?.firstName?.toLowerCase().includes(keyword) ||
          company.user?.lastName?.toLowerCase().includes(keyword) ||
          company.user?.email?.toLowerCase().includes(keyword) ||
          company.city?.toLowerCase().includes(keyword) ||
          company.district?.toLowerCase().includes(keyword) ||
          company.taxNumber?.toLowerCase().includes(keyword)
        )
      );
    } else if (activeTab === 'rejected') {
      setFilteredRejectedCompanies(
        rejectedCompanies.filter(company => 
          company.companyName?.toLowerCase().includes(keyword) ||
          company.user?.firstName?.toLowerCase().includes(keyword) ||
          company.user?.lastName?.toLowerCase().includes(keyword) ||
          company.user?.email?.toLowerCase().includes(keyword) ||
          company.city?.toLowerCase().includes(keyword) ||
          company.district?.toLowerCase().includes(keyword) ||
          company.taxNumber?.toLowerCase().includes(keyword)
        )
      );
    }
  };

  // Mevcut sekmeye göre verileri döndür
  const getCurrentData = () => {
    if (activeTab === 'pending') {
      return filteredPendingCompanies;
    } else if (activeTab === 'approved') {
      return filteredApprovedCompanies;
    } else if (activeTab === 'rejected') {
      return filteredRejectedCompanies;
    }
    return [];
  };

  // Mevcut sekmenin yükleme durumunu döndür
  const isCurrentTabLoading = () => {
    if (activeTab === 'pending') {
      return loading;
    } else if (activeTab === 'approved') {
      return loadingApproved;
    } else if (activeTab === 'rejected') {
      return loadingRejected;
    }
    return false;
  };

  // Sayfa görünür olduğunda ve component yüklendiğinde verileri getir
  useEffect(() => {
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sayfa yeniden görünür olduğunda verileri yenile
  useEffect(() => {
    if (isPageVisible) {
      fetchAllTabCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageVisible]);

  // Durum badgesi
  const getStatusBadge = (company) => {
    // User modelindeki approvalStatus'a göre badge göster
    const status = company.user?.approvalStatus || company.approvalStatus;
    
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

  // Tarih formatı
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

  // Firma onaylama işlemi
  const handleApproveCompany = async (id) => {
    try {
      setSubmitting(true);
      
      const response = await apiClient.put(`/api/companies/${id}/approval`, {
        approvalStatus: 'approved'
      });
      
      if (response.data && response.data.success) {
        // Onay bekleyen listesinden kaldır
        setPendingCompanies(pendingCompanies.filter(company => company._id !== id));
        setFilteredPendingCompanies(filteredPendingCompanies.filter(company => company._id !== id));
        
        // Onaylanan listeye ekle
        const approvedCompany = pendingCompanies.find(company => company._id === id);
        if (approvedCompany) {
          // User modelindeki approvalStatus'ı da güncelle
          approvedCompany.approvalStatus = 'approved';
          if (approvedCompany.user) {
            approvedCompany.user.approvalStatus = 'approved';
          }
          
          setApprovedCompanies([approvedCompany, ...approvedCompanies]);
          setFilteredApprovedCompanies([approvedCompany, ...filteredApprovedCompanies]);
        }
        
        // Sekme sayılarını güncelle
        setTabCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
        
        // Modalı kapat
        setShowCompanyModal(false);
        setSelectedCompany(null);
        
        // Admin panelindeki sayıları güncelle
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      } else {
        throw new Error('Firma onaylama işlemi başarısız oldu.');
      }
    } catch (err) {
      console.error('Firma onaylama hatası:', err);
      setError('Firma onaylanırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Firma reddetme işlemi
  const handleRejectCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.put(`/api/companies/${selectedCompany._id}/approval`, {
        approvalStatus: 'rejected',
        rejectionReason: rejectionReason
      });
      
      if (response.data && response.data.success) {
        // Onay bekleyen listesinden kaldır
        setPendingCompanies(pendingCompanies.filter(company => company._id !== selectedCompany._id));
        setFilteredPendingCompanies(filteredPendingCompanies.filter(company => company._id !== selectedCompany._id));
        
        // Reddedilen listeye ekle
        const rejectedCompany = pendingCompanies.find(company => company._id === selectedCompany._id);
        if (rejectedCompany) {
          // User modelindeki approvalStatus'ı da güncelle
          rejectedCompany.approvalStatus = 'rejected';
          if (rejectedCompany.user) {
            rejectedCompany.user.approvalStatus = 'rejected';
          }
          
          rejectedCompany.rejectionReason = rejectionReason;
          setRejectedCompanies([rejectedCompany, ...rejectedCompanies]);
          setFilteredRejectedCompanies([rejectedCompany, ...filteredRejectedCompanies]);
        }
        
        // Sekme sayılarını güncelle
        setTabCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          rejected: prev.rejected + 1
        }));
        
        // Modalları kapat
        setShowRejectModal(false);
        setShowCompanyModal(false);
        setSelectedCompany(null);
        setRejectionReason('');
        
        // Admin panelindeki sayıları güncelle
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      } else {
        throw new Error('Firma reddetme işlemi başarısız oldu.');
      }
    } catch (err) {
      console.error('Firma reddetme hatası:', err);
      setError('Firma reddedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h4 className={`border-bottom pb-3 mb-4 ${
        activeTab === 'pending' ? 'text-warning' : 
        activeTab === 'approved' ? 'text-success' : 
        'text-danger'
      } d-flex align-items-center justify-content-between`}>
        <div className="d-flex align-items-center">
          <div className={`${
            activeTab === 'pending' ? 'bg-warning' : 
            activeTab === 'approved' ? 'bg-success' : 
            'bg-danger'
          } p-2 rounded-circle me-2 d-flex align-items-center justify-content-center`}>
            <FaBuilding className="text-white" />
          </div>
          <span>
            {activeTab === 'pending' ? 'Onay Bekleyen Firmalar' : 
             activeTab === 'approved' ? 'Onaylanmış Firmalar' : 
             'Reddedilmiş Firmalar'}
          </span>
        </div>
      </h4>
      
      {/* Hata Mesajı */}
      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col md={5} lg={4} xl={3} className="mb-3 mb-md-0">
          <Card className="border-0 shadow-sm" style={{ maxHeight: '600px', overflow: 'hidden' }}>
            <Card.Body className="p-0">
              <div className={`p-4 ${
                activeTab === 'pending' ? 'bg-warning' : 
                activeTab === 'approved' ? 'bg-success' : 
                'bg-danger'
              } bg-opacity-10 text-center rounded-top`}>
                <div className={`d-inline-flex align-items-center justify-content-center ${
                  activeTab === 'pending' ? 'bg-warning' : 
                  activeTab === 'approved' ? 'bg-success' : 
                  'bg-danger'
                } bg-opacity-25 rounded-circle mb-3`} style={{width: '70px', height: '70px'}}>
                  {activeTab === 'pending' && <FaBuilding className="text-warning" size={30} />}
                  {activeTab === 'approved' && <FaCheck className="text-success" size={30} />}
                  {activeTab === 'rejected' && <FaTimes className="text-danger" size={30} />}
                </div>
                <h2 className="display-6 fw-bold mb-0">
                  {activeTab === 'pending' && filteredPendingCompanies.length}
                  {activeTab === 'approved' && filteredApprovedCompanies.length}
                  {activeTab === 'rejected' && filteredRejectedCompanies.length}
                </h2>
                <p className={`mb-0 mt-1 ${
                  activeTab === 'pending' ? 'text-warning' : 
                  activeTab === 'approved' ? 'text-success' : 
                  'text-danger'
                } fw-semibold`}>
                  {activeTab === 'pending' && 'Onay Bekleyen Firma'}
                  {activeTab === 'approved' && 'Onaylanmış Firma'}
                  {activeTab === 'rejected' && 'Reddedilmiş Firma'}
                </p>
              </div>
              
              <div className="p-4">
                <Form.Group className="mb-0">
                  <Form.Label className="text-muted fw-semibold d-flex align-items-center">
                    <FaSearch className="me-2" size={14} /> Firma Ara
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Firma adı, yetkili veya konum"
                    value={filterKeyword}
                    onChange={handleFilterChange}
                    className="form-control-lg rounded-pill shadow-sm border"
                  />
                </Form.Group>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={7} lg={8} xl={9}>
          <Nav 
            variant="tabs" 
            className="nav-fill mb-4 border-0 bg-white shadow-sm rounded-3 p-1" 
          >
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'pending'} 
                onClick={() => handleTabChange('pending')}
                className={`rounded-3 py-3 d-flex flex-column align-items-center border-0 ${activeTab === 'pending' ? 'bg-warning bg-opacity-25 text-warning' : 'bg-warning bg-opacity-10 text-muted'}`}
              >
                <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center mb-2 ${activeTab === 'pending' ? 'bg-warning bg-opacity-50' : 'bg-warning bg-opacity-25'}`} style={{width: '50px', height: '50px'}}>
                  <FaBuilding size={20} />
                </div>
                <div className="fw-semibold">Bekleyen</div>
                <div className="badge bg-warning bg-opacity-25 text-warning fw-normal mt-1">
                  {tabCounts.pending}
                </div>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'approved'} 
                onClick={() => handleTabChange('approved')}
                className={`rounded-3 py-3 d-flex flex-column align-items-center border-0 ${activeTab === 'approved' ? 'bg-success bg-opacity-25 text-success' : 'bg-success bg-opacity-10 text-muted'}`}
              >
                <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center mb-2 ${activeTab === 'approved' ? 'bg-success bg-opacity-50' : 'bg-success bg-opacity-25'}`} style={{width: '50px', height: '50px'}}>
                  <FaCheck size={20} />
                </div>
                <div className="fw-semibold">Onaylı</div>
                <div className="badge bg-success bg-opacity-25 text-success fw-normal mt-1">
                  {tabCounts.approved}
                </div>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'rejected'} 
                onClick={() => handleTabChange('rejected')}
                className={`rounded-3 py-3 d-flex flex-column align-items-center border-0 ${activeTab === 'rejected' ? 'bg-danger bg-opacity-25 text-danger' : 'bg-danger bg-opacity-10 text-muted'}`}
              >
                <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center mb-2 ${activeTab === 'rejected' ? 'bg-danger bg-opacity-50' : 'bg-danger bg-opacity-25'}`} style={{width: '50px', height: '50px'}}>
                  <FaTimes size={20} />
                </div>
                <div className="fw-semibold">Reddedilen</div>
                <div className="badge bg-danger bg-opacity-25 text-danger fw-normal mt-1">
                  {tabCounts.rejected}
                </div>
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Card className="border-0 shadow-sm" style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'hidden' }}>
            <Card.Body className="p-0">
              <div className={`p-3 ${
                activeTab === 'pending' ? 'bg-warning' : 
                activeTab === 'approved' ? 'bg-success' : 
                'bg-danger'
              } bg-opacity-10 border-bottom`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className={`mb-0 ${
                    activeTab === 'pending' ? 'text-warning' : 
                    activeTab === 'approved' ? 'text-success' : 
                    'text-danger'
                  } fw-bold d-flex align-items-center`}>
                    {activeTab === 'pending' && <><FaBuilding className="me-2" /> Onay Bekleyen Firmalar</>}
                    {activeTab === 'approved' && <><FaCheck className="me-2" /> Onaylanmış Firmalar</>}
                    {activeTab === 'rejected' && <><FaTimes className="me-2" /> Reddedilmiş Firmalar</>}
                  </h5>
                  <Button 
                    variant={
                      activeTab === 'pending' ? 'outline-warning' : 
                      activeTab === 'approved' ? 'outline-success' : 
                      'outline-danger'
                    }
                    size="sm" 
                    className="rounded-pill px-3"
                    onClick={handleRefreshTab}
                    disabled={isCurrentTabLoading()}
                  >
                    {isCurrentTabLoading() ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" />
                        Yenileniyor...
                      </>
                    ) : (
                      <>
                        <FaSync className="me-1" /> Yenile
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Firma Listesi */}
              <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                      <th className="fw-semibold">Firma Bilgisi</th>
                      <th className="fw-semibold" style={{ width: '180px' }}>Yetkili</th>
                      <th className="fw-semibold" style={{ width: '150px' }}>Konum</th>
                      <th className="fw-semibold" style={{ width: '150px' }}>Vergi No</th>
                      <th className="fw-semibold" style={{ width: '120px' }}>Tarih</th>
                      <th className="fw-semibold text-center" style={{ width: '200px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'pending' && (
                      <>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <Spinner animation="border" variant="warning" />
                              <p className="mt-3 text-muted">Onay bekleyen firmalar yükleniyor...</p>
                            </td>
                          </tr>
                        ) : filteredPendingCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <div className="mb-3">
                                <FaCheck className="text-success" size={36} />
                              </div>
                              {filterKeyword.trim() ? (
                                <p className="text-muted mb-0">Arama kriterine uygun firma bulunamadı.</p>
                              ) : (
                                <p className="text-muted mb-0">Onay bekleyen firma bulunmamaktadır.</p>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredPendingCompanies.map((company, index) => (
                            <tr key={company._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaBuilding className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{company.companyName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span className="text-truncate" style={{ maxWidth: '180px' }} title={company.user?.email}>
                                        {company.user?.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{company.user?.firstName} {company.user?.lastName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{company.city}, {company.district}</span>
                                </div>
                              </td>
                              <td>
                                <span>{company.taxNumber}</span>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {formatDate(company.createdAt)}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Firma Detayını Görüntüle"
                                    onClick={() => handleViewDetails(company)}
                                    disabled={submitting}
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Firmayı Onayla"
                                    onClick={() => handleApproveCompany(company._id)}
                                    disabled={submitting}
                                  >
                                    <FaCheck />
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Firmayı Reddet"
                                    onClick={() => handleShowRejectModal(company)}
                                    disabled={submitting}
                                  >
                                    <FaTimes />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <>
                        {loadingApproved ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <Spinner animation="border" variant="success" />
                              <p className="mt-3 text-muted">Onaylanmış firmalar yükleniyor...</p>
                            </td>
                          </tr>
                        ) : filteredApprovedCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <div className="mb-3">
                                <FaExclamationCircle className="text-muted" size={36} />
                              </div>
                              {filterKeyword.trim() ? (
                                <p className="text-muted mb-0">Arama kriterine uygun firma bulunamadı.</p>
                              ) : (
                                <p className="text-muted mb-0">Onaylanmış firma bulunmamaktadır.</p>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredApprovedCompanies.map((company, index) => (
                            <tr key={company._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaBuilding className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{company.companyName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span className="text-truncate" style={{ maxWidth: '180px' }} title={company.user?.email}>
                                        {company.user?.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{company.user?.firstName} {company.user?.lastName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{company.city}, {company.district}</span>
                                </div>
                              </td>
                              <td>
                                <span>{company.taxNumber}</span>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {company.approvalDate ? formatDate(company.approvalDate) : formatDate(company.updatedAt)}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Firma Detayını Görüntüle"
                                    onClick={() => handleViewDetails(company)}
                                  >
                                    <FaEye />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}

                    {activeTab === 'rejected' && (
                      <>
                        {loadingRejected ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <Spinner animation="border" variant="danger" />
                              <p className="mt-3 text-muted">Reddedilen firmalar yükleniyor...</p>
                            </td>
                          </tr>
                        ) : filteredRejectedCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <div className="mb-3">
                                <FaExclamationCircle className="text-muted" size={36} />
                              </div>
                              {filterKeyword.trim() ? (
                                <p className="text-muted mb-0">Arama kriterine uygun firma bulunamadı.</p>
                              ) : (
                                <p className="text-muted mb-0">Reddedilen firma bulunmamaktadır.</p>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredRejectedCompanies.map((company, index) => (
                            <tr key={company._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaBuilding className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{company.companyName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span className="text-truncate" style={{ maxWidth: '180px' }} title={company.user?.email}>
                                        {company.user?.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{company.user?.firstName} {company.user?.lastName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{company.city}, {company.district}</span>
                                </div>
                              </td>
                              <td>
                                <span>{company.taxNumber}</span>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {company.rejectionDate ? formatDate(company.rejectionDate) : formatDate(company.updatedAt)}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Firma Detayını Görüntüle"
                                    onClick={() => handleViewDetails(company)}
                                  >
                                    <FaEye />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Firma Detay Modalı */}
      <Modal 
        show={showCompanyModal} 
        onHide={handleCloseCompanyModal}
        size="lg"
        centered
        dialogClassName="border-0 shadow"
      >
        <Modal.Header className="border-0 pb-0 pt-3 px-4">
          <Modal.Title className="text-success">
            <div className="d-flex align-items-center">
              <div className="bg-success p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '38px', height: '38px'}}>
                <FaBuilding className="text-white" />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Firma Başvuru Detayları</h5>
                <p className="text-muted mb-0 mt-1 small">Firma ve yetkili bilgilerini inceleyebilirsiniz</p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={handleCloseCompanyModal}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="px-4 pt-2">
          {selectedCompany && (
            <div>
              {/* Firma Bilgileri Başlık - Kart Olarak Göster */}
              <Row className="mb-4 mt-3">
                <Col>
                  <Card className="border-0 bg-success bg-opacity-10 shadow-sm overflow-hidden">
                    <Card.Body className="p-0">
                      <div className="d-md-flex">
                        <div className="bg-success bg-opacity-25 p-4 text-center" style={{width: '200px'}}>
                          <div className="rounded-circle bg-white shadow d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                            <FaBuilding className="text-success" size={32} />
                          </div>
                          <h5 className="mb-0 text-success">{selectedCompany.companyName}</h5>
                          <div className="d-flex align-items-center justify-content-center mt-2 text-success">
                            <FaMapMarkerAlt className="me-1" size={12} />
                            <small>{selectedCompany.city}, {selectedCompany.district}</small>
                          </div>
                        </div>
                        
                        <div className="p-4 w-100">
                          <Row className="g-3">
                            <Col md={6} className="border-end">
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaUser className="text-primary" />
                                </div>
                                <div>
                                  <div className="text-muted small">Yetkili</div>
                                  <div className="fw-bold">{selectedCompany.user?.firstName} {selectedCompany.user?.lastName}</div>
                                </div>
                              </div>
                              
                              <div className="d-flex mb-3">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3 flex-shrink-0">
                                  <FaEnvelope className="text-primary" />
                                </div>
                                <div style={{ wordBreak: 'break-word' }}>
                                  <div className="text-muted small">İletişim</div>
                                  <div className="fw-bold">{selectedCompany.user?.email}</div>
                                </div>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaPhone className="text-success" />
                                </div>
                                <div>
                                  <div className="text-muted small">Telefon</div>
                                  <div className="fw-bold">{selectedCompany.user?.phone || 'Belirtilmemiş'}</div>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaInfo className="text-success" />
                                </div>
                                <div>
                                  <div className="text-muted small">Vergi No</div>
                                  <div className="fw-bold">{selectedCompany.taxNumber || 'Belirtilmemiş'}</div>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row className="mb-4">
                {/* Sol Sütun - Firma Bilgileri */}
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="fw-bold d-flex align-items-center text-primary">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                          <FaBuilding className="text-primary" />
                        </div>
                        Firma Bilgileri
                      </h5>
                    </Card.Header>
                    
                    <Card.Body className="pt-2">
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Firma Adı</div>
                        <div className="fw-medium text-break">{selectedCompany.companyName}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Vergi Numarası</div>
                        <div className="fw-medium">{selectedCompany.taxNumber}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Vergi Dairesi</div>
                        <div className="fw-medium text-break">{selectedCompany.taxOffice}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Adres</div>
                        <div className="fw-medium text-break">{selectedCompany.address}</div>
                        <div className="fw-medium">{selectedCompany.district}/{selectedCompany.city}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                {/* Sağ Sütun - İletişim Bilgileri */}
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="fw-bold d-flex align-items-center text-success">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                          <FaPhone className="text-success" />
                        </div>
                        İletişim Bilgileri
                      </h5>
                    </Card.Header>
                    
                    <Card.Body className="pt-2">
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Yetkili</div>
                        <div className="fw-medium text-break">{selectedCompany.user?.firstName} {selectedCompany.user?.lastName}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">E-posta</div>
                        <div className="fw-medium text-break">{selectedCompany.user?.email}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">Telefon</div>
                        <div className="fw-medium">{selectedCompany.user?.phone || 'Belirtilmemiş'}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-muted small mb-1">İletişim Kişisi</div>
                        <div className="fw-medium text-break">{selectedCompany.contactPerson?.name || 'Belirtilmemiş'}</div>
                        {selectedCompany.contactPerson?.phone && (
                          <div className="text-muted small d-flex align-items-center">
                            <FaPhone className="me-1" size={10} /> 
                            <span className="text-break">{selectedCompany.contactPerson.phone}</span>
                          </div>
                        )}
                        {selectedCompany.contactPerson?.email && (
                          <div className="text-muted small d-flex align-items-center">
                            <FaEnvelope className="me-1" size={10} /> 
                            <span className="text-break">{selectedCompany.contactPerson.email}</span>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row>
                <Col>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="fw-bold d-flex align-items-center text-info">
                        <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                          <FaCalendarAlt className="text-info" />
                        </div>
                        Durum Bilgisi
                      </h5>
                    </Card.Header>
                    
                    <Card.Body className="pt-2">
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Kayıt Tarihi</div>
                            <div className="fw-medium">{formatDate(selectedCompany.createdAt)}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <div className="text-muted small mb-1">Durum</div>
                            <div>{getStatusBadge(selectedCompany)}</div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Onay/Ret Butonları */}
              {activeTab === 'pending' && (
                <div className="d-flex justify-content-end gap-3 mt-4">
                  <Button 
                    variant="outline-danger" 
                    onClick={() => handleShowRejectModal(selectedCompany)}
                    disabled={submitting}
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                  >
                    <FaTimes className="me-2" /> Reddet
                  </Button>
                  <Button
                    variant="success"
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                    onClick={() => handleApproveCompany(selectedCompany._id)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <FaCheck className="me-2" /> Onayla
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Reddetme Modalı */}
      <Modal
        show={showRejectModal}
        onHide={handleCloseRejectModal}
        centered
        backdrop="static"
        keyboard={false}
        size="lg"
        dialogClassName="border-0 shadow"
      >
        <Modal.Header className="border-0 pb-0 pt-3 px-4">
          <Modal.Title className="text-danger">
            <div className="d-flex align-items-center">
              <div className="bg-danger p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '38px', height: '38px'}}>
                <i className="text-white fw-bold" style={{fontSize: '18px', fontStyle: 'normal'}}>R</i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Firma Başvurusu Reddetme</h5>
                <p className="text-muted mb-0 mt-1 small">Bu işlem firmaya bildirilecek ve başvuru sürecinden çıkarılacaktır</p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={handleCloseRejectModal}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="pt-0 pb-0 px-4">
          {selectedCompany && (
            <>
              <Row className="mb-4 mt-3">
                <Col>
                  <Card className="border-0 bg-light shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded bg-success bg-opacity-10 d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: '80px', height: '80px', flexShrink: 0 }}
                        >
                          <FaBuilding className="text-success" size={28} />
                        </div>
                        <div className="ms-3 overflow-hidden">
                          <h5 className="mb-1 text-success text-truncate">{selectedCompany.companyName}</h5>
                          
                          <div className="d-flex flex-wrap gap-3 text-muted small">
                            <div>
                              <strong>Yetkili:</strong> {selectedCompany.user?.firstName} {selectedCompany.user?.lastName}
                            </div>
                            <div>
                              <strong>Konum:</strong> {selectedCompany.city}, {selectedCompany.district}
                            </div>
                            <div className="d-flex align-items-center text-truncate" style={{ maxWidth: '100%' }}>
                              <strong>E-posta:</strong> 
                              <span className="text-truncate ms-1" title={selectedCompany.user?.email}>
                                {selectedCompany.user?.email}
                              </span>
                            </div>
                            <div>
                              <strong>Vergi No:</strong> {selectedCompany.taxNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="mb-4">
                <h6 className="mb-3 d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                    <FaFilter className="text-success" size={14} />
                  </div>
                  Hızlı Red Nedenleri <span className="text-muted ms-2 small">(Birden fazla seçebilirsiniz)</span>
                </h6>
                
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {[
                    "Firma faaliyeti ile ilgili doğrulanabilir bilgi eksik",
                    "Belirtilen konum ile iletişim bilgileri uyuşmuyor",
                    "Vergi numarası doğrulanamadı",
                    "Vergi dairesi bilgisi hatalı",
                    "Firma adı/lokasyon bilgileri eksik veya yetersiz",
                    "Başvuruda talep edilen belgeler eksik"
                  ].map((reason, index) => {
                    // Seçili neden varsa kontrol et
                    const isSelected = rejectionReason.includes(reason);
                    
                    return (
                      <Badge 
                        key={index}
                        bg={isSelected ? "success" : "light"}
                        text={isSelected ? "white" : "dark"} 
                        className={`border py-2 px-3 cursor-pointer ${isSelected ? 'border-success' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onClick={() => {
                          // Eğer seçili ise kaldır, değilse ekle
                          if (isSelected) {
                            setRejectionReason(rejectionReason.replace(reason, "").trim());
                          } else {
                            const newReason = rejectionReason ? `${rejectionReason}\n• ${reason}` : `• ${reason}`;
                            setRejectionReason(newReason);
                          }
                        }}
                      >
                        {isSelected && <FaCheck className="me-1" size={10} />}
                        {reason}
                      </Badge>
                    );
                  })}
                </div>
                
                <Form.Group>
                  <Form.Label className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                      <FaInfoCircle className="text-success" size={14} />
                    </div>
                    <span>Özel Red Nedeni (Opsiyonel)</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ek açıklamalarınızı buraya yazabilir veya yukarıdan seçimler yapabilirsiniz"
                    className="border shadow-sm"
                  />
                </Form.Group>
              </div>
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer className="border-0 px-4 py-3 bg-light rounded-bottom">
          <Alert variant="warning" className="d-flex mb-3 border-start border-warning border-4 bg-warning bg-opacity-10 w-100">
            <FaExclamationCircle className="text-warning me-2 mt-1 flex-shrink-0" size={20} />
            <div className="small">
              <strong>Önemli:</strong> Red nedenleri firmaya doğrudan iletilecektir. Açık, yapıcı ve yardımcı olmaya özen gösterin. 
              Firmanın gerekli düzeltmeleri yapıp tekrar başvurmasına yardımcı olacak bilgiler verin.
            </div>
          </Alert>
          
          <div className="d-flex flex-column flex-sm-row gap-2 w-100">
            <Button 
              variant="light" 
              onClick={handleCloseRejectModal}
              disabled={submitting}
              className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-fill"
            >
              <FaTimes className="me-2" /> Vazgeç
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRejectCompany}
              disabled={!rejectionReason.trim() || submitting}
              className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-fill"
            >
              {submitting ? (
                <>
                  <Spinner 
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  İşleniyor...
                </>
              ) : (
                <>
                  <FaTimes className="me-2" /> Reddet ve Bildir
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CompanyApprovalList; 