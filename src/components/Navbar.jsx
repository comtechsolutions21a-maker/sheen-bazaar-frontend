import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../constants';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setMobileOpen(false); }
  }

  function startVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice search not supported in this browser. Try Chrome!'); return; }
    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSearch(text);
      setListening(false);
      navigate(`/products?search=${encodeURIComponent(text)}`);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function handleLogout() { logout(); setShowUserMenu(false); navigate('/'); }

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
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/products" onClick={() => setMobileOpen(false)}>Shop</Link>
            <Link to="/products?cat=Fashion" onClick={() => setMobileOpen(false)}>Fashion</Link>
            <Link to="/products?cat=Electronics" onClick={() => setMobileOpen(false)}>Electronics</Link>
            <a href="#">Deals</a>
            {mobileOpen && <button onClick={() => setMobileOpen(false)} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:28, cursor:'pointer' }}>×</button>}
          </nav>

          <form className="navbar-search" onSubmit={handleSearch}>
            <span>🔍</span>
            <input type="text" placeholder={listening ? '🎙️ Listening... speak now!' : 'Search or tap mic to speak...'} value={search} onChange={e => setSearch(e.target.value)} />
            <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)} onClick={e => e.stopPropagation()} style={{ border:'none', background:'none', fontSize:11, color:'#8A7A87', cursor:'pointer', outline:'none', fontWeight:700 }}>
              <option value="en-IN">EN</option>
              <option value="hi-IN">हि</option>
              <option value="ur-IN">اردو</option>
              <option value="pa-IN">ਪੰ</option>
              <option value="bn-IN">বাং</option>
              <option value="ta-IN">த</option>
              <option value="te-IN">తె</option>
              <option value="mr-IN">म</option>
              <option value="gu-IN">ગુ</option>
              <option value="kn-IN">ಕ</option>
            </select>
            <span onClick={startVoiceSearch} style={{ cursor:'pointer', fontSize:18, animation: listening ? 'micPulse 1s infinite' : 'none' }} title="Voice search">
              {listening ? '🔴' : '🎙️'}
            </span>
            <style>{`@keyframes micPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.3) } }`}</style>
          </form>

          <div className="navbar-icons">
            {/* Seller dashboard */}
            {user?.role === 'seller' && (
              <Link to="/seller" style={{ fontSize:13, fontWeight:700 }}>📦 Seller</Link>
            )}
            {/* Reseller dashboard */}
            {user?.role === 'reseller' && (
              <Link to="/reseller" style={{ fontSize:13, fontWeight:700 }}>📢 Reseller</Link>
            )}
            {/* NOTE: Admin link is intentionally REMOVED from navbar */}
            {/* Admin can access dashboard at the secret URL only */}

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" title="Wishlist" style={{ fontSize:20 }}>🤍</Link>
            )}

            {/* User menu */}
            {user ? (
              <div style={{ position:'relative' }} ref={menuRef}>
                <div onClick={() => setShowUserMenu(!showUserMenu)} className="navbar-user-trigger" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13, padding:'8px 10px', borderRadius:10 }}>
                  <span>👤</span> <span className="navbar-user-name">{user.name.split(' ')[0]} ▾</span>
                </div>
                {showUserMenu && (
                  <div style={{ position:'absolute', right:0, top:'130%', background:'#fff', border:'1px solid #EFE1E7', borderRadius:12, padding:8, minWidth:180, zIndex:200, boxShadow:'0 8px 30px rgba(0,0,0,0.12)' }}>
                    <div style={{ padding:'8px 12px', fontSize:12, color:'#8A7A87', borderBottom:'1px solid #EFE1E7', marginBottom:4 }}>{user.email}</div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#2B1330', textDecoration:'none', borderRadius:8 }}>👤 My Profile</Link>
                    <Link to="/orders" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#2B1330', textDecoration:'none', borderRadius:8 }}>📋 My Orders</Link>
                    <Link to="/wishlist" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#2B1330', textDecoration:'none', borderRadius:8 }}>🤍 Wishlist</Link>
                    <Link to="/wallet" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#2B1330', textDecoration:'none', borderRadius:8 }}>👛 My Wallet</Link>
                    <Link to="/refer-earn" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#2B1330', textDecoration:'none', borderRadius:8 }}>🎁 Refer & Earn</Link>
                    {user.role === 'seller' && <Link to="/seller" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#8b5cf6', textDecoration:'none', borderRadius:8 }}>📦 Seller Dashboard</Link>}
                    {user.role === 'reseller' && <Link to="/reseller" onClick={() => setShowUserMenu(false)} style={{ display:'block', padding:'9px 12px', fontSize:13, fontWeight:600, color:'#3b82f6', textDecoration:'none', borderRadius:8 }}>📢 Reseller Dashboard</Link>}
                    <div onClick={handleLogout} style={{ padding:'9px 12px', fontSize:13, fontWeight:700, color:'#E91E8C', cursor:'pointer', borderTop:'1px solid #EFE1E7', marginTop:4, borderRadius:8 }}>🚪 Log Out</div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-pill" style={{ fontSize:13, fontWeight:700, background:'#E91E8C', color:'#fff', padding:'8px 16px', borderRadius:50, whiteSpace:'nowrap', flexShrink:0 }}>Login / Sign Up</Link>
            )}

            {/* Cart — hide for sellers/admin/resellers */}
            {user?.role !== 'seller' && user?.role !== 'reseller' && (
              <Link to="/cart" title="Cart" style={{ position:'relative', fontSize:22 }}>
                🛒
                {cart.count > 0 && <span className="dot">{cart.count}</span>}
              </Link>
            )}
          </div>

          <button className="mobile-toggle" onClick={() => setMobileOpen(o => !o)}>☰</button>
        </div>
      </header>

      <nav className="cat-nav">
        <div className="container">
          {categories.map(c => (
            <Link key={c} to={`/products?cat=${encodeURIComponent(c)}`} onClick={() => setMobileOpen(false)}>
              {CATEGORY_ICONS[c] || '🛍️'} {c}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
