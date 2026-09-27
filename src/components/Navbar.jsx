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
      {/* Scoped, self-contained layout rules for this header — written with !important
          and a CSS Grid on mobile so search/icons/brand each get their own fixed track
          and can never overlap each other, no matter what global stylesheet is loaded. */}
      <style>{`
        .util-bar { background: #1A0A12; color: #D4A0C0; font-size: 12px; padding: 8px 0; }
        .util-bar .container { display: flex; justify-content: space-between; align-items: center; }
        .util-links { display: flex; gap: 20px; }
        .util-links a { color: #D4A0C0; transition: color 0.2s; }
        .util-links a:hover { color: #fff; }

        .navbar { background: #fff; border-bottom: 1px solid #F0E0EC; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 20px rgba(185,0,110,0.06); }
        .navbar-inner { display: flex; align-items: center; gap: 20px; padding: 14px 20px; max-width: 1200px; margin: 0 auto; }
        .brand a { font-family: 'Baloo 2', sans-serif; font-size: 26px; font-weight: 800; color: #B5006E; letter-spacing: -0.5px; white-space: nowrap; }
        .brand span { color: #E91E8C; }

        .nav-links { display: flex; gap: 4px; align-items: center; }
        .nav-links a { padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #4A2040; transition: all 0.2s; }
        .nav-links a:hover, .nav-links a.active { background: #FFE8F5; color: #B5006E; font-weight: 600; }

        .navbar-search { flex: 1; max-width: 420px; min-width: 0; display: flex; align-items: center; gap: 8px; background: #FDF8FB; border: 1.5px solid #F0E0EC; border-radius: 50px; padding: 10px 16px; transition: all 0.2s; }
        .navbar-search:focus-within { border-color: #E91E8C; background: #fff; box-shadow: 0 0 0 4px rgba(233,30,140,0.15); }
        .navbar-search input { border: none; outline: none; flex: 1; min-width: 0; font-size: 14px; background: none; color: #1A0A12; font-family: 'Inter', sans-serif; }
        .navbar-search span { color: #8A6A7E; flex-shrink: 0; }

        .navbar-icons { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .navbar-icons > * { flex-shrink: 0; }
        .navbar-icons a { position: relative; display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #4A2040; transition: all 0.2s; cursor: pointer; }
        .navbar-icons a:hover { background: #FFE8F5; color: #B5006E; }

        .dot { position: absolute; top: 4px; right: 4px; background: #E91E8C; color: #fff; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

        .mobile-toggle { display: none; font-size: 22px; background: none; border: none; cursor: pointer; color: #1A0A12; padding: 8px; }

        .cat-nav { background: linear-gradient(90deg, #B5006E, #E91E8C); overflow-x: auto; scrollbar-width: none; padding: 0 20px; }
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-nav .container { display: flex; gap: 4px; padding: 10px 0; max-width: 1200px; margin: 0 auto; }
        .cat-nav a { white-space: nowrap; padding: 7px 16px; border-radius: 50px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); transition: all 0.2s; }
        .cat-nav a:hover { background: rgba(255,255,255,0.2); color: #fff; }

        @media (max-width: 768px) {
          .util-bar { display: none !important; }

          /* Grid, not flex: brand / search / icons each own a track, so long content
             in one of them shrinks or scrolls instead of sliding over its neighbor. */
          .navbar-inner {
            display: grid !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 10px 12px !important;
            flex-wrap: nowrap !important;
          }
          .brand { min-width: 0; overflow: hidden; }
          .brand a { font-size: 15px !important; }

          .navbar-search { grid-column: 2 !important; order: 0 !important; max-width: none !important; width: 100% !important; min-width: 0 !important; padding: 7px 12px !important; gap: 6px !important; }
          .navbar-search input { font-size: 12.5px !important; min-width: 0 !important; }
          .navbar-search select { display: none !important; }

          .mobile-toggle { display: none !important; }
          .nav-links { display: none !important; }

          .navbar-icons { grid-column: 3 !important; gap: 0 !important; flex-shrink: 0 !important; }
          .navbar-icons a { padding: 6px 5px !important; font-size: 12px !important; }
          .navbar-icons a[title="Wishlist"] { display: none !important; }
          .login-pill { padding: 7px 10px !important; font-size: 11.5px !important; white-space: nowrap !important; }
          .navbar-user-name { display: none !important; }
          .navbar-user-trigger { padding: 6px !important; font-size: 17px !important; gap: 0 !important; }

          .cat-nav { padding: 0 12px; }
          .cat-nav .container { padding: 8px 0; }
          .cat-nav a { padding: 6px 12px; font-size: 12px; }
        }

        @media (max-width: 380px) {
          .brand a { font-size: 13px !important; }
          .navbar-search { padding: 6px 10px !important; }
          .navbar-icons a { padding: 5px 4px !important; font-size: 11px !important; }
        }

        @keyframes micPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.3) } }
      `}</style>

      <div className="util-bar">
        <div className="container">
          <span>🚚 Free delivery on orders above ₹499</span>
          <div className="util-links">
            <Link to="/orders">Track Order</Link>
            <Link to="/help">Help Center</Link>
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
            <input type="text" placeholder={listening ? '🎙️ Listening...' : 'Search products...'} value={search} onChange={e => setSearch(e.target.value)} />
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
            <span onClick={startVoiceSearch} style={{ cursor:'pointer', fontSize:18, animation: listening ? 'micPulse 1s infinite' : 'none', flexShrink: 0 }} title="Voice search">
              {listening ? '🔴' : '🎙️'}
            </span>
          </form>

          <div className="navbar-icons">
            {/* Seller dashboard */}
            {user?.role === 'seller' && (
              <Link to="/seller" style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>📦</Link>
            )}
            {/* Reseller dashboard */}
            {user?.role === 'reseller' && (
              <Link to="/reseller" style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>📢</Link>
            )}

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
              <Link to="/cart" title="Cart" style={{ position:'relative', fontSize:20 }}>
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
