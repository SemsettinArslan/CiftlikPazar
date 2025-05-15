import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Row, Col, Spinner, Alert, Tab, Tabs, Card } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaSave, FaList, FaFilter, FaShoppingBasket, FaRobot, FaLeaf, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ProductManagement = ({ apiClient, farmerId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  
  // Form durumu
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    countInStock: '',
    unit: 'kg',
    isOrganic: false,
    image: '',
    imagePreview: null
  });

  const [validated, setValidated] = useState(false);

  // Ürünleri getir
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/products/my-products');
      
      if (response.data && response.data.success) {
        setProducts(response.data.data);
      } else {
        throw new Error('Ürünler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Ürünleri getirme hatası:', err);
      setError('Ürünleriniz yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      
      // Toast bildirim göster
      toast.error(
        <div>
          <div className="fw-bold mb-1">Ürünler Yüklenemedi</div>
          <div>Ürünleriniz yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.</div>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      
      const response = await apiClient.get('/api/categories');
      
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      } else {
        throw new Error('Kategoriler getirilirken beklenmeyen API yanıtı');
      }
    } catch (err) {
      console.error('Kategorileri getirme hatası:', err);
      
      // Toast bildirim göster
      toast.error(
        <div>
          <div className="fw-bold mb-1">Kategoriler Yüklenemedi</div>
          <div>Kategoriler yüklenirken bir sorun oluştu.</div>
        </div>
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  // Sayfa yüklendiğinde ürünleri ve kategorileri getir
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Yeni ürün ekle modalını aç
  const handleAddProduct = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      countInStock: '',
      unit: 'kg',
      isOrganic: false,
      image: '',
      imagePreview: null
    });
    setIsEditing(false);
    setCurrentProduct(null);
    setShowProductModal(true);
    setValidated(false);
    setSubmitError(null);
  };

  // Ürün düzenle modalını aç
  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category._id || product.category,
      countInStock: product.countInStock,
      unit: product.unit,
      isOrganic: product.isOrganic || false,
      image: product.image,
      imagePreview: null
    });
    setIsEditing(true);
    setCurrentProduct(product);
    setShowProductModal(true);
    setValidated(false);
    setSubmitError(null);
  };

  // Ürün silme modalını aç
  const handleDeleteProduct = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };

  // Formdaki değişiklikleri takip et
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setProductForm({
      ...productForm,
      [name]: val
    });
  };

  // Form gönderimi - ürün ekle veya güncelle
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setValidated(true);
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      
      // Form doğrulama hatası bildirimi
      toast.warning(
        <div>
          <div className="d-flex align-items-center fw-bold mb-1">
            <FaExclamationTriangle className="me-2" />
            <span>Form Eksik</span>
          </div>
          <div className="ms-4">Lütfen tüm gerekli alanları doldurun.</div>
        </div>
      );
      
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Form verilerini API'ye uygun formata dönüştür
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        countInStock: parseInt(productForm.countInStock)
      };
      
      let response;
      
      if (isEditing) {
        // Ürün güncelleme
        response = await apiClient.put(
          `/api/products/${currentProduct._id}`,
          productData
        );
      } else {
        // Yeni ürün ekleme
        response = await apiClient.post('/api/products', productData);
      }
      
      if (response.data && response.data.success) {
        // AI doğrulama sonucunu göster (varsa)
        const verificationResult = response.data.verification;
        if (verificationResult) {
          // Otomatik onaylanmış ve onay başarılı ürünleri belirt
          if (verificationResult.autoApproved) {
            setError({
              type: 'success',
              message: 'Ürününüz Gemini AI tarafından otomatik olarak onaylandı ve hemen satışa sunulabilir! ' + 
                verificationResult.reason
            });
            
            // Bildirim göster - AI tarafından otomatik onaylandı
            toast.success(
              <div>
                <div className="d-flex align-items-center fw-bold mb-1">
                  <FaRobot className="me-2 text-success" />
                  <span>Yapay Zeka Onayı</span>
                </div>
                <div className="ms-4">Ürününüz yapay zeka tarafından otomatik olarak onaylandı ve hemen satışa sunulabilir!</div>
              </div>
            );
          } else if (verificationResult.isValid) {
            setError({
              type: 'info',
              message: 'Ürününüz Gemini AI tarafından doğrulandı fakat güven skoru nedeniyle manuel incelemeye alındı. ' + 
                verificationResult.reason
            });
            
            // Bildirim göster - AI doğruladı ama manuel inceleme
            toast.info(
              <div>
                <div className="d-flex align-items-center fw-bold mb-1">
                  <FaRobot className="me-2 text-info" />
                  <span>Doğrulandı - İnceleniyor</span>
                </div>
                <div className="ms-4">Ürün doğrulandı fakat manuel incelemeye alındı.</div>
              </div>
            );
          } else {
            setError({
              type: 'warning',
              message: 'Ürününüz Gemini AI tarafından doğrulanamadı ve manuel inceleme için gönderildi. ' + 
                verificationResult.reason
            });
            
            // Bildirim göster - AI doğrulayamadı
            toast.warning(
              <div>
                <div className="d-flex align-items-center fw-bold mb-1">
                  <FaRobot className="me-2 text-warning" />
                  <span>Doğrulanamadı</span>
                </div>
                <div className="ms-4">Ürün manuel inceleme için gönderildi.</div>
                {verificationResult.reason && (
                  <div className="ms-4 mt-1 small text-muted">{verificationResult.reason}</div>
                )}
              </div>
            );
          }
        } else {
          // Genel başarı bildirimi
          toast.success(
            <div>
              <div className="d-flex align-items-center fw-bold mb-1">
                <FaCheck className="me-2" />
                <span>{isEditing ? 'Ürün Güncellendi' : 'Ürün Eklendi'}</span>
              </div>
              <div className="ms-4">
                {isEditing 
                  ? `${productForm.name} başarıyla güncellendi.` 
                  : `${productForm.name} başarıyla eklendi ve incelemeye alındı.`
                }
              </div>
            </div>
          );
        }
        
        // Modal'ı kapat
        setShowProductModal(false);
        
        // Ürünleri yeniden yükle
        fetchProducts();
      } else {
        throw new Error(response.data?.message || 'Beklenmedik API yanıtı');
      }
    } catch (err) {
      console.error('Ürün kaydetme hatası:', err);
      setSubmitError(
        err.response?.data?.message || 
        err.message || 
        'Ürün kaydedilirken bir hata oluştu.'
      );
      
      // Hata bildirimi göster
      toast.error(
        <div>
          <div className="d-flex align-items-center fw-bold mb-1">
            <FaExclamationTriangle className="me-2" />
            <span>Kaydetme Hatası</span>
          </div>
          <div className="ms-4">
            {err.response?.data?.message || err.message || 'Ürün kaydedilirken bir hata oluştu.'}
          </div>
        </div>
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Ürün silme işlemi
  const confirmDeleteProduct = async () => {
    try {
      setSubmitting(true);
      
      const response = await apiClient.delete(`/api/products/${currentProduct._id}`);
      
      if (response.data && response.data.success) {
        // Modal'ı kapat
        setShowDeleteModal(false);
        setCurrentProduct(null);
        
        // Ürünleri yeniden yükle
        fetchProducts();
        
        // Bildirim göster
        toast.success(
          <div>
            <div className="d-flex align-items-center fw-bold mb-1">
              <FaCheck className="me-2" />
              <span>Ürün Silindi</span>
            </div>
            <div className="ms-4">{currentProduct?.name || 'Ürün'} başarıyla silindi.</div>
          </div>
        );
      } else {
        throw new Error(response.data?.message || 'Beklenmedik API yanıtı');
      }
    } catch (err) {
      console.error('Ürün silme hatası:', err);
      setSubmitError(
        err.response?.data?.message || 
        err.message || 
        'Ürün silinirken bir hata oluştu.'
      );
      
      // Hata bildirimi göster
      toast.error(
        <div>
          <div className="d-flex align-items-center fw-bold mb-1">
            <FaExclamationTriangle className="me-2" />
            <span>Silme Hatası</span>
          </div>
          <div className="ms-4">
            {err.response?.data?.message || err.message || 'Ürün silinirken bir hata oluştu.'}
          </div>
        </div>
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Ürün görseli için URL oluşturma
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    
    // Eğer görüntü yolu data:image formatında base64 ise doğrudan kullan
    if (imageName.startsWith('data:')) {
      return imageName;
    }
    
    // API artık sadece dosya adını döndürüyor, her durumda uploads/product-images/ yolunu ekle
    return `${apiClient.defaults.baseURL}/uploads/product-images/${imageName}`;
  };

  // Duruma göre ürünleri filtrele
  const getFilteredProducts = () => {
    if (filterStatus === 'all') {
      return products;
    }
    return products.filter(product => product.approvalStatus === filterStatus);
  };

  // Durum kartı
  const getStatusCard = (title, status, count, icon, color, description) => (
    <Card className="border-0 shadow-sm h-100 mb-4">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-center mb-3">
          <div className={`p-3 rounded bg-${color} bg-opacity-10 me-3`}>
            {icon}
          </div>
          <div>
            <h6 className="mb-0">{title}</h6>
            <div className="small text-muted">{description}</div>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <strong>{count}</strong>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => setFilterStatus(status)}
            active={filterStatus === status}
          >
            <FaFilter className="me-1" /> Filtrele
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  // Durum badge'ı
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" className="py-2 px-3"><FaInfoCircle className="me-1" /> Onay Bekliyor</Badge>;
      case 'approved':
        return <Badge bg="success" className="py-2 px-3"><FaCheck className="me-1" /> Onaylandı</Badge>;
      case 'rejected':
        return <Badge bg="danger" className="py-2 px-3"><FaTimes className="me-1" /> Reddedildi</Badge>;
      default:
        return <Badge bg="secondary" className="py-2 px-3">Bilinmiyor</Badge>;
    }
  };

  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = products.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = products.filter(p => p.approvalStatus === 'rejected').length;

  return (
    <div>
      <h4 className="border-bottom pb-3 mb-4 text-success">Ürün Yönetimi</h4>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="products" title={<span><FaList className="me-2" /> Ürünlerim</span>}>
          <div className="mb-4">
            <Row>
              <Col md={4}>
                {getStatusCard(
                  'Onay Bekleyen Ürünler', 
                  'pending', 
                  pendingCount,
                  <FaInfoCircle size={20} className="text-warning" />,
                  'warning',
                  'İnceleme sürecindeki ürünler'
                )}
              </Col>
              <Col md={4}>
                {getStatusCard(
                  'Onaylı Ürünler', 
                  'approved', 
                  approvedCount,
                  <FaCheck size={20} className="text-success" />,
                  'success',
                  'Satışa hazır ürünler'
                )}
              </Col>
              <Col md={4}>
                {getStatusCard(
                  'Reddedilen Ürünler', 
                  'rejected', 
                  rejectedCount,
                  <FaTimes size={20} className="text-danger" />,
                  'danger',
                  'Kabul edilmeyen ürünler'
                )}
              </Col>
            </Row>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">Ürün Listesi</h5>
              <p className="text-muted mb-0 small">
                {filterStatus === 'all' 
                  ? 'Tüm ürünleriniz' 
                  : filterStatus === 'pending' 
                    ? 'Onay bekleyen ürünleriniz' 
                    : filterStatus === 'approved' 
                      ? 'Onaylanmış ürünleriniz' 
                      : 'Reddedilmiş ürünleriniz'
                }
              </p>
            </div>
            <Button 
              variant="success" 
              onClick={handleAddProduct}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-2" /> Yeni Ürün Ekle
            </Button>
          </div>

          {error && (
            <Alert 
              variant={typeof error === 'object' && error.type ? error.type : "danger"} 
              className="mb-4 d-flex align-items-center"
              dismissible
              onClose={() => setError(null)}
            >
              {typeof error === 'object' && error.type === 'success' ? (
                <FaCheck className="me-2" />
              ) : typeof error === 'object' && error.type === 'info' ? (
                <FaInfoCircle className="me-2" />
              ) : typeof error === 'object' && error.type === 'warning' ? (
                <FaExclamationTriangle className="me-2" />
              ) : (
                <FaExclamationTriangle className="me-2" />
              )}
              {typeof error === 'object' && error.message ? error.message : error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3">Ürünler yükleniyor...</p>
            </div>
          ) : getFilteredProducts().length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <FaShoppingBasket size={40} className="text-muted mb-3" />
              <h5>Henüz ürün bulunmuyor</h5>
              <p className="text-muted">
                {filterStatus === 'all' 
                  ? 'Henüz hiç ürün eklemediniz. Yeni ürün ekleyin ve satışa başlayın!' 
                  : `${filterStatus === 'pending' 
                      ? 'Onay bekleyen' 
                      : filterStatus === 'approved' 
                        ? 'Onaylanmış' 
                        : 'Reddedilmiş'
                    } ürününüz bulunmuyor.`
                }
              </p>
              {filterStatus !== 'all' && (
                <Button 
                  variant="outline-success" 
                  onClick={() => setFilterStatus('all')}
                  className="mt-2"
                >
                  Tüm Ürünleri Göster
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '80px' }}>#</th>
                    <th>Ürün Adı</th>
                    <th style={{ width: '120px' }}>Fiyat</th>
                    <th style={{ width: '100px' }}>Stok</th>
                    <th style={{ width: '180px' }}>Durum</th>
                    <th style={{ width: '150px' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProducts().map((product, index) => (
                    <tr key={product._id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {product.image ? (
                            <img 
                              src={getImageUrl(product.image)}
                              alt={product.name} 
                              width="40" 
                              height="40" 
                              className="me-2 rounded"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div 
                              className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}
                            >
                              <FaShoppingBasket className="text-muted" />
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{product.name}</div>
                            <div className="small text-muted">
                              {product.category && (product.category.category_name || 'Kategori')}
                              {product.isOrganic && <Badge bg="success" className="ms-2">Organik</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">
                        {product.price?.toFixed(2)} ₺ / {product.unit}
                      </td>
                      <td className="text-center">
                        {product.countInStock > 0 ? (
                          product.countInStock
                        ) : (
                          <Badge bg="danger">Stokta Yok</Badge>
                        )}
                      </td>
                      <td>
                        {getStatusBadge(product.approvalStatus)}
                        {product.rejectionReason && (
                          <div className="small text-danger mt-1">
                            <FaExclamationTriangle className="me-1" />
                            {product.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Ürün Ekleme / Düzenleme Modal */}
      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
        dialogClassName="border-0 shadow"
      >
        <Modal.Header className="border-0 pb-0 pt-3 px-4">
          <Modal.Title className="text-success">
            <div className="d-flex align-items-center">
              <div className="bg-success p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '42px', height: '42px'}}>
                {isEditing ? <FaEdit className="text-white" size={18} /> : <FaPlus className="text-white" size={18} />}
              </div>
              <div>
                <h5 className="mb-0 fw-bold">{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h5>
                <p className="text-muted mb-0 mt-1 small">
                  {isEditing 
                    ? 'Mevcut ürün bilgilerini güncelleyebilirsiniz' 
                    : 'Ürün detaylarını eksiksiz doldurun ve kaydedin'}
                </p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={() => setShowProductModal(false)}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmitProduct}>
          <Modal.Body className="pt-2 px-4">
            {submitError && (
              <Alert variant="danger" className="mb-4 d-flex border-start border-danger border-4">
                <FaExclamationTriangle className="me-2 flex-shrink-0 mt-1" />
                <div>{submitError}</div>
              </Alert>
            )}
            
            <div className="bg-light p-3 rounded-3 border mb-4">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                  <FaInfoCircle className="text-success" size={14} />
                </div>
                <h6 className="mb-0 text-success">Doğru ve eksiksiz bilgiler</h6>
              </div>
              <p className="text-muted small mb-0">Ürün bilgilerini eksiksiz ve doğru girmeniz, ürününüzün hızlıca onaylanmasına yardımcı olur. Görseller net ve ürünü doğru yansıtmalıdır.</p>
            </div>
            
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3" controlId="productName">
                  <Form.Label className="fw-medium">Ürün Adı</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    placeholder="Ürün adını girin"
                    required
                    className="shadow-sm border"
                  />
                  <Form.Control.Feedback type="invalid">
                    Ürün adı gereklidir.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted small">
                    Örn: Salkım Domates, Organik Elma, Taze Ispanak
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="productCategory">
                  <Form.Label className="fw-medium">Kategori</Form.Label>
                  <Form.Select
                    name="category"
                    value={productForm.category}
                    onChange={handleInputChange}
                    required
                    disabled={loadingCategories}
                    className="shadow-sm border"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.category_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Kategori seçimi gereklidir.
                  </Form.Control.Feedback>
                  {loadingCategories && (
                    <div className="text-center mt-2 d-flex align-items-center">
                      <Spinner animation="border" size="sm" variant="success" className="me-2" /> 
                      <span className="small">Kategoriler yükleniyor...</span>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group className="mb-3" controlId="productPrice">
                  <Form.Label className="fw-medium">Fiyat (₺)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={productForm.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="shadow-sm border"
                  />
                  <Form.Control.Feedback type="invalid">
                    Geçerli bir fiyat girin.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="productStock">
                  <Form.Label className="fw-medium">Stok Miktarı</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="countInStock"
                    value={productForm.countInStock}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                    className="shadow-sm border"
                  />
                  <Form.Control.Feedback type="invalid">
                    Geçerli bir stok miktarı girin.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="productUnit">
                  <Form.Label className="fw-medium">Birim</Form.Label>
                  <Form.Select
                    name="unit"
                    value={productForm.unit}
                    onChange={handleInputChange}
                    required
                    className="shadow-sm border"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="adet">Adet</option>
                    <option value="litre">Litre</option>
                    <option value="demet">Demet</option>
                    <option value="paket">Paket</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Birim seçimi gereklidir.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4" controlId="productDescription">
              <Form.Label className="fw-medium">Ürün Açıklaması</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={productForm.description}
                onChange={handleInputChange}
                placeholder="Ürün açıklamasını girin"
                required
                className="shadow-sm border"
              />
              <Form.Control.Feedback type="invalid">
                Ürün açıklaması gereklidir.
              </Form.Control.Feedback>
              <Form.Text className="text-muted small">
                Detaylı bir açıklama, müşterilerin ürününüzü daha iyi anlamasını sağlar.
              </Form.Text>
            </Form.Group>
            
            <div className="p-3 border rounded-3 mb-4">
              <Form.Group controlId="productImage">
                <Form.Label className="fw-medium d-flex align-items-center">
                  <FaShoppingBasket className="text-success me-2" /> Ürün Görseli
                </Form.Label>
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control shadow-sm"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        
                        try {
                          // Önce dosyayı gösterme için base64'e çevir (önizleme için)
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            // Önizleme için geçici olarak base64 formatını göster
                            setProductForm(prev => ({
                              ...prev,
                              imagePreview: reader.result
                            }));
                          };
                          reader.readAsDataURL(file);
                          
                          // Dosyayı sunucuya yükle
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          const response = await apiClient.post('/api/products/upload-image', formData, {
                            headers: {
                              'Content-Type': 'multipart/form-data'
                            }
                          });
                          
                          if (response.data.success) {
                            // Yüklenen dosya adını form state'e kaydet (artık tam yol değil sadece dosya adı)
                            const uploadedImagePath = response.data.data.imagePath;
                            console.log('Sunucudan dönen dosya adı:', uploadedImagePath);
                            
                            setProductForm(prev => ({
                              ...prev,
                              image: uploadedImagePath
                            }));
                            
                            // Başarı bildirimi göster
                            toast.success(
                              <div>
                                <div className="d-flex align-items-center fw-bold mb-1">
                                  <FaCheck className="me-2" />
                                  <span>Görsel Yüklendi</span>
                                </div>
                                <div className="ms-4">Görsel başarıyla yüklendi.</div>
                              </div>
                            );
                          }
                        } catch (error) {
                          console.error('Dosya yükleme hatası:', error);
                          // Hata bildirimi göster
                          toast.error(
                            <div>
                              <div className="d-flex align-items-center fw-bold mb-1">
                                <FaExclamationTriangle className="me-2" />
                                <span>Yükleme Hatası</span>
                              </div>
                              <div className="ms-4">Görsel yüklenirken bir sorun oluştu.</div>
                            </div>
                          );
                        }
                      }
                    }}
                  />
                  <Form.Text className="text-muted small">
                    Maksimum 5MB boyutunda JPG, PNG veya GIF yükleyebilirsiniz.
                  </Form.Text>
                </div>
                
                {(productForm.image || productForm.imagePreview) && (
                  <div className="d-flex justify-content-center">
                    <div className="text-center p-3 border rounded bg-white" style={{maxWidth: '300px'}}>
                      <img 
                        src={productForm.imagePreview || (productForm.image && productForm.image.startsWith('data:') 
                          ? productForm.image 
                          : getImageUrl(productForm.image))}
                        alt="Ürün görseli önizleme" 
                        className="img-fluid rounded mb-2" 
                        style={{ maxHeight: '200px' }} 
                      />
                      <p className="mb-0 text-muted small">Ürün görseli önizlemesi</p>
                    </div>
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-0 mt-3" controlId="productOrganic">
                <Form.Check
                  type="checkbox"
                  label={<span className="d-flex align-items-center"><FaLeaf className="text-success me-2" /> Bu ürün organiktir</span>}
                  name="isOrganic"
                  checked={productForm.isOrganic}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted small ms-4 ps-1">
                  Organik olarak işaretlenen ürünler için sertifika/belge istenebilir.
                </Form.Text>
              </Form.Group>
            </div>
            
            <Alert variant="info" className="d-flex border-start border-info border-4 bg-info bg-opacity-10">
              <FaInfoCircle className="text-info me-2 mt-1 flex-shrink-0" size={18} />
              <div>
                <p className="mb-0"><strong>Bilgilendirme:</strong> Eklediğiniz ürünler ilk olarak onay sürecine girecektir. Onaylandıktan sonra satışa sunulacaktır.</p>
              </div>
            </Alert>
            
            <Alert variant="success" className="d-flex border-start border-success border-4 bg-success bg-opacity-10 mt-3">
              <div className="me-3 flex-shrink-0">
                <FaRobot className="text-success" size={24} />
              </div>
              <div>
                <h6 className="mb-1">Yapay Zeka Destekli Otomatik Onay</h6>
                <p className="mb-0 small">Yüklediğiniz görseller ve ürün bilgileri <strong>Gemini AI</strong> tarafından otomatik olarak değerlendirilmektedir. Ürün görseli ve açıklaması doğru eşleşirse, ürününüz anında onaylanabilir! Lütfen yüksek kaliteli görseller ve doğru ürün açıklamaları kullanın.</p>
              </div>
            </Alert>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 py-3 bg-light rounded-bottom">
            <div className="d-flex flex-column flex-sm-row gap-2 w-100">
              <Button 
                variant="light" 
                onClick={() => setShowProductModal(false)}
                disabled={submitting}
                className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-fill border border-secondary"
              >
                <FaTimes className="me-2" /> Vazgeç
              </Button>
              <Button 
                variant="success" 
                type="submit"
                disabled={submitting}
                className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-fill"
              >
                {submitting ? (
                  <>
                    <Spinner 
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> 
                    {isEditing ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Ürün Silme Onay Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        backdrop="static"
        keyboard={false}
        centered
        dialogClassName="border-0 shadow"
      >
        <Modal.Header className="border-0 pb-0 pt-3 px-4">
          <Modal.Title className="text-danger">
            <div className="d-flex align-items-center">
              <div className="bg-danger p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '42px', height: '42px'}}>
                <FaTrash className="text-white" size={18} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Ürün Silme</h5>
                <p className="text-muted mb-0 mt-1 small">Bu işlem geri alınamaz ve ürünü kalıcı olarak kaldıracaktır.</p>
              </div>
            </div>
          </Modal.Title>
          <Button 
            variant="link" 
            className="text-dark p-0 shadow-none" 
            onClick={() => setShowDeleteModal(false)}
            style={{position: 'absolute', top: '15px', right: '15px'}}
          >
            <FaTimes />
          </Button>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4">
          <div className="bg-light p-3 rounded-3 border mb-3">
            {currentProduct && (
              <div className="d-flex align-items-center">
                {currentProduct.image ? (
                  <img 
                    src={getImageUrl(currentProduct.image)}
                    alt={currentProduct.name} 
                    width="60" 
                    height="60" 
                    className="me-3 rounded"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="me-3 rounded bg-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <FaShoppingBasket className="text-white" size={24} />
                  </div>
                )}
                <div>
                  <h6 className="mb-1">{currentProduct?.name}</h6>
                  <div className="text-muted small d-flex align-items-center">
                    <span className="me-3">{currentProduct?.price?.toFixed(2)} ₺ / {currentProduct?.unit}</span>
                    {currentProduct?.isOrganic && (
                      <Badge bg="success" className="d-flex align-items-center">
                        <FaLeaf className="me-1" size={10} /> Organik
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Alert variant="danger" className="d-flex border-start border-danger border-4 bg-danger bg-opacity-10">
            <FaExclamationCircle className="text-danger me-2 mt-1 flex-shrink-0" size={20} />
            <div>
              <strong>Dikkat!</strong> Bu işlem:
              <ul className="mb-0 ps-3 mt-1">
                <li>Ürünü sisteminizden kalıcı olarak silecek</li>
                <li>Mevcut siparişleri etkilemeyecek (eğer varsa)</li>
                <li>Satış geçmişinin görüntülenebilir kalmasını sağlayacak</li>
              </ul>
            </div>
          </Alert>
          
          {submitError && (
            <Alert variant="danger" className="mb-0 mt-3 d-flex align-items-center">
              <FaExclamationTriangle className="me-2 flex-shrink-0" />
              <span>{submitError}</span>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 py-3 bg-light rounded-bottom">
          <div className="d-flex flex-column flex-sm-row gap-2 w-100">
            <Button 
              variant="light" 
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
              className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-grow-1 border border-secondary"
            >
              <FaTimes className="me-2" /> Vazgeç
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDeleteProduct}
              disabled={submitting}
              className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center flex-grow-1"
            >
              {submitting ? (
                <>
                  <Spinner 
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Siliniyor...
                </>
              ) : (
                <>
                  <FaTrash className="me-2" /> Ürünü Sil
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductManagement; 