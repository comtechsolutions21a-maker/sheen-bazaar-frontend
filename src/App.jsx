import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import WhatsAppButton from './components/WhatsAppButton';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import SellerDashboard from './pages/SellerDashboard';
import ResellerDashboard from './pages/ResellerDashboard';
import ResellerStorefront from './pages/ResellerStorefront';
import AdminDashboard from './pages/AdminDashboard';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import BottomNav from './components/BottomNav';

// SECRET ADMIN URL — not linked anywhere on the site
// Access at: /comtech-admin-2026
const ADMIN_SECRET_PATH = '/comtech-admin-2026';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/reseller" element={<ProtectedRoute roles={['reseller']}><ResellerDashboard /></ProtectedRoute>} />
        <Route path="/r/:resellerId" element={<ResellerStorefront />} />
        {/* SECRET ADMIN URL — not visible anywhere on the site */}
        <Route path={ADMIN_SECRET_PATH} element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        {/* Old /admin still works for backward compat but we won't link it */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Routes>
      <Toast />
      <Footer />
      <WhatsAppButton />
      <BottomNav />
    </>
  );
}
