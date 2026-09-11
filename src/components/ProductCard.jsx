import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product: p }) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState('idle');

  async function handleAddToCart(e) {
    e.preventDefault();
    if (status === 'adding' || p.stock === 0) return;
    setStatus('adding');
    // CartContext.addToCart expects (productId, delta, resellerId) — passing
    // the whole product object here previously sent an object where a
    // number was expected, and no quantity delta at all.
    const ok = await addToCart(p.id, 1);
    setStatus(ok ? 'added' : 'idle');
    if (ok) setTimeout(() => setStatus('idle'), 1400);
  }

  return (
    <div className="product-card">
      <Link to={`/products/${p.id}`}>
        <div className="product-img">
          {p.image ? <img src={p.image} alt={p.name} /> : p.icon || '🛍️'}
          {p.badge && <span className="badge">{p.badge}</span>}
        </div>
        <div className="product-info">
          <h3>{p.name}</h3>
          <div className="price-row">
            <span className="price">₹{p.price}</span>
            {p.old && <span className="old-price">₹{p.old}</span>}
          </div>
          {p.stock === 0 ? (
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 11.5, marginTop: 2 }}>❌ Out of Stock</div>
          ) : p.stock != null && p.stock <= 10 && (
            <div style={{ color: '#f97316', fontWeight: 700, fontSize: 11.5, marginTop: 2 }}>⚠️ Only {p.stock} left!</div>
          )}
          <div className="rating">
            ⭐ {p.rating || '4.0'}
            <span style={{ color: '#8A7A87', fontWeight: 400 }}>(128)</span>
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 14px 14px' }}>
        <button
          className="add-cart-btn"
          onClick={handleAddToCart}
          disabled={status === 'adding' || p.stock === 0}
          style={p.stock === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {p.stock === 0 ? '❌ Out of Stock' : status === 'adding' ? '…' : status === 'added' ? '✅ Added' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
