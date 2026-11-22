import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../constants';
import NotificationBell from './NotificationBell';
import LanguagePicker from './LanguagePicker';

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

  // ── Search suggestions ──
  const [suggest, setSuggest] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef();
  const recent = (() => { try { return JSON.parse(localStorage.getItem('sb_recent_searches') || '[]'); } catch { return []; } })();

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setSuggest(null); return; }
    const t = setTimeout(() => { api.suggest(q).then(setSuggest).catch(() => setSuggest(null)); }, 220);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    function close(e) { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function goSearch(term) {
    const q = String(term || '').trim();
    if (!q) return;
    try {
      const list = [q, ...recent.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      localStorage.setItem('sb_recent_searches', JSON.stringify(list));
    } catch { /* storage blocked */ }
    setSearch(q);
    setSuggestOpen(false);
    setMobileOpen(false);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    goSearch(search);
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

        .navbar {
          background: linear-gradient(180deg, #ffffff, #FFF9FC);
          border-bottom: 1px solid #F0E0EC;
          position: sticky; top: 0; z-index: 100;
          /* Layered shadow = soft ambient blur + a crisper contact shadow, so the
             whole bar reads as if it's gently raised off the page. */
          box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, 0 10px 24px -14px rgba(185,0,110,0.35), 0 2px 6px rgba(185,0,110,0.06);
        }
        .navbar-inner { display: flex; align-items: center; gap: 20px; padding: 14px 20px; max-width: 1200px; margin: 0 auto; }
        .brand a {
          font-family: 'Baloo 2', sans-serif; font-size: 26px; font-weight: 800;
          letter-spacing: -0.5px; white-space: nowrap;
          background: linear-gradient(135deg, #B5006E, #830050);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          filter: drop-shadow(0 1px 0 rgba(255,255,255,0.6));
        }
        .brand span { background: linear-gradient(135deg, #E91E8C, #FF5FB8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .nav-links { display: flex; gap: 4px; align-items: center; }
        .nav-links a { padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #4A2040; transition: all 0.2s; }
        .nav-links a:hover, .nav-links a.active { background: #FFE8F5; color: #B5006E; font-weight: 600; box-shadow: 0 2px 6px rgba(185,0,110,0.12); }

        /* Search bar: soft inset shadow gives it a "pressed into the surface"
           feel; focus lifts it back out with a glow, like a button being pulled up. */
        .navbar-search {
          flex: 1; max-width: 420px; min-width: 0; display: flex; align-items: center; gap: 8px;
          background: #FDF8FB; border: 1.5px solid #F5E5EF; border-radius: 50px; padding: 10px 16px;
          box-shadow: inset 0 2px 5px rgba(185,0,110,0.08), inset 0 -1px 0 rgba(255,255,255,0.8);
          transition: all 0.2s;
        }
        .navbar-search:focus-within {
          border-color: #E91E8C; background: #fff;
          box-shadow: 0 4px 14px rgba(233,30,140,0.22), 0 0 0 4px rgba(233,30,140,0.12);
          transform: translateY(-1px);
        }
        .navbar-search input { border: none; outline: none; flex: 1; min-width: 0; font-size: 14px; background: none; color: #1A0A12; font-family: 'Inter', sans-serif; }
        .navbar-search span { color: #8A6A7E; flex-shrink: 0; }
        .search-suggest {
          position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
          width: min(440px, 94vw); background: #fff; border: 1px solid #F3E6EC; border-radius: 16px;
          box-shadow: 0 16px 40px rgba(26,10,18,0.16); padding: 6px; z-index: 3000; max-height: 70vh; overflow-y: auto;
        }
        .search-suggest .ss-title { font-size: 11px; font-weight: 800; color: #8A7A87; text-transform: uppercase; letter-spacing: .5px; padding: 8px 10px 4px; }
        .search-suggest .ss-row {
          display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: none; border: none;
          padding: 9px 10px; border-radius: 10px; cursor: pointer; font-size: 13.5px; color: #1A0A12; font-family: 'Inter', sans-serif;
        }
        .search-suggest .ss-row:hover { background: #FFF0F7; }
        .search-suggest .ss-row span { color: inherit; }
        .search-suggest .ss-thumb { width: 36px; height: 36px; border-radius: 8px; background: #FFF0FA; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 18px; flex-shrink: 0; }
        .search-suggest .ss-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .search-suggest .ss-all { color: #B5006E; font-weight: 700; border-top: 1px solid #F3E6EC; border-radius: 0 0 10px 10px; margin-top: 4px; }

        .navbar-icons { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .navbar-icons > * { flex-shrink: 0; }

        /* Every TOP-LEVEL icon button (cart, wishlist, seller/reseller link,
           login pill) becomes a small raised circular "puck" — soft
           neumorphic shadow at rest, pressed-in on tap. Deliberately scoped
           to DIRECT children only (">") — NOT ".navbar-icons a" — because the
           profile dropdown's own links (My Profile, My Orders, Wishlist,
           Refer & Earn, Log Out) also live inside .navbar-icons, nested one
           level deeper inside the user-menu wrapper. A plain descendant
           selector was reaching into that dropdown too and squashing those
           menu rows into overlapping 42px circles — this is the fix. */
        .navbar-icons > a,
        .navbar-icons div[title="Notifications"],
        .navbar-user-trigger {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 42px; height: 42px; padding: 0 !important; margin: 0;
          border-radius: 50% !important;
          background: linear-gradient(150deg, #ffffff, #FBECF5) !important;
          box-shadow: 3px 3px 7px rgba(185,0,110,0.14), -3px -3px 7px rgba(255,255,255,0.9), 0 1px 2px rgba(185,0,110,0.08);
          font-size: 17px !important; font-weight: 600; color: #4A2040;
          transition: transform 0.15s, box-shadow 0.15s; cursor: pointer;
        }
        .navbar-icons > a:hover,
        .navbar-icons div[title="Notifications"]:hover,
        .navbar-user-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 4px 5px 10px rgba(185,0,110,0.18), -3px -3px 7px rgba(255,255,255,0.9);
          background: linear-gradient(150deg, #ffffff, #FFE3F1) !important;
        }
        .navbar-icons > a:active,
        .navbar-icons div[title="Notifications"]:active,
        .navbar-user-trigger:active {
          transform: translateY(0);
          box-shadow: inset 2px 2px 5px rgba(185,0,110,0.18), inset -2px -2px 5px rgba(255,255,255,0.7);
        }
        .navbar-user-trigger span:first-child { display: flex; }
        .navbar-user-name { font-size: 12px !important; }

        /* The profile dropdown menu itself — plain, roomy, non-overlapping rows. */
        .navbar-user-menu {
          position: absolute; right: 0; top: calc(100% + 10px);
          background: #fff; border: 1px solid #F0E0EC; border-radius: 16px;
          padding: 8px; min-width: 200px; z-index: 250;
          box-shadow: 0 14px 40px rgba(24,4,16,0.18), 0 2px 8px rgba(185,0,110,0.08);
        }
        .navbar-user-menu a, .navbar-user-menu > div {
          display: flex !important; align-items: center; gap: 8px;
          width: auto !important; height: auto !important; border-radius: 10px !important;
          padding: 10px 12px !important; margin: 0 !important;
          background: none !important; box-shadow: none !important;
          font-size: 13px !important; font-weight: 600; color: #2B1330;
          text-decoration: none; transition: background 0.15s;
        }
        .navbar-user-menu a:hover, .navbar-user-menu > div:hover { background: #FFF6F2 !important; }

        /* Login pill keeps its own pill shape/colour, overriding the circular default above. */
        .navbar-icons > a.login-pill {
          width: auto !important; height: auto !important; border-radius: 50px !important;
          padding: 9px 18px !important;
          background: linear-gradient(135deg, #FF4FA8, #B5006E) !important;
          box-shadow: 0 6px 14px rgba(185,0,110,0.35), inset 0 1px 0 rgba(255,255,255,0.3) !important;
          color: #fff !important; font-size: 13px !important; font-weight: 700 !important;
        }
        .navbar-icons > a.login-pill:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(185,0,110,0.4), inset 0 1px 0 rgba(255,255,255,0.3) !important; }

        .dot {
          position: absolute; top: -3px; right: -3px; background: linear-gradient(135deg,#FFC93C,#FFB300);
          color: #4A2040; border-radius: 50%; width: 19px; height: 19px; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; border: 2px solid #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        }

        .mobile-toggle { display: none; font-size: 22px; background: none; border: none; cursor: pointer; color: #1A0A12; padding: 8px; }

        .cat-nav {
          background: linear-gradient(90deg, #830050, #B5006E 45%, #E91E8C);
          overflow-x: auto; scrollbar-width: none; padding: 0 20px;
          box-shadow: inset 0 3px 8px rgba(0,0,0,0.12), inset 0 -1px 0 rgba(255,255,255,0.1);
        }
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-nav .container { display: flex; gap: 6px; padding: 10px 0; max-width: 1200px; margin: 0 auto; }
        .cat-nav a {
          white-space: nowrap; padding: 7px 16px; border-radius: 50px; font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.2s;
        }
        .cat-nav a:hover { background: rgba(255,255,255,0.22); color: #fff; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.15); }

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

          .navbar-icons { grid-column: 3 !important; gap: 5px !important; flex-shrink: 0 !important; }
          .navbar-icons > a,
          .navbar-icons div[title="Notifications"],
          .navbar-user-trigger {
            width: 34px !important; height: 34px !important; padding: 0 !important; font-size: 14px !important;
          }
          .navbar-icons > a[title="Wishlist"] { display: none !important; }
          .navbar-icons > a.login-pill { width: auto !important; height: auto !important; padding: 7px 12px !important; font-size: 11.5px !important; white-space: nowrap !important; }
          .navbar-user-name { display: none !important; }
          .navbar-user-trigger { font-size: 15px !important; gap: 0 !important; }
          .dot { width: 16px !important; height: 16px !important; font-size: 8.5px !important; }
          .navbar-user-menu { min-width: 180px !important; }
          .navbar-user-menu a, .navbar-user-menu > div { font-size: 12.5px !important; padding: 9px 10px !important; }

          .cat-nav { padding: 0 12px; }
          .cat-nav .container { padding: 8px 0; }
          .cat-nav a { padding: 6px 12px; font-size: 12px; }
        }

        @media (max-width: 380px) {
          .brand a { font-size: 13px !important; }
          .navbar-search { padding: 6px 10px !important; }
          .navbar-icons > a,
          .navbar-icons div[title="Notifications"],
          .navbar-user-trigger {
            width: 30px !important; height: 30px !important; font-size: 12.5px !important;
          }
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
            <Link to="/offers" onClick={() => setMobileOpen(false)}>🎁 Offers</Link>
            {mobileOpen && <button onClick={() => setMobileOpen(false)} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:28, cursor:'pointer' }}>×</button>}
          </nav>

          <form className="navbar-search" onSubmit={handleSearch} ref={searchRef} style={{ position: 'relative' }}>
            <span>🔍</span>
            <input type="text" placeholder={listening ? '🎙️ Listening...' : 'Search products...'} value={search}
              onChange={e => { setSearch(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={e => { if (e.key === 'Escape') setSuggestOpen(false); }}
              aria-label="Search products" autoComplete="off" />
            {suggestOpen && (search.trim().length >= 2 ? suggest && (suggest.products.length + suggest.categories.length + suggest.brands.length > 0) : recent.length > 0) && (
              <div className="search-suggest">
                {search.trim().length < 2 ? (
                  <>
                    <div className="ss-title">Recent searches</div>
                    {recent.map(r => <button type="button" key={r} className="ss-row" onClick={() => goSearch(r)}>🕘 {r}</button>)}
                  </>
                ) : (
                  <>
                    {suggest.products.map(p => (
                      <button type="button" key={p.id} className="ss-row" onClick={() => { setSuggestOpen(false); setSearch(''); navigate(`/products/${p.id}`); }}>
                        <span className="ss-thumb">{p.image ? <img src={p.image} alt="" /> : (p.icon || '🛍️')}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <strong style={{ color: '#B5006E', fontSize: 13 }}>₹{p.price}</strong>
                      </button>
                    ))}
                    {suggest.categories.map(c => (
                      <button type="button" key={`c-${c}`} className="ss-row" onClick={() => { setSuggestOpen(false); navigate(`/products?cat=${encodeURIComponent(c)}`); }}>📂 <span>in <strong>{c}</strong></span></button>
                    ))}
                    {suggest.brands.map(b => (
                      <button type="button" key={`b-${b}`} className="ss-row" onClick={() => goSearch(b)}>🏷️ <span>Brand: <strong>{b}</strong></span></button>
                    ))}
                    <button type="button" className="ss-row ss-all" onClick={() => goSearch(search)}>🔍 See all results for “{search.trim()}”</button>
                  </>
                )}
              </div>
            )}
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
            <LanguagePicker />
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
                  <div className="navbar-user-menu">
                    <div style={{ padding:'8px 12px', fontSize:11.5, color:'#8A7A87', borderBottom:'1px solid #EFE1E7', marginBottom:4, wordBreak:'break-all' }}>{user.email}</div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>👤 My Profile</Link>
                    <Link to="/orders" onClick={() => setShowUserMenu(false)}>📋 My Orders</Link>
                    <Link to="/wishlist" onClick={() => setShowUserMenu(false)}>🤍 Wishlist</Link>
                    <Link to="/spin" onClick={() => setShowUserMenu(false)}>🎡 Spin & Win</Link>
                    <Link to="/refer-earn" onClick={() => setShowUserMenu(false)}>🎁 Refer & Earn</Link>
                    {user.role === 'seller' && <Link to="/seller" onClick={() => setShowUserMenu(false)} style={{ color:'#8b5cf6' }}>📦 Seller Dashboard</Link>}
                    {user.role === 'reseller' && <Link to="/reseller" onClick={() => setShowUserMenu(false)} style={{ color:'#3b82f6' }}>📢 Reseller Dashboard</Link>}
                    <div onClick={handleLogout} style={{ borderTop:'1px solid #EFE1E7', marginTop:4, color:'#E91E8C', fontWeight:700 }}>🚪 Log Out</div>
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
                {cart.count > 0 && <span className="dot sb-pop" key={cart.count}>{cart.count}</span>}
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
