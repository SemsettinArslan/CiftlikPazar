import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

// useAuth hook'u - başka bileşenlerden kolayca AuthContext'e erişmek için
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde yerel depolamadaki token'ı kontrol et
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/auth/me', config);

        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setError(error.response?.data?.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Kayıt olma
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);

      if (res.data.success) {
        // Eğer çiftçi kaydı ise, token'ı kaydetme ve kullanıcıyı ayarlama (onaya kadar)
        if (userData.role === 'farmer') {
          return true; // Başarılı kayıt ama giriş yok
        }
        
        // Normal müşteri kaydı için token ve kullanıcı ayarlaması
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        toast.success('Başarıyla kayıt oldunuz!');
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
      toast.error(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Giriş yapma
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });

      if (res.data.success) {
        // Eğer kullanıcı onaylanmamış bir çiftçi ise giriş engelle
        if (res.data.user.role === 'farmer' && !res.data.user.isApproved) {
          setError('Çiftçi hesabınız henüz onaylanmamıştır. Onay sürecinden sonra giriş yapabilirsiniz.');
          toast.warning('Çiftçi hesabınız henüz onaylanmamıştır.');
          localStorage.removeItem('token'); // Token'ı temizle
          setLoading(false);
          return false;
        }
        
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        toast.success('Giriş başarılı!');
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Giriş sırasında bir hata oluştu');
      toast.error(error.response?.data?.message || 'Giriş sırasında bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma
  const logout = async () => {
    try {
      // Önce localStorage'den token'ı temizle (en kritik kısım)
      localStorage.removeItem('token');
      setUser(null);
      
      // Sunucuya çıkış bildirimini gönder (başarısız olsa bile kullanıcı çıkış yapmış olacak)
      await axios.get('/api/auth/logout');
      toast.success('Başarıyla çıkış yaptınız');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu', error);
      // Hata olsa bile kullanıcıyı çıkış yapmış olarak kabul et
      toast.success('Çıkış yapıldı');
    }
  };

  // Şifre sıfırlama talebinde bulunma
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/forgot-password', { email });

      if (res.data.success) {
        toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Şifre sıfırlama talebinde bir hata oluştu');
      toast.error(error.response?.data?.message || 'Şifre sıfırlama talebinde bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (resetToken, password) => {
    try {
      setLoading(true);
      const res = await axios.put(`/api/auth/reset-password/${resetToken}`, { password });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        toast.success('Şifreniz başarıyla sıfırlandı ve giriş yaptınız!');
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Şifre sıfırlama sırasında bir hata oluştu');
      toast.error(error.response?.data?.message || 'Şifre sıfırlama sırasında bir hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Admin hesabı oluşturmak için geçici yardımcı fonksiyon (DEV ONLY)
  const createAdminUser = async (email, password) => {
    try {
      // 1. Normal kullanıcı olarak kaydol
      const registerRes = await axios.post('/api/auth/register', {
        firstName: 'Admin',
        lastName: 'User',
        email,
        password,
        phone: '5551234567'
      });

      // 2. Admin hesabı oluştur - bu endpoint normalde production'da bulunmamalı
      const { data } = await axios.post('/api/auth/make-admin', { 
        email,
        secretKey: 'dev_admin_secret_key' // Güvenlik için basit bir anahtar
      });

      return {
        success: true,
        message: 'Admin hesabı başarıyla oluşturuldu',
        data: data.data
      };
    } catch (error) {
      console.error('Admin oluşturma hatası:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Admin hesabı oluşturulamadı'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        createAdminUser,
        setUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 