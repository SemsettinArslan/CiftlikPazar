import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Ürün tipi
type Product = {
  _id: string;
  id?: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  countInStock?: number;
  image?: string;
  farmer?: {
    _id: string;
    farmName: string;
  };
};

// Sepet state tipi
type CartState = {
  items: Product[];
  totalItems: number;
  totalPrice: number;
  currentFarmerId: string | null;
};

// Sepet aksiyonları
type CartAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: { _id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { _id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'REPLACE_CART'; payload: CartState };

// Context tipi
type CartContextType = {
  cart: CartState;
  addToCart: (product: Product) => boolean;
  removeFromCart: (product: { _id: string }) => void;
  updateQuantity: (product: { _id: string }, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  getShippingFee: () => number;
  getOrderTotal: () => number;
};

// Context oluştur
const CartContext = createContext<CartContextType | undefined>(undefined);

// Reducer fonksiyonu
const cartReducer = (state: CartState, action: CartAction): CartState => {
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
        if (action.payload.countInStock !== undefined && action.payload.countInStock <= 0) {
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
          
          // Güncellenmiş ürün
          return {
            ...item,
            quantity: safeQuantity
          };
        }
        return item;
      });

      const updatedItem = updatedItems.find(item => item._id === action.payload._id);
      const oldItem = state.items.find(item => item._id === action.payload._id);
      
      if (!updatedItem || !oldItem) return state;
      
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
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: CartState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    currentFarmerId: null
  };

  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // AsyncStorage'dan sepet verisini yükle
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          dispatch({ 
            type: 'REPLACE_CART', 
            payload: parsedCart
          });
        }
      } catch (error) {
        console.error('Sepet yüklenirken hata oluştu:', error);
      }
    };
    
    loadCart();
  }, []);

  // Sepet değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(state));
      } catch (error) {
        console.error('Sepet kaydedilirken hata oluştu:', error);
      }
    };
    
    saveCart();
  }, [state]);

  // Sepet fonksiyonları
  const addToCart = (product: Product): boolean => {
    // Stok kontrolü
    const existingItem = state.items.find(item => item._id === product._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const stockLimit = product.countInStock || 0;
    
    // Stok sınırını kontrol et
    if (stockLimit <= 0) {
      Alert.alert(
        "Stok Hatası", 
        `Üzgünüz, "${product.name}" ürünü stokta bulunmamaktadır.`
      );
      return false;
    }
    
    if (currentQuantity >= stockLimit) {
      Alert.alert(
        "Stok Sınırı", 
        `"${product.name}" ürününden sepette zaten ${currentQuantity} adet var. Stok sınırı: ${stockLimit}`
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
      Alert.alert("Başarılı", `"${product.name}" sepete eklendi`);
      return true;
    } else {
      // Farklı üreticiden ürün eklenmeye çalışılıyor
      const currentFarmerName = state.items[0].farmer ? state.items[0].farmer.farmName : "başka bir çiftlik";
      const productFarmerName = product.farmer ? product.farmer.farmName : "farklı bir çiftlik";
      
      // Farklı çiftlikten ürün ekleme onayı iste
      Alert.alert(
        "Farklı Çiftlikten Ürün",
        `Sepetinizde "${currentFarmerName}" çiftliğinden ürünler var. "${productFarmerName}" çiftliğinden ürün eklemek için sepetiniz temizlenecektir. Devam etmek istiyor musunuz?`,
        [
          {
            text: "İptal",
            style: "cancel"
          },
          { 
            text: "Devam Et", 
            onPress: () => {
              // Sepeti temizle ve yeni ürünü ekle
              dispatch({ type: 'CLEAR_CART' });
              dispatch({
                type: 'ADD_TO_CART',
                payload: product
              });
              Alert.alert("Başarılı", `Sepetiniz temizlendi ve "${product.name}" eklendi`);
            }
          }
        ]
      );
      
      // Kullanıcı onayı beklediğimiz için false döndürüyoruz
      return false;
    }
  };

  const removeFromCart = (product: { _id: string }) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: product
    });
  };

  const updateQuantity = (product: { _id: string }, quantity: number) => {
    if (quantity <= 0) {
      // Miktar 0 veya altına düşerse ürünü sepetten kaldır
      removeFromCart(product);
      return;
    }
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { _id: product._id, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartItemCount = () => {
    return state.totalItems;
  };

  const getCartTotal = () => {
    return state.totalPrice;
  };

  // Kargo ücreti
  const getShippingFee = () => {
    const cartTotal = getCartTotal();
    return cartTotal < 150 ? 20 : 0;
  };

  // Genel toplam
  const getOrderTotal = () => {
    return getCartTotal() + getShippingFee();
  };

  return (
    <CartContext.Provider
      value={{
        cart: state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartTotal,
        getShippingFee,
        getOrderTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Cart context hook
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart hook must be used within a CartProvider');
  }
  
  return context;
};

export default CartContext; 