import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

const ALL_CATS = [
  { name: 'All', icon: '🛍️' },
  { name: 'Fashion', icon: '👗' },
  { name: 'Electronics', icon: '📱' },
  { name: 'Home', icon: '🏠' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Kids', icon: '🧸' },
  { name: 'Jewellery', icon: '💍' },
  { name: 'Footwear', icon: '👟' },
  { name: 'Bags', icon: '👜' },
];

const PRICE_FILTERS = [
  { key: 'all', label: 'All Prices' },
  { key: 'under300', label: 'Under ₹300' },
  { key: '300-600', label: '₹300 – ₹600' },
  { key: '600plus', label: '₹600 & above' },
];

function ProductCard({ p }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [status, setStatus] = useState('idle'); // idle | adding | added
  const discount = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;

  async function handleAddToCart(e) {
    e.stopPropagation();
    if (status === 'adding') return;
    setStatus('adding');
    const ok = await addToCart(p.id, 1);
    if (ok) {
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1400);
    } else {
      // addToCart already shows a "please log in" toast when this happens
      setStatus('idle');
    }
  }

  return (
    <div
      onClick={() => navigate(`/products/${p.id}`)}
      style={{
        background: '#fff', border: '1.5px solid #F0E0EC', borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(185,0,110,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#FFF0FA,#FFE0F0)', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.image ? (
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 56 }}>{p.icon || '🛍️'}</span>
        )}
        {discount > 0 && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#FF1744,#FF6B6B)', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 50 }}>
            {discount}% OFF
          </span>
        )}
      </div>
      <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1A0A12', lineHeight: 1.35, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>
          {p.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#B5006E', fontFamily: 'Baloo 2, sans-serif' }}>₹{p.price}</span>
          {p.old > p.price && <span style={{ fontSize: 11.5, color: '#B0A0AC', textDecoration: 'line-through' }}>₹{p.old}</span>}
        </div>
        {p.rating > 0 && (
          <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 8 }}>
            ⭐ {p.rating} <span style={{ color: '#B0A0AC', fontWeight: 400 }}>({p.reviewCount || 0})</span>
          </div>
        )}
        <button
          onClick={handleAddToCart}
          disabled={status === 'adding'}
          style={{
            marginTop: 'auto', border: 'none', borderRadius: 10, padding: '9px 0',
            fontSize: 12, fontWeight: 800, cursor: status === 'adding' ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            background: status === 'added' ? '#22c55e' : 'linear-gradient(135deg,#E91E8C,#B5006E)',
            color: '#fff', opacity: status === 'adding' ? 0.7 : 1, transition: 'background 0.2s',
          }}
        >
          {status === 'adding' ? '…' : status === 'added' ? '✅ Added' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const activeCat = params.get('cat') || 'All';
  const searchTerm = params.get('search') || '';
  const dealsOnly = params.get('deals') === '1';

  const [activePrice, setActivePrice] = useState('all');
  const [sortMode, setSortMode] = useState(params.get('sort') || 'default');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBox, setSearchBox] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (activeCat !== 'All') query.set('cat', activeCat);
    if (searchBox) query.set('search', searchBox);
    if (sortMode !== 'default') query.set('sort', sortMode);
    if (activePrice === 'under300') query.set('maxPrice', '299');
    if (activePrice === '300-600') { query.set('minPrice', '300'); query.set('maxPrice', '600'); }
    if (activePrice === '600plus') query.set('minPrice', '601');

    fetch(`${BASE}/products?${query.toString()}`)
      .then(r => r.json())
      .then(list => {
        const arr = Array.isArray(list) ? list : [];
        setProducts(dealsOnly ? arr.filter(p => p.old > p.price) : arr);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCat, searchBox, sortMode, activePrice, dealsOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setSearchBox(searchTerm); }, [searchTerm]);

  function selectCat(name) {
    const next = new URLSearchParams(params);
    if (name === 'All') next.delete('cat'); else next.set('cat', name);
    next.delete('deals');
    setParams(next);
    setShowFilters(false);
  }

  function cycleSort() {
    setSortMode(m => (m === 'default' ? 'price-low' : m === 'price-low' ? 'price-high' : 'default'));
  }
  const sortLabel =
    sortMode === 'price-low' ? 'Price: Low → High' :
    sortMode === 'price-high' ? 'Price: High → Low' : 'Sort: Default';

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #EFE1E7', fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '60vh' }}>
      {/* Header banner */}
      <div style={{
        background: dealsOnly ? 'linear-gradient(135deg,#1A0A12,#6B0F45)' : 'linear-gradient(135deg,#FFF0FA,#FFE8F5)',
        padding: '20px 16px', marginBottom: 4,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: dealsOnly ? 'rgba(255,255,255,0.6)' : '#B0899E', marginBottom: 6 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / <span style={{ fontWeight: 700, color: dealsOnly ? '#fff' : '#B5006E' }}>{dealsOnly ? 'Deals' : activeCat}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{dealsOnly ? '🔥' : (ALL_CATS.find(c => c.name === activeCat)?.icon || '🛍️')}</span>
            <div>
              <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800, margin: 0, color: dealsOnly ? '#fff' : '#1A0A12' }}>
                {dealsOnly ? "Today's Deals" : activeCat === 'All' ? 'All Products' : activeCat}
              </h1>
              <p style={{ fontSize: 12, margin: '2px 0 0', color: dealsOnly ? 'rgba(255,255,255,0.7)' : '#8A7A87' }}>
                {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Sidebar — desktop */}
        <aside className="products-sidebar-desktop" style={{ width: 200, flexShrink: 0, display: 'none' }}>
          <SidebarFilters activeCat={activeCat} selectCat={selectCat} activePrice={activePrice} setActivePrice={setActivePrice} inp={inp} />
        </aside>

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile category chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 6 }}>
            {ALL_CATS.map(c => (
              <button
                key={c.name}
                onClick={() => selectCat(c.name)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 50, fontSize: 12.5, fontWeight: 700,
                  border: `1.5px solid ${activeCat === c.name && !dealsOnly ? '#E91E8C' : '#EFE1E7'}`,
                  background: activeCat === c.name && !dealsOnly ? '#FFE8F5' : '#fff',
                  color: activeCat === c.name && !dealsOnly ? '#B5006E' : '#4A2040',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>

          {/* Toolbar: filter toggle + sort */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <button
              onClick={() => setShowFilters(true)}
              className="filter-toggle-mobile"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #EFE1E7', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#4A2040', cursor: 'pointer' }}
            >
              ⚙️ Filters {activePrice !== 'all' ? '•' : ''}
            </button>
            <button
              onClick={cycleSort}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #EFE1E7', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#4A2040', cursor: 'pointer', marginLeft: 'auto' }}
            >
              ⇅ {sortLabel}
            </button>
          </div>

          {/* Product grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid #F5EBF1', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1 / 1', background: 'linear-gradient(90deg,#F8ECF3,#FFF6FB,#F8ECF3)', backgroundSize: '200% 100%', animation: 'shimmerLoad 1.4s infinite' }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ height: 10, background: '#F5EBF1', borderRadius: 4, marginBottom: 8, width: '85%' }} />
                    <div style={{ height: 14, background: '#F5EBF1', borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
              ))}
              <style>{`@keyframes shimmerLoad { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1.5px solid #F5EBF1', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{dealsOnly ? '🔥' : '🔍'}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1A0A12', marginBottom: 6 }}>
                {dealsOnly ? "No active deals right now" : 'No products found'}
              </div>
              <div style={{ fontSize: 13, color: '#8A7A87' }}>
                {dealsOnly ? 'Check back soon, or browse everything below.' : 'Try a different category, price range, or search term.'}
              </div>
              {(dealsOnly || activeCat !== 'All' || activePrice !== 'all') && (
                <Link to="/products" style={{ display: 'inline-block', marginTop: 16, background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff', padding: '10px 22px', borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Browse All Products →
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowFilters(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 18px 28px', width: '100%', maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: '#EFE1E7', borderRadius: 50, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 17, fontWeight: 800, margin: 0 }}>Filters</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#8A7A87', cursor: 'pointer' }}>×</button>
            </div>
            <SidebarFilters activeCat={activeCat} selectCat={selectCat} activePrice={activePrice} setActivePrice={setActivePrice} inp={inp} />
            <button
              onClick={() => setShowFilters(false)}
              style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
            >
              Show {products.length} Result{products.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .products-sidebar-desktop { display: block !important; }
          .filter-toggle-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarFilters({ activeCat, selectCat, activePrice, setActivePrice, inp }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#8A7A87', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Category</div>
        {ALL_CATS.map(c => (
          <div
            key={c.name}
            onClick={() => selectCat(c.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: activeCat === c.name ? 800 : 500,
              background: activeCat === c.name ? '#FFE8F5' : 'transparent',
              color: activeCat === c.name ? '#B5006E' : '#4A2040', marginBottom: 2,
            }}
          >
            <span>{c.icon}</span>{c.name}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#8A7A87', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Price</div>
        {PRICE_FILTERS.map(f => (
          <div
            key={f.key}
            onClick={() => setActivePrice(f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: activePrice === f.key ? 800 : 500,
              background: activePrice === f.key ? '#FFE8F5' : 'transparent',
              color: activePrice === f.key ? '#B5006E' : '#4A2040', marginBottom: 2,
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${activePrice === f.key ? '#E91E8C' : '#D8C8D2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {activePrice === f.key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E91E8C' }} />}
            </span>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}
