import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Alert, Badge, Form, Button, Spinner } from 'react-bootstrap';
import { FaLeaf, FaBoxOpen, FaShoppingCart, FaChartBar, FaCog, FaTachometerAlt, FaExclamationCircle, FaSave, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductManagement from './ProductManagement';

// Backend API URL'i
const API_BASE_URL = 'http://localhost:3001';

// Çiftlik kategorileri
const FARM_CATEGORIES = [
  "Sebze", "Meyve", "Baklagiller", "Süt Ürünleri", "Et Ürünleri", "Organik Ürünler", 
  "Bal ve Arı Ürünleri", "Zeytinyağı ve Zeytin", "Tahıl", "Baharatlar", "Yumurta"
];

// API istekleri için axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Her istekte token ekleyen interceptor
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

const FarmerDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmerData, setFarmerData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  // Form durumları
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [farmForm, setFarmForm] = useState({
    farmName: '',
    city: '',
    district: '',
    address: '',
    taxNumber: '',
    description: '',
    categories: [],
    offersShipping: false,
    phoneNumber: ''
  });
  
  // Kategori bilgileri
  const [categoryData, setCategoryData] = useState([]);
  
  // İl ve ilçe listelerini tutan state'ler
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      if (response.data.success && response.data.data) {
        setCategoryData(response.data.data);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
    }
  };

  // Sayfa yüklendiğinde kategorileri getir
  useEffect(() => {
    fetchCategories();
  }, []);

  // İlleri getiren fonksiyon
  const fetchCities = async () => {
    setCityLoading(true);
    try {
      // Doğru endpoint: /api/cities
      const response = await apiClient.get('/api/cities');
      console.log('İl verileri yanıtı:', response.data);
      
      // API response şemasına göre düzenleme
      if (response.data && response.data.success && response.data.data) {
        // API'den gelen il listesini formatlama (city alanını kullan)
        const formattedCities = response.data.data.map(city => city.city);
        setCities(formattedCities);
      } else {
        setCities([]);
        console.error('İl verileri uygun formatta değil:', response.data);
      }
    } catch (err) {
      console.error('İl bilgileri alınamadı:', err);
      setCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  // İlçeleri getiren fonksiyon
  const fetchDistrictsForCity = async (city) => {
    if (!city) {
      setDistricts([]);
      return;
    }
    
    setDistrictLoading(true);
    try {
      // Önce il ID'sini bulmak için illeri çek
      const citiesResponse = await apiClient.get('/api/cities');
      const cityData = citiesResponse.data.data.find(c => c.city === city);
      
      if (!cityData) {
        console.error('Seçilen il için veri bulunamadı:', city);
        setDistricts([]);
        setDistrictLoading(false);
        return;
      }
      
      // İlçeleri getir
      const response = await apiClient.get(`/api/cities/${cityData.cityid}/districts`);
      console.log('İlçe verileri yanıtı:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        setDistricts(response.data.data);
      } else {
        setDistricts([]);
        console.error('İlçe verileri uygun formatta değil:', response.data);
      }
    } catch (err) {
      console.error('İlçe bilgileri alınamadı:', err);
      setDistricts([]);
    } finally {
      setDistrictLoading(false);
    }
  };

  // Sayfa yüklendiğinde illeri getir
  useEffect(() => {
    fetchCities();
  }, []);

  // Kullanıcının çiftçi olup olmadığını kontrol et
  useEffect(() => {
    const checkFarmerAccess = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Kullanıcı bilgilerini al
        const userResponse = await apiClient.get('/api/auth/me');
        const userInfo = userResponse.data.data;
        setUserData(userInfo);

        // Kullanıcı çiftçi değilse ana sayfaya yönlendir
        if (userInfo.role !== 'farmer') {
          navigate('/');
          return;
        }

        // Çiftçi verilerini getir
        const farmerResponse = await apiClient.get('/api/farmers/me');
        const farmerInfo = farmerResponse.data.data;
        setFarmerData(farmerInfo);
        
        // İl seçildiğinde ilçeleri getir
        if (farmerInfo.city) {
          await fetchDistrictsForCity(farmerInfo.city);
        }
        
        // Çiftçi kategorilerini al - burada kategoriler ID olarak gelir
        const categoryIds = farmerInfo.categories || [];
        console.log('Kategoriler (ID):', categoryIds);
        
        // Form verilerini doldur
        setFarmForm({
          farmName: farmerInfo.farmName || '',
          city: farmerInfo.city || '',
          district: farmerInfo.district || '',
          address: farmerInfo.address || '',
          taxNumber: farmerInfo.taxNumber || '',
          description: farmerInfo.description || '',
          categories: categoryIds,  // Kategori ID'lerini olduğu gibi saklıyoruz
          offersShipping: farmerInfo.offersShipping || farmerInfo.hasShipping || false,
          phoneNumber: userInfo.phoneNumber || userInfo.phone || ''
        });
        
        // Konsola verileri yazdıralım (debugging için)
        console.log('Çiftlik Verileri:', farmerInfo);
        console.log('Kullanıcı Verileri:', userInfo);
        console.log('Form Verileri:', farmForm);
        
        setLoading(false);
      } catch (err) {
        setError('Çiftçi paneline erişim sırasında bir hata oluştu');
        setLoading(false);
      }
    };

    checkFarmerAccess();
  }, [navigate]);

  // Şehir değiştiğinde ilçeleri getir
  useEffect(() => {
    if (farmForm.city) {
      fetchDistrictsForCity(farmForm.city);
    } else {
      setDistricts([]);
    }
  }, [farmForm.city]);

  // Kategori adından ID elde etme
  const getCategoryId = (categoryName) => {
    const category = categoryData.find(cat => cat.category_name === categoryName);
    return category ? category._id : null;
  };
  
  // Kategori ID'sinden ad elde etme
  const getCategoryName = (categoryId) => {
    const category = categoryData.find(cat => cat._id === categoryId);
    return category ? category.category_name : '';
  };
  
  // Kategori içinde olup olmadığını kontrol eden fonksiyon
  const isCategorySelected = (categoryName) => {
    // Eğer farmForm.categories ID'leri içeriyorsa, isim bazlı kontrol yapmalıyız
    if (categoryData.length === 0) return false;
    
    const categoryId = getCategoryId(categoryName);
    if (!categoryId) return false;
    
    return farmForm.categories.includes(categoryId) || 
           farmForm.categories.some(cat => cat._id === categoryId || cat === categoryId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFarmForm({
      ...farmForm,
      [name]: value
    });
    
    // İl değiştiğinde ilçeyi sıfırla
    if (name === 'city') {
      setFarmForm(prevState => ({
        ...prevState,
        district: ''
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFarmForm({
      ...farmForm,
      [name]: checked
    });
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    let updatedCategories = [...farmForm.categories];
    
    // Kategori ID'sini bul
    const categoryId = getCategoryId(value);
    
    if (!categoryId) {
      console.error(`${value} için kategori ID'si bulunamadı`);
      return;
    }
    
    if (checked) {
      // Eğer zaten listede değilse ekle
      if (!updatedCategories.includes(categoryId) && 
          !updatedCategories.some(cat => cat._id === categoryId || cat === categoryId)) {
        updatedCategories.push(categoryId);
      }
    } else {
      // ID veya obje olarak varsa çıkar
      updatedCategories = updatedCategories.filter(cat => 
        cat !== categoryId && (typeof cat === 'object' ? cat._id !== categoryId : true)
      );
    }
    
    setFarmForm({
      ...farmForm,
      categories: updatedCategories
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setUpdating(true);
    setUpdateSuccess(false);
    setUpdateError('');
    
    try {
      // Çiftlik bilgilerini güncelle (telefon numarası hariç)
      const farmData = { ...farmForm };
      delete farmData.phoneNumber; // Telefon numarasını farmData'dan çıkar
      
      // hasShipping alanını ekle
      if (farmData.offersShipping !== undefined) {
        farmData.hasShipping = farmData.offersShipping;
        delete farmData.offersShipping; // offersShipping alanını kaldır
      }
      
      // API'ye gönderilecek veriyi konsola yazdır
      console.log('Çiftliğe gönderilecek veriler:', farmData);
      
      // Doğru URL ile çiftlik güncellemesi
      const farmerResponse = await apiClient.put('/api/farmers/update', farmData);
      
      console.log('Çiftlik güncelleme yanıtı:', farmerResponse.data);
      
      // Kullanıcının telefon numarasını güncelle
      console.log('Telefon güncellemesi için gönderilen veri:', { phoneNumber: farmForm.phoneNumber });
      
      // Doğru URL ile telefon güncellemesi
      const phoneResponse = await apiClient.put('/api/auth/update-phone', { 
        phoneNumber: farmForm.phoneNumber 
      });
      
      console.log('Telefon güncelleme yanıtı:', phoneResponse.data);
      
      if (farmerResponse.data.success) {
        setFarmerData(farmerResponse.data.data);
        // Kullanıcı verisini de güncelle
        setUserData(prevUserData => ({
          ...prevUserData,
          phoneNumber: farmForm.phoneNumber
        }));
        
        setUpdateSuccess(true);
        
        // 3 saniye sonra başarı mesajını kaldır
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      
      // Hata detaylarını daha kapsamlı yazdır
      if (err.response) {
        console.error('Hata yanıtı:', {
          status: err.response.status, 
          statusText: err.response.statusText,
          data: err.response.data
        });
        // API hata mesajını göster
        setUpdateError(err.response.data?.message || 'Çiftlik bilgileriniz güncellenirken bir API hatası oluştu');
      } else if (err.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error('İstek yapıldı ama yanıt alınamadı:', err.request);
        setUpdateError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        // İstek yapılırken bir şeyler yanlış gitti
        console.error('İstek hatası:', err.message);
        setUpdateError(`İstek sırasında hata: ${err.message}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Yükleniyor ekranı
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-3">Çiftlik paneli yükleniyor...</p>
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
            <FaLeaf className="me-2" /> Çiftlik Yönetim Paneli
          </h2>
          <p className="text-muted">
            Merhaba, {farmerData?.farmName || 'Çiftçi'}! Çiftliğinizi buradan yönetebilirsiniz.
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
              <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={k => setActiveTab(k || 'overview')}>
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
                    <FaLeaf className="me-2" /> Genel Bakış
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="farm-info" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'farm-info' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'farm-info' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaCog className="me-2" /> Çiftlik Bilgileri
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="products" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'products' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'products' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaBoxOpen className="me-2" /> Ürün Yönetimi
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="orders" 
                    className="border-bottom rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'orders' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'orders' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaShoppingCart className="me-2" /> Siparişler
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="statistics" 
                    className="rounded-0 px-4 py-3"
                    style={{ 
                      color: activeTab === 'statistics' ? '#4a8e3a' : '#495057',
                      backgroundColor: activeTab === 'statistics' ? 'rgba(74, 142, 58, 0.1)' : 'transparent',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaChartBar className="me-2" /> İstatistikler
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
                  <Row>
                    <Col md={6} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3 text-success">Çiftlik Bilgileri</h5>
                          <p className="mb-2"><strong>Çiftlik Adı:</strong> {farmerData?.farmName}</p>
                          <p className="mb-2"><strong>Konum:</strong> {farmerData?.city}, {farmerData?.district}</p>
                          <p className="mb-0"><strong>Vergi No:</strong> {farmerData?.taxNumber}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                      <Card className="border-0 bg-success text-white h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3">Hızlı İstatistikler</h5>
                          <p className="mb-2 d-flex align-items-center justify-content-between">
                            <span><strong>Toplam Ürünler:</strong></span>
                            <Badge bg="light" text="success" pill className="fs-6">{0}</Badge>
                          </p>
                          <p className="mb-2 d-flex align-items-center justify-content-between">
                            <span><strong>Tamamlanan Siparişler:</strong></span>
                            <Badge bg="light" text="success" pill className="fs-6">{0}</Badge>
                          </p>
                          <p className="mb-0 d-flex align-items-center justify-content-between">
                            <span><strong>Bu Ay Toplam Satış:</strong></span>
                            <Badge bg="light" text="success" pill className="fs-6">{0} ₺</Badge>
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey="farm-info" active={activeTab === 'farm-info'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">Çiftlik Bilgileri</h4>
                  
                  {updateSuccess && (
                    <Alert variant="success" className="d-flex align-items-center">
                      <FaCheck className="me-2" />
                      Çiftlik bilgileriniz başarıyla güncellendi!
                    </Alert>
                  )}
                  
                  {updateError && (
                    <Alert variant="danger" className="d-flex align-items-center">
                      <FaExclamationCircle className="me-2" />
                      {updateError}
                    </Alert>
                  )}
                  
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="farmName">
                          <Form.Label>Çiftlik Adı</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="farmName"
                            value={farmForm.farmName}
                            onChange={handleInputChange}
                            placeholder="Çiftliğinizin adını girin"
                          />
                          <Form.Control.Feedback type="invalid">
                            Çiftlik adı gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="phoneNumber">
                          <Form.Label>Telefon Numarası</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="phoneNumber"
                            value={farmForm.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="05xxxxxxxxx"
                            pattern="[0-9]{10,11}"
                          />
                          <Form.Control.Feedback type="invalid">
                            Geçerli bir telefon numarası girin (10-11 rakam).
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="city">
                          <Form.Label>İl</Form.Label>
                          <Form.Select
                            required
                            name="city"
                            value={farmForm.city}
                            onChange={handleInputChange}
                            disabled={cityLoading}
                          >
                            <option value="">İl Seçin</option>
                            {cities.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </Form.Select>
                          {cityLoading && (
                            <div className="mt-2 text-center">
                              <Spinner animation="border" size="sm" variant="success" />
                              <span className="ms-2 text-muted">İller yükleniyor...</span>
                            </div>
                          )}
                          <Form.Control.Feedback type="invalid">
                            İl seçimi gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="district">
                          <Form.Label>İlçe</Form.Label>
                          <Form.Select
                            required
                            name="district"
                            value={farmForm.district}
                            onChange={handleInputChange}
                            disabled={!farmForm.city || districtLoading}
                          >
                            <option value="">İlçe Seçin</option>
                            {districts.map((district) => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </Form.Select>
                          {districtLoading && (
                            <div className="mt-2 text-center">
                              <Spinner animation="border" size="sm" variant="success" />
                              <span className="ms-2 text-muted">İlçeler yükleniyor...</span>
                            </div>
                          )}
                          <Form.Control.Feedback type="invalid">
                            İlçe seçimi gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3" controlId="address">
                      <Form.Label>Adres</Form.Label>
                      <Form.Control
                        required
                        as="textarea"
                        rows={3}
                        name="address"
                        value={farmForm.address}
                        onChange={handleInputChange}
                        placeholder="Çiftliğinizin tam adresini girin"
                      />
                      <Form.Control.Feedback type="invalid">
                        Adres gereklidir.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="taxNumber">
                      <Form.Label>Vergi Numarası</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="taxNumber"
                        value={farmForm.taxNumber}
                        onChange={handleInputChange}
                        placeholder="Vergi numaranızı girin"
                        pattern="[0-9]{10,11}"
                      />
                      <Form.Control.Feedback type="invalid">
                        Geçerli bir vergi numarası girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="description">
                      <Form.Label>Çiftlik Açıklaması</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={farmForm.description}
                        onChange={handleInputChange}
                        placeholder="Çiftliğiniz hakkında kısa bir açıklama yazın"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-4" controlId="categories">
                      <Form.Label>Çiftlik Kategorileri</Form.Label>
                      <div className="border rounded p-3">
                        <Row>
                          {categoryData.length === 0 ? (
                            <Col className="text-center py-3">
                              <Spinner animation="border" size="sm" variant="success" className="me-2" />
                              <span className="text-muted">Kategoriler yükleniyor...</span>
                            </Col>
                          ) : (
                            categoryData.map((category) => (
                              <Col md={4} className="mb-2" key={category._id}>
                                <Form.Check
                                  type="checkbox"
                                  id={`category-${category._id}`}
                                  label={category.category_name}
                                  value={category.category_name}
                                  checked={isCategorySelected(category.category_name)}
                                  onChange={handleCategoryChange}
                                />
                              </Col>
                            ))
                          )}
                        </Row>
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-4" controlId="offersShipping">
                      <Form.Check
                        type="switch"
                        id="shipping-switch"
                        label="Kargo ile gönderim yapıyorum"
                        name="offersShipping"
                        checked={farmForm.offersShipping}
                        onChange={handleCheckboxChange}
                      />
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="success" 
                        type="submit" 
                        className="d-flex align-items-center"
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Güncelleniyor...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Bilgileri Güncelle
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                <Tab.Pane eventKey="products" active={activeTab === 'products'}>
                  <ProductManagement apiClient={apiClient} farmerId={farmerData?._id} />
                </Tab.Pane>

                <Tab.Pane eventKey="orders" active={activeTab === 'orders'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">Siparişler</h4>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FaExclamationCircle className="me-2 text-info" />
                    Sipariş modülü henüz eklenmedi. Yakında burada siparişlerinizi takip edebileceksiniz.
                  </Alert>
                </Tab.Pane>

                <Tab.Pane eventKey="statistics" active={activeTab === 'statistics'}>
                  <h4 className="border-bottom pb-3 mb-4 text-success">İstatistikler</h4>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FaExclamationCircle className="me-2 text-info" />
                    İstatistik modülü henüz eklenmedi. Yakında burada satış istatistiklerinizi görüntüleyebileceksiniz.
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

export default FarmerDashboardPage; 