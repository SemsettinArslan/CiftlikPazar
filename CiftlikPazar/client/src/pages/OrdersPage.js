import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaShoppingBag, FaExclamationCircle, FaEye } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/orders/myorders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError('Siparişler yüklenirken bir hata oluştu.');
        }
      } catch (err) {
        setError('Siparişleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        console.error('Sipariş yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Sipariş durumuna göre renk ve metin belirleme
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Onay Bekliyor</Badge>;
      case 'processing':
        return <Badge bg="info">Hazırlanıyor</Badge>;
      case 'shipped':
        return <Badge bg="primary">Kargoya Verildi</Badge>;
      case 'delivered':
        return <Badge bg="success">Teslim Edildi</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Siparişlerim</h1>
            <Link to="/products" className="btn btn-outline-success">
              <FaArrowLeft className="me-2" /> Alışverişe Devam Et
            </Link>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Siparişleriniz yükleniyor...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="d-flex align-items-start">
          <FaExclamationCircle className="me-2 mt-1" />
          <div>{error}</div>
        </Alert>
      ) : orders.length === 0 ? (
        <Card className="p-5 shadow-sm border-0">
          <div className="text-center py-5">
            <FaShoppingBag size={50} className="text-muted mb-4" />
            <h3>Henüz siparişiniz bulunmuyor</h3>
            <p className="text-muted mb-4">Siparişleriniz burada görüntülenecektir.</p>
            <Link to="/products">
              <Button variant="success" className="px-4">
                <FaArrowLeft className="me-2" /> Alışverişe Başla
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table responsive className="table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Sipariş No</th>
                  <th>Tarih</th>
                  <th>Ürünler</th>
                  <th>Toplam</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>#{order._id.substring(order._id.length - 6)}</strong>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaBoxOpen className="me-2 text-success" />
                        <span>{order.items.length} ürün</span>
                      </div>
                    </td>
                    <td className="fw-bold">{order.totalAmount.toFixed(2)} ₺</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Link to={`/order/${order._id}`} className="btn btn-sm btn-outline-primary">
                        <FaEye className="me-1" /> Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrdersPage; 