import React, { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaLock } from 'react-icons/fa';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [validated, setValidated] = useState(false);
  const { resetToken } = useParams();
  const { resetPassword, loading, error } = useContext(AuthContext);
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
    
    // Şifre doğrulama
    if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    
    setPasswordError('');
    
    // Şifre sıfırlama işlemini gerçekleştir
    const success = await resetPassword(resetToken, password);
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
              <FaLock className="text-success" size={30} />
              <h2 className="mt-2">Şifre Sıfırlama</h2>
              <p className="text-muted">
                Lütfen yeni şifrenizi belirleyin.
              </p>
            </div>

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Yeni Şifre</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Yeni şifrenizi giriniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Form.Control.Feedback type="invalid">
                  Şifre en az 6 karakter olmalıdır.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label>Şifre Tekrar</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Şifrenizi tekrar giriniz"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Lütfen şifrenizi tekrar girin.
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
                    'Şifremi Sıfırla'
                  )}
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <p className="mb-0">
                  <Link to="/login" className="text-success text-decoration-none">
                    Giriş sayfasına dön
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

export default ResetPasswordPage; 