import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaExclamationTriangle, FaTrash, FaStore } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';

// Context oluştur
const CartContext = createContext();

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
      
      // Eğer son ürün de kaldırıldıysa currentFarmerId'yi sıfırla
      const newCurrentFarmerId = filteredItems.length === 0 ? null : state.currentFarmerId;
      
      return {
        ...state,
        items: filteredItems,
        totalItems: state.totalItems - removedItem.quantity,
        totalPrice: state.totalPrice - (removedItem.price * removedItem.quantity),
        currentFarmerId: newCurrentFarmerId
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
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDifference,
        totalPrice: state.totalPrice + (quantityDifference * updatedItem.price)
      };

    case 'CLEAR_CART':
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        currentFarmerId: null
      };
      
    case 'REPLACE_CART':
      return {
        ...action.payload
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
    currentFarmerId: null
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
        <FaShoppingCart className="me-2" />
        <span>{product.name} sepetten çıkarıldı</span>
      </div>
    );
  };

  const updateQuantity = (product, quantity) => {
    if (quantity < 1) {
      removeFromCart(product);
      return;
    }
    
    // Stok limiti kontrolü
    const stockLimit = product.countInStock || 0;
    if (quantity > stockLimit) {
      toast.warning(
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <span>Üzgünüz, "{product.name}" ürününün stok limiti: {stockLimit}</span>
        </div>
      );
      // Stok limitini aşmayacak şekilde ayarla
      quantity = stockLimit;
    }
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { ...product, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    
    toast.info(
      <div className="d-flex align-items-center">
        <FaShoppingCart className="me-2" />
        <span>Sepet temizlendi</span>
      </div>
    );
  };

  const getCartItemCount = () => {
    return state.totalItems;
  };

  const getCartTotal = () => {
    return state.totalPrice;
  };

  return (
    <>
      <CartContext.Provider
        value={{
          cart: state,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          getCartItemCount,
          getCartTotal
        }}
      >
        {children}
      </CartContext.Provider>
      
      {/* Farklı çiftlik onay modalı */}
      <Modal 
        show={showConfirmModal} 
        onHide={handleCancelNewFarmer}
        centered
        backdrop="static"
      >
        <Modal.Header className="bg-success text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Sepet Uyarısı
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="d-flex flex-column">
            <p className="mb-3">
              Sepetinizde <strong>{existingFarmerName}</strong> çiftliğinden ürünler bulunmaktadır.
            </p>
            <p className="mb-3">
              <strong>{newFarmerName}</strong> çiftliğinden ürün eklemek için mevcut sepetiniz temizlenecektir.
            </p>
            <p className="mb-0">
              Devam etmek istiyor musunuz?
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCancelNewFarmer}>
            İptal
          </Button>
          <Button variant="success" onClick={handleConfirmNewFarmer}>
            <FaTrash className="me-2" />
            Sepeti Temizle ve Devam Et
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// Özel hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart hook must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 