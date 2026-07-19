import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const EMPTY_FORM = { name: '', icon: '🛍️', image: '', price: '', old: '', cat: 'Fashion', desc: '', stock: 100 };
const CATS = ['Fashion', 'Electronics', 'Home', 'Beauty', 'Kids', 'Jewellery', 'Footwear', 'Bags'];
const MAX_IMAGE_MB = 5;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.readAsDataURL(file);
  });
}

const STATUS_STEPS = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
const EMPTY_SHIP_FORM = { method: 'courier_pickup', courierPartner: '', trackingNumber: '' };

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('products'); // 'products' | 'orders' | 'earnings'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [couriers, setCouriers] = useState({ approvedCouriers: [], platformCourierName: '' });
  const [shipOrderId, setShipOrderId] = useState(null);
  const [shipForm, setShipForm] = useState(EMPTY_SHIP_FORM);

  function loadProducts() {
    api.sellerGetProducts().then(setProducts).catch((e) => setError(e.message));
  }
  function loadOrders() {
    api.sellerGetOrders().then(setOrders).catch((e) => setError(e.message));
  }
  function loadEarnings() {
    api.sellerGetEarnings().then(setEarnings).catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadEarnings();
    api.sellerGetCouriers().then(setCouriers).catch(() => {});
    // Poll so newly placed orders (and their payment status) show up automatically.
    const interval = setInterval(() => { loadOrders(); loadEarnings(); }, 20000);
    return () => clearInterval(interval);
  }, []);

  const newOrderCount = orders.filter((o) => o.status === 'placed').length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), old: Number(form.old) || Number(form.price), stock: Number(form.stock) };
      if (editingId) {
        await api.sellerUpdateProduct(editingId, payload);
      } else {
        await api.sellerCreateProduct(payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, icon: p.icon, image: p.image || '', price: p.price, old: p.old, cat: p.cat, desc: p.desc, stock: p.stock });
  }

  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(p) {
    await api.sellerUpdateProduct(p.id, { active: !p.active });
    loadProducts();
  }

  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.sellerDeleteProduct(p.id);
    loadProducts();
  }

  async function advanceStatus(orderId, status, extra = {}) {
    setError('');
    try {
      await api.sellerUpdateOrderStatus(orderId, { status, ...extra });
      setShipOrderId(null);
      setShipForm(EMPTY_SHIP_FORM);
      loadOrders();
      loadEarnings();
    } catch (err) {
      setError(err.message);
    }
  }

  function openShipForm(orderId) {
    setShipOrderId(orderId);
    setShipForm({ ...EMPTY_SHIP_FORM, courierPartner: couriers.approvedCouriers[0] || '' });
  }

  async function submitShipForm(orderId) {
    if (shipForm.method === 'self_ship' && !shipForm.trackingNumber.trim()) {
      setError('Enter a tracking number for the self-ship option');
      return;
    }
    await advanceStatus(orderId, 'shipped', shipForm);
  }

  return (
    <div className="container section">
      <div className="sec-title">
        <h2>Seller Dashboard — {user.businessName || user.name}</h2>
      </div>

      {!user.sellerApproved && (
        <div className="panel" style={{ marginBottom: 20, background: '#FFF8E8', borderColor: '#FFC72C' }}>
          ⏳ Your seller account is pending admin approval. You can add listings now, but they won't
          appear in the storefront until you're approved.
        </div>
      )}

      <div className="tabs" style={{ maxWidth: 460, marginBottom: 22 }}>
        <div className={`tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>My Listings</div>
        <div className={`tab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>
          Orders{newOrderCount > 0 && <span className="new-order-badge">{newOrderCount}</span>}
        </div>
        <div className={`tab${tab === 'earnings' ? ' active' : ''}`} onClick={() => setTab('earnings')}>Earnings</div>
      </div>

      {error && <p style={{ color: 'var(--pink-dark)', marginBottom: 14 }}>{error}</p>}

      {tab === 'products' && (
        <div className="shop-layout">
          <div className="panel" style={{ maxWidth: 380 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>{editingId ? 'Edit Listing' : 'Add a New Listing'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="flabel">Product Name</label>
                <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="flabel">Product Image</label>
                <label className="upload-box">
                  <input type="file" accept="image/*" onChange={handleImageSelect} />
                  {form.image ? (
                    <>
                      <div className="upload-preview"><img src={form.image} alt="Product preview" /></div>
                      <span
                        className="upload-remove"
                        onClick={(e) => { e.preventDefault(); setForm((f) => ({ ...f, image: '' })); }}
                      >
                        Remove photo
                      </span>
                    </>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="e-icon">📷</div>
                      Tap to upload a product photo (JPG/PNG, up to {MAX_IMAGE_MB}MB)
                    </div>
                  )}
                </label>
              </div>
              <div className="form-group">
                <label className="flabel">Fallback Icon (emoji, shown until a photo is added)</label>
                <input className="field" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="flabel">Category</label>
                <select className="field" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="flabel">Price (₹)</label>
                <input className="field" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="flabel">Original / Strike-through Price (₹)</label>
                <input className="field" type="number" value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="flabel">Stock</label>
                <input className="field" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="flabel">Description</label>
                <input className="field" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              </div>
              <button className="btn-primary" type="submit">{editingId ? 'Save Changes' : 'Add Listing'}</button>
              {editingId && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div>
            {products.length === 0 ? (
              <div className="empty-state"><div className="e-icon">📦</div>You haven't listed any products yet.</div>
            ) : (
              products.map((p) => (
                <div className="cart-item" key={p.id}>
                  <div className="ci-img">{p.image ? <img src={p.image} alt={p.name} /> : p.icon}</div>
                  <div className="ci-info">
                    <div className="n">{p.name} {!p.active && <span style={{ color: 'var(--muted)' }}>(inactive)</span>}</div>
                    <div className="p">₹{p.price} · {p.cat} · stock {p.stock}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px' }} onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px' }} onClick={() => toggleActive(p)}>
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px', borderColor: 'var(--pink)' }} onClick={() => deleteProduct(p)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {newOrderCount > 0 && (
            <div className="panel" style={{ marginBottom: 16, background: '#E7F8F1', borderColor: 'var(--green)' }}>
              🔔 You have {newOrderCount} new order{newOrderCount > 1 ? 's' : ''} waiting to be confirmed.
            </div>
          )}
          {orders.length === 0 ? (
            <div className="empty-state"><div className="e-icon">📬</div>No orders for your products yet.</div>
          ) : (
            orders.map((o) => {
              const stepIndex = STATUS_STEPS.indexOf(o.status);
              const nextStep = STATUS_STEPS[stepIndex + 1];
              return (
                <div className="panel" key={o._id} style={{ marginBottom: 14 }}>
                  <div className="srow">
                    <span>
                      Order #{o._id.slice(-6).toUpperCase()}
                      {o.status === 'placed' && <span className="new-order-tag">New</span>}
                    </span>
                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  {o.items.map((i) => (
                    <div className="srow" key={i.productId}>
                      <span>
                        {i.image ? <img src={i.image} alt={i.name} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} /> : `${i.icon} `}
                        {i.name} × {i.qty}
                      </span>
                      <span>₹{(i.basePrice ?? i.price) * i.qty}</span>
                    </div>
                  ))}
                  <div className="srow">
                    <span>Status</span>
                    <span style={{ textTransform: 'capitalize' }}>{o.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="srow">
                    <span>Payment</span>
                    <span>
                      {o.paymentMethod}
                      <span className={`pay-status ${o.paymentStatus}`}>
                        {o.paymentStatus === 'paid' ? '✓ Paid' : o.paymentMethod === 'COD' ? 'Collect on delivery' : 'Pending'}
                      </span>
                    </span>
                  </div>

                  {o.shipping?.method && (
                    <div className="srow">
                      <span>Shipping</span>
                      <span>
                        {o.shipping.method === 'courier_pickup' ? `📦 Picked up by ${o.shipping.courierPartner}` : `🚚 Self-shipped via ${o.shipping.courierPartner}`}
                        {o.shipping.trackingNumber && ` · ${o.shipping.trackingNumber}`}
                      </span>
                    </div>
                  )}

                  {nextStep === 'shipped' && shipOrderId !== o._id && (
                    <div style={{ marginTop: 10 }}>
                      <button className="btn-primary green" style={{ width: 'auto', padding: '9px 18px' }} onClick={() => openShipForm(o._id)}>
                        Mark as shipped
                      </button>
                    </div>
                  )}

                  {shipOrderId === o._id && (
                    <div className="panel" style={{ marginTop: 12, background: '#FBFAFB' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>How is this order shipping out?</div>
                      <div className="tabs" style={{ marginBottom: 12 }}>
                        <div
                          className={`tab${shipForm.method === 'courier_pickup' ? ' active' : ''}`}
                          onClick={() => setShipForm((f) => ({ ...f, method: 'courier_pickup' }))}
                        >
                          Courier pickup
                        </div>
                        <div
                          className={`tab${shipForm.method === 'self_ship' ? ' active' : ''}`}
                          onClick={() => setShipForm((f) => ({ ...f, method: 'self_ship', courierPartner: couriers.approvedCouriers[0] || '' }))}
                        >
                          Self-ship
                        </div>
                      </div>

                      {shipForm.method === 'courier_pickup' ? (
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                          Pack the order and hand it to {couriers.platformCourierName || "Sheen Bazaar's courier partner"} — they'll pick it up and handle delivery.
                        </p>
                      ) : (
                        <>
                          <div className="form-group">
                            <label className="flabel">Approved Courier</label>
                            <select
                              className="field"
                              value={shipForm.courierPartner}
                              onChange={(e) => setShipForm((f) => ({ ...f, courierPartner: e.target.value }))}
                            >
                              {couriers.approvedCouriers.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="flabel">Tracking Number</label>
                            <input
                              className="field"
                              value={shipForm.trackingNumber}
                              onChange={(e) => setShipForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                              placeholder="e.g. DL482910337IN"
                            />
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button className="btn-primary green" style={{ width: 'auto', padding: '9px 18px' }} onClick={() => submitShipForm(o._id)}>
                          Confirm shipment
                        </button>
                        <button className="btn-outline" style={{ width: 'auto', padding: '9px 18px' }} onClick={() => setShipOrderId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {nextStep && nextStep !== 'shipped' && o.status !== 'delivered' && o.status !== 'cancelled' && (
                    <div style={{ marginTop: 10 }}>
                      <button className="btn-primary green" style={{ width: 'auto', padding: '9px 18px' }} onClick={() => advanceStatus(o._id, nextStep)}>
                        Mark as {nextStep.replace(/_/g, ' ')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
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
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>In your business account</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>₹{earnings.paidTotal}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{earnings.paidOrders} order{earnings.paidOrders === 1 ? '' : 's'} paid</div>
                </div>
                <div className="panel" style={{ background: '#FFF8E8', borderColor: '#FFC72C' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>Pending (COD, not yet collected)</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>₹{earnings.pendingTotal}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{earnings.pendingOrders} order{earnings.pendingOrders === 1 ? '' : 's'} awaiting delivery</div>
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
                      <span>{t.paymentMethod}{t.transactionId ? ` · ${t.transactionId}` : ''}</span>
                      <span className={`pay-status ${t.paymentStatus}`}>
                        {t.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>
                    {t.paymentStatus === 'paid' && t.commission > 0 && (
                      <>
                        <div className="srow"><span>Order total</span><span>₹{t.grossAmount}</span></div>
                        <div className="srow">
                          <span>Platform commission{t.commissionPercent !== null && t.commissionPercent !== undefined ? ` (${t.commissionPercent}%)` : ''}</span>
                          <span>−₹{t.commission}</span>
                        </div>
                      </>
                    )}
                    <div className="srow total"><span>{t.paymentStatus === 'paid' ? 'Your payout' : 'Amount'}</span><span>₹{t.amount}</span></div>
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
