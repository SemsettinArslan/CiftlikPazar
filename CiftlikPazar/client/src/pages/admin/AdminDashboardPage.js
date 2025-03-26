import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUsers, FaLeaf, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';

const AdminDashboardPage = () => {
  return (
    <Container className="py-4">
      <h1 className="my-4 display-5 fw-bold border-bottom pb-3">Admin Paneli</h1>
      
      <p className="lead mb-4">
        Çiftlik Pazar yönetim paneline hoş geldiniz. Bu panel üzerinden sistemi yönetebilirsiniz.
      </p>
      
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Kullanıcılar</h5>
                <FaUsers className="text-primary" size={24} />
              </div>
              <h2 className="fw-bold mb-0">245</h2>
              <p className="text-muted">Toplam kullanıcı sayısı</p>
              <div className="mt-auto">
                <small className="text-success">+12% son haftada</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Çiftçiler</h5>
                <FaLeaf className="text-success" size={24} />
              </div>
              <h2 className="fw-bold mb-0">38</h2>
              <p className="text-muted">Onaylı çiftçi sayısı</p>
              <div className="mt-auto">
                <small className="text-warning">5 onay bekliyor</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Siparişler</h5>
                <FaShoppingCart className="text-info" size={24} />
              </div>
              <h2 className="fw-bold mb-0">189</h2>
              <p className="text-muted">Toplam sipariş sayısı</p>
              <div className="mt-auto">
                <small className="text-success">+8% son ayda</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="shadow-sm h-100 border-warning">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Bekleyen İşler</h5>
                <FaExclamationTriangle className="text-warning" size={24} />
              </div>
              <h2 className="fw-bold mb-0">7</h2>
              <p className="text-muted">Bekleyen işlem sayısı</p>
              <div className="mt-auto">
                <small className="text-danger">3 acil işlem mevcut</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="alert alert-info">
        <h5 className="alert-heading">Çiftçi Başvuruları</h5>
        <p className="mb-0">
          <strong>5 adet</strong> yeni çiftçi başvurusu incelemenizi bekliyor. 
          <a href="/admin/farmer-requests" className="alert-link ms-2">
            Başvuruları incelemek için tıklayın
          </a>
        </p>
      </div>
    </Container>
  );
};

export default AdminDashboardPage; 