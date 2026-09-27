import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Icons are plain inline SVGs — never emoji. Emoji glyphs (like 👤 for Account)
// are missing on several Android OEM fonts, which makes the browser render a
// solid "missing glyph" placeholder box instead of the icon.
function IconHome({ active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#E91E8C' : '#8A7A87'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5v-6h5v6H17.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
function IconShop({ active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#E91E8C' : '#8A7A87'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IconCart({ active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#E91E8C' : '#8A7A87'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.3" fill={active ? '#E91E8C' : '#8A7A87'} stroke="none" />
      <circle cx="18" cy="20" r="1.3" fill={active ? '#E91E8C' : '#8A7A87'} stroke="none" />
      <path d="M3.5 4h2l2 12h11l2-8H6.5" />
    </svg>
  );
}
function IconOrders({ active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#E91E8C' : '#8A7A87'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}
function IconAccount({ active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#E91E8C' : '#8A7A87'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.2-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

const NAV_ITEMS = [
  { path: '/', Icon: IconHome, label: 'Home' },
  { path: '/products', Icon: IconShop, label: 'Shop' },
  { path: '/cart', Icon: IconCart, label: 'Cart', badge: true },
  { path: '/orders', Icon: IconOrders, label: 'Orders' },
  { path: '/profile', Icon: IconAccount, label: 'Account' },
];

export default function BottomNav() {
  const location = useLocation();
  const { cart } = useCart();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('sb_install_dismissed')) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  }

  function dismissBanner() {
    setShowInstallBanner(false);
    localStorage.setItem('sb_install_dismissed', '1');
  }

  return (
    <>
      <style>{`
        .bottom-nav { display: none; }
        @media (max-width: 768px) {
          .bottom-nav {
            display: flex !important;
            position: fixed !important;
            bottom: 0 !important; left: 0 !important; right: 0 !important;
            background: rgba(255,255,255,0.96) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid #F0E0EC;
            /* Pushed far above any other fixed element on the page (chat
               buttons, WhatsApp FAB, compare bar, banners, etc). Two fixed
               elements with the SAME z-index are stacked by DOM order, so if
               something else on the page also uses z-index:999 and is added
               to the page after this nav, it used to win and sit on top of
               it — that's what was painting the black box over Account. A
               z-index this high can no longer be tied by anything reasonable. */
            z-index: 2147483000 !important;
            padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
            box-shadow: 0 -4px 24px rgba(185,0,110,0.08);
            isolation: isolate;
            overflow: hidden;
          }
          body { padding-bottom: 70px; }
          .whatsapp-fab { bottom: 84px !important; }
        }
        .bn-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 6px 0; text-decoration: none; position: relative;
          transition: transform 0.15s;
          background: transparent !important;
          z-index: 1;
        }
        .bn-item:active { transform: scale(0.9); }
        .bn-icon {
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          /* Deliberately NO background/pill here — active state is shown purely
             by icon + label color, never by a background box, so a background
             box can never render (in any color) behind a nav icon. */
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .bn-label { font-size: 10px; font-weight: 700; color: #8A7A87; transition: color 0.2s; }
        .bn-item.active .bn-label { color: #E91E8C; }
        .bn-badge {
          position: absolute; top: 0; right: 8px;
          background: #E91E8C; color: #fff; font-size: 9px; font-weight: 800;
          min-width: 16px; height: 16px; border-radius: 50px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
        }
        @keyframes bannerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {showInstallBanner && !isStandalone && (
        <div style={{
          position:'fixed', bottom:76, left:12, right:12, zIndex:1000,
          background:'linear-gradient(135deg,#1A0A12,#6B0F45)', borderRadius:18,
          padding:'16px 18px', color:'#fff', display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 8px 40px rgba(0,0,0,0.35)', animation:'bannerUp 0.4s ease',
        }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#E91E8C,#B5006E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🛍️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14 }}>Install Sheen Bazaar App</div>
            <div style={{ fontSize:11.5, opacity:0.75 }}>Shop faster · One-tap access</div>
          </div>
          <button onClick={installApp} style={{ background:'#E91E8C', color:'#fff', border:'none', borderRadius:50, padding:'10px 18px', fontWeight:800, fontSize:13, cursor:'pointer', flexShrink:0 }}>Install</button>
          <button onClick={dismissBanner} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:20, cursor:'pointer', padding:0 }}>×</button>
        </div>
      )}

      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const { Icon } = item;
          return (
            <Link key={item.path} to={item.path} className={`bn-item${active ? ' active' : ''}`}>
              <div className="bn-icon">
                <Icon active={active} />
                {item.badge && cart.count > 0 && <span className="bn-badge">{cart.count}</span>}
              </div>
              <span className="bn-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
