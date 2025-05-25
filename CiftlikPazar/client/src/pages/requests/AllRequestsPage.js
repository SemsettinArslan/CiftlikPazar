import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaEye, FaExclamationCircle, FaList, FaCalendarAlt, FaMapMarkerAlt, FaHandshake } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AllRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [userType, setUserType] = useState(null); // 'farmer', 'company', or null

  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      console.log('Kategoriler getiriliyor...');
      const response = await axios.get('/api/categories');
      console.log('Kategori API yanıtı:', response.data);
      
      if (response.data.success && response.data.data) {
        console.log(`${response.data.data.length} adet kategori başarıyla yüklendi.`);
        setCategories(response.data.data);
      } else {
        console.warn('API başarılı yanıt verdi ancak kategori verisi bulunamadı:', response.data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
      if (err.response) {
        console.error('Hata yanıtı:', err.response.data);
        console.error('Hata durumu:', err.response.status);
      } else if (err.request) {
        console.error('Yanıt alınamadı, istek:', err.request);
      } else {
        console.error('Hata mesajı:', err.message);
      }
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Talepleri getiren fonksiyon
  const fetchRequests = async () => {
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
      
      // Tüm talepleri getir (aktif olanları)
      const response = await axios.get('/api/requests', config);
      
      if (response.data && response.data.success) {
        setRequests(response.data.data);
      } else {
        setRequests([]);
        setError('Talepler yüklenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Talepler getirilirken hata:', err);
      
      if (err.response) {
        setError(err.response.data?.message || 'Talepler alınırken bir API hatası oluştu');
      } else if (err.request) {
        setError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        setError(`İstek sırasında hata: ${err.message}`);
      }
      
      setRequests([]);
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

  // Sayfa yüklendiğinde talepleri ve kategorileri getir
  useEffect(() => {
    checkUserType();
    fetchCategories();
    fetchRequests();
  }, []);

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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };
  
  // Talepleri filtreleyen fonksiyon
  const filterRequests = () => {
    return requests.filter(request => {
      // Durum filtresi
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      
      // Kategori filtresi
      if (categoryFilter && categoryFilter !== '') {
        if (typeof request.category === 'object' && request.category._id) {
          if (request.category._id.toString() !== categoryFilter) {
            return false;
          }
        } else if (typeof request.category === 'string' && request.category !== categoryFilter) {
          return false;
        }
      }
      
      // Arama filtresi
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        return (
          request.title.toLowerCase().includes(term) ||
          request.description.toLowerCase().includes(term) ||
          request.city.toLowerCase().includes(term) ||
          request.district.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Talepler yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0 text-primary d-flex align-items-center">
            <FaList className="me-2" /> Tüm Talepler
          </h2>
          <p className="text-muted">
            Firmaların oluşturduğu talepleri görüntüleyin {userType === 'farmer' && 've tekliflerinizi gönderin'}.
          </p>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col lg={4} md={6} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Talep başlığı veya konum ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col lg={4} md={3} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                  <option value="expired">Süresi Doldu</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col lg={4} md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaList />
                </InputGroup.Text>
                <Form.Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  disabled={categoryLoading}
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.category_name}
                    </option>
                  ))}
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

          {filterRequests().length === 0 ? (
            <Alert variant="info" className="d-flex align-items-center">
              <FaExclamationCircle className="me-2" />
              {searchTerm || statusFilter !== 'all' || categoryFilter 
                ? 'Arama kriterlerinize uygun talep bulunamadı.' 
                : 'Henüz oluşturulmuş bir talep bulunmamaktadır.'}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Talep No</th>
                    <th>Başlık</th>
                    <th>Miktar</th>
                    <th>Konum</th>
                    <th>Son Tarih</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRequests().map((request) => (
                    <tr key={request._id}>
                      <td>
                        <span className="fw-medium">#{request._id.substring(request._id.length - 6)}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-medium">{request.title}</div>
                            <small className="text-muted">
                              {request.description.substring(0, 30)}...
                              <span className="ms-1 badge bg-light text-dark">
                                {categoryLoading ? (
                                  <span>
                                    <Spinner animation="border" size="sm" variant="primary" className="me-1" /> 
                                    Yükleniyor...
                                  </span>
                                ) : (
                                  getCategoryName(request.category)
                                )}
                              </span>
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{request.quantity} {request.unit}</td>
                      <td>{request.city}, {request.district}</td>
                      <td>{formatDate(request.deadline)}</td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>
                        <Link to={`/requests/${request._id}`}>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            className="me-2"
                          >
                            <FaEye className="me-1" /> Detay
                          </Button>
                        </Link>
                        
                        {userType === 'farmer' && request.status === 'active' && (
                          <Link to={`/requests/${request._id}`}>
                            <Button 
                              variant="primary" 
                              size="sm"
                            >
                              <FaHandshake className="me-1" /> Teklif Ver
                            </Button>
                          </Link>
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
    </Container>
  );
};

export default AllRequestsPage; 