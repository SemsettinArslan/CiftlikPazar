import React, { useState, useContext, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserPlus } from 'react-icons/fa';
import { getCities, getDistrictsByCityId } from '../services/cityService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    district: ''
  });

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const { register, loading: registerLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const { 
    firstName, lastName, email, password, confirmPassword, phone, 
    address, city, district
  } = formData;

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
      if (!city) {
        setDistricts([]);
        return;
      }

      try {
        // İlçeleri yüklerken sadece ilçe kısmında loading gösterelim, tüm sayfada değil
        // setPageLoading(true); - Bu satırı kaldırdık
        
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === city);
        if (selectedCity) {
          const districtsData = await getDistrictsByCityId(selectedCity.cityid);
          setDistricts(districtsData);
          // İlçe seçimi sıfırla
          setFormData(prev => ({ ...prev, district: '' }));
        }
      } catch (error) {
        setError('İlçeler yüklenirken bir hata oluştu.');
        console.error(error);
      } finally {
        // setPageLoading(false); - Bu satırı kaldırdık
      }
    };

    loadDistricts();
  }, [city, cities]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Form doğrulama
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Şifre kontrolü
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setValidated(true);
    setError('');

    // Kayıt işlemi - sadece müşteri olarak
    const userData = { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      address, 
      city,
      district
    };
    
    const success = await register(userData);
    
    if (success) {
      navigate('/');
    }
  };

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
              <FaUserPlus className="text-success" size={30} />
              <h2 className="mt-2">Kayıt Ol</h2>
              <p className="text-muted">Yeni bir hesap oluşturun</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="firstName">
                    <Form.Label>Ad</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Adınız"
                      name="firstName"
                      value={firstName}
                      onChange={handleChange}
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
                    <Form.Label>Soyad</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Soyadınız"
                      name="lastName"
                      value={lastName}
                      onChange={handleChange}
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
                    <Form.Label>E-posta Adresi</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="E-posta adresiniz"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Lütfen geçerli bir e-posta adresi girin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Telefon Numarası</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Telefon numaranız (05XX XXX XX XX)"
                      name="phone"
                      value={phone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                    />
                    <Form.Control.Feedback type="invalid">
                      Lütfen geçerli bir telefon numarası girin (10-11 rakam).
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Şifre</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Şifreniz"
                      name="password"
                      value={password}
                      onChange={handleChange}
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
                    <Form.Label>Şifre Tekrar</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <Form.Control.Feedback type="invalid">
                      Şifrenizi tekrar girin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4" controlId="address">
                <Form.Label>Adres</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Adresiniz"
                  name="address"
                  value={address}
                  onChange={handleChange}
                  maxLength={200}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>İl</Form.Label>
                    <Form.Select 
                      name="city"
                      value={city}
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
                    <Form.Label>İlçe</Form.Label>
                    <Form.Select
                      name="district"
                      value={district}
                      onChange={handleChange}
                      disabled={!city || districts.length === 0}
                      required
                    >
                      <option value="">İlçe Seçiniz</option>
                      {districts.map((district, index) => (
                        <option key={index} value={district}>
                          {district}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid">
                <Button
                  variant="success"
                  type="submit"
                  disabled={registerLoading}
                  className="mb-3"
                >
                  {registerLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{' '}
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kayıt Ol'
                  )}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3">
              <p>
                Zaten hesabınız var mı?{' '}
                <Link to="/login" className="text-success">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default RegisterPage; 