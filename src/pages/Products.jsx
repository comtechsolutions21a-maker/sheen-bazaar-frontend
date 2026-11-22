import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSEO } from '../utils/useSEO';
import { api } from '../api/client';
import FlashCountdown from '../components/FlashCountdown';

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

const SORTS = [
  { key: 'default', label: 'Newest first' },
  { key: 'popular', label: 'Most popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'discount', label: 'Biggest discount' },
  { key: 'price-low', label: 'Price: Low → High' },
  { key: 'price-high', label: 'Price: High → Low' },
];

const RATING_FILTERS = [
  { key: 0, label: 'Any rating' },
  { key: 4, label: '4★ & above' },
  { key: 3, label: '3★ & above' },
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
        {(p.images?.[0] || p.image) ? (
          <img src={p.images?.[0] || p.image} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 56 }}>{p.icon || '🛍️'}</span>
        )}
        {discount > 0 && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#FF1744,#FF6B6B)', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 50 }}>
            {discount}% OFF
          </span>
        )}
        {p.flashActive && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: '#1A0A12', color: '#FFD54F', fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 50 }}>⚡ SALE</span>
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
        {p.flashActive && <div style={{ marginBottom: 4 }}><FlashCountdown endsAt={p.flashEndsAt} compact /></div>}
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

  useSEO(
    searchTerm ? `Search: ${searchTerm}` : activeCat !== 'All' ? `${activeCat} Products` : 'Shop All Products',
    searchTerm ? `Search results for "${searchTerm}" on Sheen Bazaar.` : `Browse ${activeCat !== 'All' ? activeCat.toLowerCase() + ' ' : ''}products on Sheen Bazaar with fast delivery and great prices.`
  );

  const [activePrice, setActivePrice] = useState('all');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [brands, setBrands] = useState([]);           // all brands available
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
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
    if (activePrice === 'custom') { if (customMin) query.set('minPrice', customMin); if (customMax) query.set('maxPrice', customMax); }
    if (selectedBrands.length) query.set('brand', selectedBrands.join(','));
    if (minRating) query.set('minRating', String(minRating));
    if (inStockOnly) query.set('inStock', '1');
    if (params.get('flash') === '1') query.set('flash', '1');

    fetch(`${BASE}/products?${query.toString()}`)
      .then(r => r.json())
      .then(list => {
        const arr = Array.isArray(list) ? list : [];
        setProducts(dealsOnly ? arr.filter(p => p.old > p.price) : arr);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCat, searchBox, sortMode, activePrice, customMin, customMax, selectedBrands, minRating, inStockOnly, dealsOnly, params]);

  // Brand list for the current category
  useEffect(() => { api.getBrands(activeCat).then(setBrands).catch(() => setBrands([])); setSelectedBrands([]); }, [activeCat]);

  const activeFilterCount = (activePrice !== 'all' ? 1 : 0) + selectedBrands.length + (minRating ? 1 : 0) + (inStockOnly ? 1 : 0);
  function clearFilters() { setActivePrice('all'); setCustomMin(''); setCustomMax(''); setSelectedBrands([]); setMinRating(0); setInStockOnly(false); }
  const filterProps = { activeCat, selectCat, activePrice, setActivePrice, customMin, setCustomMin, customMax, setCustomMax, brands, selectedBrands, setSelectedBrands, minRating, setMinRating, inStockOnly, setInStockOnly, clearFilters, activeFilterCount };

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setSearchBox(searchTerm); }, [searchTerm]);

  function selectCat(name) {
    const next = new URLSearchParams(params);
    if (name === 'All') next.delete('cat'); else next.set('cat', name);
    next.delete('deals');
    setParams(next);
    setShowFilters(false);
  }

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
          <SidebarFilters {...filterProps} inp={inp} />
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
              ⚙️ Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>
            {searchBox && <span style={{ fontSize: 12.5, color: '#8A7A87' }}>Results for “<strong style={{ color: '#1A0A12' }}>{searchBox}</strong>”</span>}
            <select value={sortMode} onChange={e => setSortMode(e.target.value)} aria-label="Sort products"
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #EFE1E7', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#4A2040', cursor: 'pointer', marginLeft: 'auto', outline: 'none' }}>
              {SORTS.map(o => <option key={o.key} value={o.key}>⇅ {o.label}</option>)}
            </select>
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
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{ display: 'inline-block', marginTop: 16, marginRight: 8, background: '#fff', color: '#B5006E', border: '1.5px solid #E91E8C', padding: '9px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Clear filters</button>
              )}
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
            <SidebarFilters {...filterProps} inp={inp} />
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

function FilterTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: '#8A7A87', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{children}</div>;
}

function Radio({ on }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${on ? '#E91E8C' : '#D8C8D2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E91E8C' }} />}
    </span>
  );
}

const rowStyle = (on) => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
  fontSize: 13, fontWeight: on ? 800 : 500, background: on ? '#FFE8F5' : 'transparent',
  color: on ? '#B5006E' : '#4A2040', marginBottom: 2,
});

function SidebarFilters({ activeCat, selectCat, activePrice, setActivePrice, customMin, setCustomMin, customMax, setCustomMax, brands, selectedBrands, setSelectedBrands, minRating, setMinRating, inStockOnly, setInStockOnly, clearFilters, activeFilterCount, inp }) {
  return (
    <div>
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} style={{ width: '100%', marginBottom: 14, background: '#fff', color: '#B5006E', border: '1.5px solid #E91E8C', borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>✕ Clear all filters ({activeFilterCount})</button>
      )}
      <div style={{ marginBottom: 20 }}>
        <FilterTitle>Category</FilterTitle>
        {ALL_CATS.map(c => (
          <div key={c.name} onClick={() => selectCat(c.name)} style={rowStyle(activeCat === c.name)}>
            <span>{c.icon}</span>{c.name}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <FilterTitle>Price</FilterTitle>
        {PRICE_FILTERS.map(f => (
          <div key={f.key} onClick={() => setActivePrice(f.key)} style={rowStyle(activePrice === f.key)}>
            <Radio on={activePrice === f.key} />{f.label}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
          <input type="number" min="0" inputMode="numeric" placeholder="Min ₹" value={customMin} onChange={e => { setCustomMin(e.target.value); setActivePrice('custom'); }} style={{ ...inp, padding: '8px 10px', fontSize: 12.5 }} />
          <span style={{ color: '#8A7A87' }}>–</span>
          <input type="number" min="0" inputMode="numeric" placeholder="Max ₹" value={customMax} onChange={e => { setCustomMax(e.target.value); setActivePrice('custom'); }} style={{ ...inp, padding: '8px 10px', fontSize: 12.5 }} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <FilterTitle>Customer rating</FilterTitle>
        {RATING_FILTERS.map(f => (
          <div key={f.key} onClick={() => setMinRating(f.key)} style={rowStyle(minRating === f.key)}>
            <Radio on={minRating === f.key} />{f.label}
          </div>
        ))}
      </div>
      {brands.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FilterTitle>Brand</FilterTitle>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {brands.map(b => {
              const on = selectedBrands.includes(b);
              return (
                <label key={b} style={{ ...rowStyle(on), cursor: 'pointer' }}>
                  <input type="checkbox" checked={on} onChange={() => setSelectedBrands(on ? selectedBrands.filter(x => x !== b) : [...selectedBrands, b])} style={{ accentColor: '#E91E8C', width: 16, height: 16 }} />
                  {b}
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <FilterTitle>Availability</FilterTitle>
        <label style={{ ...rowStyle(inStockOnly), cursor: 'pointer' }}>
          <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} style={{ accentColor: '#E91E8C', width: 16, height: 16 }} />
          In stock only
        </label>
      </div>
    </div>
  );
}
