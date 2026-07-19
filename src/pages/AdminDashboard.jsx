import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_COLORS = { placed: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', out_for_delivery: '#f97316', delivered: '#22c55e', cancelled: '#ef4444' };

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${color || '#EFE1E7'}`, borderRadius: 14, padding: '20px 22px', minWidth: 140 }}>
      <div style={{ fontSize: 12, color: '#8A7A87', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || '#2B1330' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#8A7A87', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data || Object.keys(data).length === 0) return <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No revenue data yet</div>;
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, padding: '0 8px' }}>
      {entries.map(([month, val]) => (
        <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 10, color: '#8A7A87' }}>₹{(val/1000).toFixed(0)}k</div>
          <div style={{ width: '100%', background: '#D9276B', borderRadius: '4px 4px 0 0', height: `${(val / max) * 90}px`, minHeight: 4 }} />
          <div style={{ fontSize: 10, color: '#8A7A87', whiteSpace: 'nowrap' }}>{month}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // User edit modal
  const [editUser, setEditUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [emailUser, setEmailUser] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Product add/edit modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', old: '', cat: '', desc: '', icon: '🛍️', badge: '', stock: 100 });

  // Coupon
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: '', maxUses: 100, expiresAt: '' });
  const [coupons, setCoupons] = useState([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    commissionPercent: '', siteName: '', supportEmail: '', supportPhone: '',
    address: '', whatsappNumber: '', facebookUrl: '', instagramUrl: '', twitterUrl: '', lowStockThreshold: 10
  });

  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  function showMsg(msg, isError = false) {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  }

  function loadStats() { api.adminStats().then(setStats).catch(e => setError(e.message)); }
  function loadUsers() { api.adminGetUsers().then(setUsers).catch(e => setError(e.message)); }
  function loadProducts() { api.adminGetProducts().then(setProducts).catch(e => setError(e.message)); }
  function loadOrders() { api.adminGetOrders().then(setOrders).catch(e => setError(e.message)); }
  function loadSettings() {
    api.adminGetSettings().then(s => {
      setSettings(s);
      setCoupons(s.coupons || []);
      setSettingsForm({
        commissionPercent: s.commissionPercent ?? '',
        siteName: s.siteName || '',
        supportEmail: s.supportEmail || '',
        supportPhone: s.supportPhone || '',
        address: s.address || '',
        whatsappNumber: s.whatsappNumber || '',
        facebookUrl: s.facebookUrl || '',
        instagramUrl: s.instagramUrl || '',
        twitterUrl: s.twitterUrl || '',
        lowStockThreshold: s.lowStockThreshold || 10,
      });
    }).catch(e => setError(e.message));
  }

  useEffect(() => { loadStats(); loadUsers(); loadProducts(); loadOrders(); loadSettings(); }, []);

  // Save all settings
  async function saveSettings(e) {
    e.preventDefault();
    try {
      await api.adminUpdateSettings(settingsForm);
      showMsg('Settings saved successfully!');
      loadStats(); loadSettings();
    } catch (err) { showMsg(err.message, true); }
  }

  // User actions
  async function approveSeller(id, approved) {
    await api.adminUpdateUser(id, { sellerApproved: approved });
    loadUsers(); loadStats();
    showMsg(approved ? 'Seller approved!' : 'Approval revoked');
  }
  async function makeAdmin(id) {
    if (!confirm('Promote this user to Admin? They will have full access.')) return;
    await api.adminUpdateUser(id, { role: 'admin' });
    loadUsers(); showMsg('User promoted to Admin!');
  }
  async function deleteUser(id) {
    if (!confirm('Delete this user permanently?')) return;
    await api.adminDeleteUser(id);
    loadUsers(); showMsg('User deleted');
  }
  async function saveEditUser() {
    try {
      await api.adminUpdateUser(editUser._id, editUserData);
      setEditUser(null); loadUsers(); showMsg('User updated!');
    } catch (err) { showMsg(err.message, true); }
  }
  async function resetPassword() {
    if (newPassword.length < 6) return showMsg('Password must be at least 6 characters', true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/admin/users/${resetPasswordUser._id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('bazaario_token')}` },
        body: JSON.stringify({ newPassword }),
      });
      setResetPasswordUser(null); setNewPassword(''); showMsg('Password reset successfully!');
    } catch (err) { showMsg(err.message, true); }
  }
  async function sendEmail() {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/admin/users/${emailUser._id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('bazaario_token')}` },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
      });
      setEmailUser(null); setEmailSubject(''); setEmailMessage(''); showMsg('Email sent!');
    } catch (err) { showMsg(err.message, true); }
  }

  // Export users to CSV
  function exportUsers() {
    const rows = [['Name', 'Email', 'Phone', 'Role', 'Business', 'Joined']];
    users.forEach(u => rows.push([u.name, u.email, u.phone || '', u.role, u.businessName || '', new Date(u.createdAt).toLocaleDateString()]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sheen-bazaar-users.csv'; a.click();
  }

  // Product actions
  async function saveProduct() {
    try {
      if (editProduct) {
        await api.adminUpdateProduct(editProduct.id, productForm);
        showMsg('Product updated!');
      } else {
        await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/admin/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('bazaario_token')}` },
          body: JSON.stringify({ ...productForm, price: Number(productForm.price), old: Number(productForm.old), stock: Number(productForm.stock) }),
        });
        showMsg('Product added!');
      }
      setShowAddProduct(false); setEditProduct(null);
      setProductForm({ name: '', price: '', old: '', cat: '', desc: '', icon: '🛍️', badge: '', stock: 100 });
      loadProducts();
    } catch (err) { showMsg(err.message, true); }
  }
  async function toggleProduct(p) { await api.adminUpdateProduct(p.id, { active: !p.active }); loadProducts(); }
  async function deleteProduct(p) { if (!confirm(`Delete "${p.name}"?`)) return; await api.adminDeleteProduct(p.id); loadProducts(); }

  // Orders
  async function updateOrderStatus(id, status) {
    await api.adminUpdateOrderStatus(id, status, '');
    loadOrders(); loadStats(); showMsg('Order status updated!');
  }

  // Print invoice
  function printInvoice(order) {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Invoice #${order._id.slice(-8).toUpperCase()}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:8px;text-align:left} .total{font-size:20px;font-weight:bold}</style>
      </head><body>
      <h1>🛍️ Sheen Bazaar</h1>
      <h2>Invoice #${order._id.slice(-8).toUpperCase()}</h2>
      <p><strong>Customer:</strong> ${order.user?.name || 'N/A'} (${order.user?.email || ''})</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}</p>
      <p><strong>Address:</strong> ${order.address?.fullName}, ${order.address?.addressLine}, ${order.address?.phone}</p>
      <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price * i.qty}</td></tr>`).join('')}
      </table>
      <br><p class="total">Total: ₹${order.total}</p>
      <script>window.print();</script>
      </body></html>
    `);
  }

  // Coupons
  async function addCoupon(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('bazaario_token')}` },
        body: JSON.stringify(couponForm),
      });
      const data = await res.json();
      setCoupons(data); setCouponForm({ code: '', discountPercent: '', maxUses: 100, expiresAt: '' });
      showMsg('Coupon created!');
    } catch (err) { showMsg(err.message, true); }
  }
  async function deleteCoupon(code) {
    await fetch(`${import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api'}/admin/coupons/${code}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('bazaario_token')}` },
    });
    setCoupons(c => c.filter(x => x.code !== code)); showMsg('Coupon deleted');
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredOrders = orders.filter(o => !orderStatusFilter || o.status === orderStatusFilter);

  const TABS = ['overview', 'users', 'products', 'orders', 'coupons', 'settings'];

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #EFE1E7', fontSize: 13, color: '#2B1330', background: '#fff', boxSizing: 'border-box', outline: 'none', marginBottom: 10 };
  const btn = (color = '#D9276B') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' });
  const btnOut = (color = '#D9276B') => ({ background: 'transparent', color, border: `1.5px solid ${color}`, borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2B1330', marginBottom: 20 }}>Admin Dashboard</h1>

      {error && <div style={{ background: '#FFE8F0', color: '#A8114F', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>✅ {success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === t ? '#D9276B' : '#fff', color: tab === t ? '#fff' : '#8A7A87', boxShadow: tab === t ? '0 2px 8px rgba(217,39,107,0.2)' : 'none' }}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : t === 'products' ? '📦 Products' : t === 'orders' ? '🛒 Orders' : t === 'coupons' ? '🏷️ Coupons' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard label="Customers" value={stats.customerCount} color="#3b82f6" />
            <StatCard label="Sellers" value={stats.sellerCount} color="#8b5cf6" sub={stats.pendingSellerCount > 0 ? `${stats.pendingSellerCount} pending` : null} />
            <StatCard label="Products" value={stats.productCount} color="#f59e0b" />
            <StatCard label="Orders" value={stats.orderCount} color="#f97316" />
            <StatCard label="Revenue" value={`₹${stats.collectedRevenue}`} color="#22c55e" />
            <StatCard label="Pending Revenue" value={`₹${stats.pendingRevenue}`} color="#64748b" />
            <StatCard label="Commission Earned" value={`₹${stats.commissionEarned}`} color="#D9276B" />
          </div>

          {/* Revenue Chart */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #EFE1E7' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>📊 Revenue (Last 6 Months)</h3>
            <RevenueChart data={stats.revenueByMonth} />
          </div>

          {/* Recent Orders */}
          {stats.recentOrders?.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #EFE1E7' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>🔔 Recent Orders</h3>
              {stats.recentOrders.map(o => (
                <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>#{o._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: '#8A7A87' }}>{o.user?.name} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#D9276B' }}>₹{o.total}</div>
                    <div style={{ fontSize: 11, color: STATUS_COLORS[o.status] || '#8A7A87', fontWeight: 700 }}>{o.status.replace(/_/g, ' ').toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Low Stock */}
          {stats.lowStockProducts?.length > 0 && (
            <div style={{ background: '#fff7ed', border: '1.5px solid #f97316', borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#c2410c' }}>📦 Low Stock Alerts</h3>
              {stats.lowStockProducts.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fed7aa' }}>
                  <span>{p.icon} {p.name}</span>
                  <span style={{ fontWeight: 700, color: p.stock === 0 ? '#ef4444' : '#f97316' }}>{p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input placeholder="🔍 Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ ...inp, marginBottom: 0, flex: 1, minWidth: 200 }} />
            <button onClick={exportUsers} style={btn('#22c55e')}>📋 Export CSV</button>
          </div>
          {filteredUsers.map(u => (
            <div key={u._id} style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FFF6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {u.role === 'seller' ? '📦' : u.role === 'admin' ? '🛠️' : u.role === 'reseller' ? '📢' : '🧑'}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name} <span style={{ color: '#8A7A87', fontSize: 12 }}>({u.role})</span></div>
                <div style={{ fontSize: 12, color: '#8A7A87' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}{u.businessName ? ` · ${u.businessName}` : ''}</div>
                <div style={{ fontSize: 11, color: '#8A7A87' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => { setEditUser(u); setEditUserData({ name: u.name, email: u.email, phone: u.phone || '' }); }} style={btnOut('#3b82f6')}>✏️ Edit</button>
                <button onClick={() => setResetPasswordUser(u)} style={btnOut('#8b5cf6')}>🔒 Password</button>
                <button onClick={() => { setEmailUser(u); }} style={btnOut('#f59e0b')}>✉️ Email</button>
                {u.role === 'seller' && <button onClick={() => approveSeller(u._id, !u.sellerApproved)} style={btnOut(u.sellerApproved ? '#ef4444' : '#22c55e')}>{u.sellerApproved ? 'Revoke' : '✅ Approve'}</button>}
                {u.role !== 'admin' && <button onClick={() => makeAdmin(u._id)} style={btnOut('#6c3d91')}>🛠️ Admin</button>}
                {u.role !== 'admin' && <button onClick={() => deleteUser(u._id)} style={btnOut('#ef4444')}>🗑️ Delete</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => { setShowAddProduct(true); setEditProduct(null); setProductForm({ name: '', price: '', old: '', cat: '', desc: '', icon: '🛍️', badge: '', stock: 100 }); }} style={btn()}>+ Add Product</button>
          </div>
          {products.map(p => (
            <div key={p._id} style={{ background: '#fff', border: `1.5px solid ${p.active ? '#EFE1E7' : '#fca5a5'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 28 }}>{p.icon || '🛍️'}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {!p.active && <span style={{ color: '#ef4444', fontSize: 11 }}>(Inactive)</span>}</div>
                <div style={{ fontSize: 12, color: '#8A7A87' }}>₹{p.price} · {p.cat} · Stock: {p.stock} {p.stock <= 5 ? '⚠️' : ''}</div>
                {p.seller && <div style={{ fontSize: 11, color: '#8A7A87' }}>Seller: {p.seller.businessName || p.seller.name}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => { setEditProduct(p); setShowAddProduct(true); setProductForm({ name: p.name, price: p.price, old: p.old, cat: p.cat, desc: p.desc || '', icon: p.icon || '🛍️', badge: p.badge || '', stock: p.stock }); }} style={btnOut('#3b82f6')}>✏️ Edit</button>
                <button onClick={() => toggleProduct(p)} style={btnOut(p.active ? '#ef4444' : '#22c55e')}>{p.active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => deleteProduct(p)} style={btnOut('#ef4444')}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setOrderStatusFilter('')} style={btn(orderStatusFilter === '' ? '#D9276B' : '#8A7A87')}>All</button>
            {ORDER_STATUSES.map(s => <button key={s} onClick={() => setOrderStatusFilter(s)} style={btn(orderStatusFilter === s ? STATUS_COLORS[s] : '#8A7A87')}>{s.replace(/_/g, ' ')}</button>)}
          </div>
          {filteredOrders.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No orders yet</div>}
          {filteredOrders.map(o => (
            <div key={o._id} style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>#{o._id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: '#8A7A87' }}>{o.user?.name} · {o.user?.email}</div>
                  <div style={{ fontSize: 12, color: '#8A7A87' }}>{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}</div>
                  <div style={{ fontSize: 12, color: '#8A7A87', marginTop: 4 }}>
                    {o.items.map(i => `${i.name} x${i.qty}`).join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#D9276B' }}>₹{o.total}</div>
                  <div style={{ fontSize: 11, color: STATUS_COLORS[o.status], fontWeight: 700, marginBottom: 8 }}>{o.status.replace(/_/g, ' ').toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => printInvoice(o)} style={btnOut('#3b82f6')}>🖨️ Invoice</button>
                    <select onChange={e => updateOrderStatus(o._id, e.target.value)} value={o.status} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #D9276B', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#D9276B' }}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COUPONS */}
      {tab === 'coupons' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>Create Coupon Code</h3>
            <form onSubmit={addCoupon}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Coupon Code</label><input placeholder="e.g. SAVE20" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Discount %</label><input type="number" placeholder="e.g. 20" min="1" max="100" value={couponForm.discountPercent} onChange={e => setCouponForm({ ...couponForm, discountPercent: e.target.value })} required style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Max Uses</label><input type="number" placeholder="100" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Expiry Date</label><input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} style={inp} /></div>
              </div>
              <button type="submit" style={btn()}>Create Coupon</button>
            </form>
          </div>
          <div>
            {coupons.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#8A7A87' }}>No coupons yet</div>}
            {coupons.map(c => (
              <div key={c.code} style={{ background: '#fff', border: '1.5px dashed #D9276B', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#D9276B', letterSpacing: 2 }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: '#8A7A87' }}>{c.discountPercent}% off · Used {c.uses || 0}/{c.maxUses} times{c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}</div>
                </div>
                <button onClick={() => deleteCoupon(c.code)} style={btnOut('#ef4444')}>🗑️ Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <form onSubmit={saveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Business Info */}
            <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>🏪 Business Info</h3>
              {[['siteName','Site Name'],['supportEmail','Support Email'],['supportPhone','Support Phone'],['address','Address']].map(([k, label]) => (
                <div key={k}><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>{label}</label><input value={settingsForm[k]} onChange={e => setSettingsForm({ ...settingsForm, [k]: e.target.value })} style={inp} /></div>
              ))}
            </div>
            {/* Social Media */}
            <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>📱 Social Media & Contact</h3>
              {[['whatsappNumber','WhatsApp Number (with country code)'],['facebookUrl','Facebook URL'],['instagramUrl','Instagram URL'],['twitterUrl','Twitter/X URL']].map(([k, label]) => (
                <div key={k}><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>{label}</label><input value={settingsForm[k]} onChange={e => setSettingsForm({ ...settingsForm, [k]: e.target.value })} style={inp} /></div>
              ))}
            </div>
            {/* Commission */}
            <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>💰 Commission & Stock</h3>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Commission % (platform keeps this on every sale)</label>
              <input type="number" min="0" max="100" value={settingsForm.commissionPercent} onChange={e => setSettingsForm({ ...settingsForm, commissionPercent: e.target.value })} style={inp} />
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Low Stock Alert Threshold</label>
              <input type="number" min="1" value={settingsForm.lowStockThreshold} onChange={e => setSettingsForm({ ...settingsForm, lowStockThreshold: e.target.value })} style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" style={{ ...btn(), padding: '14px 32px', fontSize: 15 }}>💾 Save All Settings</button>
          </div>
        </form>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 20px' }}>✏️ Edit User — {editUser.name}</h3>
            {[['name','Full Name'],['email','Email'],['phone','Phone']].map(([k, label]) => (
              <div key={k}><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>{label}</label><input value={editUserData[k] || ''} onChange={e => setEditUserData({ ...editUserData, [k]: e.target.value })} style={inp} /></div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={saveEditUser} style={btn()}>Save Changes</button>
              <button onClick={() => setEditUser(null)} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380 }}>
            <h3 style={{ margin: '0 0 20px' }}>🔒 Reset Password — {resetPasswordUser.name}</h3>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>New Password (min 6 chars)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" style={inp} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={resetPassword} style={btn('#8b5cf6')}>Reset Password</button>
              <button onClick={() => { setResetPasswordUser(null); setNewPassword(''); }} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL USER MODAL */}
      {emailUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 4px' }}>✉️ Email — {emailUser.name}</h3>
            <p style={{ fontSize: 12, color: '#8A7A87', marginBottom: 16 }}>{emailUser.email}</p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Subject</label>
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject..." style={inp} />
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Message</label>
            <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Your message..." rows={5} style={{ ...inp, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={sendEmail} style={btn('#f59e0b')}>Send Email</button>
              <button onClick={() => { setEmailUser(null); setEmailSubject(''); setEmailMessage(''); }} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px' }}>{editProduct ? '✏️ Edit Product' : '+ Add New Product'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['name','Product Name','text'],['price','Price (₹)','number'],['old','Original Price (₹)','number'],['cat','Category','text'],['badge','Badge (e.g. 50% OFF)','text'],['stock','Stock Quantity','number']].map(([k, label, type]) => (
                <div key={k} style={{ gridColumn: k === 'name' || k === 'cat' ? 'span 2' : 'span 1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type={type} value={productForm[k]} onChange={e => setProductForm({ ...productForm, [k]: e.target.value })} style={inp} required={['name','price','old','cat'].includes(k)} />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Emoji Icon</label>
                <input value={productForm.icon} onChange={e => setProductForm({ ...productForm, icon: e.target.value })} style={inp} placeholder="e.g. 👗" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={productForm.desc} onChange={e => setProductForm({ ...productForm, desc: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={saveProduct} style={btn()}>{editProduct ? 'Save Changes' : 'Add Product'}</button>
              <button onClick={() => { setShowAddProduct(false); setEditProduct(null); }} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
