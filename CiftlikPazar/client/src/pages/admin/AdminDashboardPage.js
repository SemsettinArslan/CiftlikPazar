import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Nav, Tab, Badge, Spinner, Button } from 'react-bootstrap';
import { FaUsers, FaLeaf, FaShoppingCart, FaExclamationTriangle, FaClipboardCheck, FaBox, FaTachometerAlt, FaCog, FaUserCheck, FaExclamationCircle, FaChartBar, FaCheck, FaSync } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductApprovalList from './ProductApprovalList';
import FarmerApprovalList from './FarmerApprovalList';

const API_URL = 'http://localhost:3001';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    farmerCount: 0,
    pendingFarmerCount: 0,
    approvedFarmerCount: 0,
    rejectedFarmerCount: 0,
    orderCount: 0,
    pendingProductCount: 0,
    approvedProductCount: 0,
    rejectedProductCount: 0,
    totalProductCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Konum değişikliklerini izle
  const location = useLocation();

  // Sayfa yüklendiğinde sessionStorage'dan aktif sekme bilgisini kontrol et
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
      // Kullanıldıktan sonra temizle
      sessionStorage.removeItem('adminActiveTab');
    }
  }, []);

  // API çağrıları için axios instance
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Token ekleme middleware'i
  apiClient.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // İstatistikleri yükleme fonksiyonu
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Onay bekleyen ürünleri getir (sadece sayısı için, count_only parametresi ekleyelim)
      const pendingProductsPromise = apiClient.get('/api/products/pending-approval?count_only=true');
      
      // Onaylanmış ve reddedilmiş ürünlerin sayılarını getir
      const approvedProductsPromise = apiClient.get('/api/products/admin-products?status=approved&count_only=true');
      const rejectedProductsPromise = apiClient.get('/api/products/admin-products?status=rejected&count_only=true');
      
      // Çiftçi istatistiklerini getir
      const pendingFarmersPromise = apiClient.get('/api/farmers/pending?count_only=true');
      const approvedFarmersPromise = apiClient.get('/api/farmers/approved?count_only=true');
      const rejectedFarmersPromise = apiClient.get('/api/farmers/rejected?count_only=true');

      // Tüm istekleri paralel olarak yap
      const [
        pendingProductsResponse,
        approvedProductsResponse,
        rejectedProductsResponse,
        pendingFarmersResponse,
        approvedFarmersResponse,
        rejectedFarmersResponse
      ] = await Promise.all([
        pendingProductsPromise,
        approvedProductsPromise,
        rejectedProductsPromise,
        pendingFarmersPromise,
        approvedFarmersPromise,
        rejectedFarmersPromise
      ]);
      
      // Sayım sonuçlarını al (count değerini veya dizinin uzunluğunu)
      const pendingProductCount = pendingProductsResponse.data?.count || 
                                pendingProductsResponse.data?.data?.length || 0;
      
      const approvedProductCount = approvedProductsResponse.data?.count || 0;
      const rejectedProductCount = rejectedProductsResponse.data?.count || 0;
      const totalProductCount = pendingProductCount + approvedProductCount + rejectedProductCount;
      
      const pendingFarmerCount = pendingFarmersResponse.data?.count || 0;
      const approvedFarmerCount = approvedFarmersResponse.data?.count || 0;
      const rejectedFarmerCount = rejectedFarmersResponse.data?.count || 0;
      const totalFarmerCount = pendingFarmerCount + approvedFarmerCount + rejectedFarmerCount;
      
      // Kullanıcı sayısı ve sipariş sayısını statik veriler (API daha sonra eklenebilir)
      setStats({
        userCount: 245,
        farmerCount: totalFarmerCount,
        pendingFarmerCount: pendingFarmerCount,
        approvedFarmerCount: approvedFarmerCount, 
        rejectedFarmerCount: rejectedFarmerCount,
        orderCount: 189,
        pendingProductCount,
        approvedProductCount,
        rejectedProductCount,
        totalProductCount
      });
      
    } catch (error) {
      console.error('İstatistik verileri getirilemedi:', error);
      setError('İstatistik verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde istatistikleri yükle
  useEffect(() => {
    fetchStats();
  }, []);

  // Sekme değiştirme ve istatistikleri güncelleme
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    // Overview sekmesine geçişte veya ürün onayları sekmesinden çıkışta istatistikleri güncelle
    if (tabKey === 'overview') {
      fetchStats();
    }
  };

  // Ürün onay listesinden istatistikleri güncelleme fonksiyonu
  const handleApprovalUpdate = () => {
    fetchStats();
  };

  // Yükleniyor ekranı
  if (loading && !stats.pendingProductCount) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-3">Admin paneli yükleniyor...</p>
      </Container>
    );
  }

  // Hata ekranı
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0 text-success d-flex align-items-center">
            <FaClipboardCheck className="me-2" /> Admin Yönetim Paneli
          </h2>
          <p className="text-muted">
            Sistemi buradan yönetebilirsiniz. Onay bekleyen {stats.pendingProductCount} ürün ve {stats.pendingFarmerCount} çiftçi başvurusu bulunmaktadır.
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={3} md={4} className="mb-4">
          <Card className="border-0 shadow-sm rounded overflow-hidden">
            <div className="bg-success text-white p-3">
              <h5 className="mb-0 d-flex align-items-center">
                <FaTachometerAlt className="me-2" /> Panel Menüsü
              </h5>
            </div>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={k => handleTabChange(k || 'overview')}>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="overview" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'overview' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'overview' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaClipboardCheck className="me-2" /> Genel Bakış
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="product-approvals" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'product-approvals' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'product-approvals' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaBox className="me-2" /> Ürün Onayları
                    {stats.pendingProductCount > 0 && (
                      <Badge bg="danger" pill className="ms-2">{stats.pendingProductCount}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="farmer-approvals" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'farmer-approvals' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'farmer-approvals' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaUserCheck className="me-2" /> Çiftçi Başvuruları
                    {stats.pendingFarmerCount > 0 && (
                      <Badge bg="danger" pill className="ms-2">{stats.pendingFarmerCount}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="user-management" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'user-management' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'user-management' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaUsers className="me-2" /> Kullanıcı Yönetimi
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="settings" 
                    className="rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'settings' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'settings' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaCog className="me-2" /> Sistem Ayarları
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9} md={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <Tab.Content>
                <Tab.Pane eventKey="overview" active={activeTab === 'overview'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">Genel Bakış</h4>
                  
                  <Row className="g-4 mb-4">
                    <Col md={6} xl={3} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 text-dark">Kullanıcılar</h5>
                            <FaUsers className="text-success" size={24} />
                          </div>
                          <h2 className="fw-bold mb-0">{stats.userCount}</h2>
                          <p className="text-muted mb-0">Toplam kullanıcı sayısı</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6} xl={3} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 text-dark">Çiftçiler</h5>
                            <FaLeaf className="text-success" size={24} />
                          </div>
                          <h2 className="fw-bold mb-0">{stats.farmerCount}</h2>
                          <p className="text-muted mb-0">Toplam çiftçi sayısı</p>
                          <div className="mt-3 d-flex flex-wrap gap-2">
                            <Badge bg="success" className="py-1 px-2">
                              {stats.approvedFarmerCount} onaylı
                            </Badge>
                          {stats.pendingFarmerCount > 0 && (
                              <Badge bg="warning" className="py-1 px-2">
                                {stats.pendingFarmerCount} bekleyen
                              </Badge>
                            )}
                            {stats.rejectedFarmerCount > 0 && (
                              <Badge bg="danger" className="py-1 px-2">
                                {stats.rejectedFarmerCount} reddedilen
                              </Badge>
                            )}
                            </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6} xl={3} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 text-dark">Siparişler</h5>
                            <FaShoppingCart className="text-success" size={24} />
                          </div>
                          <h2 className="fw-bold mb-0">{stats.orderCount}</h2>
                          <p className="text-muted mb-0">Toplam sipariş sayısı</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6} xl={3} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 text-dark">Ürünler</h5>
                            <FaBox className="text-success" size={24} />
                          </div>
                          <h2 className="fw-bold mb-0">{stats.totalProductCount || 0}</h2>
                          <p className="text-muted mb-0">Toplam ürün sayısı</p>
                          <div className="mt-3 d-flex flex-wrap gap-2">
                            <Badge bg="success" className="py-1 px-2">
                              {stats.approvedProductCount || 0} onaylı
                            </Badge>
                            {stats.pendingProductCount > 0 && (
                              <Badge bg="warning" className="py-1 px-2">
                                {stats.pendingProductCount} bekleyen
                              </Badge>
                            )}
                            {stats.rejectedProductCount > 0 && (
                              <Badge bg="danger" className="py-1 px-2">
                                {stats.rejectedProductCount} reddedilen
                              </Badge>
                            )}
                            </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3 text-success d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                              <FaUserCheck className="text-success" />
                            </div>
                            Çiftçi Başvuruları
                          </h5>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Onaylanan</span>
                              <span className="fw-bold text-success">{stats.approvedFarmerCount}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${stats.farmerCount > 0 ? (stats.approvedFarmerCount / stats.farmerCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Bekleyen</span>
                              <span className="fw-bold text-warning">{stats.pendingFarmerCount}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-warning" 
                                style={{ width: `${stats.farmerCount > 0 ? (stats.pendingFarmerCount / stats.farmerCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Reddedilen</span>
                              <span className="fw-bold text-danger">{stats.rejectedFarmerCount}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-danger" 
                                style={{ width: `${stats.farmerCount > 0 ? (stats.rejectedFarmerCount / stats.farmerCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {stats.pendingFarmerCount > 0 ? (
                            <Button 
                              variant="outline-success" 
                              className="rounded-pill px-4 w-100"
                              onClick={() => handleTabChange('farmer-approvals')}
                            >
                              <FaUserCheck className="me-2" /> {stats.pendingFarmerCount} Başvuruyu İncele
                            </Button>
                          ) : (
                            <Alert variant="success" className="d-flex align-items-center mb-0">
                              <FaCheck className="me-2" />
                              Bekleyen çiftçi başvurusu bulunmamaktadır.
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3 text-success d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                              <FaBox className="text-success" />
                            </div>
                            Ürün Onayları
                          </h5>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Onaylanan</span>
                              <span className="fw-bold text-success">{stats.approvedProductCount || 0}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${stats.totalProductCount > 0 ? (stats.approvedProductCount / stats.totalProductCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Bekleyen</span>
                              <span className="fw-bold text-warning">{stats.pendingProductCount}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-warning" 
                                style={{ width: `${stats.totalProductCount > 0 ? (stats.pendingProductCount / stats.totalProductCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span>Reddedilen</span>
                              <span className="fw-bold text-danger">{stats.rejectedProductCount || 0}</span>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-danger" 
                                style={{ width: `${stats.totalProductCount > 0 ? (stats.rejectedProductCount / stats.totalProductCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {stats.pendingProductCount > 0 ? (
                              <Button 
                                variant="outline-success" 
                              className="rounded-pill px-4 w-100"
                                onClick={() => handleTabChange('product-approvals')}
                              >
                              <FaBox className="me-2" /> {stats.pendingProductCount} Ürünü İncele
                              </Button>
                          ) : (
                            <Alert variant="success" className="d-flex align-items-center mb-0">
                              <FaCheck className="me-2" />
                              Bekleyen ürün onayı bulunmamaktadır.
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>
                
                <Tab.Pane eventKey="product-approvals" active={activeTab === 'product-approvals'}>
                  <ProductApprovalList apiClient={apiClient} onApprovalUpdate={handleApprovalUpdate} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="farmer-approvals" active={activeTab === 'farmer-approvals'}>
                  <FarmerApprovalList apiClient={apiClient} onApprovalUpdate={handleApprovalUpdate} />
                </Tab.Pane>
                
                <Tab.Pane eventKey="user-management" active={activeTab === 'user-management'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">Kullanıcı Yönetimi</h4>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FaExclamationCircle className="me-2" />
                    Kullanıcı yönetimi modülü yakında eklenecektir.
                  </Alert>
                </Tab.Pane>
                
                <Tab.Pane eventKey="settings" active={activeTab === 'settings'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">Sistem Ayarları</h4>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FaExclamationCircle className="me-2" />
                    Sistem ayarları modülü yakında eklenecektir.
                  </Alert>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboardPage; 