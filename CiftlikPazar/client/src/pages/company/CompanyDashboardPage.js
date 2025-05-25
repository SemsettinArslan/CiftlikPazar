import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Nav, Tab, Badge, Form, Modal, InputGroup, Table, Toast, ToastContainer } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaList, FaChartLine, FaUsers, FaExclamationCircle, FaBuilding, FaCog, FaTachometerAlt, FaFileAlt, FaEnvelope, FaHandshake, FaSave, FaCheck, FaCalendarAlt, FaSearch, FaFilter, FaEye, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaUser, FaPhone } from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CompanyDashboardPage = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    activeRequests: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    pendingOffers: 0
  });
  
  // Form durumları
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [validated, setValidated] = useState(false);
  
  // Toast bildirimi için state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [toastIcon, setToastIcon] = useState(<FaCheckCircle />);
  
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    city: '',
    district: '',
    contactPerson: {
      name: '',
      position: '',
      phone: '',
      email: ''
    }
  });
  
  // Talep formu durumları
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    city: '',
    district: '',
    budget: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonrası
    isOrganic: false,
    specifications: ''
  });
  const [requestValidated, setRequestValidated] = useState(false);
  const [requestCreating, setRequestCreating] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Talep oluşturma modalı
  const [showRequestModal, setShowRequestModal] = useState(false);

  // İl ve ilçe listelerini tutan state'ler
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Talep listesi ve filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Talep detay modalı için state'ler
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Teklifler için state'ler
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferDetailModal, setShowOfferDetailModal] = useState(false);
  
  // İlleri getiren fonksiyon
  const fetchCities = async () => {
    setCityLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get('/api/cities', config);
      
      if (response.data && response.data.success && response.data.data) {
        const formattedCities = response.data.data.map(city => city.city);
        setCities(formattedCities);
      } else {
        setCities([]);
        console.error('İl verileri uygun formatta değil:', response.data);
      }
    } catch (err) {
      console.error('İl bilgileri alınamadı:', err);
      setCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  // İlçeleri getiren fonksiyon
  const fetchDistrictsForCity = async (city) => {
    if (!city) {
      setDistricts([]);
      return;
    }
    
    setDistrictLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Önce il ID'sini bulmak için illeri çek
      const citiesResponse = await axios.get('/api/cities', config);
      const cityData = citiesResponse.data.data.find(c => c.city === city);
      
      if (!cityData) {
        console.error('Seçilen il için veri bulunamadı:', city);
        setDistricts([]);
        setDistrictLoading(false);
        return;
      }
      
      // İlçeleri getir
      const response = await axios.get(`/api/cities/${cityData.cityid}/districts`, config);
      
      if (response.data && response.data.success && response.data.data) {
        setDistricts(response.data.data);
      } else {
        setDistricts([]);
        console.error('İlçe verileri uygun formatta değil:', response.data);
      }
    } catch (err) {
      console.error('İlçe bilgileri alınamadı:', err);
      setDistricts([]);
    } finally {
      setDistrictLoading(false);
    }
  };
  
  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      console.log('Kategoriler getiriliyor...');
      const response = await axios.get('/api/categories');
      console.log('Kategori API yanıtı:', response.data);
      
      if (response.data.success && response.data.data) {
        console.log(`${response.data.data.length} adet kategori başarıyla yüklendi.`);
        setCategories(response.data.data);
      } else {
        console.warn('API başarılı yanıt verdi ancak kategori verisi bulunamadı:', response.data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Kategoriler getirilirken hata:', err);
      if (err.response) {
        console.error('Hata yanıtı:', err.response.data);
        console.error('Hata durumu:', err.response.status);
      } else if (err.request) {
        console.error('Yanıt alınamadı, istek:', err.request);
      } else {
        console.error('Hata mesajı:', err.message);
      }
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };
  
  // Firmanın taleplerini getiren fonksiyon
  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get('/api/requests/my-requests', config);
      
      if (response.data && response.data.success) {
        setRequests(response.data.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Talepler getirilirken hata:', err);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };
  
  // Firmanın tüm taleplerindeki teklifleri getiren fonksiyon
  const fetchAllOffers = async () => {
    setOffersLoading(true);
    setOfferError(null);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Önce talepleri getir
      const requestsResponse = await axios.get('/api/requests/my-requests', config);
      
      if (!requestsResponse.data || !requestsResponse.data.success) {
        setOfferError('Talepler getirilirken bir hata oluştu');
        setOffers([]);
        setOffersLoading(false);
        return;
      }
      
      const requestsWithOffers = requestsResponse.data.data.filter(
        request => request.offers && request.offers.length > 0
      );
      
      // Her talep için detaylı bilgi al (teklifler ve çiftçi bilgileri dahil)
      const allOffers = [];
      
      for (const request of requestsWithOffers) {
        try {
          // Populate parametresini ekleyerek teklif detaylarını getir
          // Çiftçinin user bilgilerini de populate etmek için query parametresi kullan
          const detailResponse = await axios.get(`/api/requests/${request._id}?populate=farmer.user`, config);
          
          if (detailResponse.data && detailResponse.data.success && detailResponse.data.data.offers) {
            console.log('Teklifler ve çiftçi bilgileri:', detailResponse.data.data.offers);
            
            // Tekliflere talep bilgilerini ekle
            const requestOffers = detailResponse.data.data.offers.map(offer => ({
              ...offer,
              requestId: request._id,
              requestTitle: request.title,
              requestUnit: request.unit,
              requestCategory: request.category,
              requestCity: request.city,
              requestDistrict: request.district,
              requestQuantity: request.quantity,
              requestDeadline: request.deadline
            }));
            
            allOffers.push(...requestOffers);
          }
        } catch (err) {
          console.error(`Talep ${request._id} için teklif detayları alınamadı:`, err);
        }
      }
      
      // Teklifleri durum ve tarih sırasına göre sırala
      allOffers.sort((a, b) => {
        // Önce bekleyen teklifler
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        
        // Sonra tarih sırası (yeniden eskiye)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      console.log('Tüm teklifler:', allOffers);
      setOffers(allOffers);
      
      // İstatistikleri güncelle
      setStats(prevStats => ({
        ...prevStats,
        totalOffers: allOffers.length,
        pendingOffers: allOffers.filter(offer => offer.status === 'pending').length,
        acceptedOffers: allOffers.filter(offer => offer.status === 'accepted').length
      }));
    } catch (err) {
      console.error('Teklifler getirilirken hata:', err);
      setOfferError('Teklifler getirilirken bir hata oluştu');
    } finally {
      setOffersLoading(false);
    }
  };
  
  // Teklifleri kabul etme fonksiyonu
  const handleAcceptOffer = async (offerId, requestId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/offers/${offerId}/accept`, {}, config);
      
      if (response.data && response.data.success) {
        // Teklifleri yeniden yükle
        fetchAllOffers();
        // Talepleri yeniden yükle
        fetchRequests();
        // Toast bildirimi göster
        setToastMessage('Teklif başarıyla kabul edildi');
        setToastType('success');
        setToastIcon(<FaCheckCircle className="me-2" />);
        setShowToast(true);
      }
    } catch (err) {
      console.error('Teklif kabul etme hatası:', err);
      setToastMessage(err.response?.data?.message || 'Teklif kabul edilirken bir hata oluştu');
      setToastType('danger');
      setToastIcon(<FaTimesCircle className="me-2" />);
      setShowToast(true);
    }
  };
  
  // Teklifleri reddetme fonksiyonu
  const handleRejectOffer = async (offerId, requestId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/offers/${offerId}/reject`, {}, config);
      
      if (response.data && response.data.success) {
        // Teklifleri yeniden yükle
        fetchAllOffers();
        setToastMessage('Teklif başarıyla reddedildi');
        setToastType('warning');
        setToastIcon(<FaExclamationCircle className="me-2" />);
        setShowToast(true);
      }
    } catch (err) {
      console.error('Teklif reddetme hatası:', err);
      setToastMessage(err.response?.data?.message || 'Teklif reddedilirken bir hata oluştu');
      setToastType('danger');
      setToastIcon(<FaTimesCircle className="me-2" />);
      setShowToast(true);
    }
  };
  
  // Talep iptal etme fonksiyonu
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/requests/${requestId}/cancel`, {}, config);
      
      if (response.data && response.data.success) {
        // Talepleri yeniden getir
        fetchRequests();
        // Detay modalını kapat
        closeDetailModal();
        // İstatistikleri güncelle
        setStats(prevStats => ({
          ...prevStats,
          activeRequests: prevStats.activeRequests - 1
        }));
        
        setToastMessage('Talep başarıyla iptal edildi');
        setToastType('warning');
        setToastIcon(<FaExclamationCircle className="me-2" />);
        setShowToast(true);
      } else {
        setToastMessage(response.data?.message || 'Talep iptal edilirken bir hata oluştu');
        setToastType('danger');
        setToastIcon(<FaTimesCircle className="me-2" />);
        setShowToast(true);
      }
    } catch (err) {
      console.error('Talep iptal etme hatası:', err);
      setToastMessage(err.response?.data?.message || 'Talep iptal edilirken bir hata oluştu');
      setToastType('danger');
      setToastIcon(<FaTimesCircle className="me-2" />);
      setShowToast(true);
    }
  };
  
  // Sayfa yüklendiğinde illeri, kategorileri ve talepleri getir
  useEffect(() => {
    fetchCities();
    fetchCategories();
    fetchRequests();
    fetchAllOffers(); // Panele girildiğinde teklifleri otomatik çek
    
    // Firma profilini getir
    const fetchCompanyProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        // Firma profili bilgilerini al
        const { data } = await axios.get('/api/companies/profile', config);
        
        if (data && data.success) {
          setCompany(data.data);
          
          // Form verilerini doldur
          setCompanyForm({
            companyName: data.data.companyName || '',
            taxNumber: data.data.taxNumber || '',
            taxOffice: data.data.taxOffice || '',
            address: data.data.address || '',
            city: data.data.city || '',
            district: data.data.district || '',
            contactPerson: {
              name: data.data.contactPerson?.name || '',
              position: data.data.contactPerson?.position || '',
              phone: data.data.contactPerson?.phone || '',
              email: data.data.contactPerson?.email || ''
            }
          });
          
          // İl seçildiğinde ilçeleri getir
          if (data.data.city) {
            await fetchDistrictsForCity(data.data.city);
          }
          
          // İstatistikleri al
          try {
            const statsResponse = await axios.get('/api/requests/my-requests', config);
            
            if (statsResponse.data && statsResponse.data.success) {
              const requests = statsResponse.data.data || [];
              
              // İstatistikleri hesapla
              const activeRequests = requests.filter(req => req.status === 'active').length;
              let totalOffers = 0;
              let acceptedOffers = 0;
              
              requests.forEach(req => {
                if (req.offers && Array.isArray(req.offers)) {
                  totalOffers += req.offers.length;
                  acceptedOffers += req.offers.filter(offer => offer.status === 'accepted').length;
                }
              });
              
              setStats({
                activeRequests,
                totalOffers,
                acceptedOffers
              });
            }
          } catch (statsError) {
            console.error('İstatistik alma hatası:', statsError);
          }
        }
      } catch (err) {
        console.error('Firma profili alma hatası:', err);
        
        if (err.response && err.response.data) {
          setError(err.response.data.message || 'Firma bilgileri alınırken bir hata oluştu');
        } else {
          setError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyProfile();
  }, [activeTab]);
  
  // Şehir değiştiğinde ilçeleri getir - Firma formu için
  useEffect(() => {
    if (companyForm.city) {
      fetchDistrictsForCity(companyForm.city);
    } else {
      setDistricts([]);
    }
  }, [companyForm.city]);
  
  // Şehir değiştiğinde ilçeleri getir - Talep formu için
  useEffect(() => {
    if (requestForm.city) {
      fetchDistrictsForCity(requestForm.city);
    }
  }, [requestForm.city]);
  
  // Form alanı değişikliği - Firma formu için
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCompanyForm({
        ...companyForm,
        [parent]: {
          ...companyForm[parent],
          [child]: value
        }
      });
    } else {
      setCompanyForm({
        ...companyForm,
        [name]: value
      });
      
      // İl değiştiğinde ilçeyi sıfırla
      if (name === 'city') {
        setCompanyForm(prevState => ({
          ...prevState,
          district: ''
        }));
      }
    }
  };
  
  // Form alanı değişikliği - Talep formu için
  const handleRequestInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setRequestForm({
      ...requestForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // İl değiştiğinde ilçeyi sıfırla
    if (name === 'city') {
      setRequestForm(prevState => ({
        ...prevState,
        district: ''
      }));
    }
  };
  
  // Tarih değişikliği - Talep formu için
  const handleDateChange = (date) => {
    setRequestForm({
      ...requestForm,
      deadline: date
    });
  };
  
  // Talep formu gönderme
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setRequestValidated(true);
      return;
    }
    
    setRequestValidated(true);
    setRequestCreating(true);
    setRequestSuccess(false);
    setRequestError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.post('/api/requests', requestForm, config);
      
      if (response.data && response.data.success) {
        setRequestSuccess(true);
        setRequestForm({
          title: '',
          description: '',
          category: '',
          quantity: '',
          unit: 'kg',
          city: '',
          district: '',
          budget: '',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isOrganic: false,
          specifications: ''
        });
        setRequestValidated(false);
        
        // Talepleri yeniden getir
        fetchRequests();
        
        // İstatistikleri güncelle
        setStats(prevStats => ({
          ...prevStats,
          activeRequests: prevStats.activeRequests + 1
        }));
        
        // Başarı mesajını toast olarak göster
        setToastMessage('Talep başarıyla oluşturuldu');
        setToastType('success');
        setToastIcon(<FaCheckCircle className="me-2" />);
        setShowToast(true);
        
        // Modalı kapat - Yeni eklenen
        closeRequestModal();
      } else {
        setRequestError(response.data?.message || 'Talep oluşturulurken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Talep oluşturma hatası:', err);
      
      if (err.response) {
        setRequestError(err.response.data?.message || 'Talep oluşturulurken bir API hatası oluştu');
      } else if (err.request) {
        setRequestError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        setRequestError(`İstek sırasında hata: ${err.message}`);
      }
    } finally {
      setRequestCreating(false);
    }
  };
  
  // Firma formu gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setUpdating(true);
    setUpdateSuccess(false);
    setUpdateError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Firma bilgilerini güncelle
      const response = await axios.put('/api/companies/update', companyForm, config);
      
      if (response.data && response.data.success) {
        setCompany(response.data.data);
        setUpdateSuccess(true);
        
        // 3 saniye sonra başarı mesajını kaldır
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        setUpdateError(response.data?.message || 'Firma bilgilerini güncellerken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      
      if (err.response) {
        setUpdateError(err.response.data?.message || 'Firma bilgileriniz güncellenirken bir API hatası oluştu');
      } else if (err.request) {
        setUpdateError('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
      } else {
        setUpdateError(`İstek sırasında hata: ${err.message}`);
      }
    } finally {
      setUpdating(false);
    }
  };
  
  // Talep oluşturma modalını açma/kapama
  const openRequestModal = () => setShowRequestModal(true);
  const closeRequestModal = () => {
    setShowRequestModal(false);
    // Formu sıfırla
    setRequestForm({
      title: '',
      description: '',
      category: '',
      quantity: '',
      unit: 'kg',
      city: '',
      district: '',
      budget: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isOrganic: false,
      specifications: ''
    });
    setRequestValidated(false);
    setRequestError('');
  };
  
  // Talep detay modalını açma/kapama
  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };
  
  // Kategori adını güvenli şekilde almak için yardımcı fonksiyon
  const getCategoryName = (category) => {
    // Debug: Kategori verisini konsola yazdır
    console.log('Kategori verisi:', category, 'Tipi:', typeof category);
    console.log('Mevcut kategoriler:', categories);
    
    // Kategori verisi yoksa
    if (!category) return 'Belirtilmemiş';
    
    // Kategori ID'sini string'e çevir
    let categoryId = '';
    
    // Eğer kategori bir obje ve id'si varsa
    if (typeof category === 'object' && category._id) {
      categoryId = category._id.toString();
      
      // Obje olarak gelenin içinde category_name varsa direk döndür
      if (category.category_name) {
        console.log('Kategori adı bulundu (objeden):', category.category_name);
        return category.category_name;
      }
    } 
    // String ise direkt al
    else if (typeof category === 'string') {
      categoryId = category;
    }
    
    console.log('Aranan kategori ID:', categoryId);
    
    // Kategoriler listesinden ara
    if (categories && categories.length > 0) {
      const foundCategory = categories.find(cat => 
        cat._id === categoryId || cat._id?.toString() === categoryId
      );
      
      if (foundCategory) {
        console.log('Kategoriler listesinden kategori bulundu:', foundCategory.category_name);
        return foundCategory.category_name;
      }
    }
    
    // Eğer kategoriler yükleniyor ya da ID henüz bulunamadıysa yükleniyor mesajı göster
    if (categoryLoading) {
      return 'Kategori Yükleniyor...';
    }
    
    // Kategoriler boş ise manuel yeniden yüklemeyi öner
    if (!categoryLoading && (!categories || categories.length === 0)) {
      return (
        <span>
          Kategori yüklenemedi{' '}
          <Button 
            variant="link" 
            size="sm" 
            className="p-0" 
            onClick={e => { e.stopPropagation(); fetchCategories(); }}
          >
            Yeniden Dene
          </Button>
        </span>
      );
    }
    
    console.log('Kategori bulunamadı, ID:', categoryId);
    return `Kategori (${categoryId ? categoryId.substring(0, 8) + '...' : 'Bilinmiyor'})`;
  };
  
  // Durum badge'i döndüren fonksiyon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Aktif</Badge>;
      case 'completed':
        return <Badge bg="primary">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge bg="danger">İptal Edildi</Badge>;
      case 'expired':
        return <Badge bg="secondary">Süresi Doldu</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };
  
  // Tarih formatını düzenleyen fonksiyon
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };
  
  // Talepleri filtreleyen fonksiyon
  const filterRequests = () => {
    return requests.filter(request => {
      // Durum filtresi
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      
      // Arama filtresi
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        return (
          request.title.toLowerCase().includes(term) ||
          request.description.toLowerCase().includes(term) ||
          request._id.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  };
  
  // Teklifleri filtreleyen fonksiyon
  const filterOffers = () => {
    return offers.filter(offer => {
      // Durum filtresi
      if (offerStatusFilter !== 'all' && offer.status !== offerStatusFilter) {
        return false;
      }
      
      // Arama filtresi
      if (offerSearchTerm && offerSearchTerm.trim() !== '') {
        const term = offerSearchTerm.toLowerCase().trim();
        return (
          (offer.requestTitle && offer.requestTitle.toLowerCase().includes(term)) ||
          (offer.farmer && offer.farmer.farmName && offer.farmer.farmName.toLowerCase().includes(term)) ||
          (offer.farmer && offer.farmer.city && offer.farmer.city.toLowerCase().includes(term)) ||
          (offer.requestId && offer.requestId.toLowerCase().includes(term)) ||
          (offer.notes && offer.notes.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  };
  
  // Teklif detaylarını görüntülemek için fonksiyonlar
  const openOfferDetailModal = (offer) => {
    setSelectedOffer(offer);
    setShowOfferDetailModal(true);
  };

  const closeOfferDetailModal = () => {
    setShowOfferDetailModal(false);
    setSelectedOffer(null);
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Firma bilgileri yükleniyor...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }
  
  // Kategoriler yükleniyorsa ve hiç kategori yoksa
  if (categoryLoading && categories.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Kategoriler yükleniyor...</p>
      </Container>
    );
  }
  
  return (
    <Container fluid className="py-4">
      {/* Toast bildirimi - sepet sistemi tarzında beyaz arka planlı */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          zIndex: 9999
        }}
      >
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide 
          className="border-0 shadow-sm"
        >
          <Toast.Body className="d-flex align-items-center p-3">
            {toastType === 'success' && <FaCheckCircle className="me-2 text-success" size={20} />}
            {toastType === 'warning' && <FaExclamationCircle className="me-2 text-warning" size={20} />}
            {toastType === 'danger' && <FaTimesCircle className="me-2 text-danger" size={20} />}
            <div>{toastMessage}</div>
            <button 
              type="button" 
              className="btn-close ms-auto"
              onClick={() => setShowToast(false)}
              aria-label="Kapat"
            />
          </Toast.Body>
        </Toast>
      </div>

      <Row className="mb-4">
        <Col>
          <h2 className="mb-0 text-primary d-flex align-items-center">
            <FaBuilding className="me-2" /> Firma Yönetim Paneli
          </h2>
          <p className="text-muted">
            Merhaba, {company?.companyName}! Firmanızı buradan yönetebilirsiniz.
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={3} md={4} className="mb-4">
          <Card className="border-0 shadow-sm rounded overflow-hidden h-100">
            <div className="bg-primary text-white p-3">
              <h5 className="mb-0 d-flex align-items-center">
                <FaTachometerAlt className="me-2" /> Panel Menüsü
              </h5>
            </div>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                <button 
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'overview' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
                >
                  <div className="d-flex align-items-center">
                    <div className="me-3 text-center" style={{width: "24px"}}>
                      <FaTachometerAlt />
                    </div>
                    <span>Genel Bakış</span>
                  </div>
                </button>
                
                <button 
                  type="button"
                  onClick={() => setActiveTab('company-info')}
                  className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'company-info' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
                >
                  <div className="d-flex align-items-center">
                    <div className="me-3 text-center" style={{width: "24px"}}>
                      <FaBuilding />
                    </div>
                    <span>Firma Bilgileri</span>
                  </div>
                </button>
                
                <button 
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'requests' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
                >
                  <div className="d-flex align-items-center">
                    <div className="me-3 text-center" style={{width: "24px"}}>
                      <FaFileAlt />
                    </div>
                    <span>Talepler</span>
                  </div>
                </button>
                
                <button 
                  type="button"
                  onClick={() => setActiveTab('offers')}
                  className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'offers' ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
                >
                  <div className="d-flex align-items-center">
                    <div className="me-3 text-center" style={{width: "24px"}}>
                      <FaHandshake />
                    </div>
                    <span>Teklifler</span>
                    {stats.pendingOffers > 0 && (
                      <Badge pill bg="danger" className="ms-2">
                        {stats.pendingOffers}
                      </Badge>
                    )}
                  </div>
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9} md={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <Tab.Content>
                <Tab.Pane eventKey="overview" active={activeTab === 'overview'}>
                  <h4 className="border-bottom pb-3 mb-4 text-primary">Genel Bakış</h4>
                  <Row>
                    <Col md={6} className="mb-4">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3 text-primary">Firma Bilgileri</h5>
                          <p className="mb-2"><strong>Firma Adı:</strong> {company?.companyName}</p>
                          <p className="mb-2"><strong>Konum:</strong> {company?.city}, {company?.district}</p>
                          <p className="mb-0"><strong>Vergi No:</strong> {company?.taxNumber}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                      <Card className="border-0 bg-primary text-white h-100">
                        <Card.Body className="p-4">
                          <h5 className="mb-3">Hızlı İstatistikler</h5>
                          <p className="mb-2 d-flex align-items-center justify-content-between">
                            <span><strong>Aktif Talepler:</strong></span>
                            <Badge bg="light" text="primary" pill className="fs-6">{stats.activeRequests}</Badge>
                          </p>
                          <p className="mb-2 d-flex align-items-center justify-content-between">
                            <span><strong>Alınan Teklifler:</strong></span>
                            <Badge bg="light" text="primary" pill className="fs-6">{stats.totalOffers}</Badge>
                          </p>
                          <p className="mb-0 d-flex align-items-center justify-content-between">
                            <span><strong>Kabul Edilen Teklifler:</strong></span>
                            <Badge bg="light" text="primary" pill className="fs-6">{stats.acceptedOffers}</Badge>
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey="company-info" active={activeTab === 'company-info'}>
                  <h4 className="border-bottom pb-3 mb-4 text-primary">Firma Bilgileri</h4>
                  
                  {updateSuccess && (
                    <Alert variant="success" className="d-flex align-items-center">
                      <FaCheck className="me-2" />
                      Firma bilgileriniz başarıyla güncellendi!
                    </Alert>
                  )}
                  
                  {updateError && (
                    <Alert variant="danger" className="d-flex align-items-center">
                      <FaExclamationCircle className="me-2" />
                      {updateError}
                    </Alert>
                  )}
                  
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="companyName">
                          <Form.Label>Firma Adı</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="companyName"
                            value={companyForm.companyName}
                            onChange={handleInputChange}
                            placeholder="Firmanızın adını girin"
                          />
                          <Form.Control.Feedback type="invalid">
                            Firma adı gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="taxNumber">
                          <Form.Label>Vergi Numarası</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="taxNumber"
                            value={companyForm.taxNumber}
                            onChange={handleInputChange}
                            placeholder="Vergi numaranızı girin"
                            pattern="[0-9]{10,11}"
                          />
                          <Form.Control.Feedback type="invalid">
                            Geçerli bir vergi numarası girin.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="taxOffice">
                          <Form.Label>Vergi Dairesi</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="taxOffice"
                            value={companyForm.taxOffice}
                            onChange={handleInputChange}
                            placeholder="Vergi dairesi adını girin"
                          />
                          <Form.Control.Feedback type="invalid">
                            Vergi dairesi gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="city">
                          <Form.Label>İl</Form.Label>
                          <Form.Select
                            required
                            name="city"
                            value={companyForm.city}
                            onChange={handleInputChange}
                            disabled={cityLoading}
                          >
                            <option value="">İl Seçin</option>
                            {cities.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </Form.Select>
                          {cityLoading && (
                            <div className="mt-2 text-center">
                              <Spinner animation="border" size="sm" variant="primary" />
                              <span className="ms-2 text-muted">İller yükleniyor...</span>
                            </div>
                          )}
                          <Form.Control.Feedback type="invalid">
                            İl seçimi gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="district">
                          <Form.Label>İlçe</Form.Label>
                          <Form.Select
                            required
                            name="district"
                            value={companyForm.district}
                            onChange={handleInputChange}
                            disabled={!companyForm.city || districtLoading}
                          >
                            <option value="">İlçe Seçin</option>
                            {districts.map((district) => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </Form.Select>
                          {districtLoading && (
                            <div className="mt-2 text-center">
                              <Spinner animation="border" size="sm" variant="primary" />
                              <span className="ms-2 text-muted">İlçeler yükleniyor...</span>
                            </div>
                          )}
                          <Form.Control.Feedback type="invalid">
                            İlçe seçimi gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="contactPerson.name">
                          <Form.Label>İletişim Kişisi Adı</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="contactPerson.name"
                            value={companyForm.contactPerson.name}
                            onChange={handleInputChange}
                            placeholder="İletişim kişisi adını girin"
                          />
                          <Form.Control.Feedback type="invalid">
                            İletişim kişisi adı gereklidir.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3" controlId="address">
                      <Form.Label>Adres</Form.Label>
                      <Form.Control
                        required
                        as="textarea"
                        rows={3}
                        name="address"
                        value={companyForm.address}
                        onChange={handleInputChange}
                        placeholder="Firmanızın tam adresini girin"
                      />
                      <Form.Control.Feedback type="invalid">
                        Adres gereklidir.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="contactPerson.position">
                          <Form.Label>Pozisyon</Form.Label>
                          <Form.Control
                            type="text"
                            name="contactPerson.position"
                            value={companyForm.contactPerson.position}
                            onChange={handleInputChange}
                            placeholder="İletişim kişisinin pozisyonu"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="contactPerson.phone">
                          <Form.Label>Telefon Numarası</Form.Label>
                          <Form.Control
                            required
                            type="text"
                            name="contactPerson.phone"
                            value={companyForm.contactPerson.phone}
                            onChange={handleInputChange}
                            placeholder="05xxxxxxxxx"
                            pattern="[0-9]{10,11}"
                          />
                          <Form.Control.Feedback type="invalid">
                            Geçerli bir telefon numarası girin (10-11 rakam).
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-4" controlId="contactPerson.email">
                      <Form.Label>E-posta Adresi</Form.Label>
                      <Form.Control
                        required
                        type="email"
                        name="contactPerson.email"
                        value={companyForm.contactPerson.email}
                        onChange={handleInputChange}
                        placeholder="ornek@sirket.com"
                      />
                      <Form.Control.Feedback type="invalid">
                        Geçerli bir e-posta adresi girin.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="d-flex align-items-center"
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Güncelleniyor...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Bilgileri Güncelle
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                <Tab.Pane eventKey="requests" active={activeTab === 'requests'}>
                  <h4 className="border-bottom pb-3 mb-4 text-primary">Taleplerim</h4>
                  
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">Talep Listesi</h5>
                        <Button 
                          variant="primary" 
                          onClick={openRequestModal}
                          className="d-flex align-items-center"
                        >
                          <FaPlus className="me-2" /> Yeni Talep Oluştur
                        </Button>
                      </div>
                      
                      <Row className="mb-3">
                        <Col lg={8} md={7}>
                          <InputGroup>
                            <InputGroup.Text>
                              <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                              placeholder="Talep başlığı veya açıklama ile ara..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                        <Col lg={4} md={5} className="mt-3 mt-md-0">
                          <InputGroup>
                            <InputGroup.Text>
                              <FaFilter />
                            </InputGroup.Text>
                            <Form.Select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <option value="all">Tüm Durumlar</option>
                              <option value="active">Aktif</option>
                              <option value="completed">Tamamlandı</option>
                              <option value="cancelled">İptal Edildi</option>
                              <option value="expired">Süresi Doldu</option>
                            </Form.Select>
                          </InputGroup>
                        </Col>
                      </Row>
                      
                      {requestError && (
                        <Alert variant="danger" className="d-flex align-items-center">
                          <FaExclamationCircle className="me-2" />
                          {requestError}
                        </Alert>
                      )}
                      
                      {requestsLoading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Talepler yükleniyor...</p>
                        </div>
                      ) : filterRequests().length === 0 ? (
                        <Alert variant="info" className="d-flex align-items-center">
                          <FaExclamationCircle className="me-2" />
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Arama kriterlerinize uygun talep bulunamadı.' 
                            : 'Henüz oluşturduğunuz bir talep bulunmamaktadır.'}
                        </Alert>
                      ) : (
                        <div className="table-responsive">
                          <Table hover className="align-middle">
                            <thead className="bg-light">
                              <tr>
                                <th>Talep No</th>
                                <th>Başlık</th>
                                <th>Miktar</th>
                                <th>Konum</th>
                                <th>Son Tarih</th>
                                <th>Teklif</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filterRequests().map((request) => (
                                <tr key={request._id}>
                                  <td>
                                    <span className="fw-medium">#{request._id.substring(request._id.length - 6)}</span>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div>
                                        <div className="fw-medium">{request.title}</div>
                                        <small className="text-muted">
                                          {request.description.substring(0, 30)}...
                                          <span className="ms-1 badge bg-light text-dark">
                                            {categoryLoading ? (
                                              <span>
                                                <Spinner animation="border" size="sm" variant="primary" className="me-1" /> 
                                                Yükleniyor...
                                              </span>
                                            ) : (
                                              getCategoryName(request.category)
                                            )}
                                          </span>
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{request.quantity} {request.unit}</td>
                                  <td>{request.city}, {request.district}</td>
                                  <td>{formatDate(request.deadline)}</td>
                                  <td>
                                    <Badge bg="primary" pill>
                                      {request.offers?.length || 0} Teklif
                                    </Badge>
                                  </td>
                                  <td>{getStatusBadge(request.status)}</td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => openDetailModal(request)}
                                    >
                                      <FaEye className="me-1" /> Detay
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                <Tab.Pane eventKey="offers" active={activeTab === 'offers'}>
                  <h4 className="border-bottom pb-3 mb-4 text-primary">Gelen Teklifler</h4>
                  
                  {offersLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Teklifler yükleniyor...</p>
                    </div>
                  ) : offerError ? (
                    <Alert variant="danger" className="d-flex align-items-center">
                      <FaExclamationCircle className="me-2" />
                      {offerError}
                    </Alert>
                  ) : offers.length === 0 ? (
                    <Alert variant="info" className="d-flex align-items-center">
                      <FaExclamationCircle className="me-2" />
                      Henüz hiç teklif alınmamış.
                    </Alert>
                  ) : (
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="mb-4">
                          <Row>
                            <Col md={6} className="mb-3 mb-md-0">
                              <InputGroup>
                                <InputGroup.Text>
                                  <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                  placeholder="Teklif ara..."
                                  value={offerSearchTerm}
                                  onChange={(e) => setOfferSearchTerm(e.target.value)}
                                />
                              </InputGroup>
                            </Col>
                            <Col md={6}>
                              <InputGroup>
                                <InputGroup.Text>
                                  <FaFilter />
                                </InputGroup.Text>
                                <Form.Select
                                  value={offerStatusFilter}
                                  onChange={(e) => setOfferStatusFilter(e.target.value)}
                                >
                                  <option value="all">Tüm Teklifler</option>
                                  <option value="pending">Bekleyen Teklifler</option>
                                  <option value="accepted">Kabul Edilen Teklifler</option>
                                  <option value="rejected">Reddedilen Teklifler</option>
                                </Form.Select>
                              </InputGroup>
                            </Col>
                          </Row>
                        </div>
                        
                        <div className="table-responsive">
                          <Table hover className="align-middle">
                            <thead className="bg-light">
                              <tr>
                                <th>Talep</th>
                                <th>Çiftçi</th>
                                <th>Miktar</th>
                                <th>Fiyat</th>
                                <th>Teslim Tarihi</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filterOffers().map((offer) => (
                                <tr key={offer._id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div>
                                        <div className="fw-medium">{offer.requestTitle}</div>
                                        <small className="text-muted">
                                          #{offer.requestId.substring(offer.requestId.length - 6)}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div>
                                        <div className="fw-medium">
                                          {offer.farmer && offer.farmer.farmName 
                                            ? offer.farmer.farmName 
                                            : 'İsimsiz Çiftlik'}
                                        </div>
                                        <small className="text-muted">
                                          {offer.farmer
                                            ? `${offer.farmer.city || ''}, ${offer.farmer.district || ''}`
                                            : 'Konum belirtilmemiş'}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {offer.quantity || '?'} {offer.requestUnit}
                                  </td>
                                  <td>
                                    <div className="fw-medium text-primary">
                                      {offer.price ? parseFloat(offer.price).toFixed(2) : '0.00'} ₺
                                    </div>
                                  </td>
                                  <td>
                                    {offer.estimatedDelivery ? formatDate(offer.estimatedDelivery) : 'Belirtilmemiş'}
                                  </td>
                                  <td>
                                    {offer.status === 'pending' && <Badge bg="warning">Beklemede</Badge>}
                                    {offer.status === 'accepted' && <Badge bg="success">Kabul Edildi</Badge>}
                                    {offer.status === 'rejected' && <Badge bg="danger">Reddedildi</Badge>}
                                  </td>
                                  <td>
                                    <div className="d-flex">
                                      <Button 
                                        variant="outline-info" 
                                        size="sm"
                                        className="me-2"
                                        onClick={() => openOfferDetailModal(offer)}
                                      >
                                        <FaEye /> Detay
                                      </Button>
                                      
                                      {offer.status === 'pending' && (
                                        <div className="d-flex gap-2">
                                          <Button 
                                            variant="outline-success" 
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleAcceptOffer(offer._id, offer.requestId)}
                                          >
                                            Kabul Et
                                          </Button>
                                          <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => handleRejectOffer(offer._id, offer.requestId)}
                                          >
                                            Reddet
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Talep Oluşturma Modalı */}
      <Modal 
        show={showRequestModal} 
        onHide={closeRequestModal}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2" /> Yeni Talep Oluştur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requestSuccess && (
            <Alert variant="success" className="d-flex align-items-center">
              <FaCheck className="me-2" />
              Talep başarıyla oluşturuldu!
            </Alert>
          )}
          
          {requestError && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationCircle className="me-2" />
              {requestError}
            </Alert>
          )}
          
          <Form noValidate validated={requestValidated} onSubmit={handleRequestSubmit}>
            <Form.Group controlId="title" className="mb-3">
              <Form.Label>Talep Başlığı</Form.Label>
              <Form.Control
                required
                type="text"
                name="title"
                value={requestForm.title}
                onChange={handleRequestInputChange}
                placeholder="Talep başlığını girin"
                maxLength={100}
              />
              <Form.Control.Feedback type="invalid">
                Talep başlığı gereklidir.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group controlId="category" className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                required
                name="category"
                value={requestForm.category}
                onChange={handleRequestInputChange}
                disabled={categoryLoading}
              >
                <option value="">Kategori Seçin</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.category_name}
                  </option>
                ))}
              </Form.Select>
              {categoryLoading && (
                <div className="mt-2 text-center">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2 text-muted">Kategoriler yükleniyor...</span>
                </div>
              )}
              <Form.Control.Feedback type="invalid">
                Kategori seçimi gereklidir.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="quantity">
                  <Form.Label>Miktar</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min="1"
                    name="quantity"
                    value={requestForm.quantity}
                    onChange={handleRequestInputChange}
                    placeholder="Miktar girin"
                  />
                  <Form.Control.Feedback type="invalid">
                    Geçerli bir miktar girin.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group controlId="unit">
                  <Form.Label>Birim</Form.Label>
                  <Form.Select
                    required
                    name="unit"
                    value={requestForm.unit}
                    onChange={handleRequestInputChange}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="adet">Adet</option>
                    <option value="litre">Litre</option>
                    <option value="demet">Demet</option>
                    <option value="paket">Paket</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="city">
                  <Form.Label>İl</Form.Label>
                  <Form.Select
                    required
                    name="city"
                    value={requestForm.city}
                    onChange={handleRequestInputChange}
                    disabled={cityLoading}
                  >
                    <option value="">İl Seçin</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </Form.Select>
                  {cityLoading && (
                    <div className="mt-2 text-center">
                      <Spinner animation="border" size="sm" variant="primary" />
                      <span className="ms-2 text-muted">İller yükleniyor...</span>
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    İl seçimi gereklidir.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group controlId="district">
                  <Form.Label>İlçe</Form.Label>
                  <Form.Select
                    required
                    name="district"
                    value={requestForm.district}
                    onChange={handleRequestInputChange}
                    disabled={!requestForm.city || districtLoading}
                  >
                    <option value="">İlçe Seçin</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </Form.Select>
                  {districtLoading && (
                    <div className="mt-2 text-center">
                      <Spinner animation="border" size="sm" variant="primary" />
                      <span className="ms-2 text-muted">İlçeler yükleniyor...</span>
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    İlçe seçimi gereklidir.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="budget">
                  <Form.Label>Bütçe (₺, Opsiyonel)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="budget"
                    value={requestForm.budget}
                    onChange={handleRequestInputChange}
                    placeholder="Bütçenizi girin"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group controlId="deadline">
                  <Form.Label>Son Teslim Tarihi</Form.Label>
                  <div className="position-relative">
                    <DatePicker
                      selected={requestForm.deadline}
                      onChange={handleDateChange}
                      className="form-control"
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      required
                    />
                    <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                      <FaCalendarAlt className="text-muted" />
                    </div>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    Son teslim tarihi gereklidir.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group controlId="description" className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                required
                name="description"
                value={requestForm.description}
                onChange={handleRequestInputChange}
                placeholder="Talebinizi detaylı açıklayın"
                maxLength={1000}
              />
              <Form.Control.Feedback type="invalid">
                Açıklama gereklidir.
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {requestForm.description.length}/1000 karakter
              </Form.Text>
            </Form.Group>
            
            <Form.Group controlId="specifications" className="mb-3">
              <Form.Label>Özel Gereksinimler (Opsiyonel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="specifications"
                value={requestForm.specifications}
                onChange={handleRequestInputChange}
                placeholder="Özel isteklerinizi belirtin"
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {requestForm.specifications.length}/500 karakter
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="isOrganic"
                label="Organik ürün talep ediyorum"
                name="isOrganic"
                checked={requestForm.isOrganic}
                onChange={handleRequestInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeRequestModal}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRequestSubmit}
            disabled={requestCreating}
          >
            {requestCreating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Talep Oluştur
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Teklif Detay Modalı */}
      <Modal 
        show={showOfferDetailModal} 
        onHide={closeOfferDetailModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHandshake className="me-2" /> Teklif Detayı
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOffer && (
            <>
              <Card className="mb-4 border-0 bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold">Teklif Durumu</h6>
                    {selectedOffer.status === 'pending' && <Badge bg="warning">Beklemede</Badge>}
                    {selectedOffer.status === 'accepted' && <Badge bg="success">Kabul Edildi</Badge>}
                    {selectedOffer.status === 'rejected' && <Badge bg="danger">Reddedildi</Badge>}
                  </div>
                </Card.Body>
              </Card>
              
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Teklif Bilgileri</h6>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaFileAlt className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Talep</div>
                      <div>{selectedOffer.requestTitle}</div>
                      <small className="text-muted">#{selectedOffer.requestId.substring(selectedOffer.requestId.length - 6)}</small>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaList className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Miktar</div>
                      <div>{selectedOffer.quantity} {selectedOffer.requestUnit}</div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaCalendarAlt className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Tahmini Teslimat</div>
                      <div>{selectedOffer.estimatedDelivery ? formatDate(selectedOffer.estimatedDelivery) : 'Belirtilmemiş'}</div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex">
                    <div className="me-2">
                      <FaList className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-medium">Fiyat</div>
                      <div className="fw-medium text-success">{selectedOffer.price ? parseFloat(selectedOffer.price).toFixed(2) : '0.00'} ₺</div>
                      {selectedOffer.price && selectedOffer.quantity && (
                        <small className="text-muted">
                          Birim Fiyat: {(parseFloat(selectedOffer.price) / parseInt(selectedOffer.quantity)).toFixed(2)} ₺/{selectedOffer.requestUnit}
                        </small>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Çiftçi Bilgileri</h6>
                  {selectedOffer.farmer ? (
                    <>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaBuilding className="text-primary" />
                        </div>
                        <div>
                          <div className="fw-medium">Çiftlik Adı</div>
                          <div>{selectedOffer.farmer.farmName || 'Belirtilmemiş'}</div>
                        </div>
                      </div>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaPhone className="text-primary" />
                        </div>
                        <div>
                          <div className="fw-medium">Telefon</div>
                          <div>
                            {selectedOffer.farmer.user && selectedOffer.farmer.user.phone 
                              ? selectedOffer.farmer.user.phone 
                              : (selectedOffer.farmer.phone || 'Belirtilmemiş')}
                          </div>
                          {!selectedOffer.farmer.user && (
                            <small className="text-warning">
                              <FaExclamationCircle className="me-1" />
                              Çiftçi kullanıcı bilgileri yüklenemedi
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="mb-2 d-flex">
                        <div className="me-2">
                          <FaEnvelope className="text-primary" />
                        </div>
                        <div>
                          <div className="fw-medium">E-posta</div>
                          <div>
                            {selectedOffer.farmer.user && selectedOffer.farmer.user.email 
                              ? selectedOffer.farmer.user.email 
                              : (selectedOffer.farmer.email || 'Belirtilmemiş')}
                          </div>
                        </div>
                      </div>
                      <div className="mb-0 d-flex">
                        <div className="me-2">
                          <FaMapMarkerAlt className="text-primary" />
                        </div>
                        <div>
                          <div className="fw-medium">Konum</div>
                          <div>
                            {selectedOffer.farmer.city && selectedOffer.farmer.district 
                              ? `${selectedOffer.farmer.city}, ${selectedOffer.farmer.district}` 
                              : 'Belirtilmemiş'
                            }
                          </div>
                          {selectedOffer.farmer.address && (
                            <small className="text-muted">{selectedOffer.farmer.address}</small>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <FaExclamationCircle className="me-2" />
                      Çiftçi bilgileri bulunamadı
                    </Alert>
                  )}
                </Col>
              </Row>
              
              {selectedOffer.notes && (
                <>
                  <h6 className="fw-bold mb-3">Teklif Notları</h6>
                  <Card className="mb-4 border-0 shadow-sm">
                    <Card.Body>
                      <p>{selectedOffer.notes}</p>
                    </Card.Body>
                  </Card>
                </>
              )}
              
              {selectedOffer.status === 'accepted' && (
                <Alert variant="success">
                  <div className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" size={20} />
                    <div>
                      <strong>Bu teklif kabul edildi.</strong>
                      <p className="mb-0 mt-1">
                        Kabul tarihi: {formatDate(selectedOffer.updatedAt || selectedOffer.createdAt)}
                      </p>
                    </div>
                  </div>
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeOfferDetailModal}>
            Kapat
          </Button>
          {selectedOffer && selectedOffer.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleAcceptOffer(selectedOffer._id, selectedOffer.requestId);
                  closeOfferDetailModal();
                }}
              >
                <FaCheck className="me-2" /> Teklifi Kabul Et
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  handleRejectOffer(selectedOffer._id, selectedOffer.requestId);
                  closeOfferDetailModal();
                }}
              >
                <FaTimesCircle className="me-2" /> Teklifi Reddet
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CompanyDashboardPage; 