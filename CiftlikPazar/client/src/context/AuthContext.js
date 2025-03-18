import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

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
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 