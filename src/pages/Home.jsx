import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import ShipmentMap from '../components/ShipmentMap';
import { getRecentlyViewed } from '../utils/recentlyViewed';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
const START_SECS = 4 * 3600 + 12 * 60 + 50;

const CATEGORIES = [
  { name: 'Fashion', icon: '👗' }, { name: 'Electronics', icon: '📱' },
  { name: 'Home', icon: '🏠' }, { name: 'Beauty', icon: '💄' },
  { name: 'Footwear', icon: '👟' }, { name: 'Jewellery', icon: '💍' },
  { name: 'Bags', icon: '👜' }, { name: 'Kids', icon: '🧸' },
];

const TRUST = [
  { icon: '🚚', title: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: '↩️', title: 'Easy Returns', sub: '7-day return policy' },
  { icon: '🔒', title: 'Secure Payment', sub: '100% safe & encrypted' },
  { icon: '🏆', title: 'Best Prices', sub: 'Lowest price guarantee' },
];

// New feature announcements
const NEW_FEATURES = [
  { icon: '👛', title: 'Sheen Bazaar Wallet is here!', desc: 'Add money, pay instantly, send money to friends — all in your wallet', cta: 'Open Wallet', link: '/wallet', color: '#6B0F45' },
  { icon: '🎙️', title: 'NEW: Voice Search!', desc: 'Search products by speaking — English, हिंदी, اردو and more languages', cta: 'Try It — Tap the Mic', link: '/products', color: '#3A0CA3' },
  { icon: '📱', title: 'Recharge & Bills Coming Soon', desc: 'Mobile recharge, electricity, DTH, gas bills — pay everything from your wallet', cta: 'Explore Wallet', link: '/wallet', color: '#0A2885' },
  { icon: '💳', title: 'Pay Your Way', desc: 'UPI, Cards, Net Banking, Wallets, EMI & Cash on Delivery — all supported', cta: 'Shop Now', link: '/products', color: '#B5006E' },
];

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null, raf;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── FEEDBACK WALL ───
function FeedbackWall() {
  const [feedbacks, setFeedbacks] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/feedback`).then(r => r.json()).then(d => Array.isArray(d) && setFeedbacks(d)).catch(() => {});
  }, []);

  const demo = [
    { name: 'Priya S.', rating: 5, comment: 'Beautiful sarees and super fast delivery to Mumbai! Loved the packaging 💖', type: 'order', city: 'Mumbai' },
    { name: 'Aarif K.', rating: 5, comment: 'Wallet add-money worked instantly. Very smooth experience!', type: 'wallet', city: 'Srinagar' },
    { name: 'Rahul M.', rating: 4, comment: 'Good prices, genuine products. Will order again.', type: 'order', city: 'Delhi' },
  ];
  const show = feedbacks.length > 0 ? feedbacks : demo;

  return (
    <div className="container section">
      <div className="sec-title"><h2>💬 What Our Customers Say</h2></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {show.slice(0, 6).map((f, i) => (
          <div key={i} style={{ background:'#fff', border:'1.5px solid #F0E0EC', borderRadius:16, padding:20, position:'relative', animation:`fadeUp 0.5s ease both`, animationDelay:`${i*0.08}s` }}>
            <div style={{ position:'absolute', top:-10, left:20, background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', borderRadius:50, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800 }}>
              {f.name?.[0] || '😊'}
            </div>
            <div style={{ display:'flex', gap:2, marginBottom:8, marginTop:8 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ color:s<=f.rating?'#FFB300':'#E0E0E0', fontSize:15 }}>★</span>)}
            </div>
            <p style={{ fontSize:13.5, color:'#4A2040', lineHeight:1.6, margin:'0 0 10px' }}>"{f.comment}"</p>
            <div style={{ fontSize:12, color:'#8A7A87', fontWeight:600 }}>
              — {f.name}{f.city ? `, ${f.city}` : ''}
              <span style={{ marginLeft:8, background:'#FFE8F5', color:'#E91E8C', padding:'2px 8px', borderRadius:50, fontSize:10, fontWeight:700 }}>
                {f.type === 'wallet' ? '👛 Wallet' : f.type === 'recharge' ? '📱 Recharge' : '🛍️ Verified Buyer'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURE PROMO CAROUSEL ───
function FeaturePromos() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % NEW_FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);
  const f = NEW_FEATURES[active];
  return (
    <div className="container" style={{ marginBottom:32 }}>
      <div key={active} style={{ background:`linear-gradient(135deg,${f.color},#1A0A12)`, borderRadius:18, padding:'24px 28px', color:'#fff', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap', animation:'fadeUp 0.5s ease', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-20, top:-20, fontSize:120, opacity:0.08 }}>{f.icon}</div>
        <div style={{ fontSize:48, animation:'float 3s ease-in-out infinite' }}>{f.icon}</div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ background:'#E91E8C', display:'inline-block', padding:'3px 12px', borderRadius:50, fontSize:10, fontWeight:800, letterSpacing:1.5, marginBottom:6 }}>✨ NEW FEATURE</div>
          <h3 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:20, fontWeight:800, margin:'0 0 4px' }}>{f.title}</h3>
          <p style={{ fontSize:13.5, opacity:0.8, margin:0 }}>{f.desc}</p>
        </div>
        <Link to={f.link} style={{ background:'#fff', color:f.color, padding:'12px 24px', borderRadius:50, fontWeight:800, fontSize:14, textDecoration:'none', flexShrink:0 }}>{f.cta} →</Link>
        <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
          {NEW_FEATURES.map((_, i) => <div key={i} onClick={() => setActive(i)} style={{ width:i===active?20:7, height:7, borderRadius:50, background:i===active?'#E91E8C':'rgba(255,255,255,0.3)', cursor:'pointer', transition:'all 0.3s' }} />)}
        </div>
      </div>
    </div>
  );
}

