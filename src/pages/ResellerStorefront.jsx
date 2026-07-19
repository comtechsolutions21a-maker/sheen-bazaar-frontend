import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ResellerStorefront() {
  const { resellerId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { addToCart, showToast } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.getResellerStorefront(resellerId).then(setData).catch((e) => setError(e.message));
  }, [resellerId]);

  async function handleAdd(productId) {
    const ok = await addToCart(productId, 1, resellerId);
    if (ok) showToast('Added to cart');
  }

  if (error) {
    return (
      <div className="container section">
        <div className="empty-state"><div className="e-icon">🚫</div>{error}</div>
      </div>
    );
  }
  if (!data) return <div className="container section">Loading…</div>;

  return (
    <div className="container section">
      <div className="sec-title">
        <h2>{data.reseller.businessName || `${data.reseller.name}'s Store`}</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Products curated and priced by this reseller.
      </p>

      {data.items.length === 0 ? (
        <div className="empty-state"><div className="e-icon">🛍️</div>This reseller hasn't listed any products yet.</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {data.items.map(({ product, resellPrice }) => (
            <div className="panel" key={product.id}>
              <Link to={`/products/${product.id}`}>
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  {product.image ? <img src={product.image} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} /> : product.icon}
                </div>
                <div className="n" style={{ marginTop: 8 }}>{product.name}</div>
              </Link>
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>₹{resellPrice}</div>
              <button
                className="btn-primary green"
                style={{ marginTop: 10 }}
                onClick={() => (user ? handleAdd(product.id) : showToast('Please log in to add items to your cart'))}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
