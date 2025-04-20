import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FarmerRegisterPage from './pages/FarmerRegisterPage';
import FarmerRegisterStep2Page from './pages/FarmerRegisterStep2Page';
import FarmerRegisterCompletePage from './pages/FarmerRegisterCompletePage';
import ProfilePage from './pages/ProfilePage';
import FarmProfileEditPage from './pages/FarmProfileEditPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFarmerRequestsPage from './pages/admin/AdminFarmerRequestsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <>
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/farmer-register" element={<FarmerRegisterPage />} />
            <Route path="/farmer-register-step2" element={<FarmerRegisterStep2Page />} />
            <Route path="/farmer-register-complete" element={<FarmerRegisterCompletePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/farm-profile-edit" element={
              <ProtectedRoute>
                <FarmProfileEditPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="/admin/farmer-requests" element={
              <AdminRoute>
                <AdminFarmerRequestsPage />
              </AdminRoute>
            } />
          </Routes>
        </Container>
      </main>
      <Footer />
    </>
  );
}

export default App; 