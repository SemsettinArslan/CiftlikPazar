import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLeaf, FaShoppingCart, FaTag } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { getCategoryNameById } from '../utils/categoryUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [categoryName, setCategoryName] = useState('');
  
  useEffect(() => {
    // Kategori ismini getir
    const loadCategoryName = async () => {
      if (product.category) {
        const name = await getCategoryNameById(product.category);
        setCategoryName(name);
      }
    };
    
    loadCategoryName();
  }, [product.category]);
  
  const handleAddToCart = () => {
    // addToCart başarılı olursa true döner
    const success = addToCart(product);
    
    // Başarılı olursa toast göster
    if (success) {
      toast.success(
        <div className="d-flex align-items-center">
          <FaShoppingCart className="me-2" />
          <span>{product.name} sepete eklendi!</span>
        </div>
      );
    }
  };
  
  return (
    <>
      <Card className="h-100 shadow hover-shadow border-0">
        <Link to={`/product/${product._id}`}>
          {product.image ? (
            <Card.Img 
              variant="top" 
              src={`http://localhost:5000/uploads/product-images/${product.image}`}
              alt={product.name}
              style={{ height: '200px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/200x200?text=Resim+Yok';
              }}
            />
          ) : (
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)' }} 
                className="d-flex align-items-center justify-content-center text-success">
              <FaLeaf size={50} opacity={0.5} />
            </div>
          )}
        </Link>
        <Card.Body className="d-flex flex-column">
          <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
            <Card.Title className="text-truncate">{product.name}</Card.Title>
          </Link>
          
          <div className="mb-2">
            {(product.category || categoryName) && (
              <Badge 
                bg="light" 
                text="dark" 
                className="border me-1"
              >
                <FaTag className="me-1" />
                {categoryName || 'Kategori'}
              </Badge>
            )}
            {product.isOrganic && (
              <Badge bg="success" className="me-1">Organik</Badge>
            )}
          </div>
          
          <Card.Text className="text-muted small mb-2">
            {product.farmer && product.farmer.farmName 
              ? `Üretici: ${product.farmer.farmName}` 
              : ''}
          </Card.Text>
          
          <Card.Text className="flex-grow-1 small">
            {product.description && product.description.length > 80 
              ? `${product.description.substring(0, 80)}...` 
              : product.description || 'Açıklama bulunmamaktadır.'}
          </Card.Text>
          
          <div className="d-flex justify-content-between align-items-center mt-auto">
            <div className="d-flex flex-column">
              <span className="text-success fw-bold" style={{ fontSize: '1.25rem' }}>
                {product.price ? product.price.toFixed(2) : '0.00'} ₺
              </span>
              {product.unit && (
                <small className="text-muted">/ {product.unit}</small>
              )}
            </div>
            <Button 
              variant="outline-success" 
              size="sm" 
              className="rounded-pill"
              onClick={handleAddToCart}
            >
              <FaShoppingCart className="me-1" /> Sepete Ekle
            </Button>
          </div>
        </Card.Body>
        
        <style jsx="true">{`
          .hover-shadow {
            transition: all 0.3s ease;
          }
          .hover-shadow:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
        `}</style>
      </Card>
    </>
  );
};

export default ProductCard; 