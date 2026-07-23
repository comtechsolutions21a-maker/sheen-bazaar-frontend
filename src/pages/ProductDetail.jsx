import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const STARS = [1, 2, 3, 4, 5];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProduct(id).then(p => {
      setProduct(p);
      setLoading(false);
      // Load related
      api.getProducts({ cat: p.cat }).then(list => setRelated(list.filter(x => x.id !== p.id).slice(0, 4)));
    }).catch(() => { setLoading(false); navigate('/products'); });
  }, [id]);

  function handleAddToCart() {
    const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
    addToCart({ ...product, variant: variantStr }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
    addToCart({ ...product, variant: variantStr }, qty);
    navigate('/cart');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, fontSize: 32 }}>⏳</div>;
  if (!product) return null;

  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const discount = product.old > product.price ? Math.round((1 - product.price / product.old) * 100) : 0;

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #EFE1E7', fontSize: 13, color: '#2B1330', background: '#fff', boxSizing: 'border-box', outline: 'none', marginBottom: 10, fontFamily: 'Inter,sans-serif' };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#8A7A87', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link to="/" style={{ color: '#E91E8C' }}>Home</Link> /
        <Link to="/products" style={{ color: '#E91E8C' }}>Shop</Link> /
        <Link to={`/products?cat=${product.cat}`} style={{ color: '#E91E8C' }}>{product.cat}</Link> /
        <span style={{ color: '#2B1330', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 28, marginBottom: 40 }}>

        {/* LEFT — Images */}
        <div>
          <div style={{ background: 'linear-gradient(135deg,#FFF6F2,#FFE8F5)', borderRadius: 16, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
            {images.length > 0
              ? <img src={images[activeImg]} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 120 }}>{product.icon || '🛍️'}</span>
            }
            {discount > 0 && <div style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg,#FF1744,#FF6B6B)', color: '#fff', padding: '6px 14px', borderRadius: 50, fontSize: 13, fontWeight: 800 }}>{discount}% OFF</div>}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === activeImg ? '#E91E8C' : '#EFE1E7'}`, cursor: 'pointer', background: '#FFF6F2' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MIDDLE — Details */}
        <div>
          {product.badge && <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#FF1744,#FF6B6B)', color: '#fff', padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 800, marginBottom: 10 }}>{product.badge}</div>}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A0A12', marginBottom: 8, lineHeight: 1.3, fontFamily: 'Baloo 2,sans-serif' }}>{product.name}</h1>

          {product.brand && <div style={{ fontSize: 13, color: '#8A7A87', marginBottom: 8 }}>Brand: <strong style={{ color: '#E91E8C' }}>{product.brand}</strong></div>}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {STARS.map(s => <span key={s} style={{ color: s <= Math.round(product.rating) ? '#FFB300' : '#E0E0E0', fontSize: 18 }}>★</span>)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFB300' }}>{product.rating?.toFixed(1)}</span>
            <span style={{ fontSize: 13, color: '#8A7A87' }}>({product.reviewCount || 0} reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#E91E8C', fontFamily: 'Baloo 2,sans-serif' }}>₹{product.price}</span>
            {product.old > product.price && <>
              <span style={{ fontSize: 18, color: '#8A7A87', textDecoration: 'line-through' }}>₹{product.old}</span>
              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 50, fontSize: 13, fontWeight: 800 }}>Save ₹{product.old - product.price}</span>
            </>}
          </div>

          {/* Variants */}
          {product.variants?.map(v => (
            <div key={v.name} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{v.name}: <span style={{ fontWeight: 400, color: '#E91E8C' }}>{selectedVariants[v.name] || 'Select'}</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {v.options.map(opt => (
                  <button key={opt} onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: opt })} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedVariants[v.name] === opt ? '#E91E8C' : '#EFE1E7'}`, background: selectedVariants[v.name] === opt ? '#FFE8F5' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: selectedVariants[v.name] === opt ? '#E91E8C' : '#2B1330' }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Features:</div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {product.highlights.map((h, i) => <li key={i} style={{ fontSize: 13, color: '#4A2040', marginBottom: 4, lineHeight: 1.5 }}>{h}</li>)}
              </ul>
            </div>
          )}

          {/* Delivery info */}
          <div style={{ background: '#FFF6F2', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13 }}>🚚 Delivery in <strong>{product.deliveryDays || 5} days</strong></div>
              <div style={{ fontSize: 13 }}>↩️ <strong>{product.returnDays || 7} days</strong> return</div>
              {product.warrantyMonths > 0 && <div style={{ fontSize: 13 }}>🛡️ <strong>{product.warrantyMonths} month</strong> warranty</div>}
            </div>
          </div>

          {/* Stock */}
          {product.stock <= 10 && product.stock > 0 && <div style={{ color: '#f97316', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚠️ Only {product.stock} left in stock!</div>}
          {product.stock === 0 && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>❌ Out of Stock</div>}
        </div>

        {/* RIGHT — Buy Box */}
        <div>
          <div style={{ background: '#fff', border: '1.5px solid #EFE1E7', borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E91E8C', fontFamily: 'Baloo 2,sans-serif', marginBottom: 4 }}>₹{product.price}</div>
            {product.old > product.price && <div style={{ fontSize: 13, color: '#8A7A87', marginBottom: 12 }}>M.R.P: <span style={{ textDecoration: 'line-through' }}>₹{product.old}</span> ({discount}% off)</div>}

            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
              ✅ In Stock{product.stock > 0 ? ` (${product.stock} units)` : ' — Out of Stock'}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', marginBottom: 6 }}>QUANTITY</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #EFE1E7', borderRadius: 10, padding: '6px 14px', width: 'fit-content' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E8C', fontWeight: 800 }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#E91E8C', fontWeight: 800 }}>+</button>
              </div>
            </div>

            <button onClick={handleBuyNow} disabled={product.stock === 0} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 20px rgba(233,30,140,0.3)', opacity: product.stock === 0 ? 0.5 : 1 }}>
              ⚡ Buy Now
            </button>
            <button onClick={handleAddToCart} disabled={product.stock === 0} style={{ width: '100%', padding: 14, borderRadius: 10, border: '2px solid #E91E8C', background: added ? '#E91E8C' : '#fff', color: added ? '#fff' : '#E91E8C', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', opacity: product.stock === 0 ? 0.5 : 1 }}>
              {added ? '✅ Added to Cart!' : '🛒 Add to Cart'}
            </button>

            <div style={{ borderTop: '1px solid #EFE1E7', marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 13, display: 'flex', gap: 8, marginBottom: 8 }}>🚚 <span><strong>Free delivery</strong> on orders above ₹499</span></div>
              <div style={{ fontSize: 13, display: 'flex', gap: 8, marginBottom: 8 }}>↩️ <span>{product.returnPolicy || '7 days easy return'}</span></div>
              <div style={{ fontSize: 13, display: 'flex', gap: 8 }}>🔒 <span><strong>Secure</strong> payments</span></div>
            </div>

            {product.seller && (
              <div style={{ borderTop: '1px solid #EFE1E7', marginTop: 14, paddingTop: 14, fontSize: 12, color: '#8A7A87' }}>
                Sold by <strong style={{ color: '#2B1330' }}>{product.sellerName || 'Verified Seller'}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT DETAILS TABS */}
      <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFE1E7' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Baloo 2,sans-serif' }}>Product Description</h2>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, color: '#4A2040', lineHeight: 1.8, marginBottom: 20 }}>{product.desc || 'No description available.'}</p>

          {product.specifications?.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Specifications</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {product.specifications.map((spec, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#FFF6F2' : '#fff' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4A2040', width: '35%', borderBottom: '1px solid #EFE1E7' }}>{spec.key}</td>
                      <td style={{ padding: '10px 14px', color: '#1A0A12', borderBottom: '1px solid #EFE1E7' }}>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* REVIEWS */}
      <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFE1E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Baloo 2,sans-serif' }}>Customer Reviews ({product.reviewCount || 0})</h2>
          {user && <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Write a Review</button>}
        </div>

        {showReviewForm && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFE1E7', background: '#FFF6F2' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your Rating</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {STARS.map(s => <span key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} style={{ fontSize: 28, cursor: 'pointer', color: s <= reviewForm.rating ? '#FFB300' : '#E0E0E0', transition: 'color 0.1s' }}>★</span>)}
              </div>
            </div>
            <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience with this product..." rows={3} style={{ ...inp, resize: 'vertical' }} />
            <button onClick={async () => {
              await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/products/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bazaario_token')}` }, body: JSON.stringify(reviewForm) });
              setShowReviewForm(false);
              api.getProduct(id).then(setProduct);
            }} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Submit Review</button>
          </div>
        )}

        <div style={{ padding: '0 24px' }}>
          {product.reviews?.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No reviews yet — be the first to review!</div>}
          {product.reviews?.map((r, i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < product.reviews.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{r.name || 'Customer'}</strong>
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {STARS.map(s => <span key={s} style={{ color: s <= r.rating ? '#FFB300' : '#E0E0E0', fontSize: 14 }}>★</span>)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8A7A87' }}>{new Date(r.at).toLocaleDateString()}</div>
              </div>
              {r.comment && <p style={{ fontSize: 13, color: '#4A2040', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Baloo 2,sans-serif', marginBottom: 16 }}>Similar Products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {related.map(p => (
              <div key={p.id} onClick={() => navigate(`/products/${p.id}`)} style={{ background: '#fff', border: '1.5px solid #EFE1E7', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ background: 'linear-gradient(135deg,#FFF6F2,#FFE8F5)', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {(p.images?.[0] || p.image) ? <img src={p.images?.[0] || p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 64 }}>{p.icon || '🛍️'}</span>}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{p.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#E91E8C' }}>₹{p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
