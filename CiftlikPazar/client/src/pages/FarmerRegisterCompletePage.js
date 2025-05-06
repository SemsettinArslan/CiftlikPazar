import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaHome } from 'react-icons/fa';

const FarmerRegisterCompletePage = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="text-center" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <FaCheckCircle className="text-success mb-3" size={60} />
          <Card.Title className="fs-2 mb-3">Başvurunuz Tamamlandı!</Card.Title>
          <Card.Text>
            Çiftlik bilgileriniz başarıyla kaydedildi. Başvurunuz incelendikten sonra
            onaylanacak ve ürünlerinizi ekleyebileceksiniz.
          </Card.Text>
          <Card.Text className="mb-4">
            Başvurunuzun durumu hakkında bilgi almak için e-posta adresinizi kontrol edin
            veya hesabınıza giriş yaparak durumu takip edebilirsiniz.
          </Card.Text>
          <div className="d-grid gap-2">
            <Button as={Link} to="/" variant="success">
              <FaHome className="me-2" /> Ana Sayfaya Dön
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FarmerRegisterCompletePage; 