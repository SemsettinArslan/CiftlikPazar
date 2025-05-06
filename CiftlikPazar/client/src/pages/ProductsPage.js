import React from 'react';
import { Container } from 'react-bootstrap';
import ProductsList from '../components/ProductsList';

const ProductsPage = () => {
  return (
    <Container className="py-4">
      <ProductsList />
    </Container>
  );
};

export default ProductsPage; 