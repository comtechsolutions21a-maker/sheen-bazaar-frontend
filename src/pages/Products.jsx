import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

const ALL_CATS = ['All', 'Fashion', 'Electronics', 'Home', 'Beauty', 'Kids', 'Jewellery', 'Footwear', 'Bags'];

const PRICE_FILTERS = [
  { key: 'all', label: 'All Prices' },
  { key: 'under300', label: 'Under ₹300' },
  { key: '300-600', label: '₹300 – ₹600' },
  { key: '600plus', label: '₹600 & above' },
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const activeCat = params.get('cat') || 'All';
  const searchTerm = params.get('search') || '';
  const [activePrice, setActivePrice] = useState('all');
  const [sortMode, setSortMode] = useState('default');
  const [products, setProducts] = useState([]);
  const [searchBox, setSearchBox] = useState(searchTerm);

  const fetchProducts = useCallback(() => {
    const query = {};
    if (activeCat !== 'All') query.cat = activeCat;
    if (searchBox) query.search = searchBox;
    if (sortMode !== 'default') query.sort = sortMode;
    if (activePrice === 'under300') query.maxPrice = 299;
    if (activePrice === '300-600') { query.minPrice = 300; query.maxPrice = 600; }
    if (activePrice === '600plus') query.minPrice = 601;

    api.getProducts(query).then(setProducts);
  }, [activeCat, searchBox, sortMode, activePrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSearchBox(searchTerm);
  }, [searchTerm]);

  function selectCat(name) {
    const next = new URLSearchParams(params);
    if (name === 'All') next.delete('cat');
    else next.set('cat', name);
    setParams(next);
  }

  function cycleSort() {
    setSortMode((m) => (m === 'default' ? 'price-low' : m === 'price-low' ? 'price-high' : 'default'));
  }

  const sortLabel =
    sortMode === 'price-low' ? 'Sort: Price Low → High ⇅' :
    sortMode === 'price-high' ? 'Sort: Price High → Low ⇅' : 'Sort: Default ⇅';

  return (
    <>
      <div className="container">
        <nav className="crumbs">Home / <span>{activeCat}</span></nav>
      </div>

      <div className="container section">
        <div className="shop-layout">
          <aside className="sidebar">
            <div className="sidebar-group">
              <h3>Categories</h3>
              <div>
                {ALL_CATS.map((name) => (
                  <div
                    key={name}
                    className={`filter-chip${name === activeCat ? ' active' : ''}`}
                    onClick={() => selectCat(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
            <div className="sidebar-group">
              <h3>Price</h3>
              {PRICE_FILTERS.map((f) => (
                <div
                  key={f.key}
                  className={`filter-chip${activePrice === f.key ? ' active' : ''}`}
                  onClick={() => setActivePrice(f.key)}
                >
                  {f.label}
                </div>
              ))}
            </div>
          </aside>

          <div>
            <div className="results-bar">
              <h2 style={{ fontSize: '19px' }}>{products.length} Products</h2>
              <a href="#" onClick={(e) => { e.preventDefault(); cycleSort(); }}>{sortLabel}</a>
            </div>
            {products.length > 0 ? (
              <div className="grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="e-icon">🔍</div>
                No products found. Try a different filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
