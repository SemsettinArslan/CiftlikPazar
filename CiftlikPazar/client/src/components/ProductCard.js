import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Card className="h-100 product-card">
      <Link to={`/product/${product._id}`}>
        <Card.Img 
          variant="top" 
          src={`/uploads/product-images/${product.image}`} 
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
          <Card.Title>{product.name}</Card.Title>
        </Link>
        <Card.Text className="text-muted small mb-2">
          Üretici: {product.farmer && product.farmer.farmName ? product.farmer.farmName : 'Belirtilmemiş'}
        </Card.Text>
        <Card.Text className="flex-grow-1 product-description">
          {product.description && product.description.length > 80 
            ? `${product.description.substring(0, 80)}...` 
            : product.description || 'Açıklama bulunmamaktadır.'}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <h5 className="mb-0 text-success">{product.price.toFixed(2)} ₺</h5>
          <Button variant="outline-success" size="sm">
            Sepete Ekle
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard; 