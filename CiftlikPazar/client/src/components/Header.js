import React, { useContext, useState, useRef, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button, Image, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, 
  FaLeaf, FaStore, FaUsers, FaInfoCircle, FaChevronDown, 
  FaShieldAlt, FaListAlt, FaUserCheck, FaTachometerAlt
} from 'react-icons/fa';

const BASE_URL = 'http://localhost:5000';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Dropdown dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

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

  // Kullanıcı değiştiğinde veya sayfa yüklendiğinde dropdown'ı kapat
  useEffect(() => {
    setShowDropdown(false);
  }, [user]);

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

  // Dropdown stil düzeltmeleri için ek stil
  const dropdownStyle = {
    display: 'inline-flex',
    alignItems: 'center'
  };

  // Aktif NavLink için stil
  const activeStyle = {
    backgroundColor: 'rgba(74, 142, 58, 0.1)',
    color: '#4a8e3a'
  };

  // Profil resmi veya baş harfler
  const renderProfileImage = () => {
    if (user?.profileImage) {
      return (
        <Image 
          src={`${BASE_URL}/uploads/profile-images/${user.profileImage}`}
          roundedCircle
          width={32}
          height={32}
          className="me-2"
          style={{ objectFit: 'cover' }}
        />
      );
    } else {
      return (
        <div 
          className="bg-light text-success rounded-circle d-flex align-items-center justify-content-center me-2"
          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
        >
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
      );
    }
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
                <div className="position-relative" ref={dropdownRef}>
                  <Nav.Link
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="d-flex align-items-center"
                    style={navLinkStyle}
                  >
                    {renderProfileImage()}
                    <span>{getFullName()}</span>
                    <FaChevronDown className="ms-2" size={10} />
                  </Nav.Link>
                  
                  {showDropdown && (
                    <div 
                      className="position-absolute end-0 mt-1 bg-white rounded shadow py-1" 
                      style={{
                        minWidth: '220px',
                        zIndex: 1000,
                        border: '1px solid rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {user.role === 'admin' && (
                        <>
                          <Link 
                            to="/admin/dashboard" 
                            className="dropdown-item py-2 px-3"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'background-color 0.15s ease-in-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <FaTachometerAlt className="me-2" /> 
                            <span>Admin Paneli</span>
                          </Link>
                          <Link 
                            to="/admin/farmer-requests" 
                            className="dropdown-item py-2 px-3"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'background-color 0.15s ease-in-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <FaUserCheck className="me-2" /> 
                            <span>Çiftçi Başvuruları</span>
                          </Link>
                          <hr className="dropdown-divider my-1" />
                        </>
                      )}
                      
                      {user.role === 'farmer' && user.isApproved ? (
                        <>
                          <Link 
                            to="/my-farm" 
                            className="dropdown-item py-2 px-3"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'background-color 0.15s ease-in-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <FaLeaf className="me-2" /> 
                            <span>Çiftliğim</span>
                          </Link>
                          <Link 
                            to="/farm-products" 
                            className="dropdown-item py-2 px-3"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'background-color 0.15s ease-in-out',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <FaStore className="me-2" /> 
                            <span>Ürünlerim</span>
                          </Link>
                        </>
                      ) : (
                        <Link 
                          to="/profile" 
                          className="dropdown-item py-2 px-3"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background-color 0.15s ease-in-out',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                          <FaUser className="me-2" /> 
                          <span>Profil</span>
                        </Link>
                      )}
                      
                      <Link 
                        to="/orders" 
                        className="dropdown-item py-2 px-3"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background-color 0.15s ease-in-out',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 142, 58, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <FaStore className="me-2" /> 
                        <span>Siparişlerim</span>
                      </Link>
                      
                      <hr className="dropdown-divider my-1" />
                      
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item py-2 px-3 text-danger w-100 text-start border-0 bg-transparent"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background-color 0.15s ease-in-out',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <FaSignOutAlt className="me-2" /> 
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  )}
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