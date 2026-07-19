import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../constants';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  }

  function handleLogout() {
    logout();
    setShowUserMenu(false);
    navigate('/');
  }

  return (
    <>
      <div className="util-bar">
        <div className="container">
          <span>🚚 Free delivery on orders above ₹499</span>
          <div className="util-links">
            <Link to="/orders">Track Order</Link>
            <a href="#">Help Center</a>
            <Link to="/login?as=seller">Sell on Sheen Bazaar</Link>
          </div>
        </div>
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand"><Link to="/">Sheen <span>Bazaar</span></Link></div>
          <nav className={`nav-links${mobileOpen ? ' mobile-open' : ''}`}>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/products">Shop</Link>
            <Link to="/products?cat=Fashion">Fashion</Link>
            <Link to="/products?cat=Electronics">Electronics</Link>
            <a href="#">Deals</a>
          </nav>
          <form className={`navbar-search${mobileOpen ? ' mobile-open' : ''}`} onSubmit={handleSearch}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search sarees, kurtis, gadgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="navbar-icons">
            {user?.role === 'seller' && (
              <Link to="/seller" title="Seller Dashboard" style={{ fontSize: 13, fontWeight: 700 }}>📦 Seller</Link>
            )}
            {user?.role === 'reseller' && (
              <Link to="/reseller" title="Reseller Dashboard" style={{ fontSize: 13, fontWeight: 700 }}>📢 Reseller</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" title="Admin Dashboard" style={{ fontSize: 13, fontWeight: 700 }}>🛠️ Admin</Link>
            )}
            {user ? (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}
                >
                  👤 {user.name.split(' ')[0]} ▾
                </div>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', right: 0, top: '130%', background: '#fff',
                    border: '1px solid #EFE1E7', borderRadius: 12, padding: 8,
                    minWidth: 160, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ padding: '6px 12px', fontSize: 12, color: '#8A7A87', borderBottom: '1px solid #EFE1E7', marginBottom: 4 }}>
                      {user.email}
                    </div>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#2B1330', textDecoration: 'none', borderRadius: 8 }}>
                        🛠️ Admin Dashboard
                      </Link>
                    )}
                    {user.role === 'seller' && (
                      <Link to="/seller" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#2B1330', textDecoration: 'none', borderRadius: 8 }}>
                        📦 Seller Dashboard
                      </Link>
                    )}
                    <Link to="/orders" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '8px 12px', fontSize: 13, color: '#2B1330', textDecoration: 'none', borderRadius: 8 }}>
                      📋 My Orders
                    </Link>
                    <div
                      onClick={handleLogout}
                      style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#D9276B', cursor: 'pointer', borderTop: '1px solid #EFE1E7', marginTop: 4, borderRadius: 8 }}
                    >
                      🚪 Log Out
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" title="Account">👤 Login</Link>
            )}
            {user?.role !== 'seller' && user?.role !== 'admin' && user?.role !== 'reseller' && (
              <Link to="/cart" title="Cart">🛒<span className="dot">{cart.count}</span></Link>
            )}
          </div>
          <button className="mobile-toggle" onClick={() => setMobileOpen((o) => !o)}>☰</button>
        </div>
      </header>

      <nav className="cat-nav">
        <div className="container">
          {categories.map((c) => (
            <Link key={c} to={`/products?cat=${encodeURIComponent(c)}`}>
              {CATEGORY_ICONS[c] || '🛍️'} {c}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
