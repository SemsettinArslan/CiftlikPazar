import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Container, Form, InputGroup, Button, Badge, Dropdown, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaTags, FaCheck, FaSortAmountDown, FaSortAmountUp, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import axios from 'axios';
import ProductCard from './ProductCard';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Ürünler yükleniyor...');
        // Ana ürün listesini getir - çiftçi ID'sini kaldır
        const response = await axios.get('http://localhost:3001/api/products');
        console.log('API Yanıtı:', response);
        
        // API yanıtı kontrolü
        if (response.data && Array.isArray(response.data)) {
          // Doğrudan ürün dizisi dönüyorsa
          setProducts(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // { data: [...] } formatında dönüyorsa
          setProducts(response.data.data);
        } else {
          // Başka bir format
          console.warn('Beklenmeyen API yanıt formatı:', response.data);
          setProducts([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ürünleri yükleme hatası:', err);
        setError('Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('Kategoriler yükleniyor...');
        const response = await axios.get('http://localhost:3001/api/categories');
        console.log('Kategoriler API Yanıtı:', response);
        
        // API yanıtı kontrolü
        if (response.data && Array.isArray(response.data)) {
          // Doğrudan kategori dizisi dönüyorsa
          setCategories(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // { data: [...] } formatında dönüyorsa
          setCategories(response.data.data);
        } else {
          // Başka bir format
          console.warn('Beklenmeyen kategoriler API yanıt formatı:', response.data);
          setCategories([]);
        }
        
        setLoadingCategories(false);
      } catch (err) {
        console.error('Kategorileri yükleme hatası:', err);
        setLoadingCategories(false);
      }
    };

    fetchProducts();
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
    try {
      const category = categories.find(cat => 
        (cat._id === categoryId || cat.id === categoryId)
      );
      
      if (!category) return 'Bilinmeyen Kategori';
      
      // Farklı kategori formatlarını kontrol et
      return category.category_name || category.name || 'Kategori';
    } catch (err) {
      console.error('Kategori ismi alınırken hata:', err);
      return 'Kategori';
    }
  };

  // Ürünleri filtreleme ve sıralama
  const getFilteredAndSortedProducts = () => {
    // Önce filtreleme
    let filtered = products.filter(product => {
      // İlk ürünü logla
      if (products.length > 0 && !window.productLogged) {
        console.log('İlk ürün verisi:', products[0]);
        window.productLogged = true;
      }
      
      // İsim veya açıklama ile filtreleme
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Kategori filtresi - VE mantığı: Seçilen TÜM kategorilere sahip olmalı
      const matchesCategory = selectedCategories.length === 0 || 
        (product.category && selectedCategories.every(selectedCatId => 
          // Eğer product.category bir array ise some() kullan, değilse direkt eşitlik kontrolü yap
          Array.isArray(product.category) 
            ? product.category.some(cat => cat._id === selectedCatId || cat === selectedCatId)
            : product.category._id === selectedCatId || product.category === selectedCatId
        ));
      
      return matchesSearch && matchesCategory;
    });

    // Sonra sıralama
    if (sortOption === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    return filtered;
  };

  // Filtreleri sıfırla
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSortOption('');
  };

  // Bir kategoriyi kaldır
  const removeCategory = (categoryId) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
  };

  const filteredProducts = getFilteredAndSortedProducts();

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success" role="status"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Ürünlerimiz</h1>
      <p className="text-center mb-5">Doğrudan çiftliklerden taze ve doğal ürünleri keşfedin</p>
      
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-stretch">
        {/* Kategori Filtresi */}
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

        {/* Sıralama Seçeneği */}
        <div className="filter-item" style={{ minWidth: '220px' }}>
          <InputGroup>
            <InputGroup.Text>
              {sortOption?.includes('price') 
                ? (sortOption === 'price-asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)
                : (sortOption === 'name-asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />)
              }
            </InputGroup.Text>
            <Form.Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sıralama seçeneği"
            >
              <option value="">Sıralama Seçin</option>
              <option value="price-asc">Fiyat (Artan)</option>
              <option value="price-desc">Fiyat (Azalan)</option>
              <option value="name-asc">İsim (A-Z)</option>
              <option value="name-desc">İsim (Z-A)</option>
            </Form.Select>
          </InputGroup>
        </div>
        
        {/* Arama Kutusu */}
        <div className="filter-item flex-grow-1" style={{ minWidth: '250px' }}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Ürün adı veya açıklama ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        
        {/* Filtreleri Temizle Butonu */}
        <div className="filter-item">
          <Button 
            variant="outline-secondary" 
            onClick={resetFilters}
            disabled={!searchTerm && selectedCategories.length === 0 && !sortOption}
            className="h-100 d-flex align-items-center"
          >
            Filtreleri Temizle
          </Button>
        </div>
      </div>
      
      {/* Aktif Filtreler */}
      {(searchTerm || selectedCategories.length > 0 || sortOption) && (
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
            {selectedCategories.map(categoryId => (
              <Badge key={categoryId} bg="light" text="dark" className="p-2 border">
                Kategori: {getCategoryName(categoryId)}
                <Button variant="link" className="p-0 ms-2 text-danger" onClick={() => removeCategory(categoryId)}>
                  &times;
                </Button>
              </Badge>
            ))}
            {sortOption && (
              <Badge bg="light" text="dark" className="p-2 border">
                Sıralama: {sortOption === 'price-asc' 
                  ? 'Fiyat (Artan)' 
                  : sortOption === 'price-desc' 
                    ? 'Fiyat (Azalan)' 
                    : sortOption === 'name-asc' 
                      ? 'İsim (A-Z)' 
                      : 'İsim (Z-A)'}
                <Button variant="link" className="p-0 ms-2 text-danger" onClick={() => setSortOption('')}>
                  &times;
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Ürün Sayısı */}
      <div className="text-muted small mb-4">
        {filteredProducts.length} ürün gösteriliyor
      </div>
      
      {/* Ürün Listesi veya Boş Mesajı */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <p>Arama kriterlerinize uygun ürün bulunamadı.</p>
          <Button variant="success" onClick={resetFilters}>Tüm Ürünleri Göster</Button>
        </div>
      ) : (
        <Row>
          {filteredProducts.map(product => (
            <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductsList; 