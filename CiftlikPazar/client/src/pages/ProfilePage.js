import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Image, Nav, Table, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaCamera, FaEdit, FaTrashAlt, FaPlus, FaSave, FaTimes, FaHome, FaBuilding, FaCheck, FaClipboardList, FaAddressCard, FaIdCard, FaExclamationTriangle } from 'react-icons/fa';
import { getCities, getDistrictsByCityId } from '../services/cityService';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';

const ProfilePage = () => {
  const { user, setUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // State tanımlamaları
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [cities, setCities] = useState([]);
  const [profileDistricts, setProfileDistricts] = useState([]);
  const [addressDistricts, setAddressDistricts] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [validated, setValidated] = useState(false);
  
  // Silme modalı için state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Profil form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: ''
  });
  
  // Profil resmi state
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Adres form state
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    isDefault: false
  });
  
  // Adresler state
  const [addresses, setAddresses] = useState([]);
  const [editAddressId, setEditAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // İlleri yükle
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        setError('İller yüklenirken bir hata oluştu.');
        console.error(error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // İl değiştiğinde profil formunun ilçelerini yükle
  useEffect(() => {
    const loadDistricts = async () => {
      // İl seçilmemişse ilçeleri temizle
      if (!formData.city) {
        setProfileDistricts([]);
        return;
      }

      try {
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === formData.city);
        if (selectedCity) {
          const districtsData = await getDistrictsByCityId(selectedCity.cityid);
          setProfileDistricts(districtsData);
          
          // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
          const districtExists = districtsData.some(d => d === formData.district);
          if (!districtExists) {
            setFormData(prev => ({ ...prev, district: '' }));
          }
        }
      } catch (error) {
        setError('İlçeler yüklenirken bir hata oluştu.');
        console.error(error);
      }
    };

    loadDistricts();
  }, [formData.city, cities]);
  
  // Adres formundaki il değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadAddressDistricts = async () => {
      // İl seçilmemişse ilçeleri temizle
      if (!addressForm.city) {
        setAddressDistricts([]);
        return;
      }

      try {
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === addressForm.city);
        if (selectedCity) {
          const districtsData = await getDistrictsByCityId(selectedCity.cityid);
          setAddressDistricts(districtsData);
          
          // Eğer yeni ilçe listesinde mevcut ilçe yoksa, ilçe alanını sıfırla
          const districtExists = districtsData.some(d => d === addressForm.district);
          if (!districtExists) {
            setAddressForm(prev => ({ ...prev, district: '' }));
          }
        }
      } catch (error) {
        setError('İlçeler yüklenirken bir hata oluştu.');
        console.error(error);
      }
    };

    loadAddressDistricts();
  }, [addressForm.city, cities]);
  
  // Profil verilerini yükle
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        district: user.district || ''
      });
      
      // Profil resmi
      if (user.profileImage) {
        setPreviewImage(`${BASE_URL}/uploads/profile-images/${user.profileImage}`);
      }
      
      // Teslimat adreslerini yükle
      loadDeliveryAddresses();
    }
  }, [user, isAuthenticated]);
  
  // Kullanıcı giriş yapmadıysa ana sayfaya yönlendir
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, loading]);
  
  // Teslimat adreslerini yükle
  const loadDeliveryAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/delivery-addresses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      setError('Teslimat adresleri yüklenirken bir hata oluştu');
      console.error('Adres yükleme hatası:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };
  
  // Form verilerini güncelle
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Ad ve soyad için sadece harf girişine izin ver
    if ((name === 'firstName' || name === 'lastName') && value !== '') {
      const letterPattern = /^[A-Za-zğüşıöçĞÜŞİÖÇ ]+$/;
      if (!letterPattern.test(value)) {
        return; // Eğer sadece harf değilse değeri değiştirme
      }
    }
    
    // Telefon için sadece sayı girişine izin ver
    if (name === 'phone' && value !== '') {
      const numberPattern = /^[0-9]+$/;
      if (!numberPattern.test(value)) {
        return; // Eğer sadece sayı değilse değeri değiştirme
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Adres form verilerini güncelle
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setAddressForm({
        ...addressForm,
        [name]: checked
      });
      return;
    }
    
    // Posta kodu için sadece sayı girişine izin ver
    if (name === 'postalCode' && value !== '') {
      const numberPattern = /^[0-9]+$/;
      if (!numberPattern.test(value)) {
        return; // Eğer sadece sayı değilse değeri değiştirme
      }
    }
    
    setAddressForm({
      ...addressForm,
      [name]: value
    });
  };
  
  // Profil resmi değişikliği
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  // Profil resmi yükleme
  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!profileImage) {
      setError('Lütfen bir resim seçin');
      return;
    }
    
    setUploadingImage(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      
      const response = await axios.post(
        `${API_URL}/users/profile/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        const updatedUser = {
          ...user,
          profileImage: response.data.data.profileImage
        };
        
        // Kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Yüklenen resmin tam URL'sini göster
        setPreviewImage(`${BASE_URL}/uploads/profile-images/${response.data.data.profileImage}`);
        
        setSuccessMessage('Profil resmi başarıyla güncellendi');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Profil resmi yüklenirken bir hata oluştu'
      );
      console.error('Profil resmi yükleme hatası:', error);
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Profil bilgilerini güncelleme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/users/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Kullanıcı state'ini güncelle
        const updatedUser = {
          ...user,
          ...formData
        };
        
        // Kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccessMessage('Profil bilgileriniz başarıyla güncellendi');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Profil güncellenirken bir hata oluştu'
      );
      console.error('Profil güncelleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Teslimat adresi ekleme/güncelleme
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (editAddressId) {
        // Adres güncelleme
        response = await axios.put(
          `${API_URL}/users/delivery-addresses/${editAddressId}`,
          addressForm,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        setSuccessMessage('Teslimat adresi başarıyla güncellendi');
      } else {
        // Yeni adres ekleme
        response = await axios.post(
          `${API_URL}/users/delivery-addresses`,
          addressForm,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        setSuccessMessage('Teslimat adresi başarıyla eklendi');
      }
      
      if (response.data.success) {
        // Formu sıfırla
        setAddressForm({
          title: '',
          address: '',
          city: '',
          district: '',
          postalCode: '',
          isDefault: false
        });
        
        // Düzenleme modunu kapat
        setEditAddressId(null);
        setShowAddressForm(false);
        
        // Adresleri yeniden yükle
        loadDeliveryAddresses();
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Teslimat adresi işlemi sırasında bir hata oluştu'
      );
      console.error('Adres işlemi hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adres düzenleme
  const handleEditAddress = (address) => {
    setAddressForm({
      title: address.title,
      address: address.address,
      city: address.city,
      district: address.district || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault
    });
    setEditAddressId(address._id);
    setShowAddressForm(true);
    setActiveTab('addresses');
  };
  
  // Adres silme modalını göster
  const confirmDeleteAddress = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
  };
  
  // Silme işlemini iptal et
  const cancelDelete = () => {
    setAddressToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Adresi sil (yeni implementasyon)
  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/users/delivery-addresses/${addressToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Teslimat adresi başarıyla silindi');
        
        // Düzenleme modunda silinen adres ise formu sıfırla
        if (editAddressId === addressToDelete) {
          setAddressForm({
            title: '',
            address: '',
            city: '',
            district: '',
            postalCode: '',
            isDefault: false
          });
          setEditAddressId(null);
          setShowAddressForm(false);
        }
        
        // Adresleri yeniden yükle
        loadDeliveryAddresses();
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Adres silinirken bir hata oluştu'
      );
      console.error('Adres silme hatası:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setAddressToDelete(null);
    }
  };
  
  // Formu sıfırla
  const handleResetAddressForm = () => {
    setAddressForm({
      title: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      isDefault: false
    });
    setEditAddressId(null);
    setShowAddressForm(false);
    setValidated(false);
  };
  
  // Şehir ve ilçe değiştiğinde ilgili form verisi de değişsin
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setFormData({
      ...formData,
      city: selectedCity,
      district: '' // İl değiştiğinde ilçeyi sıfırla
    });
  };
  
  // Loading göstergesi
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" variant="success" />
      </div>
    );
  }
  
  return (
    <div className="bg-light min-vh-100 py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0 text-gray-800 fw-bold">Hesap Bilgilerim</h1>
            <p className="text-muted small">Hesap bilgilerinizi buradan yönetebilirsiniz</p>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" className="border-0 shadow-sm mb-4" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" className="border-0 shadow-sm mb-4" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}
        
        <Row>
          <Col lg={3} md={4} className="mb-4">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="text-center p-4">
                {previewImage ? (
                  <div className="mb-3">
                    <Image 
                      src={previewImage} 
                      alt="Profil Resmi" 
                      roundedCircle 
                      className="mb-3" 
                      style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid #f8f9fa' }}
                    />
                  </div>
                ) : (
                  <div className="mb-3">
                    <div 
                      className="bg-light text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: '120px', height: '120px', fontSize: '2rem', border: '3px solid #f8f9fa' }}
                    >
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  </div>
                )}
                
                <input 
                  id="profileImageInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }}
                />
                
                <h4 className="fw-bold mb-1">{user?.firstName} {user?.lastName}</h4>
                <p className="text-muted mb-2">{user?.email}</p>
                
                {user?.role === 'customer' ? (
                  <Badge bg="info" className="mb-3 py-2 px-3 rounded-pill">Müşteri</Badge>
                ) : user?.role === 'farmer' ? (
                  <Badge bg="success" className="mb-3 py-2 px-3 rounded-pill">Çiftçi</Badge>
                ) : user?.role === 'admin' ? (
                  <Badge bg="danger" className="mb-3 py-2 px-3 rounded-pill">Yönetici</Badge>
                ) : null}
                
                <div className="d-grid mt-2">
                  <Button 
                    variant="outline-success" 
                    className="d-flex align-items-center justify-content-center mb-2"
                    onClick={() => document.getElementById('profileImageInput').click()}
                  >
                    <FaCamera className="me-2" /> Fotoğraf Değiştir
                  </Button>
                </div>
                
                {profileImage && (
                  <div className="d-grid">
                    <Button 
                      variant="success" 
                      className="py-2 d-flex align-items-center justify-content-center"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Resmi Kaydet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom py-3">
                <h5 className="mb-0 fw-bold text-success">Hesap Menüsü</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Nav className="flex-column">
                  <Nav.Link 
                    className={`px-3 py-3 border-bottom ${activeTab === 'profile' ? 'bg-success text-white fw-bold' : 'text-dark'}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <FaIdCard className="me-2" /> Kişisel Bilgiler
                  </Nav.Link>
                  <Nav.Link 
                    className={`px-3 py-3 ${activeTab === 'addresses' ? 'bg-success text-white fw-bold' : 'text-dark'}`}
                    onClick={() => setActiveTab('addresses')}
                  >
                    <FaAddressCard className="me-2" /> Teslimat Adresleri
                  </Nav.Link>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={9} md={8}>
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom py-3">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                    <FaUser className="me-2" /> Kişisel Bilgilerim
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit} noValidate validated={validated}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaUser className="me-2 text-success" /> Ad
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            pattern="[A-Za-zğüşıöçĞÜŞİÖÇ ]+"
                            className="form-control-lg shadow-none"
                          />
                          <Form.Control.Feedback type="invalid">
                            Lütfen adınızı doğru formatta giriniz (sadece harf).
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaUser className="me-2 text-success" /> Soyad
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            pattern="[A-Za-zğüşıöçĞÜŞİÖÇ ]+"
                            className="form-control-lg shadow-none"
                          />
                          <Form.Control.Feedback type="invalid">
                            Lütfen soyadınızı doğru formatta giriniz (sadece harf).
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <FaEnvelope className="me-2 text-success" /> E-posta
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled
                        className="form-control-lg shadow-none bg-light"
                      />
                      <Form.Text className="text-muted">
                        E-posta adresiniz değiştirilemez
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <FaPhoneAlt className="me-2 text-success" /> Telefon
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className="form-control-lg shadow-none"
                        placeholder="5XXXXXXXXX"
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir telefon numarası giriniz (10 haneli, sadece rakam).
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Örnek: 5XXXXXXXXX (Başında 0 olmadan 10 haneli)
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <FaMapMarkerAlt className="me-2 text-success" /> Adres
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="shadow-none"
                      />
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaMapMarkerAlt className="me-2 text-success" /> Şehir
                          </Form.Label>
                          <Form.Select
                            name="city"
                            value={formData.city}
                            onChange={handleCityChange}
                            className="form-control-lg shadow-none"
                          >
                            <option value="">İl Seçiniz</option>
                            {cities.map((city) => (
                              <option key={city.cityid} value={city.city}>
                                {city.city}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaMapMarkerAlt className="me-2 text-success" /> İlçe
                          </Form.Label>
                          <Form.Select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={!formData.city || profileDistricts.length === 0}
                            className="form-control-lg shadow-none"
                          >
                            <option value="">İlçe Seçiniz</option>
                            {profileDistricts.map((district, index) => (
                              <option key={index} value={district}>
                                {district}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end mt-4">
                      <Button 
                        variant="success" 
                        type="submit" 
                        size="lg"
                        disabled={isLoading}
                        className="px-5 d-flex align-items-center"
                      >
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Güncelleniyor...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" /> Değişiklikleri Kaydet
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            )}
            
            {activeTab === 'addresses' && (
              <>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                      <FaMapMarkerAlt className="me-2" /> Teslimat Adreslerim
                    </h5>
                    {!showAddressForm && (
                      <Button 
                        variant="success" 
                        className="d-flex align-items-center"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <FaPlus className="me-2" /> Yeni Adres Ekle
                      </Button>
                    )}
                  </Card.Header>
                  <Card.Body className="p-0">
                    {loadingAddresses ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="success" />
                        <p className="mt-3 text-muted">Adresler yükleniyor...</p>
                      </div>
                    ) : addresses.length === 0 && !showAddressForm ? (
                      <div className="text-center py-5">
                        <FaMapMarkerAlt size={60} className="text-success mb-3" />
                        <h5 className="mb-3 fw-bold">Henüz Kayıtlı Adresiniz Yok</h5>
                        <p className="mb-4 text-muted px-4">Teslimat adreslerinizi buradan yönetebilirsiniz. Hızlı alışveriş için adres ekleyin.</p>
                        <Button 
                          variant="success" 
                          size="lg"
                          onClick={() => setShowAddressForm(true)}
                          className="px-4 d-inline-flex align-items-center"
                        >
                          <FaPlus className="me-2" /> Yeni Adres Ekle
                        </Button>
                      </div>
                    ) : addresses.length > 0 && !showAddressForm ? (
                      <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="fw-bold py-3">Adres Başlığı</th>
                              <th className="fw-bold py-3">Adres Detayı</th>
                              <th className="fw-bold py-3">Şehir/İlçe</th>
                              <th className="fw-bold py-3">Durum</th>
                              <th className="fw-bold py-3">İşlemler</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addresses.map((address) => (
                              <tr key={address._id}>
                                <td className="fw-bold">{address.title}</td>
                                <td>{address.address.length > 40 ? `${address.address.substring(0, 40)}...` : address.address}</td>
                                <td>{address.district ? `${address.district}, ` : ''}{address.city}</td>
                                <td>
                                  {address.isDefault ? (
                                    <Badge bg="success" className="rounded-pill px-3 py-2">
                                      <FaCheck className="me-1" /> Varsayılan
                                    </Badge>
                                  ) : (
                                    <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">
                                      Normal
                                    </Badge>
                                  )}
                                </td>
                                <td>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="me-2 d-inline-flex align-items-center"
                                    onClick={() => handleEditAddress(address)}
                                  >
                                    <FaEdit className="me-1" /> Düzenle
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="d-inline-flex align-items-center"
                                    onClick={() => confirmDeleteAddress(address._id)}
                                  >
                                    <FaTrashAlt className="me-1" /> Sil
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : null}
                  </Card.Body>
                </Card>
                
                {showAddressForm && (
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom py-3">
                      <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                        {editAddressId ? (
                          <>
                            <FaEdit className="me-2" /> Teslimat Adresini Düzenle
                          </>
                        ) : (
                          <>
                            <FaPlus className="me-2" /> Yeni Teslimat Adresi Ekle
                          </>
                        )}
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Form onSubmit={handleAddressSubmit} noValidate validated={validated}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaClipboardList className="me-2 text-success" /> Adres Başlığı
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="title"
                            value={addressForm.title}
                            onChange={handleAddressChange}
                            placeholder="Örn. Ev, İş"
                            required
                            className="form-control-lg shadow-none"
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">
                            <FaMapMarkerAlt className="me-2 text-success" /> Adres
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="address"
                            value={addressForm.address}
                            onChange={handleAddressChange}
                            required
                            className="shadow-none"
                          />
                        </Form.Group>
                        
                        <Row>
                          <Col md={4}>
                            <Form.Group className="mb-4">
                              <Form.Label className="fw-bold">
                                <FaMapMarkerAlt className="me-2 text-success" /> Şehir
                              </Form.Label>
                              <Form.Select
                                name="city"
                                value={addressForm.city}
                                onChange={(e) => {
                                  const selectedCity = e.target.value;
                                  setAddressForm({
                                    ...addressForm,
                                    city: selectedCity,
                                    district: '' // İl değiştiğinde ilçeyi sıfırla
                                  });
                                }}
                                required
                                className="form-control-lg shadow-none"
                              >
                                <option value="">İl Seçiniz</option>
                                {cities.map((city) => (
                                  <option key={city.cityid} value={city.city}>
                                    {city.city}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          
                          <Col md={4}>
                            <Form.Group className="mb-4">
                              <Form.Label className="fw-bold">
                                <FaMapMarkerAlt className="me-2 text-success" /> İlçe
                              </Form.Label>
                              <Form.Select
                                name="district"
                                value={addressForm.district}
                                onChange={handleAddressChange}
                                disabled={!addressForm.city || addressDistricts.length === 0}
                                required
                                className="form-control-lg shadow-none"
                              >
                                <option value="">İlçe Seçiniz</option>
                                {addressDistricts.map((district, index) => (
                                  <option key={index} value={district}>
                                    {district}
                                  </option>
                                ))}
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">
                                Lütfen ilçe seçiniz.
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          
                          <Col md={4}>
                            <Form.Group className="mb-4">
                              <Form.Label className="fw-bold">
                                <FaHome className="me-2 text-success" /> Posta Kodu
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="postalCode"
                                value={addressForm.postalCode}
                                onChange={handleAddressChange}
                                required
                                pattern="[0-9]+"
                                maxLength={5}
                                className="form-control-lg shadow-none"
                                placeholder="34000"
                              />
                              <Form.Control.Feedback type="invalid">
                                Lütfen geçerli bir posta kodu giriniz (sadece rakam).
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Form.Group className="mb-4">
                          <Form.Check
                            type="checkbox"
                            id="isDefault"
                            label="Bu adresi varsayılan teslimat adresi olarak ayarla"
                            name="isDefault"
                            checked={addressForm.isDefault}
                            onChange={handleAddressChange}
                            className="fs-5"
                          />
                        </Form.Group>
                        
                        <div className="d-flex justify-content-end mt-4 gap-2">
                          <Button 
                            variant="secondary" 
                            onClick={handleResetAddressForm}
                            disabled={isLoading}
                            className="px-4 py-2 d-flex align-items-center"
                          >
                            <FaTimes className="me-2" /> İptal
                          </Button>
                          <Button 
                            variant="success" 
                            type="submit" 
                            size="lg"
                            disabled={isLoading}
                            className="px-5 d-flex align-items-center"
                          >
                            {isLoading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Kaydediliyor...
                              </>
                            ) : (
                              <>
                                <FaSave className="me-2" /> {editAddressId ? 'Güncelle' : 'Kaydet'}
                              </>
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}
          </Col>
        </Row>
        
        {/* Silme Onay Modalı */}
        <Modal 
          show={showDeleteModal} 
          onHide={cancelDelete}
          centered
          backdrop="static"
        >
          <Modal.Header className="border-bottom-0 pb-0">
            <Modal.Title as="h5" className="text-danger">
              <FaExclamationTriangle className="me-2" /> Adres Silme Onayı
            </Modal.Title>
            <Button 
              variant="light" 
              size="sm" 
              onClick={cancelDelete}
              className="ms-auto border-0 bg-transparent"
            >
              <FaTimes />
            </Button>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <p>Bu teslimat adresini silmek istediğinizden emin misiniz?</p>
            <p className="text-muted small mb-0">Bu işlem geri alınamaz.</p>
          </Modal.Body>
          <Modal.Footer className="border-top-0">
            <Button 
              variant="outline-secondary" 
              onClick={cancelDelete}
              disabled={deleteLoading}
              className="d-flex align-items-center px-3 py-2 border"
            >
              <FaTimes className="me-2" /> Vazgeç
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAddress}
              disabled={deleteLoading}
              className="d-flex align-items-center"
            >
              {deleteLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Siliniyor...</span>
                </>
              ) : (
                <>
                  <FaTrashAlt className="me-2" /> Evet, Sil
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default ProfilePage; 