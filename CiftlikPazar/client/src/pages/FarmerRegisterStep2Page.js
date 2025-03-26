import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaLeaf, FaTruck, FaCertificate, FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCities, getDistrictsByCityId } from '../services/cityService';

const FarmerRegisterStep2Page = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.userData || null);

  const [formData, setFormData] = useState({
    farmName: '',
    city: '',
    district: '',
    address: '',
    taxNumber: '',
    categories: [],
    hasShipping: false,
    description: ''
  });

  // Sertifikalar için state
  const [certificates, setCertificates] = useState([]);
  const [currentCertificate, setCurrentCertificate] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateNumber: '',
    certificateType: 'other',
    description: ''
  });

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const { 
    farmName, city, district, address, taxNumber, categories: selectedCategories,
    hasShipping, description
  } = formData;

  // Veri yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        
        // İlk önce localStorage'dan kullanıcı verisini kontrol et
        let userDataInfo = null;
        const tempData = localStorage.getItem('temp_farmer_registration');
        
        if (tempData) {
          try {
            userDataInfo = JSON.parse(tempData);
          } catch (e) {
            console.error("LocalStorage verisi JSON formatında değil:", e);
          }
        }
        
        // State'den veri gelirse onu kullan
        if (!userDataInfo && location.state?.userData) {
          userDataInfo = location.state.userData;
        }
        
        // Veri yoksa, ilk sayfaya yönlendir
        if (!userDataInfo || !userDataInfo.firstName || !userDataInfo.email) {
          console.log("Kullanıcı verisi bulunamadı, yönlendiriliyor");
          toast.error('Lütfen önce temel bilgilerinizi girin');
          navigate('/farmer-register');
          return;
        }
        
        // Kullanıcı verisini ayarla - mevcut formData değerlerini koruyarak
        setUserData(userDataInfo);
        setFormData(prevFormData => ({
          ...prevFormData,  // Mevcut form değerlerini koru (categories dahil)
          email: userDataInfo.email,
          firstName: userDataInfo.firstName,
          lastName: userDataInfo.lastName,
          phone: userDataInfo.phone
        }));

        // İlleri yükle
        const citiesData = await getCities();
        setCities(citiesData);

        // Kategorileri yükle
        const categoriesRes = await axios.get('/api/categories');
        if (categoriesRes.data && categoriesRes.data.data) {
          setCategories(categoriesRes.data.data);
        } else {
          console.error("Kategori verisi alınamadı:", categoriesRes.data);
          setError("Kategori verisi alınamadı. Lütfen sayfayı yenileyin.");
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [navigate, location.state]);

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      if (!city) {
        setDistricts([]);
        return;
      }

      try {
        // Seçilen ilin ID'sini bul
        const selectedCity = cities.find(c => c.city === city);
        if (selectedCity) {
          const districtsData = await getDistrictsByCityId(selectedCity.cityid);
          setDistricts(districtsData);
          // İlçe seçimi sıfırla
          setFormData(prev => ({ ...prev, district: '' }));
        }
      } catch (error) {
        console.error('İlçeler yüklenirken bir hata oluştu:', error);
        setDistricts([]);
      }
    };

    loadDistricts();
  }, [city, cities]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'hasShipping') {
        setFormData({ ...formData, [name]: checked });
      } else {
        // Kategori seçimi
        const categoryId = value;
        if (checked) {
          setFormData({
            ...formData,
            categories: [...selectedCategories, categoryId]
          });
        } else {
          setFormData({
            ...formData,
            categories: selectedCategories.filter(id => id !== categoryId)
          });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Sertifika form alanlarını değiştirme
  const handleCertificateChange = (e) => {
    const { name, value } = e.target;
    setCurrentCertificate({
      ...currentCertificate,
      [name]: value
    });
  };

  // Sertifika ekleme
  const handleAddCertificate = (e) => {
    e.preventDefault();
    
    // Basit validasyon
    if (!currentCertificate.name || !currentCertificate.issuer || !currentCertificate.issueDate || !currentCertificate.certificateType) {
      toast.error('Lütfen sertifika için gerekli alanları doldurun');
      return;
    }
    
    // Sertifikayı ekle
    setCertificates([...certificates, { ...currentCertificate }]);
    
    // Form alanlarını temizle
    setCurrentCertificate({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      certificateNumber: '',
      certificateType: 'other',
      description: ''
    });
    
    toast.success('Sertifika eklendi');
  };

  // Sertifika silme
  const handleRemoveCertificate = (index) => {
    const updatedCertificates = [...certificates];
    updatedCertificates.splice(index, 1);
    setCertificates(updatedCertificates);
    toast.info('Sertifika silindi');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Form doğrulama
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Kategori seçimi kontrolü
    if (!selectedCategories || selectedCategories.length === 0) {
      setError('En az bir kategori seçmelisiniz');
      return;
    }

    setValidated(true);
    setError('');
    setLoading(true);

    try {
      // Geçici kayıt yap - Users tablosuna asıl kaydı da burada yapalım
      const tempData = localStorage.getItem('temp_farmer_registration');
      
      if (!tempData) {
        toast.error('Kayıt bilgileriniz bulunamadı, lütfen tekrar deneyiniz');
        navigate('/farmer-register');
        return;
      }
      
      const tempUser = JSON.parse(tempData);
      
      // API'yi çağır
      const res = await axios.post('/api/farmers/complete-registration', {
        // Kullanıcı verileri
        userInfo: {
          firstName: tempUser.firstName,
          lastName: tempUser.lastName,
          email: tempUser.email,
          password: tempUser.password,
          phone: tempUser.phone,
          role: 'farmer'
        },
        // Çiftlik verileri  
        farmInfo: {
          ...formData
        },
        // Sertifika verileri
        certificates: certificates
      });

      if (res.data.success) {
        // Geçici kayıt bilgilerini temizle
        localStorage.removeItem('temp_farmer_registration');
        
        toast.success('Çiftlik bilgileriniz başarıyla kaydedildi!');
        navigate('/farmer-register-complete');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Çiftlik kaydı sırasında bir hata oluştu');
      toast.error(err.response?.data?.message || 'Çiftlik kaydı sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status" variant="success">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-center align-items-center">
        <Card className="auth-form mt-5 mb-5" style={{ width: '700px', maxWidth: '100%' }}>
          <Card.Body>
            <div className="text-center mb-4">
              <FaLeaf className="text-success" size={30} />
              <h2 className="mt-2">Çiftlik Bilgileri</h2>
              <p className="text-muted">Lütfen çiftliğiniz hakkında bilgi verin</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="farmName">
                    <Form.Label>Çiftlik Adı</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Çiftliğinizin adı"
                      name="farmName"
                      value={farmName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                    <Form.Control.Feedback type="invalid">
                      Lütfen çiftlik adını girin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="taxNumber">
                    <Form.Label>Vergi Numarası</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Vergi numaranız"
                      name="taxNumber"
                      value={taxNumber}
                      onChange={handleChange}
                      required
                      maxLength={20}
                    />
                    <Form.Control.Feedback type="invalid">
                      Lütfen vergi numaranızı girin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>İl</Form.Label>
                    <Form.Select 
                      name="city"
                      value={city}
                      onChange={handleChange}
                      required
                    >
                      <option value="">İl Seçiniz</option>
                      {cities.map((city) => (
                        <option key={city.cityid} value={city.city}>
                          {city.city}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Lütfen il seçin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="district">
                    <Form.Label>İlçe</Form.Label>
                    <Form.Select
                      name="district"
                      value={district}
                      onChange={handleChange}
                      disabled={!city || districts.length === 0}
                      required
                    >
                      <option value="">İlçe Seçiniz</option>
                      {districts.map((d) => (
                        <option key={d.districtid || d} value={d.district || d}>
                          {d.district || d}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Lütfen ilçe seçin.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="address">
                <Form.Label>Adres</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Çiftliğinizin adresi"
                  name="address"
                  value={address}
                  onChange={handleChange}
                  required
                  maxLength={500}
                />
                <Form.Control.Feedback type="invalid">
                  Lütfen adres bilgisini girin.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Ürün Kategorileri</Form.Label>
                <div className="border rounded p-3">
                  <Row>
                    {categories.map(category => (
                      <Col md={6} key={category._id} className="mb-3">
                        <div className="category-item border rounded p-2" style={{ minHeight: '40px' }}>
                          <Form.Check
                            type="checkbox"
                            id={`category-${category._id}`}
                            label={category.category_name}
                            value={category._id}
                            checked={selectedCategories && selectedCategories.includes(category._id)}
                            onChange={handleChange}
                            className="mb-2 fw-bold"
                          />
                          {selectedCategories && selectedCategories.includes(category._id) && category.subcategory && category.subcategory.length > 0 && (
                            <div className="ms-4 mt-2 mb-2">
                              {category.subcategory.map((sub, idx) => {
                                // Her bir alt kategori için benzersiz key oluştur
                                const uniqueKey = `${category._id}-${sub.slug || sub._id || idx}`;
                                return (
                                  <Form.Check
                                    key={uniqueKey}
                                    type="checkbox"
                                    id={`subcat-${uniqueKey}`}
                                    label={sub.name}
                                    className="mb-1 small"
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
                {validated && (!selectedCategories || selectedCategories.length === 0) && (
                  <div className="text-danger mt-1 small">
                    En az bir kategori seçmelisiniz.
                  </div>
                )}
              </Form.Group>

              {/* Sertifikalar Bölümü */}
              <Form.Group className="mb-4">
                <Form.Label className="d-flex align-items-center">
                  <FaCertificate className="me-2 text-success" /> 
                  Sertifikalar
                  <span className="text-muted ms-2 small">(Opsiyonel)</span>
                </Form.Label>
                
                <div className="border rounded p-3 bg-light">
                  {/* Mevcut Sertifikalar */}
                  {certificates.length > 0 && (
                    <div className="mb-3">
                      <h6 className="mb-3 text-success">Eklenen Sertifikalar</h6>
                      {certificates.map((cert, index) => (
                        <div key={index} className="border rounded p-3 mb-2 bg-white shadow-sm">
                          <div className="d-flex justify-content-between mb-2">
                            <h6 className="mb-0">{cert.name}</h6>
                            <Button 
                              variant="link" 
                              className="text-danger p-0" 
                              onClick={() => handleRemoveCertificate(index)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                          <div className="small text-muted">
                            <div>{cert.issuer} tarafından verilmiş</div>
                            <div>Tarih: {new Date(cert.issueDate).toLocaleDateString('tr-TR')}</div>
                            <div>
                              Tür: {
                                cert.certificateType === 'organic' ? 'Organik Tarım' :
                                cert.certificateType === 'goodAgriculturalPractices' ? 'İyi Tarım Uygulamaları' :
                                cert.certificateType === 'sustainability' ? 'Sürdürülebilirlik' :
                                cert.certificateType === 'qualityAssurance' ? 'Kalite Güvence' : 'Diğer'
                              }
                            </div>
                            {cert.certificateNumber && <div>Sertifika No: {cert.certificateNumber}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Yeni Sertifika Formu */}
                  <div className="border-top pt-3 mt-2">
                    <h6 className="mb-3">Yeni Sertifika Ekle</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sertifika Adı*</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={currentCertificate.name}
                            onChange={handleCertificateChange}
                            placeholder="Organik Tarım Sertifikası"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Veren Kurum*</Form.Label>
                          <Form.Control
                            type="text"
                            name="issuer"
                            value={currentCertificate.issuer}
                            onChange={handleCertificateChange}
                            placeholder="Tarım Bakanlığı"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Verilme Tarihi*</Form.Label>
                          <Form.Control
                            type="date"
                            name="issueDate"
                            value={currentCertificate.issueDate}
                            onChange={handleCertificateChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Son Geçerlilik Tarihi</Form.Label>
                          <Form.Control
                            type="date"
                            name="expiryDate"
                            value={currentCertificate.expiryDate}
                            onChange={handleCertificateChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sertifika Türü*</Form.Label>
                          <Form.Select
                            name="certificateType"
                            value={currentCertificate.certificateType}
                            onChange={handleCertificateChange}
                          >
                            <option value="organic">Organik Tarım</option>
                            <option value="goodAgriculturalPractices">İyi Tarım Uygulamaları</option>
                            <option value="sustainability">Sürdürülebilirlik</option>
                            <option value="qualityAssurance">Kalite Güvence</option>
                            <option value="other">Diğer</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sertifika Numarası</Form.Label>
                          <Form.Control
                            type="text"
                            name="certificateNumber"
                            value={currentCertificate.certificateNumber}
                            onChange={handleCertificateChange}
                            placeholder="ORG-2023-12345"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Açıklama</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={currentCertificate.description}
                        onChange={handleCertificateChange}
                        placeholder="Sertifika hakkında ek bilgiler"
                      />
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button 
                        variant="outline-success"
                        size="sm"
                        onClick={handleAddCertificate}
                        className="mt-2"
                      >
                        <FaPlus className="me-2" /> Sertifikayı Ekle
                      </Button>
                    </div>
                  </div>
                </div>
                <Form.Text className="text-muted">
                  Çiftliğinize ait tüm sertifikaları ekleyebilirsiniz. Bu bilgiler admin kontrolünden sonra müşterilere gösterilecektir.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="hasShipping"
                  label={
                    <span className="d-flex align-items-center">
                      <FaTruck className="me-2" /> Kargo ile gönderim yapıyorum
                    </span>
                  }
                  name="hasShipping"
                  checked={hasShipping}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="description">
                <Form.Label>Çiftlik Açıklaması</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Çiftliğiniz, üretim yöntemleriniz ve ürünleriniz hakkında bilgi verin"
                  name="description"
                  value={description}
                  onChange={handleChange}
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  Maksimum 1000 karakter
                </Form.Text>
              </Form.Group>

              <div className="d-grid gap-2 mt-4">
                <Button variant="success" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">İşleniyor...</span>
                    </>
                  ) : (
                    'Başvuruyu Tamamla'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default FarmerRegisterStep2Page; 