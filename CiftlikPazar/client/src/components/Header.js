import React, { useContext } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaLeaf, FaStore, FaUsers, FaInfoCircle, FaChevronDown } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Kullanıcının tam adını alma fonksiyonu
  const getFullName = () => {
    if (!user) return '';
    
    // Eski veri yapısına uyumluluk
    if (user.name) return user.name;
    
    // Yeni veri yapısı
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Varsayılan olarak sadece birini göster
    return user.firstName || user.lastName || user.email;
  };

  const handleLogout = () => {
    logout();
  };

  // NavLink için custom stil
  const navLinkStyle = {
    fontWeight: '500',
    padding: '0.5rem 1rem',
    color: '#333',
    transition: 'all 0.3s ease',
    margin: '0 0.25rem',
    borderRadius: '4px'
  };

  // Aktif NavLink için stil
  const activeStyle = {
    backgroundColor: 'rgba(74, 142, 58, 0.1)',
    color: '#4a8e3a'
  };

  return (
    <header>
      <Navbar bg="white" expand="lg" collapseOnSelect className="py-3 shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-success d-flex align-items-center">
            <FaLeaf className="me-2" size={28} />
            <span style={{ fontSize: '1.5rem' }}>Çiftlik Pazar</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center">
              <Nav.Link 
                as={Link} 
                to="/products" 
                style={navLinkStyle}
                className="d-flex align-items-center"
              >
                <FaStore className="me-2" /> Ürünler
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/producers" 
                style={navLinkStyle}
                className="d-flex align-items-center"
              >
                <FaUsers className="me-2" /> Üreticiler
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/about" 
                style={navLinkStyle}
                className="d-flex align-items-center"
              >
                <FaInfoCircle className="me-2" /> Hakkımızda
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/cart" 
                style={navLinkStyle}
                className="d-flex align-items-center"
              >
                <FaShoppingCart className="me-2" /> Sepet
              </Nav.Link>
              
              {user ? (
                <div className="d-flex align-items-center ms-2">
                  <span className="d-flex align-items-center" style={navLinkStyle}>
                    <FaUser className="me-2" /> {getFullName()}
                  </span>
                  <NavDropdown 
                    title=""
                    id="username"
                    align="end"
                  >
                    <NavDropdown.Item as={Link} to="/profile" className="py-2">
                      <FaUser className="me-2" /> Profil
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/orders" className="py-2">
                      <FaStore className="me-2" /> Siparişlerim
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout} className="py-2 text-danger">
                      <FaSignOutAlt className="me-2" /> Çıkış Yap
                    </NavDropdown.Item>
                  </NavDropdown>
                </div>
              ) : (
                <div className="d-flex ms-2">
                  <Button 
                    as={Link} 
                    to="/login" 
                    variant="outline-success"
                    className="me-2 d-flex align-items-center"
                  >
                    <FaSignInAlt className="me-2" /> Giriş Yap
                  </Button>
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="success"
                    className="d-flex align-items-center"
                  >
                    <FaUserPlus className="me-2" /> Kayıt Ol
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header; 