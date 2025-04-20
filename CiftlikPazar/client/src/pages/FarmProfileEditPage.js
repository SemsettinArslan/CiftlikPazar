import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getCities, getDistrictsByCityId } from '../services/cityService';
import { FaCamera, FaBuilding, FaRegMoneyBillAlt, FaTag, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

const FarmProfileEditPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [farmer, setFarmer] = useState(null);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
  const [hasImageChanged, setHasImageChanged] = useState({
    profile: false,
    cover: false,
  });
  const [validated, setValidated] = useState(false);

  // Form verileri
  const [formData, setFormData] = useState({
    farmName: '',
    taxNumber: '',
    city: '',
    district: '',
    address: '',
    description: '',
    hasShipping: false,
    minOrderAmount: '0',
  });

  // Sayfaya erişim kontrolü
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    } else if (isAuthenticated && user && !user.isFarmer) {
      navigate('/profile');
    }
  }, [isAuthenticated, loading, navigate, user]);

  // Çiftlik verilerini ve diğer verileri yükle
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFarmProfile();
      loadCities();
      loadCategories();
    }
  }, [isAuthenticated, user]);

  // Çiftlik profilini yükle
  const loadFarmProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/farmers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        const farmData = response.data;
        setFarmer(farmData);
        
        setFormData({
          farmName: farmData.farmName || '',
          taxNumber: farmData.taxNumber || '',
          city: farmData.city || '',
          district: farmData.district || '',
          address: farmData.address || '',
          description: farmData.description || '',
          hasShipping: farmData.hasShipping || false,
          minOrderAmount: farmData.minOrderAmount ? farmData.minOrderAmount.toString() : '0',
        });

        // Kategorileri ayarla
        if (farmData.categories) {
          setSelectedCategories(
            farmData.categories.map(cat => (typeof cat === 'object' ? cat._id : cat))
          );
        }

        // Profil ve kapak resimlerini ayarla
        if (farmData.profileImage) {
          setPreviewProfileImage(`${BASE_URL}/uploads/farmer-images/${farmData.profileImage}`);
        }
        
        if (farmData.coverImage) {
          setPreviewCoverImage(`${BASE_URL}/uploads/farmer-images/${farmData.coverImage}`);
        }

        // İlçeleri yükle
        if (farmData.city) {
          loadDistricts(farmData.city);
        }
      }
    } catch (error) {
      setMessage('Çiftlik bilgileri yüklenirken bir hata oluştu');
      setMessageType('danger');
      console.error('Çiftlik profili yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Şehirleri yükle
  const loadCities = async () => {
    try {
      const citiesData = await getCities();
      setCities(citiesData);
    } catch (error) {
      setMessage('İller yüklenirken bir hata oluştu');
      setMessageType('danger');
      console.error('İl yükleme hatası:', error);
    }
  };

  // İlçeleri yükle
  const loadDistricts = async (cityName) => {
    try {
      const selectedCity = cities.find(c => c.city === cityName);
      if (selectedCity) {
        const districtsData = await getDistrictsByCityId(selectedCity.cityid);
        setDistricts(districtsData);
      }
    } catch (error) {
      setMessage('İlçeler yüklenirken bir hata oluştu');
      setMessageType('danger');
      console.error('İlçe yükleme hatası:', error);
    }
  };

  // Kategorileri yükle
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      setMessage('Kategoriler yüklenirken bir hata oluştu');
      setMessageType('danger');
      console.error('Kategori yükleme hatası:', error);
    }
  };

  // Form verilerini güncelle
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // İl değiştiğinde ilçeyi sıfırla ve yeni ilçeleri yükle
    if (name === 'city') {
      setFormData(prev => ({ ...prev, district: '' }));
      loadDistricts(value);
    }
  };

  // Kategori seçimi
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Profil resmi seçme
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewProfileImage(URL.createObjectURL(file));
      setHasImageChanged(prev => ({ ...prev, profile: true }));
    }
  };

  // Kapak resmi seçme
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreviewCoverImage(URL.createObjectURL(file));
      setHasImageChanged(prev => ({ ...prev, cover: true }));
    }
  };

  // Resim yükleme
  const uploadImage = async (image, type) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', image);

      const response = await axios.post(
        `${API_URL}/farmers/upload-${type}-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.imageUrl;
    } catch (error) {
      console.error(`${type} resmi yükleme hatası:`, error);
      throw new Error(`${type === 'profile' ? 'Profil' : 'Kapak'} resmi yüklenirken bir hata oluştu.`);
    }
  };

  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSaving(true);
    setMessage('');
    setMessageType('');

    try {
      const token = localStorage.getItem('token');
      let updatedData = { ...formData };

      // Profil resmi değiştiyse yükle
      if (hasImageChanged.profile && profileImage) {
        const profileImageUrl = await uploadImage(profileImage, 'profile');
        updatedData.profileImage = profileImageUrl;
      }

      // Kapak resmi değiştiyse yükle
      if (hasImageChanged.cover && coverImage) {
        const coverImageUrl = await uploadImage(coverImage, 'cover');
        updatedData.coverImage = coverImageUrl;
      }

      // Sayısal alanları dönüştür
      updatedData.minOrderAmount = parseFloat(updatedData.minOrderAmount) || 0;
      
      // Kategorileri ekle
      updatedData.categories = selectedCategories;

      // Çiftlik bilgilerini güncelle
      const response = await axios.put(
        `${API_URL}/farmers/update-profile`,
        updatedData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setMessage('Çiftlik bilgileri başarıyla güncellendi');
        setMessageType('success');
        setFarmer(response.data);
        setHasImageChanged({ profile: false, cover: false });
        
        // Kullanıcı bilgilerini localStorage'da güncelle
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo) {
          userInfo.farmer = response.data;
          localStorage.setItem('user', JSON.stringify(userInfo));
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Çiftlik bilgileri güncellenirken bir hata oluştu');
      setMessageType('danger');
      console.error('Çiftlik güncelleme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
        <p className="mt-3">Çiftlik bilgileri yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Çiftlik Profilini Düzenle</h2>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Header as="h5" className="bg-light">Kapak Fotoğrafı</Card.Header>
        <Card.Body className="p-0">
          <div 
            className="cover-image-container position-relative" 
            style={{ 
              height: '200px', 
              background: previewCoverImage ? `url(${previewCoverImage})` : '#f8f9fa',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!previewCoverImage && (
              <div className="d-flex justify-content-center align-items-center h-100">
                <FaBuilding size={50} color="#dee2e6" />
              </div>
            )}
            <div className="position-absolute bottom-0 end-0 p-2">
              <Form.Group controlId="coverImage">
                <Form.Label className="btn btn-dark btn-sm rounded-pill">
                  <FaCamera className="me-1" /> Kapak Fotoğrafı Değiştir
                  <Form.Control 
                    type="file" 
                    accept="image/*"
                    onChange={handleCoverImageChange} 
                    style={{ display: 'none' }} 
                  />
                </Form.Label>
              </Form.Group>
            </div>
          </div>
          
          <div className="text-center mt-n4 mb-3">
            <div 
              className="profile-image-container position-relative mx-auto" 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%',
                border: '4px solid white',
                background: previewProfileImage ? `url(${previewProfileImage})` : '#e9ecef',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!previewProfileImage && (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <FaBuilding size={40} color="#adb5bd" />
                </div>
              )}
              <Form.Group controlId="profileImage" className="position-absolute bottom-0 end-0">
                <Form.Label className="btn btn-primary btn-sm rounded-circle p-1" style={{ marginBottom: 0 }}>
                  <FaCamera />
                  <Form.Control 
                    type="file" 
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }} 
                  />
                </Form.Label>
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farmName">
                  <Form.Label>Çiftlik Adı</Form.Label>
                  <Form.Control
                    type="text"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleChange}
                    placeholder="Çiftlik adını girin"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Çiftlik adı gereklidir
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="taxNumber">
                  <Form.Label>Vergi Numarası</Form.Label>
                  <Form.Control
                    type="text"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    placeholder="Vergi numaranızı girin"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Vergi numarası gereklidir
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="city">
                  <Form.Label>İl</Form.Label>
                  <Form.Select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  >
                    <option value="">İl seçin</option>
                    {cities.map((city, index) => (
                      <option key={index} value={city.city}>
                        {city.city}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    İl seçimi gereklidir
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="district">
                  <Form.Label>İlçe</Form.Label>
                  <Form.Select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    disabled={!formData.city}
                    required
                  >
                    <option value="">İlçe seçin</option>
                    {districts.map((district, index) => (
                      <option key={index} value={district}>
                        {district}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    İlçe seçimi gereklidir
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="address">
              <Form.Label>Adres</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Adresinizi girin"
                required
              />
              <Form.Control.Feedback type="invalid">
                Adres gereklidir
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Çiftlik Açıklaması</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Çiftliğiniz hakkında bilgi verin"
              />
            </Form.Group>
            
            <Form.Group className="mb-4" controlId="categories">
              <Form.Label>Kategoriler</Form.Label>
              <div>
                {categories.map((category) => (
                  <Badge
                    key={category._id}
                    bg={selectedCategories.includes(category._id) ? "primary" : "light"}
                    text={selectedCategories.includes(category._id) ? "white" : "dark"}
                    style={{ 
                      cursor: 'pointer', 
                      margin: '0 5px 5px 0',
                      padding: '8px 12px'
                    }}
                    onClick={() => toggleCategory(category._id)}
                  >
                    <FaTag className="me-1" /> {category.name}
                  </Badge>
                ))}
              </div>
              {selectedCategories.length === 0 && validated && (
                <div className="text-danger small mt-1">
                  En az bir kategori seçmelisiniz
                </div>
              )}
            </Form.Group>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="hasShipping">
                  <Form.Check
                    type="checkbox"
                    name="hasShipping"
                    label="Kargo Hizmeti Sunuyorum"
                    checked={formData.hasShipping}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Ürünleriniz için kargo hizmeti sunuyorsanız işaretleyin
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="minOrderAmount">
                  <Form.Label>Minimum Sipariş Tutarı (₺)</Form.Label>
                  <Form.Control
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <Form.Text className="text-muted">
                    Minimum sipariş tutarını belirleyin (0 = sınır yok)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <Button variant="outline-secondary" onClick={() => navigate('/profile')}>
                İptal
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Kaydediliyor...</span>
                  </>
                ) : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FarmProfileEditPage; 