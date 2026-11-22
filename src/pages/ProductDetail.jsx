import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { recordView, getRecentlyViewed } from '../utils/recentlyViewed';
import { useSEO } from '../utils/useSEO';
import { compressImage } from '../utils/compressImage';
import PincodeCheck from '../components/PincodeCheck';
import FlashCountdown from '../components/FlashCountdown';

const STARS = [1, 2, 3, 4, 5];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleCompare, isComparing } = useCompare();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', images: [] });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewErr, setReviewErr] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'photos' | 1-5
  const [lightbox, setLightbox] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState(''); // '', 'sending', 'done'
  const [notifyMsg, setNotifyMsg] = useState('');

  useSEO(
    product ? product.name : undefined,
    product ? `Buy ${product.name} at ₹${product.price} on Sheen Bazaar. ${product.desc ? product.desc.slice(0, 120) : 'Fast delivery, easy returns.'}` : undefined
  );


  useEffect(() => {
    setLoading(true);
    api.getProduct(id).then(p => {
      setProduct(p);
      setLoading(false);
      recordView(p);
      setRecentlyViewed(getRecentlyViewed(p.id));
      // Load related
      api.getProducts({ cat: p.cat }).then(list => setRelated(list.filter(x => x.id !== p.id).slice(0, 4)));
    }).catch(() => { setLoading(false); navigate('/products'); });
  }, [id]);

  function handleAddToCart() {
    addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addToCart(product.id, qty);
    navigate('/cart');
  }

  async function handleNotifyStock() {
    if (!user && (!notifyEmail || !notifyEmail.includes('@'))) {
      setNotifyMsg('Please enter a valid email');
      return;
    }
    setNotifyStatus('sending'); setNotifyMsg('');
    try {
      const data = await api.notifyStock(product.id, notifyEmail);
      setNotifyStatus('done');
      setNotifyMsg(data.message || "We'll email you when it's back!");
    } catch (e) {
      setNotifyStatus('');
      setNotifyMsg(e.message);
    }
  }

  async function askQuestion() {
    if (!newQuestion.trim()) return;
    setAskingQuestion(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/products/${id}/question`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bazaario_token')}` }, body: JSON.stringify({ question: newQuestion }) });
      setNewQuestion('');
      api.getProduct(id).then(setProduct);
    } finally { setAskingQuestion(false); }
  }

  async function markHelpful(qIndex) {
    await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/products/${id}/question/${qIndex}/helpful`, { method: 'PATCH' });
    api.getProduct(id).then(setProduct);
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
      <div className="pd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 28, marginBottom: 40 }}>

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
              {STARS.map(s => <span key={s} style={{ color: product.reviewCount > 0 && s <= Math.round(product.rating) ? '#FFB300' : '#E0E0E0', fontSize: 18 }}>★</span>)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFB300' }}>{product.reviewCount > 0 ? Number(product.rating).toFixed(1) : ''}</span>
            <span style={{ fontSize: 13, color: '#8A7A87' }}>{product.reviewCount > 0 ? `(${product.reviewCount} reviews)` : 'No reviews yet'}</span>
          </div>

          {product.flashActive && <FlashCountdown endsAt={product.flashEndsAt} onEnd={() => api.getProduct(id).then(setProduct)} />}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#E91E8C', fontFamily: 'Baloo 2,sans-serif' }}>₹{product.price}</span>
            {product.old > product.price && <>
              <span style={{ fontSize: 18, color: '#8A7A87', textDecoration: 'line-through' }}>₹{product.old}</span>
              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 50, fontSize: 13, fontWeight: 800 }}>Save ₹{product.old - product.price}</span>
            </>}
          </div>

          {/* Variants */}
          {product.variants?.filter(v => v.options?.length > 0).map(v => (
            <div key={v.name} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{v.name}: <span style={{ fontWeight: 400, color: '#E91E8C' }}>{selectedVariants[v.name] || 'Select'}</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {v.options?.map(opt => (
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

          <PincodeCheck productId={product.id} />

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

            {product.stock === 0 && (
              <div style={{ marginTop: 12, padding: 14, background: '#FFF6F2', borderRadius: 10, border: '1px solid #EFE1E7' }}>
                {notifyStatus === 'done' ? (
                  <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>✅ {notifyMsg}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔔 Notify me when available</div>
                    {!user && (
                      <input
                        type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #EFE1E7', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                      />
                    )}
                    <button
                      onClick={handleNotifyStock} disabled={notifyStatus === 'sending'}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#E91E8C', color: '#fff', fontWeight: 700, fontSize: 13, cursor: notifyStatus === 'sending' ? 'not-allowed' : 'pointer', opacity: notifyStatus === 'sending' ? 0.7 : 1 }}
                    >
                      {notifyStatus === 'sending' ? 'Submitting…' : user ? `Notify me at ${user.email}` : 'Notify Me'}
                    </button>
                    {notifyMsg && <div style={{ fontSize: 12, color: '#A8114F', marginTop: 6 }}>{notifyMsg}</div>}
                  </>
                )}
              </div>
            )}
            <button onClick={() => toggleCompare(product)} style={{ width: '100%', padding: 11, borderRadius: 10, border: '1.5px solid #EFE1E7', background: isComparing(product.id) ? '#FFE8F5' : '#fff', color: isComparing(product.id) ? '#E91E8C' : '#8A7A87', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
              {isComparing(product.id) ? '✓ Added to Compare' : '⚖️ Add to Compare'}
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
          {user ? <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{product.reviews?.some(r => r.user && String(r.user) === String(user._id || user.id)) ? 'Edit my review' : 'Write a Review'}</button>
            : <Link to="/login" style={{ color: '#E91E8C', fontWeight: 700, fontSize: 13 }}>Log in to review</Link>}
        </div>

        {/* Rating summary */}
        {product.reviews?.length > 0 && (() => {
          const counts = [5,4,3,2,1].map(n => product.reviews.filter(r => r.rating === n).length);
          const photoCount = product.reviews.filter(r => r.images?.length).length;
          return (
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFE1E7', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: 110 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#1A0A12', lineHeight: 1 }}>{Number(product.rating || 0).toFixed(1)}</div>
                <div style={{ color: '#FFB300', fontSize: 16, margin: '4px 0' }}>{'★'.repeat(Math.round(product.rating || 0))}<span style={{ color: '#E0E0E0' }}>{'★'.repeat(5 - Math.round(product.rating || 0))}</span></div>
                <div style={{ fontSize: 12, color: '#8A7A87' }}>{product.reviewCount} ratings</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {[5,4,3,2,1].map((n, i) => (
                  <button key={n} onClick={() => setReviewFilter(reviewFilter === n ? 'all' : n)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', opacity: reviewFilter === 'all' || reviewFilter === n ? 1 : 0.4 }}>
                    <span style={{ fontSize: 12, width: 24, color: '#4A2040' }}>{n}★</span>
                    <span style={{ flex: 1, height: 8, background: '#F3E6EC', borderRadius: 50, overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${product.reviews.length ? (counts[i] / product.reviews.length) * 100 : 0}%`, background: n >= 4 ? '#16a34a' : n === 3 ? '#FFB300' : '#ef4444' }} />
                    </span>
                    <span style={{ fontSize: 12, width: 24, textAlign: 'right', color: '#8A7A87' }}>{counts[i]}</span>
                  </button>
                ))}
              </div>
              {photoCount > 0 && (
                <button onClick={() => setReviewFilter(reviewFilter === 'photos' ? 'all' : 'photos')} style={{ border: `1.5px solid ${reviewFilter === 'photos' ? '#E91E8C' : '#EFE1E7'}`, background: reviewFilter === 'photos' ? '#FFE8F5' : '#fff', color: '#E91E8C', borderRadius: 50, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  📷 With photos ({photoCount})
                </button>
              )}
            </div>
          );
        })()}

        {showReviewForm && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFE1E7', background: '#FFF6F2' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your Rating</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {STARS.map(s => <span key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} style={{ fontSize: 28, cursor: 'pointer', color: s <= reviewForm.rating ? '#FFB300' : '#E0E0E0', transition: 'color 0.1s' }}>★</span>)}
              </div>
            </div>
            <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience with this product..." rows={3} maxLength={2000} style={{ ...inp, resize: 'vertical' }} />

            <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 8px' }}>Add photos <span style={{ fontWeight: 400, color: '#8A7A87' }}>(optional, up to 3)</span></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {reviewForm.images.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 76, height: 76 }}>
                  <img src={src} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 10, border: '1px solid #EFE1E7' }} />
                  <button type="button" aria-label="Remove photo" onClick={() => setReviewForm({ ...reviewForm, images: reviewForm.images.filter((_, j) => j !== i) })} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#1A0A12', color: '#fff', fontSize: 12, cursor: 'pointer', lineHeight: '22px', padding: 0 }}>✕</button>
                </div>
              ))}
              {reviewForm.images.length < 3 && (
                <label style={{ width: 76, height: 76, borderRadius: 10, border: '2px dashed #E91E8C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#E91E8C', fontSize: 11, fontWeight: 700, background: '#fff' }}>
                  <span style={{ fontSize: 22 }}>📷</span>Add
                  <input type="file" accept="image/*" multiple hidden onChange={async e => {
                    const files = Array.from(e.target.files || []).slice(0, 3 - reviewForm.images.length);
                    e.target.value = '';
                    setReviewErr('');
                    try {
                      const shrunk = await Promise.all(files.map(f => compressImage(f)));
                      setReviewForm(f => ({ ...f, images: [...f.images, ...shrunk].slice(0, 3) }));
                    } catch (err) { setReviewErr(err.message); }
                  }} />
                </label>
              )}
            </div>
            {reviewErr && <div style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚠️ {reviewErr}</div>}
            <button disabled={reviewBusy} onClick={async () => {
              setReviewBusy(true); setReviewErr('');
              try {
                const updated = await api.submitReview(id, reviewForm);
                setProduct(updated);
                setShowReviewForm(false);
                setReviewForm({ rating: 5, comment: '', images: [] });
              } catch (err) { setReviewErr(err.message); }
              finally { setReviewBusy(false); }
            }} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', opacity: reviewBusy ? 0.6 : 1 }}>{reviewBusy ? 'Posting…' : 'Submit Review'}</button>
          </div>
        )}

        <div style={{ padding: '0 24px' }}>
          {(!product.reviews || product.reviews.length === 0) && <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No reviews yet — be the first to review!</div>}
          {(product.reviews || [])
            .filter(r => reviewFilter === 'all' ? true : reviewFilter === 'photos' ? r.images?.length > 0 : r.rating === reviewFilter)
            .map((r, i, list) => {
              const mine = user && r.user && String(r.user) === String(user._id || user.id);
              return (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < list.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{r.name || 'Customer'}</strong>
                  {r.verified && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 50 }}>✔ Verified purchase</span>}
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {STARS.map(s => <span key={s} style={{ color: s <= r.rating ? '#FFB300' : '#E0E0E0', fontSize: 14 }}>★</span>)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8A7A87', textAlign: 'right' }}>
                  {new Date(r.at).toLocaleDateString()}
                  {mine && <div><button onClick={async () => { if (!confirm('Delete your review?')) return; try { setProduct(await api.deleteReview(id)); } catch (e) { alert(e.message); } }} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>Delete</button></div>}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: 13, color: '#4A2040', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
              {r.images?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {r.images.map((src, j) => (
                    <img key={j} src={src} alt="Customer photo" loading="lazy" onClick={() => setLightbox(src)} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid #EFE1E7', cursor: 'zoom-in' }} />
                  ))}
                </div>
              )}
            </div>
              );
            })}
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2147483600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}

      {/* PRODUCT Q&A */}
      <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EFE1E7' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Baloo 2,sans-serif' }}>❓ Customer Questions ({product.questions?.length || 0})</h2>
        </div>
        {user && (
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFE1E7', background: '#FFF6F2' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion()} placeholder="Ask something about this product…" style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EFE1E7', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif' }} />
              <button onClick={askQuestion} disabled={askingQuestion} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', minWidth: 100 }}>{askingQuestion ? '🤖 Thinking…' : 'Ask'}</button>
            </div>
          </div>
        )}
        <div style={{ padding: '0 24px' }}>
          {(!product.questions || product.questions.length === 0) && <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No questions yet — be the first to ask!</div>}
          {product.questions?.map((q, i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < product.questions.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 800, color: '#E91E8C', flexShrink: 0 }}>Q:</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{q.question}</span>
                  <div style={{ fontSize: 11, color: '#8A7A87', marginTop: 2 }}>{q.name} · {new Date(q.askedAt).toLocaleDateString()}</div>
                </div>
              </div>
              {q.answer ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span style={{ fontWeight: 800, color: q.answeredBy === 'ai' ? '#8b5cf6' : '#22c55e', flexShrink: 0 }}>A:</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13.5, color: '#4A2040' }}>{q.answer}</span>
                    <div style={{ fontSize: 11, color: '#8A7A87', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {q.answeredBy === 'ai' ? (
                        <span style={{ background: '#F3F0FF', color: '#8b5cf6', padding: '2px 9px', borderRadius: 50, fontWeight: 800, fontSize: 10.5 }}>🤖 AI Answer</span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 9px', borderRadius: 50, fontWeight: 800, fontSize: 10.5 }}>✅ {q.answeredBy === 'seller' ? 'Seller' : 'Sheen Bazaar'} Answer</span>
                      )}
                      <span>{new Date(q.answeredAt).toLocaleDateString()}</span>
                      <span onClick={() => markHelpful(i)} style={{ cursor: 'pointer', color: '#E91E8C', fontWeight: 700 }}>👍 Helpful ({q.helpfulCount || 0})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginLeft: 20 }}>
                  ⏳ Awaiting a reply from the seller
                  <div style={{ fontSize: 10, color: '#B0A0AC', fontWeight: 400, marginTop: 2 }}>(Our AI assistant couldn't confidently answer this from the listed product details)</div>
                </div>
              )}
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

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Baloo 2,sans-serif', marginBottom: 16 }}>🕒 Recently Viewed</h2>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {recentlyViewed.map(p => (
              <div key={p.id} onClick={() => navigate(`/products/${p.id}`)} style={{ background: '#fff', border: '1.5px solid #EFE1E7', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', flex: '0 0 160px', transition: 'all 0.2s' }}>
                <div style={{ background: 'linear-gradient(135deg,#FFF6F2,#FFE8F5)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>{p.icon || '🛍️'}</span>}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#E91E8C' }}>₹{p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
