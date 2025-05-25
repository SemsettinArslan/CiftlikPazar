import React, { useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const CompanyRoute = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isCompany, setIsCompany] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  
  useEffect(() => {
    // Wait for auth context to load
    if (!authLoading) {
      // Check if user is a company and is approved
      if (user) {
        setIsCompany(user.role === 'company');
        setIsApproved(user.approvalStatus === 'approved');
      }
      setLoading(false);
    }
  }, [user, authLoading]);
  
  if (loading || authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Yetki kontrol ediliyor...</span>
      </div>
    );
  }
  
  if (!user || !isCompany) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isApproved) {
    return (
      <div className="text-center py-5">
        <h3>Hesabınız Onay Bekliyor</h3>
        <p className="lead">
          Firma hesabınız henüz onaylanmamış. Hesabınız onaylandıktan sonra bu sayfaya erişebileceksiniz.
        </p>
        <p>
          Onay süreci genellikle 24-48 saat içerisinde tamamlanmaktadır. Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    );
  }
  
  return children;
};

export default CompanyRoute; 