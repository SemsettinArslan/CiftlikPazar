import React, { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaSignInAlt } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Form doğrulama
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setError('');

    // Giriş işlemi
    const success = await login(email, password);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-center align-items-center">
        <Card className="auth-form mt-5">
          <Card.Body>
            <div className="text-center mb-4">
              <FaSignInAlt className="text-success" size={30} />
              <h2 className="mt-2">Giriş Yap</h2>
              <p className="text-muted">Hesabınıza giriş yapın</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>E-posta Adresi</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="E-posta adresinizi girin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Lütfen geçerli bir e-posta adresi girin.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Şifre</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Form.Control.Feedback type="invalid">
                  Şifre en az 6 karakter olmalıdır.
                </Form.Control.Feedback>
                <div className="text-end mt-2">
                  <Link to="/forgot-password" className="text-decoration-none small">
                    Şifremi Unuttum
                  </Link>
                </div>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="success"
                  type="submit"
                  disabled={loading}
                  className="mb-3"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3">
              <p className="mb-0">
                Hesabınız yok mu?{' '}
                <Link to="/register" className="text-success text-decoration-none">
                  Şimdi Kayıt Olun
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default LoginPage; 