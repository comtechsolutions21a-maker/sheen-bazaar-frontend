import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product: p }) {
  const { addToCart } = useCart();

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
          <div className="rating">
            ⭐ {p.rating || '4.0'}
            <span style={{ color: '#8A7A87', fontWeight: 400 }}>(128)</span>
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 14px 14px' }}>
        <button
          className="add-cart-btn"
          onClick={(e) => { e.preventDefault(); addToCart(p); }}
        >
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
}
