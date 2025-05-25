import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaExclamationTriangle, FaTrash, FaStore, FaTicketAlt } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';

// Context oluştur
const CartContext = createContext();

// Başlangıç durumu
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  currentFarmerId: null,
  coupon: null,
  discountAmount: 0,
  orderSuccess: false,
  orderId: null
};

// Reducer fonksiyonu
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItemIndex = state.items.findIndex(
        item => item._id === action.payload._id
      );

      // Stok kontrolü
      if (existingItemIndex >= 0) {
        // Eğer ürün zaten sepette varsa ve stok sınırını aşacaksa işlemi reddet
        const currentQuantity = state.items[existingItemIndex].quantity;
        const stockLimit = action.payload.countInStock || Infinity;
        
        if (currentQuantity >= stockLimit) {
          // Stok sınırı aşılıyor, state'i değiştirmeden geri döndür
          return state;
        }
        
        // Eğer stok yeterliyse miktarını arttır
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + 1,
          totalPrice: state.totalPrice + action.payload.price
        };
      } else {
        // Eğer ürün sepette yoksa ve stokta varsa yeni ekle
        if (action.payload.countInStock <= 0) {
          // Stokta yok, state'i değiştirmeden geri döndür
          return state;
        }
        
        // Ürünü sepete ekle
        const newItem = {
          ...action.payload,
          quantity: 1
        };
        
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + 1,
          totalPrice: state.totalPrice + action.payload.price,
          currentFarmerId: action.payload.farmer && action.payload.farmer._id ? action.payload.farmer._id : null
        };
      }

    case 'REMOVE_FROM_CART':
      const filteredItems = state.items.filter(item => item._id !== action.payload._id);
      const removedItem = state.items.find(item => item._id === action.payload._id);
      
      if (!removedItem) return state;
      
      // Eğer son ürün de kaldırıldıysa currentFarmerId'yi ve kuponu sıfırla
      const newCurrentFarmerId = filteredItems.length === 0 ? null : state.currentFarmerId;
      const newCoupon = filteredItems.length === 0 ? null : state.coupon;
      const newDiscountAmount = filteredItems.length === 0 ? 0 : state.discountAmount;
      
      return {
        ...state,
        items: filteredItems,
        totalItems: state.totalItems - removedItem.quantity,
        totalPrice: state.totalPrice - (removedItem.price * removedItem.quantity),
        currentFarmerId: newCurrentFarmerId,
        coupon: newCoupon,
        discountAmount: newDiscountAmount
      };

    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item => {
        if (item._id === action.payload._id) {
          // Stok limiti kontrolü
          const stockLimit = item.countInStock || Infinity;
          const safeQuantity = Math.min(action.payload.quantity, stockLimit);
          
          // Eski ve yeni miktarlar arasındaki fark
          const quantityDifference = safeQuantity - item.quantity;
          
          return {
            ...item,
            quantity: safeQuantity
          };
        }
        return item;
      });

      const updatedItem = updatedItems.find(item => item._id === action.payload._id);
      const oldItem = state.items.find(item => item._id === action.payload._id);
      const quantityDifference = updatedItem.quantity - oldItem.quantity;
      
      // İndirim hesabını tekrar yap
      let discountAmount = state.discountAmount;
      const newTotalPrice = state.totalPrice + (quantityDifference * updatedItem.price);
      
      if (state.coupon) {
        // Kupon yüzdelik ise yeniden hesapla, sabit ise aynı kalır
        if (state.coupon.type === 'percentage') {
          discountAmount = Math.min(
            (newTotalPrice * state.coupon.value) / 100,
            state.coupon.maximumDiscountAmount || Infinity
          );
        }
      }
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDifference,
        totalPrice: newTotalPrice,
        discountAmount: discountAmount
      };

    case 'CLEAR_CART':
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        currentFarmerId: null,
        coupon: null,
        discountAmount: 0,
        orderSuccess: false,
        orderId: null
      };
      
    case 'REPLACE_CART':
      return {
        ...action.payload
      };
      
    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: action.payload.coupon,
        discountAmount: action.payload.discountAmount
      };
      
    case 'REMOVE_COUPON':
      return {
        ...state,
        coupon: null,
        discountAmount: 0
      };
      
    case 'ORDER_SUCCESS':
      return {
        ...initialState,
        orderSuccess: true,
        orderId: action.payload
      };

    default:
      return state;
  }
};

