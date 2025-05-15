import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col, Nav, Tab } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye, FaUser, FaMapMarkerAlt, FaEnvelope, FaTractor, FaCertificate, FaTruck, FaSync, FaFilter, FaSearch, FaLeaf, FaThumbsUp, FaThumbsDown, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaInfo, FaCalendarAlt, FaPhone } from 'react-icons/fa';
import axios from 'axios';

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

// Kategori adını döndüren yardımcı fonksiyon
const getCategoryName = (category) => {
  // Fallback kategori isimleri (API'den veri gelmediği durumlar için)
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

const FarmerApprovalList = ({ apiClient, onApprovalUpdate }) => {
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [approvedFarmers, setApprovedFarmers] = useState([]);
  const [rejectedFarmers, setRejectedFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filteredPendingFarmers, setFilteredPendingFarmers] = useState([]);
  const [filteredApprovedFarmers, setFilteredApprovedFarmers] = useState([]);
  const [filteredRejectedFarmers, setFilteredRejectedFarmers] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  const isPageVisible = usePageVisibility();
  
  // Tüm sekme sayılarını güncelleme fonksiyonu
  const fetchAllTabCounts = async () => {
    try {
      // Tüm sekmelerin sayılarını getirmek için hızlı API çağrıları yap
      const pendingCountPromise = apiClient.get('/api/farmers/pending?count_only=true');
      const approvedCountPromise = apiClient.get('/api/farmers/approved?count_only=true');
      const rejectedCountPromise = apiClient.get('/api/farmers/rejected?count_only=true');
      
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        pendingCountPromise,
        approvedCountPromise,
        rejectedCountPromise
      ]);
      
      const pending = pendingRes.data?.count || pendingRes.data?.data?.length || 0;
      const approved = approvedRes.data?.count || approvedRes.data?.data?.length || 0;
      const rejected = rejectedRes.data?.count || rejectedRes.data?.data?.length || 0;
      
      setTabCounts({
        pending,
        approved,
        rejected
      });
      
      // Admin panelindeki sayıları güncelle
      if (onApprovalUpdate) {
        onApprovalUpdate();
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
        await fetchPendingFarmers();
      } else if (activeTab === 'approved') {
        setLoadingApproved(true);
        await fetchApprovedFarmers();
      } else if (activeTab === 'rejected') {
        setLoadingRejected(true);
        await fetchRejectedFarmers();
      }
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
      setError("Çiftçi verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
    }
  };

  // Onay bekleyen çiftçileri getir
  const fetchPendingFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/farmers/pending');
      
      if (response.data && response.data.success) {
        const pendingData = response.data.data || [];
        setPendingFarmers(pendingData);
        setFilteredPendingFarmers(pendingData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          pending: pendingData.length
        }));
      } else {
        throw new Error('Onay bekleyen çiftçiler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onay bekleyen çiftçileri getirme hatası:', err);
      setError('Onay bekleyen çiftçiler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Onaylanmış çiftçileri getir
  const fetchApprovedFarmers = async () => {
    try {
      setLoadingApproved(true);
      setError(null);
      
      const response = await apiClient.get('/api/farmers/approved');
      
      if (response.data && response.data.success) {
        const approvedData = response.data.data || [];
        setApprovedFarmers(approvedData);
        setFilteredApprovedFarmers(approvedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          approved: approvedData.length
        }));
      } else {
        throw new Error('Onaylanmış çiftçiler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onaylanmış çiftçileri getirme hatası:', err);
      setError('Onaylanmış çiftçiler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingApproved(false);
    }
  };

  // Reddedilen çiftçileri getir
  const fetchRejectedFarmers = async () => {
    try {
      setLoadingRejected(true);
      setError(null);
      
      const response = await apiClient.get('/api/farmers/rejected');
      
      if (response.data && response.data.success) {
        const rejectedData = response.data.data || [];
        setRejectedFarmers(rejectedData);
        setFilteredRejectedFarmers(rejectedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          rejected: rejectedData.length
        }));
      } else {
        throw new Error('Reddedilen çiftçiler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Reddedilen çiftçileri getirme hatası:', err);
      setError('Reddedilen çiftçiler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingRejected(false);
    }
  };

  // Sayfa ilk yüklendiğinde tüm sekme sayılarını ve aktif sekmenin verilerini getir
  useEffect(() => {
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Tab değiştiğinde verileri yükle
  const handleTabChange = (tabKey) => {
    if (tabKey === activeTab) return; // Aynı tab tekrar seçilirse işlem yapma
    
    setFilterKeyword(''); // Tab değiştiğinde filtreyi sıfırla
    setActiveTab(tabKey);
    
    // Tab değişikliğinde ilgili veriyi direkt olarak yükle, koşula bağlı olmadan
    if (tabKey === 'pending') {
      setLoading(true); // Yükleme durumunu aktif et
      fetchPendingFarmers(); // Bekleyen çiftçileri getir
    } else if (tabKey === 'approved') {
      setLoadingApproved(true); // Yükleme durumunu aktif et
      fetchApprovedFarmers(); // Onaylı çiftçileri getir
    } else if (tabKey === 'rejected') {
      setLoadingRejected(true); // Yükleme durumunu aktif et
      fetchRejectedFarmers(); // Reddedilen çiftçileri getir
    }
  };
  
  // Çiftçi detaylarını göster
  const handleViewDetails = (farmer) => {
    setSelectedFarmer(farmer);
    setShowFarmerModal(true);
  };

  // Modalı kapat
  const handleCloseFarmerModal = () => {
    setShowFarmerModal(false);
    setSelectedFarmer(null);
  };

  // Reddetme modalını aç
  const handleShowRejectModal = (farmer) => {
    setSelectedFarmer(farmer);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Reddetme modalını kapat
  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
  };
  
  // Çiftçi onaylama işlemi  
  const handleApproveFarmer = async (id) => {
    try {
      setSubmitting(true);
      
      await apiClient.put(`/api/farmers/${id}/approve`, { approved: true });
      
      // Onay listesinden çıkar
      setPendingFarmers(prev => prev.filter(f => f._id !== id));
      setFilteredPendingFarmers(prev => prev.filter(f => f._id !== id));
      
      // Sayıları güncelle
      fetchAllTabCounts();
      
      // Admin dashboard'da gösterilen sayıları güncelle
      if (onApprovalUpdate) {
        onApprovalUpdate();
      }
      
      // Başarı mesajı 
      setError({ type: 'success', message: 'Çiftçi başvurusu başarıyla onaylandı!' });
      
      // Modali kapat
      if (showFarmerModal) {
        handleCloseFarmerModal();
      }
    } catch (err) {
      console.error('Çiftçi onaylama hatası:', err);
      setError({ type: 'danger', message: `İşlem sırasında bir hata oluştu: ${err.response?.data?.message || err.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Çiftçi reddetme işlemi
  const handleRejectFarmer = async () => {
    if (!selectedFarmer || !rejectionReason.trim()) return;
    
    try {
      setSubmitting(true);
      
      await apiClient.put(`/api/farmers/${selectedFarmer._id}/approve`, { 
        approved: false,
        rejectionReason: rejectionReason
      });
      
      // Onay listesinden çıkar
      setPendingFarmers(prev => prev.filter(f => f._id !== selectedFarmer._id));
      setFilteredPendingFarmers(prev => prev.filter(f => f._id !== selectedFarmer._id));
      
      // Sayıları güncelle
      fetchAllTabCounts();
      
      // Admin dashboard'da gösterilen sayıları güncelle
      if (onApprovalUpdate) {
        onApprovalUpdate();
      }
      
      // Başarı mesajı
      setError({ type: 'success', message: 'Çiftçi başvurusu reddedildi!' });
      
      // Modalı kapat
      handleCloseRejectModal();
    } catch (err) {
      console.error('Çiftçi reddetme hatası:', err);
      setError({ type: 'danger', message: `İşlem sırasında bir hata oluştu: ${err.response?.data?.message || err.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Verileri yenile
  const handleRefreshTab = () => {
    initPage();
  };
  
  // Arama filtresi için
  const handleFilterChange = (e) => {
    const keyword = e.target.value.toLowerCase();
    setFilterKeyword(keyword);
    
    if (activeTab === 'pending') {
      setFilteredPendingFarmers(
        pendingFarmers.filter(farmer => 
          farmer.farmName.toLowerCase().includes(keyword) ||
          farmer.user?.email.toLowerCase().includes(keyword) ||
          farmer.user?.firstName?.toLowerCase().includes(keyword) ||
          farmer.user?.lastName?.toLowerCase().includes(keyword) ||
          farmer.city?.toLowerCase().includes(keyword) ||
          farmer.district?.toLowerCase().includes(keyword)
        )
      );
    } else if (activeTab === 'approved') {
      setFilteredApprovedFarmers(
        approvedFarmers.filter(farmer => 
          farmer.farmName.toLowerCase().includes(keyword) ||
          farmer.user?.email.toLowerCase().includes(keyword) ||
          farmer.user?.firstName?.toLowerCase().includes(keyword) ||
          farmer.user?.lastName?.toLowerCase().includes(keyword) ||
          farmer.city?.toLowerCase().includes(keyword) ||
          farmer.district?.toLowerCase().includes(keyword)
        )
      );
    } else if (activeTab === 'rejected') {
      setFilteredRejectedFarmers(
        rejectedFarmers.filter(farmer => 
          farmer.farmName.toLowerCase().includes(keyword) ||
          farmer.user?.email.toLowerCase().includes(keyword) ||
          farmer.user?.firstName?.toLowerCase().includes(keyword) ||
          farmer.user?.lastName?.toLowerCase().includes(keyword) ||
          farmer.city?.toLowerCase().includes(keyword) ||
          farmer.district?.toLowerCase().includes(keyword)
        )
      );
    }
  };
  
  // Kategorileri görüntüleme
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
  
  // Mevcut sekmede gösterilecek veri listesi
  const getCurrentData = () => {
    switch (activeTab) {
      case 'pending':
        return filteredPendingFarmers;
      case 'approved':
        return filteredApprovedFarmers;
      case 'rejected':
        return filteredRejectedFarmers;
      default:
        return [];
    }
  };
  
  // Mevcut yükleniyor durumu
  const isCurrentTabLoading = () => {
    switch (activeTab) {
      case 'pending':
        return loading;
      case 'approved':
        return loadingApproved;
      case 'rejected':
        return loadingRejected;
      default:
        return false;
    }
  };

  return (
    <div className="pb-5 mb-5">
      <h4 className="border-bottom pb-3 mb-4 text-success d-flex align-items-center">
        <FaTractor className="me-2" /> Çiftçi Başvuru İşlemleri
      </h4>
      
      {error && (
        <Alert 
          variant={typeof error === 'object' && error.type ? error.type : "danger"} 
          className="mb-4 d-flex align-items-center"
          dismissible
          onClose={() => setError(null)}
        >
          {typeof error === 'object' && error.type === 'success' ? (
            <FaCheck className="me-2" />
          ) : (
            <FaExclamationTriangle className="me-2" />
          )}
          {typeof error === 'object' && error.message ? error.message : error}
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
                  {activeTab === 'pending' && <FaTractor className="text-warning" size={30} />}
                  {activeTab === 'approved' && <FaThumbsUp className="text-success" size={30} />}
                  {activeTab === 'rejected' && <FaThumbsDown className="text-danger" size={30} />}
                </div>
                <h2 className="display-6 fw-bold mb-0">
                  {activeTab === 'pending' && filteredPendingFarmers.length}
                  {activeTab === 'approved' && filteredApprovedFarmers.length}
                  {activeTab === 'rejected' && filteredRejectedFarmers.length}
                </h2>
                <p className={`mb-0 mt-1 ${
                  activeTab === 'pending' ? 'text-warning' : 
                  activeTab === 'approved' ? 'text-success' : 
                  'text-danger'
                } fw-semibold`}>
                  {activeTab === 'pending' && 'Onay Bekleyen Çiftçi'}
                  {activeTab === 'approved' && 'Onaylanmış Çiftçi'}
                  {activeTab === 'rejected' && 'Reddedilmiş Çiftçi'}
                </p>
              </div>
              
              <div className="p-4">
                <Form.Group className="mb-0">
                  <Form.Label className="text-muted fw-semibold d-flex align-items-center">
                    <FaSearch className="me-2" size={14} /> Çiftçi Ara
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Çiftçi adı, çiftlik veya konum"
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
                  <FaTractor size={20} />
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
                  <FaThumbsUp size={20} />
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
                  <FaThumbsDown size={20} />
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
                    {activeTab === 'pending' && <><FaTractor className="me-2" /> Onay Bekleyen Çiftçiler</>}
                    {activeTab === 'approved' && <><FaThumbsUp className="me-2" /> Onaylanmış Çiftçiler</>}
                    {activeTab === 'rejected' && <><FaThumbsDown className="me-2" /> Reddedilmiş Çiftçiler</>}
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
              
              {/* ONAY BEKLEYEN ÇİFTÇİLER */}
              {activeTab === 'pending' && (
                <>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="warning" />
                      <p className="mt-3 text-muted">Onay bekleyen çiftçiler yükleniyor...</p>
                    </div>
                  ) : filteredPendingFarmers.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaCheck className="text-success" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun çiftçi bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Onay bekleyen çiftçi bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Çiftçi Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '180px' }}>Çiftlik</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Konum</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Tarih</th>
                            <th className="fw-semibold text-center" style={{ width: '200px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPendingFarmers.map((farmer, index) => (
                            <tr key={farmer._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaUser className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{farmer.user?.firstName} {farmer.user?.lastName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span>{farmer.user?.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{farmer.farmName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{farmer.city}, {farmer.district}</span>
                                </div>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {new Date(farmer.user?.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Çiftçi Detayını Görüntüle"
                                    onClick={() => handleViewDetails(farmer)}
                                    disabled={submitting}
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Çiftçiyi Onayla"
                                    onClick={() => handleApproveFarmer(farmer._id)}
                                    disabled={submitting}
                                  >
                                    <FaCheck />
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Çiftçiyi Reddet"
                                    onClick={() => handleShowRejectModal(farmer)}
                                    disabled={submitting}
                                  >
                                    <FaTimes />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              )}
              
              {/* ONAYLANMIŞ ÇİFTÇİLER */}
              {activeTab === 'approved' && (
                <>
                  {loadingApproved ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                      <p className="mt-3 text-muted">Onaylanmış çiftçiler yükleniyor...</p>
                    </div>
                  ) : filteredApprovedFarmers.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaExclamationCircle className="text-muted" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun çiftçi bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Onaylanmış çiftçi bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Çiftçi Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '180px' }}>Çiftlik</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Konum</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Onay Tarihi</th>
                            <th className="fw-semibold text-center" style={{ width: '100px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApprovedFarmers.map((farmer, index) => (
                            <tr key={farmer._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaUser className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{farmer.user?.firstName} {farmer.user?.lastName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span>{farmer.user?.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{farmer.farmName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{farmer.city}, {farmer.district}</span>
                                </div>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {farmer.approvalDate ? new Date(farmer.approvalDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Çiftçi Detayını Görüntüle"
                                    onClick={() => handleViewDetails(farmer)}
                                  >
                                    <FaEye />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              )}
              
              {/* REDDEDİLEN ÇİFTÇİLER */}
              {activeTab === 'rejected' && (
                <>
                  {loadingRejected ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="danger" />
                      <p className="mt-3 text-muted">Reddedilen çiftçiler yükleniyor...</p>
                    </div>
                  ) : filteredRejectedFarmers.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaExclamationCircle className="text-muted" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun çiftçi bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Reddedilen çiftçi bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Çiftçi Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '180px' }}>Çiftlik</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Konum</th>
                            <th className="fw-semibold">Red Nedeni</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Red Tarihi</th>
                            <th className="fw-semibold text-center" style={{ width: '100px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRejectedFarmers.map((farmer, index) => (
                            <tr key={farmer._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <FaUser className="text-dark" />
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{farmer.user?.firstName} {farmer.user?.lastName}</div>
                                    <div className="small text-muted d-flex align-items-center">
                                      <FaEnvelope className="me-1" size={12} />
                                      <span>{farmer.user?.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-medium">{farmer.farmName}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaMapMarkerAlt className="text-muted me-2" size={14} />
                                  <span>{farmer.city}, {farmer.district}</span>
                                </div>
                              </td>
                              <td>
                                <small className="text-danger">
                                  {farmer.rejectionReason ? 
                                    (farmer.rejectionReason.length > 100 ? 
                                      `${farmer.rejectionReason.substring(0, 100)}...` : 
                                      farmer.rejectionReason) : 
                                    'Belirtilmemiş'}
                                </small>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {farmer.rejectionDate ? new Date(farmer.rejectionDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Çiftçi Detayını Görüntüle"
                                    onClick={() => handleViewDetails(farmer)}
                                  >
                                    <FaEye />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Çiftçi Detay Modalı */}
      <Modal 
        show={showFarmerModal} 
        onHide={handleCloseFarmerModal} 
        size="lg" 
        centered
        dialogClassName="border-0 shadow"
      >
        <Modal.Header className="border-0 pb-0 pt-3 px-4">
          <Modal.Title className="text-success">
            <div className="d-flex align-items-center">
              <div className="bg-success p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '38px', height: '38px'}}>
                <FaTractor className="text-white" />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Çiftçi Başvuru Detayları</h5>
                <p className="text-muted mb-0 mt-1 small">Çiftçi ve çiftlik bilgilerini inceleyebilirsiniz</p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={handleCloseFarmerModal}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="px-4 pt-2">
          {selectedFarmer && (
            <div>
              {/* Çiftlik Bilgileri Başlık - Kart Olarak Göster */}
              <Row className="mb-4 mt-3">
                <Col>
                  <Card className="border-0 bg-success bg-opacity-10 shadow-sm overflow-hidden">
                    <Card.Body className="p-0">
                      <div className="d-md-flex">
                        <div className="bg-success bg-opacity-25 p-4 text-center" style={{width: '200px'}}>
                          <div className="rounded-circle bg-white shadow d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                            <FaTractor className="text-success" size={32} />
                          </div>
                          <h5 className="mb-0 text-success">{selectedFarmer.farmName}</h5>
                          <div className="d-flex align-items-center justify-content-center mt-2 text-success">
                            <FaMapMarkerAlt className="me-1" size={12} />
                            <small>{selectedFarmer.city}, {selectedFarmer.district}</small>
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
                                  <div className="text-muted small">Çiftçi</div>
                                  <div className="fw-bold">{selectedFarmer.user?.firstName} {selectedFarmer.user?.lastName}</div>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaEnvelope className="text-primary" />
                                </div>
                                <div>
                                  <div className="text-muted small">İletişim</div>
                                  <div className="fw-bold">{selectedFarmer.user?.email}</div>
                                </div>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaLeaf className="text-success" />
                                </div>
                                <div>
                                  <div className="text-muted small">Kategoriler</div>
                                  <div>
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success me-1">
                                      {selectedFarmer.categories && selectedFarmer.categories.length > 0 ? 
                                      getCategoryName(selectedFarmer.categories[0]) : 'Belirtilmemiş'}
                                    </span>
                                    {selectedFarmer.categories && selectedFarmer.categories.length > 1 && 
                                      <span className="badge bg-light text-muted">+{selectedFarmer.categories.length - 1} diğer</span>}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                  <FaInfo className="text-success" />
                                </div>
                                <div>
                                  <div className="text-muted small">Vergi No</div>
                                  <div className="fw-bold">{selectedFarmer.taxNumber || 'Belirtilmemiş'}</div>
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
                {/* Sol Sütun - Kişisel Bilgiler */}
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="fw-bold d-flex align-items-center text-primary">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                          <FaUser className="text-primary" />
                        </div>
                        Kişisel Bilgiler
                      </h5>
                    </Card.Header>
                    
                    <Card.Body className="pt-2">
                      <div className="mb-3 border-bottom pb-3">
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaUser className="me-2" size={12} /> Ad Soyad
                        </div>
                        <div className="fw-medium">
                          {selectedFarmer.user?.firstName} {selectedFarmer.user?.lastName}
                        </div>
                      </div>
                      
                      <div className="mb-3 border-bottom pb-3">
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaEnvelope className="me-2" size={12} /> E-posta
                        </div>
                        <div className="fw-medium">
                          {selectedFarmer.user?.email}
                        </div>
                      </div>
                      
                      <div className="mb-3 border-bottom pb-3">
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaPhone className="me-2" size={12} /> Telefon
                        </div>
                        <div className="fw-medium">
                          {selectedFarmer.user?.phone || 'Belirtilmemiş'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaCalendarAlt className="me-2" size={12} /> Başvuru Tarihi
                        </div>
                        <div className="fw-medium">
                          {new Date(selectedFarmer.user?.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                {/* Sağ Sütun - Çiftlik Detayları */}
                <Col md={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 pt-3 pb-0">
                      <h5 className="fw-bold d-flex align-items-center text-success">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                          <FaTractor className="text-success" />
                        </div>
                        Çiftlik Detayları
                      </h5>
                    </Card.Header>
                    
                    <Card.Body className="pt-2">
                      <div className="mb-3 border-bottom pb-3">
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2" size={12} /> Tam Adres
                        </div>
                        <div className="fw-medium">
                          {selectedFarmer.address}
                        </div>
                      </div>
                      
                      <div className="mb-3 border-bottom pb-3">
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaTruck className="me-2" size={12} /> Kargo Hizmeti
                        </div>
                        <div className="fw-medium">
                          {selectedFarmer.hasShipping ? (
                            <Badge bg="success" className="py-1 px-2">Mevcut</Badge>
                          ) : (
                            <Badge bg="secondary" className="py-1 px-2">Mevcut Değil</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-muted small mb-1 d-flex align-items-center">
                          <FaLeaf className="me-2" size={12} /> Üretim Kategorileri
                        </div>
                        <div className="mt-2">
                          {displayCategories(selectedFarmer.categories)}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Sertifikalar Bölümü (Varsa) */}
              {selectedFarmer.certificates && selectedFarmer.certificates.length > 0 && (
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 pt-3 pb-0">
                    <h5 className="fw-bold d-flex align-items-center text-info">
                      <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                        <FaCertificate className="text-info" />
                      </div>
                      Sertifikalar
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-2">
                    <Row className="g-3">
                      {selectedFarmer.certificates.map((cert, index) => (
                        <Col md={6} lg={4} key={index}>
                          <Card className="h-100 border shadow-sm">
                            <Card.Body>
                              <div className="d-flex justify-content-between mb-3">
                                <h6 className="mb-0 fw-bold d-flex align-items-center">
                                  <FaCertificate className="text-info me-2" size={14} /> {cert.name}
                                </h6>
                                <Badge 
                                  bg={cert.verified ? "success" : "warning"} 
                                  className="rounded-pill"
                                >
                                  {cert.verified ? "Doğrulanmış" : "Doğrulanmamış"}
                                </Badge>
                              </div>
                              
                              <div className="mb-2 small">
                                <span className="text-muted">Sertifika Tipi:</span>
                                <div className="fw-medium">{getCertificateTypeName(cert.type)}</div>
                              </div>
                              
                              <div className="mb-2 small">
                                <span className="text-muted">Sertifika No:</span>
                                <div className="fw-medium">{cert.number}</div>
                              </div>
                              
                              <div className="small">
                                <span className="text-muted">Geçerlilik:</span>
                                <div className="fw-medium">
                                  {new Date(cert.issueDate).toLocaleDateString('tr-TR')} - 
                                  {' '}{new Date(cert.expiryDate).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              )}
              
              {activeTab === 'pending' && (
                <div className="d-flex justify-content-end mt-4 gap-3">
                  <Button
                    variant="outline-danger"
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                    onClick={() => handleShowRejectModal(selectedFarmer)}
                    disabled={submitting}
                  >
                    <FaTimes className="me-2" /> Reddet
                  </Button>
                  <Button
                    variant="success"
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                    onClick={() => handleApproveFarmer(selectedFarmer._id)}
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
      
      {/* Reddetme Modali */}
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
                <h5 className="mb-0 fw-bold">Çiftçi Başvurusu Reddetme</h5>
                <p className="text-muted mb-0 mt-1 small">Bu işlem çiftçiye bildirilecek ve başvuru sürecinden çıkarılacaktır</p>
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
          {selectedFarmer && (
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
                          <FaUser className="text-success" size={28} />
                        </div>
                        <div className="ms-3">
                          <h5 className="mb-1 text-success">{selectedFarmer.user?.firstName} {selectedFarmer.user?.lastName}</h5>
                          
                          <div className="d-flex flex-wrap gap-3 text-muted small">
                            <div>
                              <strong>Çiftlik:</strong> {selectedFarmer.farmName}
                            </div>
                            <div>
                              <strong>Konum:</strong> {selectedFarmer.city}, {selectedFarmer.district}
                            </div>
                            <div>
                              <strong>E-posta:</strong> {selectedFarmer.user?.email}
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
                    "Çiftçilik faaliyeti ile ilgili doğrulanabilir bilgi eksik",
                    "Belirtilen konum ile iletişim bilgileri uyuşmuyor",
                    "Vergi numarası doğrulanamadı",
                    "Çiftlik adı/lokasyon bilgileri eksik veya yetersiz",
                    "İşletme faaliyeti açıklaması yetersiz",
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
              <strong>Önemli:</strong> Red nedenleri çiftçiye doğrudan iletilecektir. Açık, yapıcı ve yardımcı olmaya özen gösterin. 
              Çiftçinin gerekli düzeltmeleri yapıp tekrar başvurmasına yardımcı olacak bilgiler verin.
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
              onClick={handleRejectFarmer}
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
      
      <style jsx="true">{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .avatar-sm {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default FarmerApprovalList; 