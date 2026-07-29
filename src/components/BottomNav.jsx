import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', activeIcon: '🏠', label: 'Home' },
  { path: '/products', icon: '🛍️', activeIcon: '🛍️', label: 'Shop' },
  { path: '/wallet', icon: '👛', activeIcon: '👛', label: 'Wallet' },
  { path: '/orders', icon: '📋', activeIcon: '📋', label: 'Orders' },
  { path: '/profile', icon: '👤', activeIcon: '👤', label: 'Account' },
];

export default function BottomNav() {
  const location = useLocation();
  const { cart } = useCart();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed as app
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);

    // Catch install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner if not dismissed before
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
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid #F0E0EC;
            z-index: 999;
            padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
            box-shadow: 0 -4px 24px rgba(185,0,110,0.08);
          }
          body { padding-bottom: 70px; }
          .whatsapp-fab { bottom: 84px !important; }
        }
        .bn-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 6px 0; text-decoration: none; position: relative;
          transition: transform 0.15s;
        }
        .bn-item:active { transform: scale(0.9); }
        .bn-icon {
          font-size: 22px; width: 44px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50px; transition: all 0.25s;
        }
        .bn-item.active .bn-icon { background: linear-gradient(135deg,#FFE8F5,#FFD6F0); transform: translateY(-2px); }
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

      {/* Install App Banner */}
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
            <div style={{ fontSize:11.5, opacity:0.75 }}>Shop faster · Wallet · One-tap access</div>
          </div>
          <button onClick={installApp} style={{ background:'#E91E8C', color:'#fff', border:'none', borderRadius:50, padding:'10px 18px', fontWeight:800, fontSize:13, cursor:'pointer', flexShrink:0 }}>Install</button>
          <button onClick={dismissBanner} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:20, cursor:'pointer', padding:0 }}>×</button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} className={`bn-item${active ? ' active' : ''}`}>
              <div className="bn-icon">
                {item.icon}
                {item.path === '/products' && cart.count > 0 && <span className="bn-badge">{cart.count}</span>}
              </div>
              <span className="bn-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
