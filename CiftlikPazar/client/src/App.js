import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Context
import { CartProvider } from './context/CartContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FarmerRegisterPage from './pages/FarmerRegisterPage';
import FarmerRegisterStep2Page from './pages/FarmerRegisterStep2Page';
import FarmerRegisterCompletePage from './pages/FarmerRegisterCompletePage';
import CompanyRegisterPage from './pages/CompanyRegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFarmerRequestsPage from './pages/admin/AdminFarmerRequestsPage';
import AdminCompanyRequestsPage from './pages/admin/AdminCompanyRequestsPage';
import ProductsPage from './pages/ProductsPage';
import ProductPage from './pages/ProductPage';
import FarmerDashboardPage from './pages/farmer/FarmerDashboardPage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import AboutPage from './pages/AboutPage';
import ProducersPage from './pages/ProducersPage';
import ProducerDetailPage from './pages/ProducerDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ContactPage from './pages/ContactPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import FarmerRoute from './components/FarmerRoute';
import CompanyRoute from './components/CompanyRoute';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import AllRequestsPage from './pages/requests/AllRequestsPage';

function App() {
  return (
    <CartProvider>
      <Header />
      <main className="py-3">
        <Container fluid>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/farmer-register" element={<FarmerRegisterPage />} />
            <Route path="/farmer-register-step2" element={<FarmerRegisterStep2Page />} />
            <Route path="/farmer-register-complete" element={<FarmerRegisterCompletePage />} />
            <Route path="/company-register" element={<CompanyRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/producers" element={<ProducersPage />} />
            <Route path="/producer/:id" element={<ProducerDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Requests Routes */}
            <Route path="/requests" element={
              <ProtectedRoute>
                <AllRequestsPage />
              </ProtectedRoute>
            } />
            <Route path="/requests/:id" element={
              <ProtectedRoute>
                <RequestDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/order/:id" element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Farmer Routes */}
            <Route path="/farmer/dashboard" element={
              <FarmerRoute>
                <FarmerDashboardPage />
              </FarmerRoute>
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
            <Route path="/admin/company-requests" element={
              <AdminRoute>
                <AdminCompanyRequestsPage />
              </AdminRoute>
            } />

            {/* Company Routes */}
            <Route path="/company/dashboard" element={
              <CompanyRoute>
                <CompanyDashboardPage />
              </CompanyRoute>
            } />
          </Routes>
        </Container>
      </main>
      <Footer />
    </CartProvider>
  );
}

export default App; 