function StatsStrip() {
  const customers = useCountUp(52000);
  const sellers = useCountUp(4800);
  const orders = useCountUp(310000);
  const cities = useCountUp(120);
  return (
    <div className="stats-strip">
      <div className="stat-item fade-up d1"><strong>{customers.toLocaleString()}+</strong><span>Happy Customers</span></div>
      <div className="stat-item fade-up d2"><strong>{sellers.toLocaleString()}+</strong><span>Trusted Sellers</span></div>
      <div className="stat-item fade-up d3"><strong>{orders.toLocaleString()}+</strong><span>Orders Delivered</span></div>
      <div className="stat-item fade-up d4"><strong>{cities}+</strong><span>Cities Served</span></div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [secs, setSecs] = useState(START_SECS);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    api.getProducts().then(list => {
      setProducts(list.slice(0, 10));
      setNewArrivals(list.slice(5, 10));
    });
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s > 0 ? s - 1 : START_SECS)), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-float-icons" aria-hidden="true">
          <span className="fi fi-1">👗</span><span className="fi fi-2">📱</span>
          <span className="fi fi-3">👟</span><span className="fi fi-4">🎁</span>
          <span className="fi fi-5">💄</span><span className="fi fi-6">⌚</span>
        </div>
        <div className="container">
          <div className="hero-text">
            <div className="tag fade-up d1">🎉 New User Offer</div>
            <h1 className="fade-up d2">Flat 50% off on<br />your first order</h1>
            <p className="fade-up d3">Discover thousands of deals across fashion, home essentials and electronics — refreshed daily, delivered to your doorstep.</p>
            <div className="fade-up d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn-primary">Start Shopping →</Link>
              <Link to="/wallet" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>👛 Open Wallet</Link>
            </div>
          </div>
          <div className="hero-visual fade-up d3">
            <span className="hero-visual-glow" />
            <span className="hero-visual-emoji">🛍️</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="container"><StatsStrip /></div>

      {/* NEW FEATURE PROMOS */}
      <FeaturePromos />

      {/* TRUST */}
      <div className="container">
        <div className="trust-strip">
          {TRUST.map(t => (
            <div key={t.title} className="trust-item">
              <div className="trust-icon">{t.icon}</div>
              <div><strong>{t.title}</strong><span>{t.sub}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="container">
        <div className="sec-title"><h2>Shop by Category</h2><Link to="/products">All categories →</Link></div>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <Link key={c.name} to={`/products?cat=${c.name}`} className="cat-card">
              <span className="cat-icon">{c.icon}</span><span>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FLASH SALE */}
      <div className="container flash-section">
        <div className="flash">
          <div className="ftxt">
            <strong className="pulse-badge">⚡ Flash Sale — up to 80% off</strong>
            <span>Limited time offer — grab it before it's gone!</span>
          </div>
          <div className="timer"><div>{hh}</div><div>{mm}</div><div>{ss}</div></div>
        </div>
      </div>

      {/* TRENDING */}
      <div className="container section">
        <div className="sec-title"><h2>🔥 Trending near you</h2><Link to="/products">See all →</Link></div>
        <div className="grid">
          {products.map((p, i) => (
            <div key={p.id} className="grid-fade-item" style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* ANIMATED SHIPMENT MAP — real India outline, rendered from live geographic data */}
      <div className="container" style={{ marginBottom: 40 }}>
        <ShipmentMap />
      </div>

      {/* SELLER CTA */}
      <div className="container">
        <div className="seller-cta">
          <div className="seller-cta-glow" aria-hidden="true" />
          <div className="seller-cta-icon">🏬</div>
          <div className="seller-cta-text">
            <h3>Have products to sell?</h3>
            <p>Join thousands of sellers & resellers growing their business on Sheen Bazaar — zero setup fee, instant approval.</p>
          </div>
          <Link to="/login?as=seller" className="btn-primary seller-cta-btn">Become a Seller →</Link>
        </div>
      </div>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <div className="container section">
          <div className="sec-title"><h2>✨ New Arrivals</h2><Link to="/products">See all →</Link></div>
          <div className="grid">
            {newArrivals.map((p, i) => (
              <div key={p.id} className="grid-fade-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <div className="container section">
          <div className="sec-title"><h2>🕒 Recently Viewed</h2></div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {recentlyViewed.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} style={{ background: '#fff', border: '1.5px solid #F0E0EC', borderRadius: 14, overflow: 'hidden', flex: '0 0 160px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'linear-gradient(135deg,#FFF0FA,#FFE8F5)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>{p.icon || '🛍️'}</span>}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#E91E8C' }}>₹{p.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOMER FEEDBACK WALL */}
      <FeedbackWall />
    </>
  );
}
