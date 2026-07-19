import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

const START_SECS = 4 * 3600 + 12 * 60 + 50;

const CATEGORIES = [
  { name: 'Fashion', icon: '👗' },
  { name: 'Electronics', icon: '📱' },
  { name: 'Home', icon: '🏠' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Footwear', icon: '👟' },
  { name: 'Jewellery', icon: '💍' },
  { name: 'Bags', icon: '👜' },
  { name: 'Kids', icon: '🧸' },
];

const TRUST = [
  { icon: '🚚', title: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: '↩️', title: 'Easy Returns', sub: '7-day return policy' },
  { icon: '🔒', title: 'Secure Payment', sub: '100% safe & encrypted' },
  { icon: '🏆', title: 'Best Prices', sub: 'Lowest price guarantee' },
];

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatsStrip() {
  const customers = useCountUp(52000);
  const sellers = useCountUp(4800);
  const orders = useCountUp(310000);
  const cities = useCountUp(120);
  return (
    <div className="stats-strip">
      <div className="stat-item fade-up d1">
        <strong>{customers.toLocaleString()}+</strong>
        <span>Happy Customers</span>
      </div>
      <div className="stat-item fade-up d2">
        <strong>{sellers.toLocaleString()}+</strong>
        <span>Trusted Sellers</span>
      </div>
      <div className="stat-item fade-up d3">
        <strong>{orders.toLocaleString()}+</strong>
        <span>Orders Delivered</span>
      </div>
      <div className="stat-item fade-up d4">
        <strong>{cities}+</strong>
        <span>Cities Served</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [secs, setSecs] = useState(START_SECS);

  useEffect(() => {
    api.getProducts().then((list) => {
      setProducts(list.slice(0, 10));
      setNewArrivals(list.slice(5, 10));
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : START_SECS)), 1000);
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
          <span className="fi fi-1">👗</span>
          <span className="fi fi-2">📱</span>
          <span className="fi fi-3">👟</span>
          <span className="fi fi-4">🎁</span>
          <span className="fi fi-5">💄</span>
          <span className="fi fi-6">⌚</span>
        </div>
        <div className="container">
          <div className="hero-text">
            <div className="tag fade-up d1">🎉 New User Offer</div>
            <h1 className="fade-up d2">Flat 50% off on<br />your first order</h1>
            <p className="fade-up d3">
              Discover thousands of deals across fashion, home essentials and electronics —
              refreshed daily, delivered to your doorstep.
            </p>
            <div className="fade-up d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn-primary">Start Shopping →</Link>
              <Link to="/login?as=seller" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Become a Seller</Link>
            </div>
          </div>
          <div className="hero-visual fade-up d3">
            <span className="hero-visual-glow" />
            <span className="hero-visual-emoji">🛍️</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="container">
        <StatsStrip />
      </div>

      {/* TRUST BADGES */}
      <div className="container">
        <div className="trust-strip">
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <div className="trust-icon">{t.icon}</div>
              <div>
                <strong>{t.title}</strong>
                <span>{t.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="container">
        <div className="sec-title">
          <h2>Shop by Category</h2>
          <Link to="/products">All categories →</Link>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} to={`/products?cat=${c.name}`} className="cat-card">
              <span className="cat-icon">{c.icon}</span>
              <span>{c.name}</span>
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
          <div className="timer">
            <div>{hh}</div>
            <div>{mm}</div>
            <div>{ss}</div>
          </div>
        </div>
      </div>

      {/* TRENDING */}
      <div className="container section">
        <div className="sec-title">
          <h2>🔥 Trending near you</h2>
          <Link to="/products">See all →</Link>
        </div>
        <div className="grid">
          {products.map((p, i) => (
            <div key={p.id} className="grid-fade-item" style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
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
          <div className="sec-title">
            <h2>✨ New Arrivals</h2>
            <Link to="/products">See all →</Link>
          </div>
          <div className="grid">
            {newArrivals.map((p, i) => (
              <div key={p.id} className="grid-fade-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
