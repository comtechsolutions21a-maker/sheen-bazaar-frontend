import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ResellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('catalog'); // 'catalog' | 'listings' | 'orders' | 'earnings'
  const [catalog, setCatalog] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState('');
  const [priceInputs, setPriceInputs] = useState({}); // productId -> string being typed
  const [savingId, setSavingId] = useState(null);

  function loadCatalog() { api.resellerGetCatalog().then(setCatalog).catch((e) => setError(e.message)); }
  function loadListings() { api.resellerGetListings().then(setListings).catch((e) => setError(e.message)); }
  function loadOrders() { api.resellerGetOrders().then(setOrders).catch((e) => setError(e.message)); }
  function loadEarnings() { api.resellerGetEarnings().then(setEarnings).catch((e) => setError(e.message)); }

  useEffect(() => {
    loadCatalog();
    loadListings();
    loadOrders();
    loadEarnings();
  }, []);

  async function saveListing(productId, basePrice) {
    setError('');
    const raw = priceInputs[productId];
    const price = Number(raw);
    if (!raw || Number.isNaN(price) || price < basePrice) {
      setError(`Your resell price must be at least ₹${basePrice}`);
      return;
    }
    setSavingId(productId);
    try {
      await api.resellerCreateListing({ productId, resellPrice: price });
      loadCatalog();
      loadListings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function toggleListing(l) {
    await api.resellerUpdateListing(l.productId, { active: !l.active });
    loadListings();
    loadCatalog();
  }

  async function removeListing(l) {
    if (!confirm(`Stop reselling "${l.product?.name}"?`)) return;
    await api.resellerDeleteListing(l.productId);
    loadListings();
    loadCatalog();
  }

  const storefrontUrl = `${window.location.origin}/r/${user.id}`;

  return (
    <div className="container section">
      <div className="sec-title">
        <h2>Reseller Dashboard — {user.businessName || user.name}</h2>
      </div>

      <div className="panel" style={{ marginBottom: 20, background: '#F3F0FF', borderColor: '#B9A9FF' }}>
        🔗 Your storefront link: <a href={storefrontUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>{storefrontUrl}</a>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          Share this so customers can buy your resold products at your own price. You keep the markup as your commission —
          it's paid out once the customer's order is delivered and paid.
        </div>
      </div>

      <div className="tabs" style={{ maxWidth: 520, marginBottom: 22 }}>
        <div className={`tab${tab === 'catalog' ? ' active' : ''}`} onClick={() => setTab('catalog')}>Browse Products</div>
        <div className={`tab${tab === 'listings' ? ' active' : ''}`} onClick={() => setTab('listings')}>My Listings</div>
        <div className={`tab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>Orders</div>
        <div className={`tab${tab === 'earnings' ? ' active' : ''}`} onClick={() => setTab('earnings')}>Earnings</div>
      </div>

      {error && <p style={{ color: 'var(--pink-dark)', marginBottom: 14 }}>{error}</p>}

      {tab === 'catalog' && (
        <div>
          {catalog.length === 0 ? (
            <div className="empty-state"><div className="e-icon">🛍️</div>No products available to resell yet.</div>
          ) : (
            catalog.map(({ product, listing }) => (
              <div className="cart-item" key={product._id}>
                <div className="ci-img">{product.image ? <img src={product.image} alt={product.name} /> : product.icon}</div>
                <div className="ci-info">
                  <div className="n">{product.name}</div>
                  <div className="p" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    Supplier price ₹{product.price} · {product.seller?.businessName || product.seller?.name || 'Sheen Bazaar'}
                  </div>
                  {listing && (
                    <div className="p" style={{ fontSize: 12.5, color: 'var(--green)' }}>
                      Listed at ₹{listing.resellPrice} · earns ₹{listing.resellPrice - product.price} per sale
                      {!listing.active && ' (paused)'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="field"
                    type="number"
                    min={product.price}
                    step="1"
                    style={{ width: 100, padding: '8px 10px' }}
                    placeholder={`≥ ₹${product.price}`}
                    value={priceInputs[product.id] ?? (listing ? String(listing.resellPrice) : '')}
                    onChange={(e) => setPriceInputs((s) => ({ ...s, [product.id]: e.target.value }))}
                  />
                  <button
                    className="btn-outline"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    disabled={savingId === product.id}
                    onClick={() => saveListing(product.id, product.price)}
                  >
                    {listing ? 'Update' : 'Resell this'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="empty-state"><div className="e-icon">📋</div>You haven't listed any products yet — start from Browse Products.</div>
          ) : (
            listings.map((l) => (
              <div className="cart-item" key={l._id}>
                <div className="ci-img">{l.product?.image ? <img src={l.product.image} alt={l.product.name} /> : (l.product?.icon || '🛍️')}</div>
                <div className="ci-info">
                  <div className="n">{l.product?.name || 'Product removed'} {!l.active && <span style={{ color: 'var(--muted)' }}>(paused)</span>}</div>
                  <div className="p" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    You sell at ₹{l.resellPrice} · supplier price ₹{l.product?.price ?? '—'} · you earn ₹{l.commission ?? '—'} per sale
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px' }} onClick={() => toggleListing(l)}>
                    {l.active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px', borderColor: 'var(--pink)' }} onClick={() => removeListing(l)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="empty-state"><div className="e-icon">📬</div>No orders through your listings yet.</div>
          ) : (
            orders.map((o) => (
              <div className="panel" key={o._id} style={{ marginBottom: 14 }}>
                <div className="srow">
                  <span>Order #{o._id.slice(-6).toUpperCase()}</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                {o.items.map((i) => (
                  <div className="srow" key={i.productId}>
                    <span>{i.name} × {i.qty}</span>
                    <span>₹{i.price * i.qty} <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>(you earn ₹{(i.price - i.basePrice) * i.qty})</span></span>
                  </div>
                ))}
                <div className="srow">
                  <span>Status</span>
                  <span style={{ textTransform: 'capitalize' }}>{o.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="srow">
                  <span>Payment</span>
                  <span className={`pay-status ${o.paymentStatus}`}>{o.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'earnings' && (
        <div>
          {!earnings ? (
            <div className="empty-state"><div className="e-icon">💰</div>Loading earnings…</div>
          ) : (
            <>
              <div className="shop-layout" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
                <div className="panel" style={{ background: '#E7F8F1', borderColor: 'var(--green)' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>Commission paid out</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>₹{earnings.paidTotal}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{earnings.paidOrders} order{earnings.paidOrders === 1 ? '' : 's'} settled</div>
                </div>
                <div className="panel" style={{ background: '#FFF8E8', borderColor: '#FFC72C' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>Pending (order not yet paid/delivered)</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>₹{earnings.pendingTotal}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{earnings.pendingOrders} order{earnings.pendingOrders === 1 ? '' : 's'} awaiting settlement</div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Transactions</h3>
              {earnings.transactions.length === 0 ? (
                <div className="empty-state"><div className="e-icon">💳</div>No transactions yet.</div>
              ) : (
                earnings.transactions.map((t) => (
                  <div className="panel" key={t.orderId} style={{ marginBottom: 10 }}>
                    <div className="srow">
                      <span>Order #{String(t.orderId).slice(-6).toUpperCase()}</span>
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <div className="srow">
                      <span>{t.paymentMethod}</span>
                      <span className={`pay-status ${t.paymentStatus}`}>{t.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}</span>
                    </div>
                    <div className="srow total"><span>Your commission</span><span>₹{t.amount}</span></div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