// CartProvider bileşeni
export const CartProvider = ({ children }) => {
  const initialState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    currentFarmerId: null,
    coupon: null,
    discountAmount: 0,
    orderSuccess: false,
    orderId: null
  };

  // LocalStorage'dan sepet verisini yükle
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      dispatch({ 
        type: 'REPLACE_CART', 
        payload: parsedCart
      });
    }
  }, []);

  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [existingFarmerName, setExistingFarmerName] = useState('');
  const [newFarmerName, setNewFarmerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sepet değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Farklı çiftlikten ürün ekleme işlemini onayla
  const handleConfirmNewFarmer = () => {
    // Sepeti temizle ve yeni ürünü ekle
    dispatch({ type: 'CLEAR_CART' });
    
    // Yeni ürünü ekle
    dispatch({
      type: 'ADD_TO_CART',
      payload: pendingProduct
    });
    
    toast.info(
      <div className="d-flex align-items-center">
        <FaShoppingCart className="me-2" />
        <span>Sepetiniz temizlendi ve {pendingProduct.name} eklendi</span>
      </div>
    );
    
    // Modalı kapat ve bekleyen ürünü temizle
    setShowConfirmModal(false);
    setPendingProduct(null);
  };
  
  // İşlemi iptal et
  const handleCancelNewFarmer = () => {
    setShowConfirmModal(false);
    setPendingProduct(null);
  };

  // Sepet fonksiyonları
  const addToCart = (product) => {
    // Stok kontrolü
    const existingItem = state.items.find(item => item._id === product._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const stockLimit = product.countInStock || 0;
    
    // Stok sınırını kontrol et
    if (stockLimit <= 0) {
      toast.error(
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <span>Üzgünüz, "{product.name}" ürünü stokta bulunmamaktadır.</span>
        </div>
      );
      return false;
    }
    
    if (currentQuantity >= stockLimit) {
      toast.warning(
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <span>"{product.name}" ürününden sepette zaten {currentQuantity} adet var. Stok sınırı: {stockLimit}</span>
        </div>
      );
      return false;
    }
    
    // Çiftçi/üretici kontrolü
    const productFarmerId = product.farmer && product.farmer._id ? product.farmer._id : null;
    
    // Sepet boşsa veya aynı üreticiden ürün ekleniyorsa direkt ekle
    if (state.items.length === 0 || state.currentFarmerId === null || state.currentFarmerId === productFarmerId) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: product
      });
      return true;
    } else {
      // Farklı üreticiden ürün eklenmeye çalışılıyor
      const currentFarmerName = state.items[0].farmer ? state.items[0].farmer.farmName : "başka bir çiftlik";
      const productFarmerName = product.farmer ? product.farmer.farmName : "farklı bir çiftlik";
      
      // Modal için state'i ayarla
      setPendingProduct(product);
      setExistingFarmerName(currentFarmerName);
      setNewFarmerName(productFarmerName);
      setShowConfirmModal(true);
      
      // Modalı gösterdiğimiz için false döndürüyoruz
      // Onay gelirse handleConfirmNewFarmer fonksiyonu çağrılacak
      return false;
    }
  };

  const removeFromCart = (product) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: product
    });
    
    toast.info(
      <div className="d-flex align-items-center">
        <FaTrash className="me-2" />
        <span>{product.name} sepetten çıkarıldı</span>
      </div>
    );
  };

  const updateQuantity = (product, quantity) => {
    // Geçersiz değerler için kontrol
    if (quantity < 1) quantity = 1;
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { _id: product._id, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    
    toast.info(
      <div className="d-flex align-items-center">
        <FaShoppingCart className="me-2" />
        <span>Sepetiniz temizlendi</span>
      </div>
    );
  };

  const getCartItemCount = () => {
    return state.totalItems;
  };

  const getCartTotal = () => {
    return state.totalPrice;
  };
  
  // Kargo ücreti hesaplama
  const getShippingFee = () => {
    // 150 TL üzeri alışverişlerde kargo ücretsiz
    const FREE_SHIPPING_THRESHOLD = 150;
    const SHIPPING_FEE = 20;
    
    return state.totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  };
  
  // Sipariş toplam tutarı (indirim ve kargo dahil)
  const getOrderTotal = () => {
    const cartTotal = state.totalPrice;
    const discountAmount = state.discountAmount;
    const shippingFee = getShippingFee();
    
    return cartTotal - discountAmount + shippingFee;
  };
  
  // Sipariş oluşturma
  const createOrder = async (shippingAddress, paymentMethod = 'Kapıda Ödeme') => {
    try {
      setLoading(true);
      setError(null);
      
      // Teslimat adresi kontrolü
      if (!shippingAddress) {
        setError('Teslimat adresi bilgileri eksik');
        return { success: false };
      }

      // Zorunlu alanların kontrolü
      const requiredFields = ['fullName', 'address', 'city', 'district', 'phone'];
      const missingFields = requiredFields.filter(field => !shippingAddress[field]);
      
      if (missingFields.length > 0) {
        setError(`Teslimat adresi için gerekli alanlar eksik: ${missingFields.join(', ')}`);
        return { success: false };
      }
      
      // Sipariş verisi oluştur
      const orderData = {
        items: state.items.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          farmer: item.farmer?._id || item.farmer
        })),
        shippingAddress,
        paymentMethod,
        totalPrice: state.totalPrice,
        shippingFee: getShippingFee(),
        totalAmount: getOrderTotal(),
        coupon: state.coupon ? state.coupon._id : null,
        discountAmount: state.discountAmount
      };
      
      // API isteği gönder
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/orders', orderData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Başarılı sipariş
        dispatch({ 
          type: 'ORDER_SUCCESS',
          payload: response.data.data._id
        });
        
        toast.success(
          <div className="d-flex align-items-center">
            <FaShoppingCart className="me-2" />
            <span>Siparişiniz başarıyla oluşturuldu!</span>
          </div>
        );
        
        return {
          success: true,
          orderId: response.data.data._id
        };
      } else {
        setError('Sipariş oluşturulurken bir hata oluştu.');
        return { success: false };
      }
    } catch (err) {
      console.error('Sipariş oluşturma hatası:', err);
      setError(err.response?.data?.message || 'Sipariş oluşturulurken bir hata oluştu.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  
  // Kupon işlemleri
  const applyCoupon = async (couponCode) => {
    try {
      setLoading(true);
      setError(null);
      
      // API URL'i tam olarak belirt
      const response = await axios.post('http://localhost:3001/api/coupons/check', {
        code: couponCode,
        cartTotal: state.totalPrice
      });
      
      if (response.data.success) {
        const { coupon, discountAmount } = response.data.data;
        
        dispatch({
          type: 'APPLY_COUPON',
          payload: { coupon, discountAmount }
        });
        
        toast.success(
          <div className="d-flex align-items-center">
            <FaTicketAlt className="me-2" />
            <span>{coupon.code} kuponu başarıyla uygulandı. {discountAmount.toFixed(2)} ₺ indirim kazandınız!</span>
          </div>
        );
        
        return true;
      }
    } catch (error) {
      console.error('Kupon hatası:', error);
      
      // Hata mesajını daha güvenilir şekilde al
      let errorMessage = 'Kupon uygulanırken bir hata oluştu.';
      
      if (error.response) {
        // Server yanıtı ile gelen hata (4xx, 5xx)
        console.log('Hata yanıtı:', error.response);
        errorMessage = error.response.data?.message || 
                      (error.response.data?.error?.message) || 
                      `Hata kodu: ${error.response.status}`;
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı
        errorMessage = 'Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.';
      } else {
        // İstek oluşturulurken hata
        errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
      }
      
      setError(errorMessage);
      
      // Hata tipine göre özel başlıklar
      let title = 'Kupon Hatası';
      
      if (errorMessage.includes('bulunamadı')) {
        title = 'Geçersiz Kupon';
      } else if (errorMessage.includes('süresi dolmuş')) {
        title = 'Süresi Dolmuş';
      } else if (errorMessage.includes('aktif değil')) {
        title = 'Pasif Kupon';
      } else if (errorMessage.includes('kullanım limiti')) {
        title = 'Limit Dolmuş';
      } else if (errorMessage.includes('minimum')) {
        title = 'Yetersiz Tutar';
      }
      
      toast.error(
        <div>
          <div className="d-flex align-items-center fw-bold mb-1">
            <FaExclamationTriangle className="me-2 text-danger" />
            <span>{title}</span>
          </div>
          <div className="ms-4">{errorMessage}</div>
        </div>
      );
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
    
    toast.info(
      <div className="d-flex align-items-center">
        <FaTicketAlt className="me-2" />
        <span>Kupon kaldırıldı</span>
      </div>
    );
  };

  // Modal bileşeni
  const farmerChangeModal = (
    <Modal show={showConfirmModal} onHide={handleCancelNewFarmer} centered>
      <Modal.Header closeButton>
        <Modal.Title>Farklı Çiftlikten Ürün</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-center mb-3">
          <FaStore className="text-warning me-2" size={22} />
          <div>
            <p className="mb-0">
              Sepetinizde zaten <strong>{existingFarmerName}</strong>'den ürünler var.
            </p>
            <p className="mb-0">
              <strong>{newFarmerName}</strong>'den ürün eklemek için sepetiniz temizlenecek.
            </p>
          </div>
        </div>
        <p className="text-danger mb-0">Devam etmek istiyor musunuz?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={handleCancelNewFarmer}>
          Vazgeç
        </Button>
        <Button variant="success" onClick={handleConfirmNewFarmer}>
          Sepeti Temizle ve Ekle
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // Context değeri
  const contextValue = {
    cart: {
      ...state,
      finalTotal: getCartTotal()
    },
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    getShippingFee,
    getOrderTotal,
    createOrder,
    applyCoupon,
    removeCoupon,
    couponLoading: loading,
    couponError: error
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
      {farmerChangeModal}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart hook must be used within a CartProvider');
  }
  
  return context;
};

export default CartContext; 