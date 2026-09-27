import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Icons are plain inline SVGs — never emoji. Emoji glyphs are missing on
// several Android OEM fonts, which renders a "missing glyph" black box
// instead of the icon. `filled` swaps to a solid version for the active tab.
function IconHome({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 3.2 2.5 11h2.3v9.3h5.4v-6.1h3.6v6.1h5.4V11h2.3L12 3.2Z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8A7A87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5v-6h5v6H17.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
function IconShop({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M8.5 2A3.5 3.5 0 0 0 5 5.5V7H4a1 1 0 0 0-1 1l1.1 12.1a2 2 0 0 0 2 1.9h11.8a2 2 0 0 0 2-1.9L21 8a1 1 0 0 0-1-1h-1V5.5A3.5 3.5 0 0 0 15.5 2h-7Zm0 2h7A1.5 1.5 0 0 1 17 5.5V7H7V5.5A1.5 1.5 0 0 1 8.5 4ZM7 10a1 1 0 1 1 2 0 3 3 0 0 0 6 0 1 1 0 1 1 2 0 5 5 0 0 1-10 0Z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8A7A87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IconCart({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <circle cx="9" cy="20.5" r="1.5" />
      <circle cx="18" cy="20.5" r="1.5" />
      <path d="M2.5 3h2.3l.7 3H21a1 1 0 0 1 1 1.2l-1.7 8A2 2 0 0 1 18.3 17H8.1a2 2 0 0 1-2-1.6L3.4 4.8 2.5 4a1 1 0 0 1 0-1Z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8A7A87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.3" fill="#8A7A87" stroke="none" />
      <circle cx="18" cy="20" r="1.3" fill="#8A7A87" stroke="none" />
      <path d="M3.5 4h2l2 12h11l2-8H6.5" />
    </svg>
  );
}
function IconOrders({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M8 2.5A1.5 1.5 0 0 0 6.5 4v.5H6A2.5 2.5 0 0 0 3.5 7v13A2.5 2.5 0 0 0 6 22.5h12a2.5 2.5 0 0 0 2.5-2.5V7A2.5 2.5 0 0 0 18 4.5h-.5V4A1.5 1.5 0 0 0 16 2.5H8Zm0 2h8v1H8v-1ZM7 11h10v1.6H7V11Zm0 4h10v1.6H7V15Zm0 4h6v1.6H7V19Z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8A7A87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}
function IconAccount({ filled }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5c0-4.14 3.58-7.5 8-7.5s8 3.36 8 7.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8A7A87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        .bottom-nav-wrap { display: none; }
        @media (max-width: 768px) {
          .bottom-nav-wrap {
            display: block !important;
            position: fixed !important;
            left: 0 !important; right: 0 !important; bottom: 0 !important;
            z-index: 2147483000 !important;
            padding: 0 10px calc(10px + env(safe-area-inset-bottom));
            pointer-events: none;
          }
          body { padding-bottom: 82px; }
          .whatsapp-fab { bottom: 96px !important; }

          .bottom-nav {
            pointer-events: auto;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            background: #fff;
            border-radius: 26px;
            padding: 8px 6px;
            box-shadow: 0 -6px 10px rgba(185,0,110,0.04), 0 10px 30px rgba(24,4,16,0.18), 0 2px 0 rgba(255,255,255,0.6) inset;
            border: 1px solid rgba(240,224,236,0.8);
            isolation: isolate;
            overflow: visible;
          }
        }

        .bn-item {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          gap: 3px; padding: 8px 0 6px; text-decoration: none; position: relative;
          background: transparent !important; border: none;
          -webkit-tap-highlight-color: transparent;
        }
        .bn-item:active .bn-icon-wrap { transform: scale(0.88); }

        .bn-icon-wrap {
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1);
        }

        /* Active tab: icon lifts into a raised gradient "bubble" that pops
           above the bar for a modern, 3D floating look. */
        .bn-item.active .bn-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: linear-gradient(150deg, #FF4FA8, #B5006E);
          transform: translateY(-16px);
          box-shadow:
            0 10px 18px rgba(185,0,110,0.4),
            0 3px 6px rgba(185,0,110,0.3),
            inset 0 2px 3px rgba(255,255,255,0.35),
            inset 0 -3px 5px rgba(0,0,0,0.15);
          animation: bnPop 0.32s cubic-bezier(.34,1.56,.64,1);
        }
        .bn-item.active:active .bn-icon-wrap { transform: translateY(-16px) scale(0.92); }

        @keyframes bnPop {
          0% { transform: translateY(0) scale(0.7); }
          60% { transform: translateY(-19px) scale(1.08); }
          100% { transform: translateY(-16px) scale(1); }
        }

        .bn-label {
          font-size: 10.5px; font-weight: 700; color: #8A7A87;
          transition: color 0.2s, opacity 0.2s, transform 0.2s;
        }
        .bn-item.active .bn-label { color: #B5006E; transform: translateY(-14px); }

        .bn-badge {
          position: absolute; top: -2px; right: 4px;
          background: #FFB300; color: #fff; font-size: 9px; font-weight: 800;
          min-width: 16px; height: 16px; border-radius: 50px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 2;
        }
        .bn-item.active .bn-badge { top: -16px; right: 2px; }

        @keyframes bannerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {showInstallBanner && !isStandalone && (
        <div style={{
          position:'fixed', bottom:96, left:12, right:12, zIndex:2147483000,
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

      <div className="bottom-nav-wrap">
        <nav className="bottom-nav">
          {NAV_ITEMS.map(item => {
            const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            const { Icon } = item;
            return (
              <Link key={item.path} to={item.path} className={`bn-item${active ? ' active' : ''}`}>
                <div className="bn-icon-wrap">
                  <Icon filled={active} />
                  {item.badge && cart.count > 0 && <span className="bn-badge">{cart.count}</span>}
                </div>
                <span className="bn-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
