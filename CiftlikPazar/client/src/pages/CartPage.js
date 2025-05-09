import React from 'react';
import { Container, Row, Col, Card, Button, Table, Image, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaMinus, FaPlus, FaShoppingCart, FaLeaf } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <Container className="py-5">
      <h1 className="mb-4">Alışveriş Sepetim</h1>
      
      {cart.items.length === 0 ? (
        <Card className="p-5 shadow-sm border-0">
          <div className="text-center py-5">
            <FaShoppingCart size={50} className="text-muted mb-4" />
            <h3>Sepetiniz boş</h3>
            <p className="text-muted mb-4">Sepetinizde ürün bulunmamaktadır.</p>
            <Link to="/products">
              <Button variant="success" className="px-4">
                <FaArrowLeft className="me-2" /> Alışverişe Devam Et
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Table responsive className="table-borderless align-middle">
                  <thead>
                    <tr className="text-muted">
                      <th style={{ width: '100px' }}>Ürün</th>
                      <th>Detay</th>
                      <th className="text-center" style={{ width: '200px' }}>Miktar</th>
                      <th className="text-end" style={{ width: '120px' }}>Fiyat</th>
                      <th className="text-end" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map(item => (
                      <tr key={item._id}>
                        <td>
                          <Link to={`/product/${item._id}`}>
                            {item.image ? (
                              <Image 
                                src={`http://localhost:5000/uploads/product-images/${item.image}`}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="img-thumbnail"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/80?text=Resim+Yok';
                                }}
                              />
                            ) : (
                              <div 
                                className="img-thumbnail d-flex align-items-center justify-content-center bg-light"
                                style={{ width: '80px', height: '80px' }}
                              >
                                <FaLeaf size={30} className="text-success opacity-50" />
                              </div>
                            )}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/product/${item._id}`} className="text-decoration-none text-dark">
                            <h6>{item.name}</h6>
                          </Link>
                          <p className="text-muted small mb-0">
                            {item.farmer && item.farmer.farmName 
                              ? `Üretici: ${item.farmer.farmName}` 
                              : ''}
                          </p>
                          <p className="text-muted small mb-0">
                            Birim: {item.unit || 'adet'}
                          </p>
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center">
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="border" 
                              onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                            >
                              <FaMinus />
                            </Button>
                            <Form.Control
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item, parseInt(e.target.value) || 1)}
                              className="mx-2 text-center"
                              style={{ width: '60px' }}
                            />
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="border"
                              onClick={() => updateQuantity(item, item.quantity + 1)}
                            >
                              <FaPlus />
                            </Button>
                          </div>
                        </td>
                        <td className="text-end">
                          <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} ₺</span>
                          <div className="small text-muted">{item.price.toFixed(2)} ₺ / {item.unit || 'adet'}</div>
                        </td>
                        <td className="text-end">
                          <Button 
                            variant="link" 
                            className="text-danger p-0"
                            onClick={() => removeFromCart(item)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                <div className="d-flex justify-content-between mt-4 mb-2">
                  <Link to="/products">
                    <Button variant="outline-success">
                      <FaArrowLeft className="me-2" /> Alışverişe Devam Et
                    </Button>
                  </Link>
                  <Button 
                    variant="outline-danger" 
                    onClick={clearCart}
                  >
                    <FaTrash className="me-2" /> Sepeti Temizle
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Sipariş Özeti</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <span>Ara Toplam</span>
                  <span>{cart.totalPrice.toFixed(2)} ₺</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Toplam</strong>
                  <strong>{cart.totalPrice.toFixed(2)} ₺</strong>
                </div>
                
                <Button variant="success" className="w-100">
                  Ödemeye Geç
                </Button>
                
                <Alert variant="info" className="mt-4 mb-0">
                  <small>
                    Siparişinizi tamamladıktan sonra 14 gün içerisinde iade edebilirsiniz.
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage; 