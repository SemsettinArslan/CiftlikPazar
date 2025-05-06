import React, { useState, useEffect } from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import axios from 'axios';
import ProductCard from './ProductCard';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/products');
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Ürünler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-5">Ürünler yükleniyor...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;

  return (
    <Container>
      <h2 className="text-center mb-4">Tüm Ürünler</h2>
      <Row>
        {products.length === 0 ? (
          <Col className="text-center py-5">
            <p>Henüz ürün bulunmamaktadır</p>
          </Col>
        ) : (
          products.map(product => (
            <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default ProductsList; 