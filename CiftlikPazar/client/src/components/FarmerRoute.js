import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FarmerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Kullanıcı bilgileri yükleniyorsa, bir şey gösterme
  if (loading) {
    return <div className="text-center py-5">Yükleniyor...</div>;
  }

  // Kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı çiftçi değilse, ana sayfaya yönlendir
  if (user.role !== 'farmer') {
    return <Navigate to="/" replace />;
  }

  // Kullanıcı çiftçi ise, korunan içeriği göster
  return children;
};

export default FarmerRoute; 