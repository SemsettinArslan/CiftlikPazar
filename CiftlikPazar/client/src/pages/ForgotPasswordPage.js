import React, { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaKey } from 'react-icons/fa';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [validated, setValidated] = useState(false);
  const { forgotPassword, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form gönderildiğinde
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
    
    if (!email) {
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setEmailSent(true);
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-center align-items-center">
        <Card className="auth-form mt-5">
          <Card.Body>
            <div className="text-center mb-4">
              <FaKey className="text-success" size={30} />
              <h2 className="mt-2">Şifremi Unuttum</h2>
              {!emailSent ? (
                <p className="text-muted">
                  E-posta adresinizi giriniz. Şifre sıfırlama bağlantısı gönderilecektir.
                </p>
              ) : (
                <Alert variant="success" className="mt-3">
                  E-posta adresinize şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.
                </Alert>
              )}
            </div>

            {!emailSent ? (
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>E-posta Adresi</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="E-posta adresinizi giriniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Lütfen geçerli bir e-posta adresi girin.
                  </Form.Control.Feedback>
                </Form.Group>

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
                          className="me-2"
                        />
                        İşlem Yapılıyor...
                      </>
                    ) : (
                      'Şifre Sıfırlama Bağlantısı Gönder'
                    )}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="d-grid gap-2 mt-4">
                <Button variant="outline-success" onClick={() => navigate('/login')}>
                  Giriş Sayfasına Dön
                </Button>
              </div>
            )}

            <div className="text-center mt-4">
              <p className="mb-0">
                Giriş yapmayı mı tercih edersiniz?{' '}
                <Link to="/login" className="text-success text-decoration-none">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ForgotPasswordPage; 