import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import FlashCountdown from './FlashCountdown';
import WishButton from './WishButton';

export default function ProductCard({ product: p, onFlashEnd }) {
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
          {(p.images?.[0] || p.image) ? <img src={p.images?.[0] || p.image} alt={p.name} loading="lazy" /> : p.icon || '🛍️'}
          {p.flashActive ? <span className="badge" style={{ background: '#1A0A12', color: '#FFD54F' }}>⚡ FLASH SALE</span> : p.badge && <span className="badge">{p.badge}</span>}
          <WishButton product={p} size={32} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }} />
        </div>
        <div className="product-info">
          <h3>{p.name}</h3>
          <div className="price-row">
            <span className="price">₹{p.price}</span>
            {p.old > p.price && <span className="old-price">₹{p.old}</span>}
          </div>
          {p.flashActive && <FlashCountdown endsAt={p.flashEndsAt} compact onEnd={onFlashEnd} />}
          {p.stock === 0 ? (
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 11.5, marginTop: 2 }}>❌ Out of Stock</div>
          ) : p.stock != null && p.stock <= 10 && (
            <div style={{ color: '#f97316', fontWeight: 700, fontSize: 11.5, marginTop: 2 }}>⚠️ Only {p.stock} left!</div>
          )}
          {p.reviewCount > 0 ? (
            <div className="rating">
              ⭐ {Number(p.rating).toFixed(1)}
              <span style={{ color: '#8A7A87', fontWeight: 400 }}>({p.reviewCount})</span>
            </div>
          ) : (
            <div className="rating" style={{ color: '#8A7A87', fontWeight: 500 }}>✨ New</div>
          )}
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
