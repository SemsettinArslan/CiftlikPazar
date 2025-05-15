import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Dropdown, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaTree, FaMapMarkerAlt, FaSearch, FaFilter, FaTags, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const ProducersPage = () => {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const fetchProducers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/farmers/public');
        setProducers(response.data.data);
        
        // Şehirleri getir
        const uniqueCities = [...new Set(response.data.data.map(producer => producer.city))];
        setCities(uniqueCities.sort());
        
        setLoading(false);
      } catch (err) {
        setError('Üreticiler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axios.get('http://localhost:3001/api/categories');
        setCategories(response.data.data);
        setLoadingCategories(false);
      } catch (err) {
        console.error('Kategoriler yüklenirken hata oluştu:', err);
        setLoadingCategories(false);
      }
    };

    fetchProducers();
    fetchCategories();
  }, []);

  // Dropdown dışına tıklandığında kapanması için
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownRef]);

  // Kategori seçme veya kaldırma
  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Kategori ismi getirme
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.category_name : 'Bilinmeyen Kategori';
  };

  // Arama ve filtrelemeye göre üreticileri filtrele
  const filteredProducers = producers.filter(producer => {
    // İsim ile filtreleme
    const matchesSearch = producer.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Şehir filtresi
    const matchesCity = cityFilter === '' || producer.city === cityFilter;
    
    // Kategori filtresi - VE mantığı: Seçilen TÜM kategorilere sahip olmalı
    const matchesCategory = selectedCategories.length === 0 || 
      (producer.categories && selectedCategories.every(selectedCatId => 
        producer.categories.some(cat => cat._id === selectedCatId)
      ));
    
    return matchesSearch && matchesCity && matchesCategory;
  });

  // Filtreleri sıfırla
  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setSelectedCategories([]);
  };

  // Bir kategoriyi kaldır
  const removeCategory = (categoryId) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success" role="status"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Üreticilerimiz</h1>
      <p className="text-center mb-5">Özenle seçilmiş, doğal ve taze ürünler yetiştiren çiftliklerimizi keşfedin</p>
      
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-stretch">
        <div className="filter-item" style={{ minWidth: '250px' }}>
          <InputGroup>
            <InputGroup.Text><FaMapMarkerAlt /></InputGroup.Text>
            <Form.Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </div>
        
        <div className="filter-item position-relative" style={{ minWidth: '250px' }} ref={categoryDropdownRef}>
          <InputGroup>
            <InputGroup.Text><FaTags /></InputGroup.Text>
            <Form.Control
              placeholder={selectedCategories.length > 0 ? `${selectedCategories.length} kategori seçildi` : "Kategorileri seçin..."}
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              readOnly
              aria-label="Kategoriye göre filtrele"
              style={{ cursor: 'pointer', background: 'white' }}
            />
            <Button 
              variant="outline-secondary"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <FaFilter />
            </Button>
          </InputGroup>
          
          {showCategoryDropdown && (
            <div 
              className="position-absolute start-0 w-100 mt-1 bg-white border rounded shadow"
              style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                zIndex: 1000,
                marginTop: '0px'
              }}
            >
              <ListGroup variant="flush">
                {loadingCategories ? (
                  <ListGroup.Item className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-success"></div>
                  </ListGroup.Item>
                ) : categories.length === 0 ? (
                  <ListGroup.Item>Kategori bulunamadı</ListGroup.Item>
                ) : (
                  categories.map(category => (
                    <ListGroup.Item 
                      key={category._id}
                      action
                      onClick={() => toggleCategory(category._id)}
                      className="d-flex justify-content-between align-items-center"
                      style={{ cursor: 'pointer' }}
                    >
                      {category.category_name}
                      {selectedCategories.includes(category._id) && (
                        <FaCheck className="text-success" />
                      )}
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </div>
          )}
        </div>
        
        <div className="filter-item flex-grow-1" style={{ minWidth: '250px' }}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Çiftlik adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        
        <div className="filter-item">
          <Button 
            variant="outline-secondary" 
            onClick={resetFilters}
            disabled={!searchTerm && !cityFilter && selectedCategories.length === 0}
            className="h-100 d-flex align-items-center"
          >
            Filtreleri Temizle
          </Button>
        </div>
      </div>
      
      {(searchTerm || cityFilter || selectedCategories.length > 0) && (
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="text-muted me-2">Aktif filtreler:</span>
            {searchTerm && (
              <Badge bg="light" text="dark" className="p-2 border">
                Aranan: {searchTerm}
                <Button variant="link" className="p-0 ms-2 text-danger" onClick={() => setSearchTerm('')}>
                  &times;
                </Button>
              </Badge>
            )}
            {cityFilter && (
              <Badge bg="light" text="dark" className="p-2 border">
                Şehir: {cityFilter}
                <Button variant="link" className="p-0 ms-2 text-danger" onClick={() => setCityFilter('')}>
                  &times;
                </Button>
              </Badge>
            )}
            {selectedCategories.map(categoryId => (
              <Badge key={categoryId} bg="light" text="dark" className="p-2 border">
                {getCategoryName(categoryId)}
                <Button variant="link" className="p-0 ms-2 text-danger" onClick={() => removeCategory(categoryId)}>
                  &times;
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-muted small mb-4">
        {filteredProducers.length} üretici gösteriliyor
      </div>
      
      {filteredProducers.length === 0 ? (
        <div className="text-center py-5">
          <p>Arama kriterlerinize uygun üretici bulunamadı.</p>
          <Button variant="success" onClick={resetFilters}>Tüm Üreticileri Göster</Button>
        </div>
      ) : (
        <Row>
          {filteredProducers.map(producer => (
            <Col key={producer._id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow hover-shadow border-0 overflow-hidden">
                <div className="bg-light p-4 text-center position-relative farm-card-header">
                  <div className="farm-icon-container">
                    <FaHome className="farm-icon text-success" />
                    <FaTree className="tree-icon text-success" />
                  </div>
                  <style jsx="true">{`
                    .farm-card-header {
                      height: 140px;
                      background: linear-gradient(to bottom, #e8f5e9 0%, #f8f9fa 100%);
                    }
                    .farm-icon-container {
                      position: relative;
                      display: inline-block;
                    }
                    .farm-icon {
                      font-size: 3.5rem;
                      position: relative;
                      z-index: 2;
                    }
                    .tree-icon {
                      font-size: 2.5rem;
                      position: absolute;
                      right: -25px;
                      top: -10px;
                      z-index: 1;
                      opacity: 0.8;
                    }
                    .hover-shadow:hover {
                      transform: translateY(-5px);
                      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                      transition: all 0.3s ease;
                    }
                  `}</style>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-3 text-center fw-bold">{producer.farmName}</Card.Title>
                  
                  <div className="mb-3 text-muted d-flex align-items-center justify-content-center">
                    <FaMapMarkerAlt className="me-2" />
                    {producer.city} / {producer.district}
                  </div>
                  
                  <Card.Text className="mb-3 text-center flex-grow-1">
                    {producer.description ? (
                      producer.description.length > 80 
                        ? `${producer.description.substring(0, 80)}...` 
                        : producer.description
                    ) : 'Bu üretici henüz bir açıklama eklememiş.'}
                  </Card.Text>
                  
                  <div className="d-flex flex-wrap justify-content-center mb-3">
                    {producer.categories && producer.categories.map((category, idx) => (
                      <Badge 
                        key={idx} 
                        bg={selectedCategories.includes(category._id) ? "success" : "light"}
                        text={selectedCategories.includes(category._id) ? "white" : "dark"}
                        className="me-2 mb-2 border"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleCategory(category._id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0 text-center pb-4">
                  <Link to={`/producer/${producer._id}`}>
                    <Button variant="outline-success" className="px-4 rounded-pill">
                      Çiftliği Ziyaret Et
                    </Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProducersPage; 