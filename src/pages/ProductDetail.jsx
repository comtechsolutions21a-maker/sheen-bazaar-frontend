import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const { addToCart, showToast } = useCart();

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch(() => setProduct(null));
    api.getRelated(id).then(setRelated).catch(() => setRelated([]));
  }, [id]);

  if (!product) return <div className="container section">Loading…</div>;

  async function quickAdd() {
    const ok = await addToCart(product.id, 1);
    if (ok) showToast('Added to cart 🛒');
  }

  async function buyNow() {
    const ok = await addToCart(product.id, 1);
    if (ok) navigate('/cart');
  }

  return (
    <div className="container">
      <nav className="crumbs">
        <Link to="/">Home</Link> / <Link to="/products">Shop</Link> / <span>{product.name}</span>
      </nav>

      <div className="pd-layout">
        <div className="pd-hero">{product.image ? <img src={product.image} alt={product.name} /> : product.icon}</div>
        <div>
          <div className="rating">★ {product.rating} rating</div>
          <div className="pd-name">{product.name}</div>
          <div className="pd-price-row">
            <span className="pd-price">₹{product.price}</span>
            <span className="pd-old">₹{product.old}</span>
            <span className="pd-pct">{product.badge}</span>
          </div>
          <p className="pd-desc">{product.desc}</p>
          <div className="pd-meta">
            <div>🚚 <strong>Free Delivery</strong>in 3-5 days</div>
            <div>↩️ <strong>7-Day Return</strong>easy exchange</div>
            <div>🔒 <strong>Secure Payment</strong>UPI / Cards / COD</div>
          </div>
          <div className="pd-actions">
            <button className="btn-outline" onClick={quickAdd}>Add to Cart</button>
            <button className="btn-primary" onClick={buyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-title"><h2>You may also like</h2></div>
        <div className="related-strip">
          {related.map((r) => (
            <div className="card" key={r.id}>
              <Link to={`/products/${r.id}`}>
                <div className="imgbox"><span className="badge">{r.badge}</span>{r.image ? <img src={r.image} alt={r.name} /> : r.icon}</div>
              </Link>
              <div className="info">
                <Link to={`/products/${r.id}`}><div className="name">{r.name}</div></Link>
                <div className="price-row"><span className="price-big">₹{r.price}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
