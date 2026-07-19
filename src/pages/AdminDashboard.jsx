import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview'); // overview | users | products | orders | settings
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  // Step 7 — Commission: the rate is entered manually by the admin here — there's
  // no built-in default the app falls back to.
  const [commissionInput, setCommissionInput] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionSaved, setCommissionSaved] = useState(false);

  function loadStats() { api.adminStats().then(setStats).catch((e) => setError(e.message)); }
  function loadUsers() { api.adminGetUsers().then(setUsers).catch((e) => setError(e.message)); }
  function loadProducts() { api.adminGetProducts().then(setProducts).catch((e) => setError(e.message)); }
  function loadOrders() { api.adminGetOrders().then(setOrders).catch((e) => setError(e.message)); }
  function loadSettings() {
    api.adminGetSettings()
      .then((s) => setCommissionInput(s.commissionPercent === null || s.commissionPercent === undefined ? '' : String(s.commissionPercent)))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadStats();
    loadUsers();
    loadProducts();
    loadOrders();
    loadSettings();
  }, []);

  async function saveCommission(e) {
    e.preventDefault();
    setError('');
    setCommissionSaved(false);
    if (commissionInput === '' || Number.isNaN(Number(commissionInput))) {
      setError('Enter a commission percentage between 0 and 100');
      return;
    }
    setSavingCommission(true);
    try {
      await api.adminUpdateSettings({ commissionPercent: Number(commissionInput) });
      setCommissionSaved(true);
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCommission(false);
    }
  }

  async function approveSeller(id, approved) {
    await api.adminUpdateUser(id, { sellerApproved: approved });
    loadUsers();
    loadStats();
  }
  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    await api.adminDeleteUser(id);
    loadUsers();
  }
  async function toggleProductActive(p) {
    await api.adminUpdateProduct(p.id, { active: !p.active });
    loadProducts();
  }
  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.adminDeleteProduct(p.id);
    loadProducts();
  }
  async function setOrderStatus(id, status) {
    await api.adminUpdateOrderStatus(id, status);
    loadOrders();
    loadStats();
  }

  return (
    <div className="container section">
      <div className="sec-title"><h2>Admin Dashboard</h2></div>
      {error && <p style={{ color: 'var(--pink-dark)', marginBottom: 14 }}>{error}</p>}

      <div className="tabs" style={{ maxWidth: 520, marginBottom: 22 }}>
        {['overview', 'users', 'products', 'orders', 'settings'].map((t) => (
          <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </div>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <StatCard label="Customers" value={stats.customerCount} />
          <StatCard label="Sellers" value={stats.sellerCount} />
          <StatCard label="Pending seller approvals" value={stats.pendingSellerCount} highlight={stats.pendingSellerCount > 0} />
          <StatCard label="Products" value={stats.productCount} />
          <StatCard label="Orders" value={stats.orderCount} />
          <StatCard label="Revenue Collected" value={`₹${stats.collectedRevenue}`} />
          <StatCard label="Pending (COD not yet delivered)" value={`₹${stats.pendingRevenue}`} />
          <StatCard
            label={`Commission Earned${stats.commissionPercent !== null && stats.commissionPercent !== undefined ? ` (${stats.commissionPercent}%)` : ''}`}
            value={`₹${stats.commissionEarned}`}
            highlight={stats.commissionPercent === null || stats.commissionPercent === undefined}
          />
          <StatCard label="Reseller Commission Paid" value={`₹${stats.resellerPayouts}`} />
        </div>
      )}
      {tab === 'overview' && stats && (stats.commissionPercent === null || stats.commissionPercent === undefined) && (
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          ⚠️ No commission rate set yet — suppliers are currently getting paid in full. Set one under the Settings tab.
        </p>
      )}

      {tab === 'users' && (
        <div>
          {users.map((u) => (
            <div className="cart-item" key={u._id}>
              <div className="ci-img">{u.role === 'seller' ? '📦' : u.role === 'reseller' ? '📢' : u.role === 'admin' ? '🛠️' : '🧑'}</div>
              <div className="ci-info">
                <div className="n">{u.name} <span style={{ color: 'var(--muted)' }}>({u.role})</span></div>
                <div className="p" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {u.email}{u.businessName ? ` · ${u.businessName}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 260 }}>
                {u.role === 'seller' && (
                  <button
                    className="btn-outline"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    onClick={() => approveSeller(u._id, !u.sellerApproved)}
                  >
                    {u.sellerApproved ? 'Revoke approval' : 'Approve seller'}
                  </button>
                )}
                {u.role !== 'admin' && (
                  <button
                    className="btn-outline"
                    style={{ width: 'auto', padding: '8px 12px', borderColor: 'var(--pink)' }}
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div>
          {products.map((p) => (
            <div className="cart-item" key={p._id}>
              <div className="ci-img">{p.image ? <img src={p.image} alt={p.name} /> : p.icon}</div>
              <div className="ci-info">
                <div className="n">{p.name} {!p.active && <span style={{ color: 'var(--muted)' }}>(inactive)</span>}</div>
                <div className="p" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  ₹{p.price} · {p.cat} · {p.seller ? `Seller: ${p.seller.businessName || p.seller.name}` : 'Platform listing'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px' }} onClick={() => toggleProductActive(p)}>
                  {p.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-outline" style={{ width: 'auto', padding: '8px 12px', borderColor: 'var(--pink)' }} onClick={() => deleteProduct(p)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {orders.map((o) => (
            <div className="panel" key={o._id} style={{ marginBottom: 14 }}>
              <div className="srow">
                <span>Order #{o._id.slice(-6).toUpperCase()} — {o.user?.name || 'Unknown'}</span>
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="srow"><span>{o.items.length} item(s)</span><span>₹{o.total}</span></div>
              <div className="srow" style={{ alignItems: 'center' }}>
                <span>Status</span>
                <select
                  className="field"
                  style={{ width: 'auto', padding: '6px 10px' }}
                  value={o.status}
                  onChange={(e) => setOrderStatus(o._id, e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'settings' && (
        <div className="panel" style={{ maxWidth: 420 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Commission (Step 7)</h3>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
            On every paid order, the platform keeps this percentage and transfers the rest to the
            supplier. Enter the rate you want to use — nothing is applied automatically.
          </p>
          <form onSubmit={saveCommission}>
            <div className="form-group">
              <label className="flabel">Commission Percentage</label>
              <input
                className="field"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter a percentage, e.g. 12"
                value={commissionInput}
                onChange={(e) => { setCommissionInput(e.target.value); setCommissionSaved(false); }}
                required
              />
            </div>
            <button className="btn-primary green" type="submit" style={{ width: 'auto', padding: '9px 18px' }} disabled={savingCommission}>
              {savingCommission ? 'Saving…' : 'Save Commission Rate'}
            </button>
            {commissionSaved && <span style={{ marginLeft: 12, fontSize: 12.5, color: 'var(--green)' }}>✓ Saved</span>}
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="panel" style={highlight ? { borderColor: 'var(--yellow)', background: '#FFFBEF' } : undefined}>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Baloo 2', sans-serif", marginTop: 6 }}>{value}</div>
    </div>
  );
}
