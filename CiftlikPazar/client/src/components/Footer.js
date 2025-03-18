import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="py-4">
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-4">Çiftlik Pazar</h5>
            <p>
              Taze ve organik ürünler arayan tüketicileri, ürünlerini doğrudan satmak isteyen yerel üreticilerle buluşturan dijital pazar yeri.
            </p>
            <div className="d-flex mt-4">
              <a href="https://facebook.com" className="text-white me-3">
                <FaFacebook size={24} />
              </a>
              <a href="https://twitter.com" className="text-white me-3">
                <FaTwitter size={24} />
              </a>
              <a href="https://instagram.com" className="text-white">
                <FaInstagram size={24} />
              </a>
            </div>
          </Col>
          
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-4">Hızlı Linkler</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-white text-decoration-none">Ana Sayfa</Link>
              </li>
              <li className="mb-2">
                <Link to="/products" className="text-white text-decoration-none">Ürünler</Link>
              </li>
              <li className="mb-2">
                <Link to="/producers" className="text-white text-decoration-none">Üreticiler</Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-white text-decoration-none">Hakkımızda</Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-white text-decoration-none">İletişim</Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4}>
            <h5 className="text-uppercase mb-4">İletişim</h5>
            <ul className="list-unstyled">
              <li className="mb-3">
                <FaMapMarkerAlt className="me-2" />
                Tarım Caddesi No:123, 34000, İstanbul
              </li>
              <li className="mb-3">
                <FaPhone className="me-2" />
                +90 212 123 45 67
              </li>
              <li className="mb-3">
                <FaEnvelope className="me-2" />
                info@ciftlikpazar.com
              </li>
            </ul>
          </Col>
        </Row>
        
        <hr className="my-4 bg-light" />
        
        <Row>
          <Col className="text-center py-3">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Çiftlik Pazar | Tüm Hakları Saklıdır
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 