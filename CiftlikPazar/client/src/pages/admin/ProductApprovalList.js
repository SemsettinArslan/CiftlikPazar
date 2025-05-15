import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col, Nav, Tab } from 'react-bootstrap';
import { FaCheck, FaTimes, FaExclamationTriangle, FaEye, FaLeaf, FaBoxOpen, FaSync, FaFilter, FaExclamationCircle, FaSearch, FaTag, FaStore, FaInfoCircle, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

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

const ProductApprovalList = ({ apiClient, onApprovalUpdate }) => {
  const [products, setProducts] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredApprovedProducts, setFilteredApprovedProducts] = useState([]);
  const [filteredRejectedProducts, setFilteredRejectedProducts] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // React Router'dan konum değişikliklerini izle
  const location = useLocation();
  
  // Tüm sekme sayılarını güncelleme fonksiyonu
  const fetchAllTabCounts = async () => {
    try {
      // Tüm sekmelerin sayılarını getirmek için hızlı API çağrıları yap
      const pendingCountPromise = apiClient.get('/api/products/pending-approval');
      const approvedCountPromise = apiClient.get('/api/products/admin-products?status=approved&count_only=true');
      const rejectedCountPromise = apiClient.get('/api/products/admin-products?status=rejected&count_only=true');
      
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
    } catch (err) {
      console.error('Tab sayıları getirilirken hata:', err);
    }
  };
  
  // Aktif sekmenin verisini yükleme fonksiyonu
  const loadActiveTabData = async (forceRefresh = false) => {
    try {
      // Sadece aktif sekmeyi yükle
      if (activeTab === 'pending') {
        if (!products.length || forceRefresh) {
          await fetchPendingProducts();
        }
      } else if (activeTab === 'approved') {
        if (!approvedProducts.length || forceRefresh) {
          await fetchApprovedProducts();
        }
      } else if (activeTab === 'rejected') {
        if (!rejectedProducts.length || forceRefresh) {
          await fetchRejectedProducts();
        }
      }
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
      setError("Ürün verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
    }
  };

  // Onay bekleyen ürünleri getir
  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/products/pending-approval');
      
      if (response.data && response.data.success) {
        const pendingData = response.data.data || [];
        setProducts(pendingData);
        setFilteredProducts(pendingData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          pending: pendingData.length
        }));
      } else {
        throw new Error('Onay bekleyen ürünler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onay bekleyen ürünleri getirme hatası:', err);
      setError('Onay bekleyen ürünler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Onaylanmış ürünleri getir
  const fetchApprovedProducts = async () => {
    try {
      setLoadingApproved(true);
      setError(null);
      
      const response = await apiClient.get('/api/products/admin-products?status=approved');
      
      if (response.data && response.data.success) {
        const approvedData = response.data.data || [];
        setApprovedProducts(approvedData);
        setFilteredApprovedProducts(approvedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          approved: approvedData.length
        }));
      } else {
        throw new Error('Onaylanmış ürünler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Onaylanmış ürünleri getirme hatası:', err);
      setError('Onaylanmış ürünler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingApproved(false);
    }
  };

  // Reddedilen ürünleri getir
  const fetchRejectedProducts = async () => {
    try {
      setLoadingRejected(true);
      setError(null);
      
      const response = await apiClient.get('/api/products/admin-products?status=rejected');
      
      if (response.data && response.data.success) {
        const rejectedData = response.data.data || [];
        setRejectedProducts(rejectedData);
        setFilteredRejectedProducts(rejectedData);
        
        // Sekme sayısını güncelle
        setTabCounts(prev => ({
          ...prev,
          rejected: rejectedData.length
        }));
      } else {
        throw new Error('Reddedilen ürünler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Reddedilen ürünleri getirme hatası:', err);
      setError('Reddedilen ürünler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingRejected(false);
    }
  };

  // Sayfa ilk yüklendiğinde tüm sekme sayılarını ve aktif sekmenin verilerini getir
  useEffect(() => {
    const initPage = async () => {
      await fetchAllTabCounts();
      
      // Sadece aktif sekmenin verilerini yükle
      if (activeTab === 'pending') {
        await fetchPendingProducts();
      } else if (activeTab === 'approved') {
        await fetchApprovedProducts();
      } else if (activeTab === 'rejected') {
        await fetchRejectedProducts();
      }
    };
    
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sekme değiştirme işlevi
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // Sekme değiştiğinde her zaman verileri yenile
    if (tabKey === 'pending') {
      fetchPendingProducts();
    } else if (tabKey === 'approved') {
      fetchApprovedProducts();
    } else if (tabKey === 'rejected') {
      fetchRejectedProducts();
    }
  };
  
  // Filtreleme işlemlerini optimize et - debounce ekle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!filterKeyword.trim()) {
        setFilteredProducts(products);
        setFilteredApprovedProducts(approvedProducts);
        setFilteredRejectedProducts(rejectedProducts);
        return;
      }
      
      const lowercasedFilter = filterKeyword.toLowerCase();
      
      // Sadece aktif sekme için filtreleme yap
      if (activeTab === 'pending') {
        const filtered = products.filter(product => 
          (product.name && product.name.toLowerCase().includes(lowercasedFilter)) ||
          (product.farmer?.farmName && product.farmer.farmName.toLowerCase().includes(lowercasedFilter)) ||
          (product.category?.category_name && product.category.category_name.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredProducts(filtered);
      } 
      else if (activeTab === 'approved') {
        const filtered = approvedProducts.filter(product => 
          (product.name && product.name.toLowerCase().includes(lowercasedFilter)) ||
          (product.farmer?.farmName && product.farmer.farmName.toLowerCase().includes(lowercasedFilter)) ||
          (product.category?.category_name && product.category.category_name.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredApprovedProducts(filtered);
      }
      else if (activeTab === 'rejected') {
        const filtered = rejectedProducts.filter(product => 
          (product.name && product.name.toLowerCase().includes(lowercasedFilter)) ||
          (product.farmer?.farmName && product.farmer.farmName.toLowerCase().includes(lowercasedFilter)) ||
          (product.category?.category_name && product.category.category_name.toLowerCase().includes(lowercasedFilter)) ||
          (product.rejectionReason && product.rejectionReason.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredRejectedProducts(filtered);
      }
    }, 300); // 300ms gecikme ile filtreleme yap
    
    return () => clearTimeout(timer);
  }, [filterKeyword, products, approvedProducts, rejectedProducts, activeTab]);

  // Ürün onaylama
  const handleApproveProduct = async (productId) => {
    try {
      setSubmitting(true);
      
      const response = await apiClient.put(`/api/products/${productId}/approve`);
      
      if (response.data && response.data.success) {
        // Ürünleri yeniden yükle
        fetchPendingProducts();
        // Tüm sekme sayılarını güncelle
        fetchAllTabCounts();
        
        // İstatistikleri güncelle
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      } else {
        throw new Error(response.data?.message || 'Beklenmedik API yanıtı');
      }
    } catch (err) {
      console.error('Ürün onaylama hatası:', err);
      setError('Ürün onaylanırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ürün reddetme için modal aç
  const handleRejectClick = (product) => {
    setCurrentProduct(product);
    setRejectReason([]);
    setShowRejectModal(true);
  };

  // Ürün reddetme
  const handleRejectProduct = async () => {
    // Seçilen nedenleri ve/veya özel nedeni birleştir
    const reasons = [...rejectReason];
    
    // Boş kontrol
    if (reasons.length === 0) {
      return;
    }
    
    // Nedenleri birleştirerek API'ye gönderelim
    const formattedReason = reasons.join("\n• ");
    
    try {
      setSubmitting(true);
      
      const response = await apiClient.put(`/api/products/${currentProduct._id}/reject`, {
        reason: formattedReason.startsWith('•') ? formattedReason : `• ${formattedReason}`
      });
      
      if (response.data && response.data.success) {
        // Modal'ı kapat
        setShowRejectModal(false);
        
        // Ürünleri yeniden yükle
        fetchPendingProducts();
        // Tüm sekme sayılarını güncelle
        fetchAllTabCounts();
        
        // İstatistikleri güncelle
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
      } else {
        throw new Error(response.data?.message || 'Beklenmedik API yanıtı');
      }
    } catch (err) {
      console.error('Ürün reddetme hatası:', err);
      setError('Ürün reddedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ürün detayını açma
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Ürün görseli için URL oluşturma
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${apiClient.defaults.baseURL}/uploads/product-images/${imageName}`;
  };

  // İlgili sekmenin verilerini manuel olarak yenileme
  const handleRefreshTab = () => {
    if (activeTab === 'pending') {
      fetchPendingProducts();
    } else if (activeTab === 'approved') {
      fetchApprovedProducts();
    } else if (activeTab === 'rejected') {
      fetchRejectedProducts();
    }
    fetchAllTabCounts(); // Tüm sayıları güncelle
  };

  return (
    <div className="pb-5 mb-5">
      <h4 className="border-bottom pb-3 mb-4 text-success d-flex align-items-center">
        <FaBoxOpen className="me-2" /> Ürün Onay İşlemleri
      </h4>
      
      {error && (
        <Alert variant="danger" className="mb-4 d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
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
                  {activeTab === 'pending' && <FaBoxOpen className="text-warning" size={30} />}
                  {activeTab === 'approved' && <FaThumbsUp className="text-success" size={30} />}
                  {activeTab === 'rejected' && <FaThumbsDown className="text-danger" size={30} />}
                </div>
                <h2 className="display-6 fw-bold mb-0">
                  {activeTab === 'pending' && filteredProducts.length}
                  {activeTab === 'approved' && filteredApprovedProducts.length}
                  {activeTab === 'rejected' && filteredRejectedProducts.length}
                </h2>
                <p className={`mb-0 mt-1 ${
                  activeTab === 'pending' ? 'text-warning' : 
                  activeTab === 'approved' ? 'text-success' : 
                  'text-danger'
                } fw-semibold`}>
                  {activeTab === 'pending' && 'Onay Bekleyen Ürün'}
                  {activeTab === 'approved' && 'Onaylanmış Ürün'}
                  {activeTab === 'rejected' && 'Reddedilmiş Ürün'}
                </p>
              </div>
              
              <div className="p-4">
                <Form.Group className="mb-0">
                  <Form.Label className="text-muted fw-semibold d-flex align-items-center">
                    <FaSearch className="me-2" size={14} /> Ürün Ara
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ürün ismi, çiftlik veya kategori"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
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
                  <FaBoxOpen size={20} />
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
                    {activeTab === 'pending' && <><FaBoxOpen className="me-2" /> Onay Bekleyen Ürünler</>}
                    {activeTab === 'approved' && <><FaThumbsUp className="me-2" /> Onaylanmış Ürünler</>}
                    {activeTab === 'rejected' && <><FaThumbsDown className="me-2" /> Reddedilmiş Ürünler</>}
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
                    disabled={
                      (activeTab === 'pending' && loading) || 
                      (activeTab === 'approved' && loadingApproved) || 
                      (activeTab === 'rejected' && loadingRejected)
                    }
                  >
                    {(
                      (activeTab === 'pending' && loading) || 
                      (activeTab === 'approved' && loadingApproved) || 
                      (activeTab === 'rejected' && loadingRejected)
                    ) ? (
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
              
              {/* ONAY BEKLEYEN ÜRÜNLER */}
              {activeTab === 'pending' && (
                <>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="warning" />
                      <p className="mt-3 text-muted">Onay bekleyen ürünler yükleniyor...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaCheck className="text-success" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun ürün bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Onay bekleyen ürün bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Ürün Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Üretici</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Fiyat</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Tarih</th>
                            <th className="fw-semibold text-center" style={{ width: '200px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product, index) => (
                            <tr key={product._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {product.image ? (
                                    <img 
                                      src={getImageUrl(product.image)} 
                                      alt={product.name} 
                                      width="40" 
                                      height="40" 
                                      className="me-2 rounded"
                                      style={{ objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/40x40?text=Resim+Yok';
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      <FaLeaf className="text-success" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold">{product.name}</div>
                                    <div className="small text-muted">
                                      {product.category?.category_name || 'Kategori'}
                                      {product.isOrganic && <Badge bg="success" className="ms-2 rounded-pill">Organik</Badge>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {product.farmer?.farmName || 'Bilinmeyen Üretici'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-nowrap">{product.price?.toFixed(2)} ₺</div>
                                <div className="small text-muted">/ {product.unit}</div>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {new Date(product.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Ürün Detayını Görüntüle"
                                    onClick={() => handleViewProduct(product)}
                                    disabled={submitting}
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Ürünü Onayla"
                                    onClick={() => handleApproveProduct(product._id)}
                                    disabled={submitting}
                                  >
                                    <FaCheck />
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Ürünü Reddet"
                                    onClick={() => handleRejectClick(product)}
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
              
              {/* ONAYLANMIŞ ÜRÜNLER */}
              {activeTab === 'approved' && (
                <>
                  {loadingApproved ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                      <p className="mt-3 text-muted">Onaylanmış ürünler yükleniyor...</p>
                    </div>
                  ) : filteredApprovedProducts.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaExclamationCircle className="text-muted" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun ürün bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Onaylanmış ürün bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Ürün Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Üretici</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Fiyat</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Onay Tarihi</th>
                            <th className="fw-semibold text-center" style={{ width: '100px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApprovedProducts.map((product, index) => (
                            <tr key={product._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {product.image ? (
                                    <img 
                                      src={getImageUrl(product.image)} 
                                      alt={product.name} 
                                      width="40" 
                                      height="40" 
                                      className="me-2 rounded"
                                      style={{ objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/40x40?text=Resim+Yok';
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      <FaLeaf className="text-success" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold">{product.name}</div>
                                    <div className="small text-muted">
                                      {product.category?.category_name || 'Kategori'}
                                      {product.isOrganic && <Badge bg="success" className="ms-2 rounded-pill">Organik</Badge>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {product.farmer?.farmName || 'Bilinmeyen Üretici'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-nowrap">{product.price?.toFixed(2)} ₺</div>
                                <div className="small text-muted">/ {product.unit}</div>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {product.approvalDate ? new Date(product.approvalDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Ürün Detayını Görüntüle"
                                    onClick={() => handleViewProduct(product)}
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
              
              {/* REDDEDİLEN ÜRÜNLER */}
              {activeTab === 'rejected' && (
                <>
                  {loadingRejected ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="danger" />
                      <p className="mt-3 text-muted">Reddedilen ürünler yükleniyor...</p>
                    </div>
                  ) : filteredRejectedProducts.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FaExclamationCircle className="text-muted" size={36} />
                      </div>
                      {filterKeyword.trim() ? (
                        <p className="text-muted mb-0">Arama kriterine uygun ürün bulunamadı.</p>
                      ) : (
                        <p className="text-muted mb-0">Reddedilen ürün bulunmamaktadır.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-semibold" style={{ width: '50px' }}>#</th>
                            <th className="fw-semibold">Ürün Bilgisi</th>
                            <th className="fw-semibold" style={{ width: '150px' }}>Üretici</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Fiyat</th>
                            <th className="fw-semibold">Red Nedeni</th>
                            <th className="fw-semibold" style={{ width: '120px' }}>Red Tarihi</th>
                            <th className="fw-semibold text-center" style={{ width: '100px' }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRejectedProducts.map((product, index) => (
                            <tr key={product._id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {product.image ? (
                                    <img 
                                      src={getImageUrl(product.image)} 
                                      alt={product.name} 
                                      width="40" 
                                      height="40" 
                                      className="me-2 rounded"
                                      style={{ objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/40x40?text=Resim+Yok';
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      <FaLeaf className="text-success" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold">{product.name}</div>
                                    <div className="small text-muted">
                                      {product.category?.category_name || 'Kategori'}
                                      {product.isOrganic && <Badge bg="success" className="ms-2 rounded-pill">Organik</Badge>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {product.farmer?.farmName || 'Bilinmeyen Üretici'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-nowrap">{product.price?.toFixed(2)} ₺</div>
                                <div className="small text-muted">/ {product.unit}</div>
                              </td>
                              <td>
                                <small className="text-danger">
                                  {product.rejectionReason ? 
                                    (product.rejectionReason.length > 100 ? 
                                      `${product.rejectionReason.substring(0, 100)}...` : 
                                      product.rejectionReason) : 
                                    'Belirtilmemiş'}
                                </small>
                              </td>
                              <td>
                                <div className="small text-nowrap">
                                  {product.approvalDate ? new Date(product.approvalDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    className="px-2 py-1"
                                    title="Ürün Detayını Görüntüle"
                                    onClick={() => handleViewProduct(product)}
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
      
      {/* Ürün Reddetme Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        backdrop="static"
        keyboard={false}
        centered
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
                <h5 className="mb-0 fw-bold">Ürün Reddetme</h5>
                <p className="text-muted mb-0 mt-1 small">Bu işlem çiftçiye bildirilecek ve ürün onay sürecinden çıkarılacaktır</p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={() => setShowRejectModal(false)}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="pt-0 pb-0 px-4">
          {currentProduct && (
            <>
              <Row className="mb-4 mt-3">
                <Col>
                  <Card className="border-0 bg-light shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        {currentProduct.image ? (
                          <div className="rounded overflow-hidden shadow-sm" style={{width: '80px', height: '80px', flexShrink: 0}}>
                            <img 
                              src={getImageUrl(currentProduct.image)} 
                              alt={currentProduct.name} 
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/80x80?text=Resim+Yok';
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="rounded bg-success bg-opacity-10 d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: '80px', height: '80px', flexShrink: 0 }}
                          >
                            <FaLeaf className="text-success" size={28} />
                          </div>
                        )}
                        <div className="ms-3">
                          <h5 className="mb-1 text-success">{currentProduct.name}</h5>
                          
                          <div className="d-flex flex-wrap gap-3 text-muted small">
                            <div>
                              <strong>Üretici:</strong> {currentProduct.farmer?.farmName || 'Bilinmeyen Üretici'}
                            </div>
                            <div>
                              <strong>Fiyat:</strong> {currentProduct.price?.toFixed(2)} ₺/{currentProduct.unit}
                            </div>
                            <div>
                              <strong>Kategori:</strong> {currentProduct.category?.category_name || 'Belirtilmemiş'}
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
                    "Fotoğraf ürünü net göstermiyor",
                    "Ürün açıklaması yetersiz",
                    "Fiyat piyasa fiyatına göre aşırı yüksek",
                    "Ürün platformumuzun kategorilerine uygun değil",
                    "Ürün görseli uygunsuz içerik barındırıyor",
                    "Organik olarak işaretlenmiş ancak belge sunulmamış"
                  ].map((reason, index) => {
                    // Şu anki neden seçilmiş mi kontrol et
                    const isSelected = rejectReason.includes(reason);
                    
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
                            setRejectReason(rejectReason.filter(r => r !== reason));
                          } else {
                            setRejectReason([...rejectReason, reason]);
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
                    value={rejectReason.find(r => !['Fotoğraf ürünü net göstermiyor', 'Ürün açıklaması yetersiz', 'Fiyat piyasa fiyatına göre aşırı yüksek', 'Ürün platformumuzun kategorilerine uygun değil', 'Ürün görseli uygunsuz içerik barındırıyor', 'Organik olarak işaretlenmiş ancak belge sunulmamış'].includes(r)) || ''}
                    onChange={(e) => {
                      // Önceki özel nedeni filtreleyip çıkar
                      const standardReasons = ['Fotoğraf ürünü net göstermiyor', 'Ürün açıklaması yetersiz', 'Fiyat piyasa fiyatına göre aşırı yüksek', 'Ürün platformumuzun kategorilerine uygun değil', 'Ürün görseli uygunsuz içerik barındırıyor', 'Organik olarak işaretlenmiş ancak belge sunulmamış'];
                      const filtered = rejectReason.filter(r => standardReasons.includes(r));
                      
                      // Yeni değer boş değilse ekle
                      if (e.target.value) {
                        setRejectReason([...filtered, e.target.value]);
                      } else {
                        setRejectReason(filtered);
                      }
                    }}
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
              Çiftçinin ürününü düzeltip tekrar başvurmasına yardımcı olacak bilgiler verin.
            </div>
          </Alert>
          
          <div className="d-flex flex-column flex-sm-row gap-2 w-100">
            <Button 
              variant="light" 
              onClick={() => setShowRejectModal(false)}
              disabled={submitting}
              className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-fill"
            >
              <FaTimes className="me-2" /> Vazgeç
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRejectProduct}
              disabled={rejectReason.length === 0 || submitting}
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
      
      {/* Ürün Detay Modal */}
      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        size="lg"
        centered
        dialogClassName="border-0"
      >
        <Modal.Header closeButton className="bg-light border-0 pb-0">
          <Modal.Title className="text-success">
            <FaBoxOpen className="me-2" /> Ürün Detayı
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 px-4">
          {selectedProduct && (
            <div>
              <Row className="mb-4 g-4">
                <Col md={5}>
                  <div className="position-relative h-100">
                    {selectedProduct.isOrganic && (
                      <div 
                        className="position-absolute badge bg-success text-white px-3 py-2 rounded-pill" 
                        style={{ top: '10px', right: '10px', zIndex: 2 }}
                      >
                        <FaLeaf className="me-1" /> Organik Ürün
                      </div>
                    )}
                    
                    {selectedProduct.image ? (
                      <div className="rounded-3 shadow-sm h-100 overflow-hidden" style={{ minHeight: '240px' }}>
                        <img
                          src={getImageUrl(selectedProduct.image)}
                          alt={selectedProduct.name}
                          className="img-fluid w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yok';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ height: '240px' }}>
                        <div className="text-center">
                          <FaLeaf size={50} className="text-success opacity-50 mb-2" />
                          <p className="text-muted">Ürün görseli bulunmamaktadır</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                
                <Col md={7}>
                  <h3 className="mb-2 fw-bold">{selectedProduct.name}</h3>
                  
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge bg="success" className="rounded-pill px-3 py-2">
                      <FaTag className="me-1" /> {selectedProduct.category?.category_name || 'Kategori'}
                    </Badge>
                    <Badge bg="info" text="dark" className="rounded-pill px-3 py-2 bg-opacity-25">
                      <FaBoxOpen className="me-1" /> {selectedProduct.countInStock} {selectedProduct.unit}
                    </Badge>
                  </div>
                  
                  <Card className="border-0 bg-light mb-3">
                    <Card.Body className="p-3">
                      <Row className="g-0">
                        <Col xs={6} className="border-end">
                          <div className="text-center py-2">
                            <h4 className="mb-0 text-success fw-bold">{selectedProduct.price?.toFixed(2)} ₺</h4>
                            <small className="text-muted">/ {selectedProduct.unit}</small>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="text-center py-2">
                            <h6 className="mb-0">Eklenme Tarihi</h6>
                            <div className="text-muted">
                              {new Date(selectedProduct.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Body className="p-3">
                      <h5 className="mb-3 d-flex align-items-center">
                        <FaStore className="me-2 text-success" /> Üretici Bilgisi
                      </h5>
                      <p className="mb-1">
                        <strong>Çiftlik Adı:</strong> {selectedProduct.farmer?.farmName || 'Bilinmeyen Üretici'}
                      </p>
                      {selectedProduct.farmer?.city && selectedProduct.farmer?.district && (
                        <p className="mb-1">
                          <strong>Konum:</strong> {selectedProduct.farmer.city}, {selectedProduct.farmer.district}
                        </p>
                      )}
                      {selectedProduct.farmer?.phoneNumber && (
                        <p className="mb-0">
                          <strong>İletişim:</strong> {selectedProduct.farmer.phoneNumber}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-3">
                  <h5 className="mb-3 d-flex align-items-center">
                    <FaInfoCircle className="me-2 text-success" /> Ürün Açıklaması
                  </h5>
                  <p className="mb-0 text-muted">
                    {selectedProduct.description 
                      ? selectedProduct.description 
                      : <span className="fst-italic">Bu ürün için açıklama bulunmamaktadır.</span>}
                  </p>
                </Card.Body>
              </Card>
              
              <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 pt-2">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowProductModal(false)}
                  disabled={submitting}
                  className="rounded-pill px-4 py-2"
                >
                  <FaTimes className="me-2" /> Kapat
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => {
                    setShowProductModal(false);
                    handleApproveProduct(selectedProduct._id);
                  }}
                  disabled={submitting}
                  className="rounded-pill px-4 py-2"
                >
                  <FaCheck className="me-2" /> Onayla
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setShowProductModal(false);
                    handleRejectClick(selectedProduct);
                  }}
                  disabled={submitting}
                  className="rounded-pill px-4 py-2"
                >
                  <FaTimes className="me-2" /> Reddet
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Modaller için daha fazla bottom padding/margin ekle */}
      <div className="mb-5 pb-5"></div>
    </div>
  );
};

export default ProductApprovalList; 