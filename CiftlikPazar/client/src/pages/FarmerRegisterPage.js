import React, { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FarmerRegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const { 
    firstName, lastName, email, password, confirmPassword, phone
  } = formData;

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
    setLoading(true);

    try {
      // Kullanıcı verilerini sadece localStorage'a kaydedelim 
      // Users'a kayıt 2. adımda olacak
      localStorage.setItem('temp_farmer_registration', JSON.stringify({
        firstName, 
        lastName, 
        email, 
        password, // Şifreyi de kaydedelim, ikinci adımda kullanacağız
        phone,
        role: 'farmer'
      }));
      
      // Doğrudan ikinci adıma yönlendir
      navigate('/farmer-register-step2');
    } catch (err) {
      setError('İşlem sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              <h2 className="mt-2">Çiftçi Başvurusu</h2>
              <p className="text-muted">Çiftlik Pazarı'na çiftçi olarak katılın</p>
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
                      Şifre tekrarını girin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid gap-2 mt-4">
                <Button variant="success" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">İşleniyor...</span>
                    </>
                  ) : (
                    'Devam Et'
                  )}
                </Button>
              </div>

              <div className="text-center mt-3">
                <p>
                  Zaten hesabınız var mı?{' '}
                  <Link to="/login" className="text-success">
                    Giriş Yap
                  </Link>
                </p>
                <p>
                  <Link to="/register" className="text-success">
                    Müşteri olarak kaydolmak için tıklayın
                  </Link>
                </p>
                <p>
                  <Link to="/company-register" className="text-success">
                    Firma olarak kaydolmak için tıklayın
                  </Link>
                </p>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default FarmerRegisterPage; 