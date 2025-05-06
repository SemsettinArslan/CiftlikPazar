import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // Yükleme sırasında boş bir ekran göster veya loading spinner
  if (loading) {
    return <div className="text-center py-5">Yükleniyor...</div>;
  }

  // Admin değilse ana sayfaya yönlendir
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // Admin ise çocuk bileşenleri göster
  return children;
};

export default AdminRoute; 