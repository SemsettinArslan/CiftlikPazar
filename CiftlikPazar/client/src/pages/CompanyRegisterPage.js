import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCities, getDistrictsByCityId } from '../services/cityService';

const CompanyRegisterPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    city: '',
    district: '',
    address: '',
    contactPerson: {
      name: '',
      position: '',
      phone: '',
      email: ''
    },
    companyType: 'other'
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Kişisel Bilgiler, 2: Firma Bilgileri
  const [validated, setValidated] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  
  // İlleri yükle
  useEffect(() => {
    const loadCities = async () => {
      try {
        setPageLoading(true);
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        setError('İller yüklenirken bir hata oluştu.');
        console.error(error);
      } finally {
        setPageLoading(false);
      }
    };

    loadCities();
  }, []);

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.city) {
        setDistricts([]);
        return;
      }

      try {
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === formData.city);
        if (selectedCity) {
          const districtsData = await getDistrictsByCityId(selectedCity.cityid);
          setDistricts(districtsData);
          // İlçe seçimi sıfırla
          setFormData(prev => ({ ...prev, district: '' }));
        }
      } catch (error) {
        setError('İlçeler yüklenirken bir hata oluştu.');
        console.error(error);
      }
    };

    loadDistricts();
  }, [formData.city, cities]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Telefon numarası kontrolü - sadece rakam ve 10 hane
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({
        ...formData,
        [name]: numericValue
      });
      return;
    }
    
    // Vergi numarası kontrolü - sadece rakam ve 11 hane
    if (name === 'taxNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData({
        ...formData,
        [name]: numericValue
      });
      return;
    }
    
    if (name.includes('.')) {
      // Nested object (contactPerson) - telefon numarası kontrolü
      const [parent, child] = name.split('.');
      
      if (child === 'phone') {
        const numericValue = value.replace(/\D/g, '').slice(0, 10);
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: numericValue
          }
        });
        return;
      }
      
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const validateStep1 = (form) => {
    // Kişisel bilgileri doğrula
    if (form.checkValidity() === false) {
      return false;
    }
    
    // Şifrelerin eşleştiğini doğrula
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const validateStep2 = (form) => {
    // Firma bilgilerini doğrula
    if (form.checkValidity() === false) {
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleNextStep = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setValidated(true);
    
    if (validateStep1(form)) {
      setStep(2);
      setValidated(false); // Reset validation for step 2
    }
  };
  
  const handlePrevStep = () => {
    setStep(1);
    setValidated(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setValidated(true);
    
    if (!validateStep2(form)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/companies/register', formData);
      
      if (response.data.success) {
        toast.success('Firma hesabınız başarıyla oluşturuldu. Onay için bekleyiniz.', {
          position: "bottom-right",
          autoClose: 5000
        });
        
        // Onay bekleyen firma hesapları için token kaydetmiyoruz
        // ve doğrudan dashboard'a yönlendirmiyoruz
        
        // Kullanıcıyı login sayfasına yönlendir
        navigate('/login', { 
          state: { 
            message: 'Firma hesabınız başarıyla oluşturuldu. Hesabınız onaylandıktan sonra giriş yapabilirsiniz.' 
          } 
        });
      } else {
        setError(response.data.message || 'Kayıt işlemi sırasında bir hata oluştu');
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Kayıt işlemi sırasında bir hata oluştu');
      } else {
        setError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Firma türleri
  const companyTypes = [
    { value: 'restaurant', label: 'Restoran / Kafe' },
    { value: 'hotel', label: 'Otel / Konaklama' },
    { value: 'market', label: 'Market / Bakkal' },
    { value: 'processor', label: 'Gıda İşleyici / Üretici' },
    { value: 'exporter', label: 'İhracatçı' },
    { value: 'other', label: 'Diğer' }
  ];
  
  if (pageLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status" variant="success">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="d-flex justify-content-center align-items-center">
        <Card className="auth-form mt-5 mb-5" style={{ width: '600px', maxWidth: '100%' }}>
          <Card.Body>
            <div className="text-center mb-4">
              <FaBuilding className="text-success" size={30} />
              <h2 className="mt-2">Firma Başvurusu</h2>
              <p className="text-muted">Çiftlik Pazarı'na firma olarak katılın</p>
            </div>
            
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}
            
            {step === 1 ? (
              <Form noValidate validated={validated} onSubmit={handleNextStep}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="firstName">
                      <div className="mb-1">Ad</div>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Adınız"
                        required
                        maxLength={30}
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen adınızı girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="lastName">
                      <div className="mb-1">Soyad</div>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Soyadınız"
                        required
                        maxLength={30}
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen soyadınızı girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="email">
                      <div className="mb-1">E-posta Adresi</div>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="E-posta adresiniz"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir e-posta adresi girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="phone">
                      <div className="mb-1">Telefon Numarası</div>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Telefon numaranız (05XX XXX XX XX)"
                        required
                        pattern="[0-9]{10}"
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir telefon numarası girin (10 rakam).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="password">
                      <div className="mb-1">Şifre</div>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Şifreniz"
                        required
                        minLength={6}
                      />
                      <Form.Control.Feedback type="invalid">
                        Şifre en az 6 karakter olmalıdır.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <div className="mb-1">Şifre Tekrar</div>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Şifrenizi tekrar girin"
                        required
                        minLength={6}
                      />
                      <Form.Control.Feedback type="invalid">
                        Şifre tekrarını girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2 mt-4">
                  <Button type="submit" variant="success">
                    Devam Et
                  </Button>
                </div>
              </Form>
            ) : (
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="companyName">
                  <div className="mb-1">Firma Adı</div>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Firma Adı"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Lütfen firma adını girin.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="taxNumber">
                      <div className="mb-1">Vergi Numarası</div>
                      <Form.Control
                        type="text"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        placeholder="Vergi numarası"
                        required
                        pattern="[0-9]{10,11}"
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir vergi numarası girin (10-11 rakam).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="taxOffice">
                      <div className="mb-1">Vergi Dairesi</div>
                      <Form.Control
                        type="text"
                        name="taxOffice"
                        value={formData.taxOffice}
                        onChange={handleChange}
                        placeholder="Vergi Dairesi"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen vergi dairesini girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="city">
                      <div className="mb-1">İl</div>
                      <Form.Select 
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      >
                        <option value="">İl Seçiniz</option>
                        {cities.map((city) => (
                          <option key={city.cityid} value={city.city}>
                            {city.city}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Lütfen il seçin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="district">
                      <div className="mb-1">İlçe</div>
                      <Form.Select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.city || districts.length === 0}
                        required
                      >
                        <option value="">İlçe Seçiniz</option>
                        {districts.map((district, index) => (
                          <option key={index} value={district}>
                            {district}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Lütfen ilçe seçin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="address">
                  <div className="mb-1">Adres</div>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Firma adresi"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Lütfen adres bilgisini girin.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="companyType">
                  <div className="mb-1">Firma Türü</div>
                  <Form.Select
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleChange}
                  >
                    {companyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <h5 className="mb-3 mt-4">İletişim Kişisi Bilgileri</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="contactPersonName">
                      <div className="mb-1">İletişim Kişisi Adı</div>
                      <Form.Control
                        type="text"
                        name="contactPerson.name"
                        value={formData.contactPerson.name}
                        onChange={handleChange}
                        placeholder="Ad Soyad"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen iletişim kişisinin adını girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="contactPersonPosition">
                      <div className="mb-1">Pozisyon</div>
                      <Form.Control
                        type="text"
                        name="contactPerson.position"
                        value={formData.contactPerson.position}
                        onChange={handleChange}
                        placeholder="Ünvan / Pozisyon"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="contactPersonPhone">
                      <div className="mb-1">İletişim Telefonu</div>
                      <Form.Control
                        type="tel"
                        name="contactPerson.phone"
                        value={formData.contactPerson.phone}
                        onChange={handleChange}
                        placeholder="05XX XXX XX XX"
                        required
                        pattern="[0-9]{10}"
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir telefon numarası girin (10 rakam).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="contactPersonEmail">
                      <div className="mb-1">İletişim E-posta</div>
                      <Form.Control
                        type="email"
                        name="contactPerson.email"
                        value={formData.contactPerson.email}
                        onChange={handleChange}
                        placeholder="ornek@sirket.com"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Lütfen geçerli bir e-posta adresi girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2 mt-4">
                  <Button type="button" variant="outline-secondary" onClick={handlePrevStep} className="mb-2">
                    Geri
                  </Button>
                  <Button type="submit" variant="success" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Kaydediliyor...</span>
                      </>
                    ) : (
                      'Kayıt Ol'
                    )}
                  </Button>
                </div>
              </Form>
            )}
            
            <div className="text-center mt-3">
              <p>
                Zaten hesabınız var mı? <Link to="/login" className="text-success">Giriş Yap</Link>
              </p>
              <p>
                <Link to="/register" className="text-success">
                  Müşteri olarak kaydolmak için tıklayın
                </Link>
              </p>
              <p>
                <Link to="/farmer-register" className="text-success">
                  Çiftçi olarak kaydolmak için tıklayın
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default CompanyRegisterPage; 