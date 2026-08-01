import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
const ORDER_STATUSES = ['placed','confirmed','shipped','out_for_delivery','delivered','cancelled'];
const STATUS_COLORS = { placed:'#f59e0b', confirmed:'#3b82f6', shipped:'#8b5cf6', out_for_delivery:'#f97316', delivered:'#22c55e', cancelled:'#ef4444' };
const MEMBERSHIP_COLORS = { Free:'#8A7A87', Basic:'#3b82f6', Pro:'#8b5cf6', VIP:'#f59e0b' };
const COURIER_OPTIONS = ['Delhivery', 'Blue Dart', 'DTDC', 'Ekart', 'Shadowfax', 'Xpressbees', 'Amazon Logistics'];
const MEMBERSHIP_BADGES = { Free:'🆓', Basic:'🥉', Pro:'🥈', VIP:'👑' };

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

function StatCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background:'#fff', border:`2px solid ${color}22`, borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-10, right:-10, fontSize:48, opacity:0.08 }}>{icon}</div>
      <div style={{ fontSize:11, color:'#8A7A87', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color, fontFamily:'Baloo 2,sans-serif' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#8A7A87', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data || !Object.keys(data).length) return <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No revenue data yet — place some orders to see the chart!</div>;
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([,v]) => v), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:140, padding:'0 8px' }}>
      {entries.map(([month, val]) => (
        <div key={month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontSize:10, color:'#8A7A87', fontWeight:600 }}>₹{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}</div>
          <div style={{ width:'100%', background:'linear-gradient(180deg,#E91E8C,#B5006E)', borderRadius:'6px 6px 0 0', height:`${(val/max)*110}px`, minHeight:4, transition:'height 0.5s ease' }} />
          <div style={{ fontSize:10, color:'#8A7A87', whiteSpace:'nowrap' }}>{month}</div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id:'overview', label:'📊 Overview' },
  { id:'users', label:'👥 Users' },
  { id:'products', label:'📦 Products' },
  { id:'orders', label:'🛒 Orders' },
  { id:'returns', label:'↩️ Returns' },
  { id:'chat', label:'💬 Support Chat' },
  { id:'coupons', label:'🏷️ Coupons' },
  { id:'memberships', label:'👑 Memberships' },
  { id:'notifications', label:'🔔 Notifications' },
  { id:'site', label:'🎨 Site Content' },
  { id:'payments', label:'💳 Payments' },
  { id:'settings', label:'⚙️ Settings' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [siteContent, setSiteContent] = useState({});
  const [msg, setMsg] = useState({ text:'', type:'' });
  const [userSearch, setUserSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('');

  // Modals
  const [editUser, setEditUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [emailUser, setEmailUser] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name:'', price:'', old:'', cat:'', desc:'', icon:'🛍️', badge:'', stock:100 });
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [membershipForm, setMembershipForm] = useState({ name:'Basic', price:'', discountPercent:0, freeDelivery:false, prioritySupport:false, badge:'🥉', color:'#3b82f6', features:'' });
  const [notifForm, setNotifForm] = useState({ title:'', message:'', type:'info', targetRole:'all', expiresAt:'' });
  const [couponForm, setCouponForm] = useState({ code:'', discountPercent:'', maxUses:100, expiresAt:'', minOrderValue:0 });
  const [broadcastForm, setBroadcastForm] = useState({ subject:'', message:'', role:'all' });
  const [loading, setLoading] = useState(false);
  const [viewDocsUser, setViewDocsUser] = useState(null);
  const [docsData, setDocsData] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returns, setReturns] = useState([]);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [chatReply, setChatReply] = useState('');
  const [pickupModal, setPickupModal] = useState(null);
  const [pickupForm, setPickupForm] = useState({ courierPartner:'Delhivery', pickupTrackingNumber:'', scheduledDate:'' });

  function showMsg(text, type='success') { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 3500); }

  async function load(path) { const r = await authFetch(path); return r.json(); }
  async function loadAll() {
    const [s, u, p, o, sets, sc, m, n, ret, chats] = await Promise.all([
      load('/admin/stats'), load('/admin/users'), load('/admin/products'),
      load('/admin/orders'), load('/admin/settings'), load('/admin/site-content'),
      load('/admin/memberships'), load('/admin/notifications'), load('/admin/returns'),
      load('/admin/chat/threads'),
    ]);
    setStats(s); setUsers(u); setProducts(p); setOrders(o);
    setSettings(sets); setSiteContent(sc); setMemberships(m); setNotifications(n);
    if (sets.coupons) setCoupons(sets.coupons);
    setReturns(Array.isArray(ret) ? ret : []);
    setChatThreads(Array.isArray(chats) ? chats : []);
  }
  useEffect(() => { loadAll(); }, []);

  async function apiCall(path, method, body) {
    setLoading(true);
    try {
      const r = await authFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      return data;
    } finally { setLoading(false); }
  }

  // Users
  async function saveEditUser() { await apiCall(`/admin/users/${editUser._id}`, 'PATCH', editUserData); setEditUser(null); loadAll(); showMsg('User updated!'); }
  async function openThread(t) {
    const data = await apiCall(`/admin/chat/threads/${t._id}`, 'GET');
    setActiveThread(data);
    loadAll();
  }
  async function sendReply() {
    if (!chatReply.trim()) return;
    const data = await apiCall(`/admin/chat/threads/${activeThread._id}/reply`, 'POST', { text: chatReply });
    setActiveThread(data); setChatReply(''); loadAll();
  }
  async function closeThread(id) {
    await apiCall(`/admin/chat/threads/${id}/close`, 'PATCH');
    setActiveThread(null); loadAll(); showMsg('Conversation closed');
  }

  async function assignReturnPickup(orderId, courierPartner, scheduledDate) {
    await apiCall(`/admin/returns/${orderId}/assign-pickup`, 'PATCH', { courierPartner, scheduledDate });
    loadAll(); showMsg('Pickup assigned! Customer can now print their return label.');
  }
  async function rejectReturn(orderId) {
    const reason = prompt('Reason for rejecting this return:');
    if (reason === null) return;
    await apiCall(`/admin/returns/${orderId}/reject`, 'PATCH', { reason });
    loadAll(); showMsg('Return rejected');
  }
  async function completeReturn(orderId, refundMethod) {
    if (!confirm(`Confirm item received and refund via ${refundMethod === 'wallet' ? 'Wallet' : 'Original Payment Method'}?`)) return;
    await apiCall(`/admin/returns/${orderId}/complete`, 'PATCH', { refundMethod });
    loadAll(); showMsg('Return completed and refund processed!');
  }
  async function resetPw() { if (newPw.length < 6) return showMsg('Min 6 chars', 'error'); await apiCall(`/admin/users/${resetPwUser._id}/reset-password`, 'PATCH', { newPassword: newPw }); setResetPwUser(null); setNewPw(''); showMsg('Password reset!'); }
  async function sendEmail() { await apiCall(`/admin/users/${emailUser._id}/email`, 'POST', { subject: emailSubject, message: emailBody }); setEmailUser(null); showMsg('Email sent!'); }
  async function sendBroadcast(e) { e.preventDefault(); const data = await apiCall('/admin/users/broadcast-email', 'POST', broadcastForm); showMsg(`Email sent to ${data.sent} users!`); setBroadcastForm({ subject:'', message:'', role:'all' }); }
  async function deleteUser(id) { if (!confirm('Delete this user?')) return; await apiCall(`/admin/users/${id}`, 'DELETE'); loadAll(); showMsg('User deleted'); }
  async function approveSeller(id, v) { await apiCall(`/admin/users/${id}`, 'PATCH', { sellerApproved: v }); loadAll(); showMsg(v ? 'Seller approved!' : 'Approval revoked'); }
  async function makeAdmin(id) { if (!confirm('Promote to Admin?')) return; await apiCall(`/admin/users/${id}`, 'PATCH', { role: 'admin' }); loadAll(); showMsg('Promoted to Admin!'); }
  async function banUser(id, banned) { await apiCall(`/admin/users/${id}`, 'PATCH', { banned }); loadAll(); showMsg(banned ? 'User banned' : 'User unbanned'); }
  function exportUsers() {
    const rows = [['Name','Email','Phone','Role','Membership','Joined']];
    users.forEach(u => rows.push([u.name, u.email, u.phone||'', u.role, u.membershipTier||'Free', new Date(u.createdAt).toLocaleDateString()]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' })); a.download = 'users.csv'; a.click();
  }

  // Products
  async function saveProduct() {
    const body = { ...productForm, price: Number(productForm.price), old: Number(productForm.old), stock: Number(productForm.stock) };
    if (editProduct) { await apiCall(`/admin/products/${editProduct.id}`, 'PATCH', body); showMsg('Product updated!'); }
    else { await apiCall('/admin/products', 'POST', body); showMsg('Product added!'); }
    setShowAddProduct(false); setEditProduct(null); setProductForm({ name:'', price:'', old:'', cat:'', desc:'', icon:'🛍️', badge:'', stock:100 }); loadAll();
  }
  async function toggleProduct(p) { await apiCall(`/admin/products/${p.id}`, 'PATCH', { active: !p.active }); loadAll(); }
  async function deleteProduct(p) { if (!confirm(`Delete "${p.name}"?`)) return; await apiCall(`/admin/products/${p.id}`, 'DELETE'); loadAll(); showMsg('Deleted!'); }

  // Orders
  async function updateStatus(id, status) { await apiCall(`/admin/orders/${id}/status`, 'PATCH', { status }); loadAll(); showMsg('Status updated!'); }
  function printInvoice(o) {
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Invoice #${o._id.slice(-8).toUpperCase()}</title><style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}.total{font-size:20px;font-weight:bold}</style></head><body><h1>🛍️ Sheen Bazaar</h1><h2>Invoice #${o._id.slice(-8).toUpperCase()}</h2><p><b>Customer:</b> ${o.user?.name||'N/A'} (${o.user?.email||''})</p><p><b>Phone:</b> ${o.user?.phone||'N/A'}</p><p><b>Date:</b> ${new Date(o.createdAt).toLocaleDateString()}</p><p><b>Payment:</b> ${o.paymentMethod} — ${o.paymentStatus}</p><p><b>Address:</b> ${o.address?.fullName||''}, ${o.address?.addressLine||''}, ${o.address?.phone||''}</p><table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price*i.qty}</td></tr>`).join('')}</table><br><p class="total">Total: ₹${o.total}</p><script>window.print();</script></body></html>`);
  }

  function printShippingLabel(o) {
    const trackingNum = o.shipping?.trackingNumber || o._id.slice(-10).toUpperCase();
    const courier = o.shipping?.courierPartner || 'Not assigned yet';
    const codAmount = o.paymentMethod === 'COD' && o.paymentStatus !== 'paid' ? o.total : 0;
    const orderShort = o._id.slice(-8).toUpperCase();
    const itemsSummary = o.items.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.qty}`).join(', ');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Shipping Label — #${orderShort}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
      <style>
        @page { size: A6; margin: 6mm; } * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; padding: 12px; max-width: 420px; margin: auto; color: #111; }
        .label-box { border: 2px solid #111; border-radius: 8px; padding: 14px; }
        .brand-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
        .brand { font-size: 18px; font-weight: 900; } .brand span { color: #E91E8C; }
        .cod-badge { background: #111; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; }
        .prepaid-badge { background: #16a34a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; }
        .section { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #999; }
        .section:last-child { border-bottom: none; }
        .label-title { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .ship-name { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
        .ship-addr { font-size: 13px; line-height: 1.5; }
        .ship-phone { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .two-col { display: flex; gap: 16px; } .two-col > div { flex: 1; }
        .barcode-wrap { text-align: center; margin: 12px 0; }
        .order-id-big { font-size: 13px; font-weight: 800; text-align: center; letter-spacing: 2px; margin-top: 4px; }
        .items-box { background: #f5f5f5; border-radius: 6px; padding: 8px 10px; font-size: 11.5px; line-height: 1.6; }
        .footer-row { display: flex; justify-content: space-between; font-size: 11px; color: #444; margin-top: 8px; }
      </style></head><body>
        <div class="label-box">
          <div class="brand-row"><div class="brand">🛍️ Sheen<span>Bazaar</span></div>${codAmount > 0 ? `<div class="cod-badge">COD ₹${codAmount}</div>` : `<div class="prepaid-badge">PREPAID</div>`}</div>
          <div class="section"><div class="label-title">Deliver To</div><div class="ship-name">${o.address?.fullName || ''}</div><div class="ship-addr">${o.address?.addressLine || ''}<br>${o.address?.city || ''}, ${o.address?.state || ''} — ${o.address?.pincode || ''}</div><div class="ship-phone">📞 ${o.address?.phone || ''}</div></div>
          <div class="two-col section"><div><div class="label-title">Courier Partner</div><div style="font-weight:700;font-size:13px">${courier}</div></div><div><div class="label-title">Order Date</div><div style="font-weight:700;font-size:13px">${new Date(o.createdAt).toLocaleDateString()}</div></div></div>
          <div class="barcode-wrap"><svg id="barcode"></svg><div class="order-id-big">TRK: ${trackingNum}</div></div>
          <div class="section"><div class="label-title">Package Contents</div><div class="items-box">${itemsSummary}</div></div>
          <div class="section" style="border-bottom:none"><div class="label-title">Customer Contact</div><div style="font-size:12.5px; line-height:1.6"><strong>${o.user?.name || ''}</strong><br>${o.user?.email || ''}<br>Order Ref: #${orderShort}</div></div>
          <div class="footer-row"><span>Weight: ___ kg</span><span>Order #${orderShort}</span></div>
        </div>
        <script>
          window.onload = function() {
            JsBarcode("#barcode", "${trackingNum}", { format: "CODE128", width: 2, height: 50, displayValue: false, margin: 0 });
            setTimeout(() => window.print(), 300);
          };
        <\/script>
      </body></html>
    `);
  }

  // Coupons
  async function addCoupon(e) { e.preventDefault(); const data = await apiCall('/admin/coupons', 'POST', couponForm); setCoupons(data); setCouponForm({ code:'', discountPercent:'', maxUses:100, expiresAt:'', minOrderValue:0 }); showMsg('Coupon created!'); }
  async function deleteCoupon(code) { const data = await apiCall(`/admin/coupons/${code}`, 'DELETE'); setCoupons(data); showMsg('Coupon deleted'); }

  // Memberships
  async function saveMembership(e) {
    e.preventDefault();
    const body = { ...membershipForm, features: membershipForm.features.split('\n').filter(Boolean) };
    await apiCall('/admin/memberships', 'POST', body);
    setShowAddMembership(false); setMembershipForm({ name:'Basic', price:'', discountPercent:0, freeDelivery:false, prioritySupport:false, badge:'🥉', color:'#3b82f6', features:'' });
    loadAll(); showMsg('Membership plan created!');
  }
  async function deleteMembership(id) { if (!confirm('Delete this plan?')) return; await apiCall(`/admin/memberships/${id}`, 'DELETE'); loadAll(); showMsg('Deleted!'); }

  // Notifications
  async function addNotif(e) { e.preventDefault(); await apiCall('/admin/notifications', 'POST', { ...notifForm, expiresAt: notifForm.expiresAt || null }); setNotifForm({ title:'', message:'', type:'info', targetRole:'all', expiresAt:'' }); loadAll(); showMsg('Notification created!'); }
  async function toggleNotif(n) { await apiCall(`/admin/notifications/${n._id}`, 'PATCH', { isActive: !n.isActive }); loadAll(); }
  async function deleteNotif(id) { await apiCall(`/admin/notifications/${id}`, 'DELETE'); loadAll(); showMsg('Deleted!'); }

  // Settings & Site
  async function saveSettings(e) { e.preventDefault(); await apiCall('/admin/settings', 'PUT', settings); showMsg('Settings saved!'); }
  async function saveSiteContent(e) { e.preventDefault(); await apiCall('/admin/site-content', 'PUT', siteContent); showMsg('Site content saved!'); }

  const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #EFE1E7', fontSize:13, color:'#2B1330', background:'#fff', boxSizing:'border-box', outline:'none', marginBottom:10, fontFamily:'Inter,sans-serif' };
  const btn = (color='#E91E8C') => ({ background:color, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s' });
  const btnOut = (color='#E91E8C') => ({ background:'transparent', color, border:`1.5px solid ${color}`, borderRadius:8, padding:'7px 12px', fontWeight:700, fontSize:12, cursor:'pointer' });
  const label = { fontSize:12, fontWeight:700, color:'#8A7A87', display:'block', marginBottom:4 };
  const card = { background:'#fff', border:'1px solid #EFE1E7', borderRadius:14, padding:20, marginBottom:16 };

  const filteredUsers = users.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredOrders = orders.filter(o => !orderFilter || o.status === orderFilter);

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#1A0A12', fontFamily:'Baloo 2,sans-serif' }}>🛠️ Admin Panel</h1>
        <div style={{ fontSize:13, color:'#8A7A87' }}>Sheen Bazaar — Admin</div>
      </div>

      {msg.text && (
        <div style={{ background: msg.type==='error' ? '#FFE8F0' : '#e8f5e9', color: msg.type==='error' ? '#A8114F' : '#2e7d32', padding:'12px 16px', borderRadius:10, marginBottom:16, fontWeight:600, fontSize:13 }}>
          {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
        </div>
      )}

      {/* TABS */}
      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'9px 16px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background: tab===t.id ? '#E91E8C' : '#fff', color: tab===t.id ? '#fff' : '#8A7A87', boxShadow: tab===t.id ? '0 2px 8px rgba(233,30,140,0.2)' : '0 1px 4px rgba(0,0,0,0.06)', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==='overview' && stats && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
            <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue||0}`} color="#22c55e" icon="💰" />
            <StatCard label="Total Revenue" value={`₹${stats.collectedRevenue}`} color="#22c55e" icon="📈" />
            <StatCard label="Customers" value={stats.customerCount} color="#3b82f6" icon="👥" />
            <StatCard label="Sellers" value={stats.sellerCount} color="#8b5cf6" sub={stats.pendingSellerCount > 0 ? `${stats.pendingSellerCount} pending approval` : null} icon="🏬" />
            <StatCard label="Products" value={stats.productCount} color="#f59e0b" icon="📦" />
            <StatCard label="Total Orders" value={stats.orderCount} color="#f97316" icon="🛒" />
            <StatCard label="Commission" value={`₹${stats.commissionEarned}`} color="#E91E8C" icon="💎" />
            <StatCard label="Pending Revenue" value={`₹${stats.pendingRevenue}`} color="#64748b" icon="⏳" />
          </div>

          <div style={card}>
            <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700 }}>📊 Revenue — Last 6 Months</h3>
            <RevenueChart data={stats.revenueByMonth} />
          </div>

          {stats.recentOrders?.length > 0 && (
            <div style={card}>
              <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700 }}>🔔 Recent Orders</h3>
              {stats.recentOrders.map(o => (
                <div key={o._id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>#{o._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize:12, color:'#8A7A87' }}>{o.user?.name} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, color:'#E91E8C' }}>₹{o.total}</div>
                    <div style={{ fontSize:11, color: STATUS_COLORS[o.status], fontWeight:700 }}>{o.status.replace(/_/g,' ').toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats.lowStockProducts?.length > 0 && (
            <div style={{ ...card, background:'#fff7ed', border:'1.5px solid #f97316' }}>
              <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:700, color:'#c2410c' }}>📦 Low Stock Alerts</h3>
              {stats.lowStockProducts.map(p => (
                <div key={p._id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #fed7aa' }}>
                  <span>{p.icon} {p.name}</span>
                  <span style={{ fontWeight:700, color: p.stock===0 ? '#ef4444' : '#f97316' }}>{p.stock===0 ? 'OUT OF STOCK' : `${p.stock} left`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab==='users' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <input placeholder="🔍 Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ ...inp, marginBottom:0, flex:1, minWidth:200 }} />
            <button onClick={exportUsers} style={btn('#22c55e')}>📋 Export CSV</button>
          </div>

          {/* Broadcast email */}
          <div style={{ ...card, background:'#FFF6F2', border:'1.5px solid #EFE1E7' }}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700 }}>📣 Broadcast Email to Users</h4>
            <form onSubmit={sendBroadcast} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10, alignItems:'end' }}>
              <div>
                <span style={label}>Target</span>
                <select value={broadcastForm.role} onChange={e => setBroadcastForm({...broadcastForm, role:e.target.value})} style={inp}>
                  <option value="all">All Users</option>
                  <option value="customer">Customers Only</option>
                  <option value="seller">Sellers Only</option>
                  <option value="reseller">Resellers Only</option>
                </select>
              </div>
              <div>
                <span style={label}>Subject</span>
                <input value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject:e.target.value})} placeholder="Email subject..." style={inp} required />
              </div>
              <button type="submit" style={btn()}>Send</button>
            </form>
            <div>
              <span style={label}>Message</span>
              <textarea value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message:e.target.value})} placeholder="Email message..." rows={2} style={{ ...inp, resize:'vertical' }} required />
            </div>
          </div>

          {filteredUsers.map(u => (
            <div key={u._id} style={{ ...card, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#FFF6F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:'2px solid #EFE1E7' }}>
                {u.role==='admin' ? '🛠️' : u.role==='seller' ? '📦' : u.role==='reseller' ? '📢' : '🧑'}
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>
                  {u.name}
                  <span style={{ color:'#8A7A87', fontSize:12 }}> ({u.role})</span>
                  {u.membershipTier && u.membershipTier !== 'Free' && <span style={{ marginLeft:6, background: MEMBERSHIP_COLORS[u.membershipTier]+'22', color: MEMBERSHIP_COLORS[u.membershipTier], fontSize:11, padding:'2px 8px', borderRadius:50, fontWeight:700 }}>{MEMBERSHIP_BADGES[u.membershipTier]} {u.membershipTier}</span>}
                  {u.banned && <span style={{ marginLeft:6, background:'#FFE8F0', color:'#ef4444', fontSize:11, padding:'2px 8px', borderRadius:50, fontWeight:700 }}>🚫 Banned</span>}
                </div>
                <div style={{ fontSize:12, color:'#8A7A87' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
                <div style={{ fontSize:11, color:'#8A7A87' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={() => { setEditUser(u); setEditUserData({ name:u.name, email:u.email, phone:u.phone||'', membershipTier:u.membershipTier||'Free' }); }} style={btnOut('#3b82f6')}>✏️ Edit</button>
                <button onClick={() => setResetPwUser(u)} style={btnOut('#8b5cf6')}>🔒 PW</button>
                <button onClick={() => { setEmailUser(u); setEmailSubject(''); setEmailBody(''); }} style={btnOut('#f59e0b')}>✉️</button>
                {u.role==='seller' && <button onClick={() => openSellerDocs(u)} style={btnOut('#8b5cf6')}>🪪 Docs {u.sellerDocsStatus==='pending' ? '🟡' : u.sellerDocsStatus==='approved' ? '🟢' : u.sellerDocsStatus==='rejected' ? '🔴' : '⚪'}</button>}
                {u.role==='seller' && <button onClick={() => approveSeller(u._id, !u.sellerApproved)} style={btnOut(u.sellerApproved ? '#ef4444' : '#22c55e')}>{u.sellerApproved ? 'Revoke' : '✅ Approve'}</button>}
                {u.role !== 'admin' && <button onClick={() => makeAdmin(u._id)} style={btnOut('#6c3d91')}>🛠️ Admin</button>}
                {u.role !== 'admin' && <button onClick={() => banUser(u._id, !u.banned)} style={btnOut(u.banned ? '#22c55e' : '#ef4444')}>{u.banned ? '✅ Unban' : '🚫 Ban'}</button>}
                {u.role !== 'admin' && <button onClick={() => deleteUser(u._id)} style={btnOut('#ef4444')}>🗑️</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS */}
      {tab==='products' && (
        <div>
          <button onClick={() => { setShowAddProduct(true); setEditProduct(null); setProductForm({ name:'', price:'', old:'', cat:'', desc:'', icon:'🛍️', badge:'', stock:100 }); }} style={{ ...btn(), marginBottom:16 }}>+ Add Product</button>
          {products.map(p => (
            <div key={p._id} style={{ ...card, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:10, border:`1.5px solid ${p.active ? '#EFE1E7' : '#fca5a5'}` }}>
              <div style={{ fontSize:36 }}>{p.icon||'🛍️'}</div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{p.name} {!p.active && <span style={{ color:'#ef4444', fontSize:11 }}>(Inactive)</span>}</div>
                <div style={{ fontSize:12, color:'#8A7A87' }}>₹{p.price} · {p.cat} · Stock: {p.stock} {p.stock<=5?'⚠️':''}</div>
                {p.seller && <div style={{ fontSize:11, color:'#8A7A87' }}>Seller: {p.seller.businessName||p.seller.name}</div>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { setEditProduct(p); setShowAddProduct(true); setProductForm({ name:p.name, price:p.price, old:p.old||'', cat:p.cat, desc:p.desc||'', icon:p.icon||'🛍️', badge:p.badge||'', stock:p.stock }); }} style={btnOut('#3b82f6')}>✏️ Edit</button>
                <button onClick={() => toggleProduct(p)} style={btnOut(p.active?'#ef4444':'#22c55e')}>{p.active?'Deactivate':'Activate'}</button>
                <button onClick={() => deleteProduct(p)} style={btnOut('#ef4444')}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS */}
      {tab==='orders' && (
        <div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            <button onClick={() => setOrderFilter('')} style={btn(orderFilter===''?'#E91E8C':'#8A7A87')}>All ({orders.length})</button>
            {ORDER_STATUSES.map(s => <button key={s} onClick={() => setOrderFilter(s)} style={btn(orderFilter===s ? STATUS_COLORS[s] : '#8A7A87')}>{s.replace(/_/g,' ')} ({orders.filter(o=>o.status===s).length})</button>)}
          </div>
          {filteredOrders.length===0 && <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No orders</div>}
          {filteredOrders.map(o => (
            <div key={o._id} style={{ ...card, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>#{o._id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize:12, color:'#8A7A87' }}>{o.user?.name} · {o.user?.email} · {o.user?.phone}</div>
                  <div style={{ fontSize:12, color:'#8A7A87' }}>{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}</div>
                  <div style={{ fontSize:12, color:'#8A7A87', marginTop:4 }}>{o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}</div>
                  {o.address && <div style={{ fontSize:11, color:'#8A7A87' }}>📍 {o.address.addressLine}, {o.address.city}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'#E91E8C' }}>₹{o.total}</div>
                  <div style={{ fontSize:11, color: STATUS_COLORS[o.status], fontWeight:700, marginBottom:8 }}>{o.status.replace(/_/g,' ').toUpperCase()}</div>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'wrap' }}>
                    <button onClick={() => printInvoice(o)} style={btnOut('#3b82f6')}>🖨️ Invoice</button>
                    <button onClick={() => printShippingLabel(o)} style={btnOut('#1A0A12')}>🏷️ Label</button>
                    <select onChange={e => updateStatus(o._id, e.target.value)} value={o.status} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #E91E8C', fontWeight:700, fontSize:12, cursor:'pointer', color:'#E91E8C' }}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RETURNS */}
      {tab==='returns' && (
        <div>
          {returns.length === 0 && (
            <div style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
              <div style={{ fontWeight:700, fontSize:18 }}>No pending returns</div>
              <div style={{ color:'#8A7A87' }}>All caught up!</div>
            </div>
          )}
          {returns.map(o => (
            <div key={o._id} style={{ ...card, border:'1.5px solid #ec4899' }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14 }}>↩️ #{o._id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize:12, color:'#8A7A87' }}>{o.user?.name} · {o.user?.email} · {o.user?.phone}</div>
                  <div style={{ fontSize:12.5, color:'#4A2040', marginTop:4 }}><strong>Reason:</strong> {o.returnReason}</div>
                  <div style={{ fontSize:12, color:'#8A7A87', marginTop:2 }}>{o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:800, background: o.returnStatus==='requested' ? '#fef3c7' : '#dbeafe', color: o.returnStatus==='requested' ? '#b45309' : '#1d4ed8' }}>{o.returnStatus.toUpperCase()}</span>
                  <div style={{ fontWeight:800, fontSize:16, color:'#E91E8C', marginTop:6 }}>₹{o.total}</div>
                </div>
              </div>

              {o.returnStatus === 'requested' && (
                <div style={{ background:'#FFF6F2', borderRadius:10, padding:14, marginTop:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#8A7A87', marginBottom:8 }}>Assign pickup courier to approve this return</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <select id={`courier-${o._id}`} defaultValue="" style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #EFE1E7', fontSize:13, fontFamily:'Inter,sans-serif' }}>
                      <option value="" disabled>Select courier…</option>
                      {COURIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input id={`pickupdate-${o._id}`} type="date" style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #EFE1E7', fontSize:13 }} />
                    <button onClick={() => {
                      const courier = document.getElementById(`courier-${o._id}`).value;
                      const date = document.getElementById(`pickupdate-${o._id}`).value;
                      if (!courier) return showMsg('Select a courier first', 'error');
                      assignReturnPickup(o._id, courier, date);
                    }} style={btn('#ec4899')}>🚚 Approve & Assign Pickup</button>
                    <button onClick={() => rejectReturn(o._id)} style={btnOut('#ef4444')}>❌ Reject</button>
                  </div>
                </div>
              )}

              {o.returnStatus === 'approved' && (
                <div style={{ background:'#F3F0FF', borderRadius:10, padding:14, marginTop:10 }}>
                  <div style={{ fontSize:13, marginBottom:4 }}><strong>Courier:</strong> {o.returnPickup?.courierPartner}</div>
                  {o.returnPickup?.scheduledDate && <div style={{ fontSize:13, marginBottom:10 }}><strong>Pickup date:</strong> {new Date(o.returnPickup.scheduledDate).toLocaleDateString()}</div>}
                  <div style={{ fontSize:12, fontWeight:700, color:'#8A7A87', marginBottom:8 }}>Once the item is received back, complete the return and issue refund:</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button onClick={() => completeReturn(o._id, 'wallet')} style={btn('#22c55e')}>💰 Refund to Wallet</button>
                    <button onClick={() => completeReturn(o._id, 'original_payment')} style={btnOut('#3b82f6')}>💳 Refund to Original Payment</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUPPORT CHAT */}
      {tab==='chat' && (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, height:560 }}>
          {/* Thread list */}
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:14, overflowY:'auto' }}>
            {chatThreads.length===0 && <div style={{ padding:30, textAlign:'center', color:'#8A7A87', fontSize:13 }}>No conversations yet</div>}
            {chatThreads.map(t => (
              <div key={t._id} onClick={() => openThread(t)} style={{ padding:'14px 16px', borderBottom:'1px solid #F5F5F5', cursor:'pointer', background: activeThread?._id===t._id ? '#FFF6F2' : '#fff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{t.user?.name || 'Unknown'}</div>
                  {t.unreadByAdmin && <span style={{ width:8, height:8, borderRadius:'50%', background:'#E91E8C' }} />}
                </div>
                <div style={{ fontSize:11.5, color:'#8A7A87' }}>{t.user?.email}</div>
                <div style={{ fontSize:11.5, color:'#B0A0AC', marginTop:4 }}>{t.messages?.[t.messages.length-1]?.text?.slice(0,40) || 'No messages'}</div>
                <div style={{ fontSize:10, color: t.status==='closed' ? '#8A7A87' : '#22c55e', fontWeight:700, marginTop:4 }}>{t.status==='closed' ? '✓ Closed' : '● Open'}</div>
              </div>
            ))}
          </div>

          {/* Active thread */}
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:14, display:'flex', flexDirection:'column' }}>
            {!activeThread ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#8A7A87', fontSize:13 }}>Select a conversation to view</div>
            ) : (
              <>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid #EFE1E7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14 }}>{activeThread.user?.name}</div>
                    <div style={{ fontSize:12, color:'#8A7A87' }}>{activeThread.user?.email} · {activeThread.user?.phone}</div>
                  </div>
                  {activeThread.status !== 'closed' && <button onClick={() => closeThread(activeThread._id)} style={btnOut('#8A7A87')}>✓ Close</button>}
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:16, background:'#FFF6F2' }}>
                  {activeThread.messages.map((m, i) => (
                    <div key={i} style={{ display:'flex', justifyContent: m.from==='admin' ? 'flex-end' : 'flex-start', marginBottom:8 }}>
                      <div style={{ maxWidth:'70%', padding:'9px 13px', borderRadius:14, background: m.from==='admin' ? 'linear-gradient(135deg,#E91E8C,#B5006E)' : '#fff', color: m.from==='admin' ? '#fff' : '#1A0A12', fontSize:13, border: m.from==='customer' ? '1px solid #EFE1E7' : 'none' }}>
                        {m.text}
                        <div style={{ fontSize:9.5, opacity:0.6, marginTop:3 }}>{new Date(m.at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:12, borderTop:'1px solid #EFE1E7', display:'flex', gap:8 }}>
                  <input value={chatReply} onChange={e=>setChatReply(e.target.value)} onKeyDown={e=>e.key==='Enter' && sendReply()} placeholder="Type a reply…" style={{ ...inp, marginBottom:0, flex:1 }} />
                  <button onClick={sendReply} style={btn()}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* COUPONS */}
      {tab==='coupons' && (
        <div>
          <div style={card}>
            <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>Create Coupon Code</h3>
            <form onSubmit={addCoupon}>
              <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['code','Coupon Code','text','e.g. SAVE20'],['discountPercent','Discount %','number','e.g. 20'],['maxUses','Max Uses','number','100'],['minOrderValue','Min Order Value (₹)','number','0'],['expiresAt','Expiry Date','date','']].map(([k,l,t,p]) => (
                  <div key={k}><span style={label}>{l}</span><input type={t} placeholder={p} value={couponForm[k]} onChange={e => setCouponForm({...couponForm, [k]: k==='code' ? e.target.value.toUpperCase() : e.target.value})} style={inp} required={['code','discountPercent'].includes(k)} /></div>
                ))}
              </div>
              <button type="submit" style={btn()}>Create Coupon</button>
            </form>
          </div>
          {coupons.length===0 && <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No coupons yet</div>}
          {coupons.map(c => (
            <div key={c.code} style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1.5px dashed #E91E8C', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:22, color:'#E91E8C', letterSpacing:3 }}>{c.code}</div>
                <div style={{ fontSize:12, color:'#8A7A87' }}>
                  {c.discountPercent}% off
                  {c.minOrderValue > 0 ? ` · Min order ₹${c.minOrderValue}` : ''}
                  {` · Used ${c.uses||0}/${c.maxUses}`}
                  {c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <button onClick={() => deleteCoupon(c.code)} style={btnOut('#ef4444')}>🗑️ Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* MEMBERSHIPS */}
      {tab==='memberships' && (
        <div>
          <button onClick={() => setShowAddMembership(true)} style={{ ...btn(), marginBottom:16 }}>+ Create Membership Plan</button>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
            {memberships.map(m => (
              <div key={m._id} style={{ background:'#fff', border:`2px solid ${m.color}44`, borderRadius:16, padding:24, position:'relative' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>{m.badge}</div>
                <div style={{ fontWeight:800, fontSize:20, color:m.color, fontFamily:'Baloo 2,sans-serif' }}>{m.name}</div>
                <div style={{ fontSize:24, fontWeight:800, color:'#1A0A12', margin:'8px 0' }}>₹{m.price}<span style={{ fontSize:13, fontWeight:400, color:'#8A7A87' }}>/month</span></div>
                <ul style={{ fontSize:13, color:'#4A2040', padding:'0 0 0 16px', margin:'8px 0 16px' }}>
                  {m.discountPercent > 0 && <li>{m.discountPercent}% off every order</li>}
                  {m.freeDelivery && <li>Free delivery on all orders</li>}
                  {m.prioritySupport && <li>Priority customer support</li>}
                  {m.features?.map((f,i) => <li key={i}>{f}</li>)}
                </ul>
                <button onClick={() => deleteMembership(m._id)} style={{ ...btnOut('#ef4444'), fontSize:12 }}>🗑️ Delete</button>
              </div>
            ))}
            {memberships.length===0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#8A7A87' }}>
                No membership plans yet. Create your 4 tiers: Free, Basic, Pro, VIP.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab==='notifications' && (
        <div>
          <div style={card}>
            <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>Create Notification / Announcement</h3>
            <form onSubmit={addNotif}>
              <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><span style={label}>Title</span><input value={notifForm.title} onChange={e=>setNotifForm({...notifForm,title:e.target.value})} placeholder="e.g. Flat 50% off today!" style={inp} required /></div>
                <div><span style={label}>Type</span><select value={notifForm.type} onChange={e=>setNotifForm({...notifForm,type:e.target.value})} style={inp}><option value="info">ℹ️ Info</option><option value="promo">🏷️ Promo</option><option value="order">📦 Order</option><option value="alert">⚠️ Alert</option></select></div>
                <div><span style={label}>Show to</span><select value={notifForm.targetRole} onChange={e=>setNotifForm({...notifForm,targetRole:e.target.value})} style={inp}><option value="all">All Users</option><option value="customer">Customers</option><option value="seller">Sellers</option><option value="reseller">Resellers</option></select></div>
                <div><span style={label}>Expires (optional)</span><input type="date" value={notifForm.expiresAt} onChange={e=>setNotifForm({...notifForm,expiresAt:e.target.value})} style={inp} /></div>
                <div style={{ gridColumn:'span 2' }}><span style={label}>Message</span><textarea value={notifForm.message} onChange={e=>setNotifForm({...notifForm,message:e.target.value})} rows={2} placeholder="Notification message..." style={{ ...inp, resize:'vertical' }} required /></div>
              </div>
              <button type="submit" style={btn()}>Create Notification</button>
            </form>
          </div>
          {notifications.map(n => (
            <div key={n._id} style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, opacity: n.isActive ? 1 : 0.5 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{n.type==='promo'?'🏷️':n.type==='alert'?'⚠️':n.type==='order'?'📦':'ℹ️'} {n.title}</div>
                <div style={{ fontSize:12, color:'#8A7A87' }}>{n.message}</div>
                <div style={{ fontSize:11, color:'#8A7A87' }}>Target: {n.targetRole} · {n.isActive ? '✅ Active' : '❌ Inactive'}{n.expiresAt ? ` · Expires ${new Date(n.expiresAt).toLocaleDateString()}` : ''}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => toggleNotif(n)} style={btnOut(n.isActive?'#f59e0b':'#22c55e')}>{n.isActive?'Pause':'Activate'}</button>
                <button onClick={() => deleteNotif(n._id)} style={btnOut('#ef4444')}>🗑️</button>
              </div>
            </div>
          ))}
          {notifications.length===0 && <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No notifications yet</div>}
        </div>
      )}

      {/* SITE CONTENT */}
      {tab==='site' && (
        <form onSubmit={saveSiteContent}>
          <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>🏠 Hero Section</h3>
              {[['heroBadge','Hero Badge Text'],['heroTitle','Main Heading'],['heroSubtitle','Subtitle'],['heroCta','Button Text']].map(([k,l]) => (
                <div key={k}><span style={label}>{l}</span><input value={siteContent[k]||''} onChange={e=>setSiteContent({...siteContent,[k]:e.target.value})} style={inp} /></div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>📢 Announcement Bar</h3>
              <div><span style={label}>Announcement Text</span><input value={siteContent.announcementText||''} onChange={e=>setSiteContent({...siteContent,announcementText:e.target.value})} style={inp} /></div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
                <input type="checkbox" checked={!!siteContent.announcementActive} onChange={e=>setSiteContent({...siteContent,announcementActive:e.target.checked})} />
                Show Announcement Bar
              </label>
              <h4 style={{ margin:'0 0 12px', fontWeight:700 }}>⚡ Flash Sale Banner</h4>
              <div><span style={label}>Flash Sale Text</span><input value={siteContent.flashSaleText||''} onChange={e=>setSiteContent({...siteContent,flashSaleText:e.target.value})} style={inp} /></div>
              <div><span style={label}>Flash Sale Subtext</span><input value={siteContent.flashSaleSubtext||''} onChange={e=>setSiteContent({...siteContent,flashSaleSubtext:e.target.value})} style={inp} /></div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <input type="checkbox" checked={!!siteContent.flashSaleActive} onChange={e=>setSiteContent({...siteContent,flashSaleActive:e.target.checked})} />
                Show Flash Sale Banner
              </label>
            </div>
            <div style={{ ...card, gridColumn:'span 2', background:'#fff7ed', border:'1.5px solid #f97316' }}>
              <h3 style={{ margin:'0 0 12px', fontWeight:700, color:'#c2410c' }}>🚧 Maintenance Mode</h3>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                <input type="checkbox" checked={!!siteContent.maintenanceMode} onChange={e=>setSiteContent({...siteContent,maintenanceMode:e.target.checked})} />
                Enable Maintenance Mode (hides site from customers)
              </label>
              <div><span style={label}>Maintenance Message</span><input value={siteContent.maintenanceMessage||''} onChange={e=>setSiteContent({...siteContent,maintenanceMessage:e.target.value})} style={inp} /></div>
            </div>
          </div>
          <button type="submit" style={{ ...btn(), padding:'14px 32px', fontSize:15, marginTop:8 }}>💾 Save Site Content</button>
        </form>
      )}

      {/* PAYMENTS */}
      {tab==='payments' && (
        <div>
          {/* Primary gateway selector */}
          <div style={{ ...card, background:'#FFF6F2', border:'1.5px solid #E91E8C' }}>
            <h3 style={{ margin:'0 0 8px', fontWeight:700 }}>⚡ Primary Payment Gateway</h3>
            <p style={{ fontSize:13, color:'#8A7A87', marginBottom:12 }}>Customers see this gateway first. If it fails, the other one is offered automatically.</p>
            <div style={{ display:'flex', gap:10 }}>
              {['razorpay','cashfree'].map(g => (
                <button key={g} onClick={()=>setSiteContent({...siteContent,primaryGateway:g})} style={{ flex:1, padding:'14px', borderRadius:10, border:`2px solid ${siteContent.primaryGateway===g?'#E91E8C':'#EFE1E7'}`, background:siteContent.primaryGateway===g?'#FFE8F5':'#fff', fontWeight:800, fontSize:14, cursor:'pointer', color:siteContent.primaryGateway===g?'#E91E8C':'#8A7A87' }}>
                  {g==='razorpay'?'💳 Razorpay':'💰 Cashfree'} {siteContent.primaryGateway===g?'(Primary)':''}
                </button>
              ))}
            </div>
          </div>

          {/* Razorpay */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ margin:0, fontWeight:700 }}>💳 Razorpay Configuration</h3>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <input type="checkbox" checked={!!siteContent.razorpayEnabled} onChange={e=>setSiteContent({...siteContent,razorpayEnabled:e.target.checked})} /> Enabled
              </label>
            </div>
            <p style={{ fontSize:13, color:'#8A7A87', marginBottom:16 }}>Fee: 2% per transaction · Settlement: 2-3 days</p>
            <div><span style={label}>Razorpay Key ID</span><input value={siteContent.razorpayKeyId||''} onChange={e=>setSiteContent({...siteContent,razorpayKeyId:e.target.value})} placeholder="rzp_live_XXXXXXXXXX" style={inp} /></div>
            <div><span style={label}>Razorpay Key Secret</span><input type="password" value={siteContent.razorpayKeySecret||''} onChange={e=>setSiteContent({...siteContent,razorpayKeySecret:e.target.value})} placeholder="Your secret key" style={inp} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
              <input type="checkbox" checked={!!siteContent.razorpayLiveMode} onChange={e=>setSiteContent({...siteContent,razorpayLiveMode:e.target.checked})} />
              Live Mode (uncheck for test mode)
            </label>
          </div>

          {/* Cashfree */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ margin:0, fontWeight:700 }}>💰 Cashfree Configuration</h3>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <input type="checkbox" checked={!!siteContent.cashfreeEnabled} onChange={e=>setSiteContent({...siteContent,cashfreeEnabled:e.target.checked})} /> Enabled
              </label>
            </div>
            <p style={{ fontSize:13, color:'#8A7A87', marginBottom:16 }}>Fee: 1.9% per transaction · Same-day settlement available · Sign up at cashfree.com</p>
            <div><span style={label}>Cashfree App ID</span><input value={siteContent.cashfreeAppId||''} onChange={e=>setSiteContent({...siteContent,cashfreeAppId:e.target.value})} placeholder="Your Cashfree App ID" style={inp} /></div>
            <div><span style={label}>Cashfree Secret Key</span><input type="password" value={siteContent.cashfreeSecretKey||''} onChange={e=>setSiteContent({...siteContent,cashfreeSecretKey:e.target.value})} placeholder="Your Cashfree secret key" style={inp} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
              <input type="checkbox" checked={!!siteContent.cashfreeLiveMode} onChange={e=>setSiteContent({...siteContent,cashfreeLiveMode:e.target.checked})} />
              Live Mode (uncheck for sandbox/test mode)
            </label>
          </div>

          <button onClick={async()=>{await apiCall('/admin/site-content','PUT',siteContent);showMsg('Payment gateway settings saved!');}} style={{ ...btn(), padding:'14px 32px', fontSize:15, marginBottom:20 }}>💾 Save All Gateway Settings</button>

          <div style={{ ...card, background:'#f0fdf4', border:'1.5px solid #22c55e' }}>
            <h3 style={{ margin:'0 0 12px', fontWeight:700, color:'#15803d' }}>✅ How Razorpay Works on Your Site</h3>
            <ol style={{ fontSize:13, color:'#1A0A12', lineHeight:2, paddingLeft:20 }}>
              <li>Customer places order → clicks "Pay Now"</li>
              <li>Razorpay payment popup opens</li>
              <li>Customer pays via UPI, Card, Net Banking</li>
              <li>Payment verified → Order marked as Confirmed</li>
              <li>Money comes to your Razorpay account</li>
              <li>You withdraw to your bank account anytime</li>
            </ol>
            <p style={{ fontSize:13, color:'#8A7A87', marginTop:12 }}>
              Razorpay charges <strong>2% per transaction</strong>. To activate live payments, complete KYC on razorpay.com and switch to Live keys above.
            </p>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab==='settings' && (
        <form onSubmit={saveSettings}>
          <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>🏪 Business Info</h3>
              {[['siteName','Site Name'],['supportEmail','Support Email'],['supportPhone','Support Phone'],['address','Business Address']].map(([k,l]) => (
                <div key={k}><span style={label}>{l}</span><input value={settings[k]||''} onChange={e=>setSettings({...settings,[k]:e.target.value})} style={inp} /></div>
              ))}
            </div>
            <div style={{ ...card, gridColumn:'span 2' }}>
              <h3 style={{ margin:'0 0 4px', fontWeight:700 }}>📱 Social Media & Contact</h3>
              <p style={{ fontSize:12.5, color:'#8A7A87', margin:'0 0 18px' }}>These links appear in your site footer, and WhatsApp powers the floating chat button. Leave any field blank to hide that icon.</p>

              <div style={{ background:'#FFF6F2', border:'1.5px solid #E91E8C33', borderRadius:12, padding:16, marginBottom:18 }}>
                <div style={{ fontWeight:800, fontSize:13, marginBottom:10, color:'#E91E8C' }}>💬 WhatsApp Chat Button</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><span style={label}>WhatsApp Number (country code + number, no + or spaces)</span><input value={settings.whatsappNumber||''} onChange={e=>setSettings({...settings,whatsappNumber:e.target.value})} placeholder="919876543210" style={inp} /></div>
                  <div><span style={label}>Default Chat Message</span><input value={settings.whatsappMessage||''} onChange={e=>setSettings({...settings,whatsappMessage:e.target.value})} placeholder="Hi! I have a question..." style={inp} /></div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  ['facebookUrl','📘 Facebook','https://facebook.com/yourpage'],
                  ['instagramUrl','📸 Instagram','https://instagram.com/yourpage'],
                  ['twitterUrl','🐦 Twitter / X','https://x.com/yourpage'],
                  ['youtubeUrl','▶️ YouTube','https://youtube.com/@yourchannel'],
                  ['linkedinUrl','💼 LinkedIn','https://linkedin.com/company/yourpage'],
                  ['pinterestUrl','📌 Pinterest','https://pinterest.com/yourpage'],
                  ['telegramUrl','✈️ Telegram','https://t.me/yourchannel'],
                  ['threadsUrl','🧵 Threads','https://threads.net/@yourpage'],
                ].map(([k,l,ph]) => (
                  <div key={k}><span style={label}>{l}</span><input value={settings[k]||''} onChange={e=>setSettings({...settings,[k]:e.target.value})} placeholder={ph} style={inp} /></div>
                ))}
              </div>

              {/* Live preview of which icons will show in the footer */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #EFE1E7' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#8A7A87', marginBottom:8 }}>Preview — icons that will appear in your footer:</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[
                    ['facebookUrl','📘'], ['instagramUrl','📸'], ['twitterUrl','🐦'], ['youtubeUrl','▶️'],
                    ['linkedinUrl','💼'], ['pinterestUrl','📌'], ['telegramUrl','✈️'], ['threadsUrl','🧵'],
                  ].filter(([k]) => settings[k]).map(([k,icon]) => (
                    <span key={k} style={{ width:36, height:36, borderRadius:10, background:'#FFF6F2', border:'1px solid #EFE1E7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</span>
                  ))}
                  {settings.whatsappNumber && <span style={{ width:36, height:36, borderRadius:10, background:'#dcfce7', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💬</span>}
                  {![settings.facebookUrl,settings.instagramUrl,settings.twitterUrl,settings.youtubeUrl,settings.linkedinUrl,settings.pinterestUrl,settings.telegramUrl,settings.threadsUrl].some(Boolean) && <span style={{ fontSize:12, color:'#B0A0AC' }}>No social links added yet</span>}
                </div>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>💰 Commission & Stock</h3>
              <div><span style={label}>Commission % (platform keeps this on every sale)</span><input type="number" min="0" max="100" value={settings.commissionPercent||''} onChange={e=>setSettings({...settings,commissionPercent:e.target.value})} style={inp} /></div>
              <div><span style={label}>Low Stock Alert Threshold</span><input type="number" min="1" value={settings.lowStockThreshold||10} onChange={e=>setSettings({...settings,lowStockThreshold:e.target.value})} style={inp} /></div>
            </div>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>🧾 GST / Tax Settings</h3>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:14 }}>
                <input type="checkbox" checked={!!settings.gstEnabled} onChange={e=>setSettings({...settings,gstEnabled:e.target.checked})} />
                Enable GST on invoices (once you're registered)
              </label>
              <div><span style={label}>GSTIN</span><input value={settings.gstin||''} onChange={e=>setSettings({...settings,gstin:e.target.value})} placeholder="e.g. 22AAAAA0000A1Z5" style={inp} /></div>
              <div><span style={label}>GST Rate (%)</span><input type="number" min="0" max="28" value={settings.gstPercent||18} onChange={e=>setSettings({...settings,gstPercent:e.target.value})} style={inp} /></div>
              <p style={{ fontSize:11.5, color:'#8A7A87', margin:0 }}>When enabled, customer receipts show a CGST/SGST breakdown and your GSTIN — ready for GST compliance.</p>
            </div>
            <div style={card}>
              <h3 style={{ margin:'0 0 16px', fontWeight:700 }}>🎁 Refer & Earn</h3>
              <div><span style={label}>Reward Amount (₹) — credited to both referrer and new customer</span><input type="number" min="0" value={settings.referralRewardAmount||50} onChange={e=>setSettings({...settings,referralRewardAmount:e.target.value})} style={inp} /></div>
              <p style={{ fontSize:11.5, color:'#8A7A87', margin:0 }}>Paid automatically to both wallets when a referred customer completes their first paid order.</p>
            </div>
          </div>
          <button type="submit" style={{ ...btn(), padding:'14px 32px', fontSize:15 }}>💾 Save All Settings</button>
        </form>
      )}

      {/* ─── MODALS ─── */}

      {/* Edit User */}
      {editUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:420 }}>
            <h3 style={{ margin:'0 0 20px' }}>✏️ Edit — {editUser.name}</h3>
            {[['name','Full Name'],['email','Email'],['phone','Phone']].map(([k,l]) => (
              <div key={k}><span style={label}>{l}</span><input value={editUserData[k]||''} onChange={e=>setEditUserData({...editUserData,[k]:e.target.value})} style={inp} /></div>
            ))}
            <div><span style={label}>Membership Tier</span>
              <select value={editUserData.membershipTier||'Free'} onChange={e=>setEditUserData({...editUserData,membershipTier:e.target.value})} style={inp}>
                {['Free','Basic','Pro','VIP'].map(t => <option key={t} value={t}>{MEMBERSHIP_BADGES[t]} {t}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={saveEditUser} style={btn()}>Save Changes</button>
              <button onClick={() => setEditUser(null)} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password */}
      {resetPwUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:380 }}>
            <h3 style={{ margin:'0 0 20px' }}>🔒 Reset Password — {resetPwUser.name}</h3>
            <span style={label}>New Password (min 6 chars)</span>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="New password" style={inp} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={resetPw} style={btn('#8b5cf6')}>Reset</button>
              <button onClick={() => { setResetPwUser(null); setNewPw(''); }} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Email User */}
      {emailUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:440 }}>
            <h3 style={{ margin:'0 0 4px' }}>✉️ Email — {emailUser.name}</h3>
            <p style={{ fontSize:12, color:'#8A7A87', marginBottom:16 }}>{emailUser.email}</p>
            <span style={label}>Subject</span><input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} style={inp} />
            <span style={label}>Message</span><textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)} rows={4} style={{ ...inp, resize:'vertical' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={sendEmail} style={btn('#f59e0b')}>Send Email</button>
              <button onClick={() => setEmailUser(null)} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product */}
      {showAddProduct && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 20px' }}>{editProduct ? '✏️ Edit Product' : '+ Add New Product'}</h3>
            <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['name','Product Name','text',true],['price','Price (₹)','number',true],['old','Original Price (₹)','number',false],['cat','Category','text',true],['badge','Badge (e.g. 50% OFF)','text',false],['stock','Stock Qty','number',false]].map(([k,l,t,req]) => (
                <div key={k} style={{ gridColumn: ['name','cat'].includes(k) ? 'span 2' : 'span 1' }}>
                  <span style={label}>{l}</span>
                  <input type={t} value={productForm[k]} onChange={e=>setProductForm({...productForm,[k]:e.target.value})} style={inp} required={req} />
                </div>
              ))}
              <div style={{ gridColumn:'span 2' }}><span style={label}>Emoji Icon</span><input value={productForm.icon} onChange={e=>setProductForm({...productForm,icon:e.target.value})} placeholder="e.g. 👗" style={inp} /></div>
              <div style={{ gridColumn:'span 2' }}><span style={label}>Description</span><textarea value={productForm.desc} onChange={e=>setProductForm({...productForm,desc:e.target.value})} rows={3} style={{ ...inp, resize:'vertical' }} /></div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={saveProduct} style={btn()}>{editProduct ? 'Save Changes' : 'Add Product'}</button>
              <button onClick={() => { setShowAddProduct(false); setEditProduct(null); }} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Membership */}
      {showAddMembership && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 20px' }}>👑 Create Membership Plan</h3>
            <form onSubmit={saveMembership}>
              <div><span style={label}>Plan Name</span>
                <select value={membershipForm.name} onChange={e=>setMembershipForm({...membershipForm,name:e.target.value})} style={inp}>
                  {['Free','Basic','Pro','VIP'].map(t => <option key={t} value={t}>{MEMBERSHIP_BADGES[t]} {t}</option>)}
                </select>
              </div>
              <div><span style={label}>Monthly Price (₹) — 0 for Free</span><input type="number" min="0" value={membershipForm.price} onChange={e=>setMembershipForm({...membershipForm,price:e.target.value})} style={inp} required /></div>
              <div><span style={label}>Discount % on every order</span><input type="number" min="0" max="50" value={membershipForm.discountPercent} onChange={e=>setMembershipForm({...membershipForm,discountPercent:e.target.value})} style={inp} /></div>
              <div><span style={label}>Badge Emoji</span><input value={membershipForm.badge} onChange={e=>setMembershipForm({...membershipForm,badge:e.target.value})} style={inp} /></div>
              <div><span style={label}>Color (hex)</span><input type="color" value={membershipForm.color} onChange={e=>setMembershipForm({...membershipForm,color:e.target.value})} style={{ ...inp, height:44 }} /></div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                <input type="checkbox" checked={membershipForm.freeDelivery} onChange={e=>setMembershipForm({...membershipForm,freeDelivery:e.target.checked})} /> Free delivery on all orders
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                <input type="checkbox" checked={membershipForm.prioritySupport} onChange={e=>setMembershipForm({...membershipForm,prioritySupport:e.target.checked})} /> Priority customer support
              </label>
              <div><span style={label}>Extra Features (one per line)</span><textarea value={membershipForm.features} onChange={e=>setMembershipForm({...membershipForm,features:e.target.value})} rows={3} placeholder="Early access to sales&#10;Exclusive member deals&#10;Birthday bonus" style={{ ...inp, resize:'vertical' }} /></div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={btn()}>Create Plan</button>
                <button type="button" onClick={() => setShowAddMembership(false)} style={btnOut('#8A7A87')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELLER DOCS REVIEW MODAL */}
      {viewDocsUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 4px' }}>🪪 Documents — {viewDocsUser.name}</h3>
            <p style={{ fontSize:12, color:'#8A7A87', marginBottom:16 }}>{viewDocsUser.email} · {viewDocsUser.businessName}</p>
            {!docsData ? (
              <div style={{ textAlign:'center', padding:30, color:'#8A7A87' }}>Loading…</div>
            ) : docsData.status === 'not_submitted' ? (
              <div style={{ textAlign:'center', padding:30, color:'#8A7A87' }}>This seller hasn't submitted documents yet.</div>
            ) : (
              <>
                <div style={{ display:'inline-block', marginBottom:16, padding:'4px 14px', borderRadius:50, fontSize:12, fontWeight:800, background: docsData.status==='approved'?'#dcfce7':docsData.status==='rejected'?'#fee2e2':'#fef3c7', color: docsData.status==='approved'?'#16a34a':docsData.status==='rejected'?'#dc2626':'#b45309' }}>
                  {docsData.status.toUpperCase()}
                </div>
                {docsData.rejectReason && <div style={{ background:'#FFE8F0', color:'#A8114F', padding:10, borderRadius:8, marginBottom:12, fontSize:12.5 }}>Previous rejection: {docsData.rejectReason}</div>}
                <div className="admin-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                  {[['panCard','PAN Card'],['aadhaarFront','Aadhaar Front'],['aadhaarBack','Aadhaar Back'],['bankProof','Bank Proof'],['gstCertificate','GST Certificate'],['shopPhoto','Shop Photo']].map(([key,label]) => (
                    docsData.docs?.[key] ? (
                      <div key={key}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#8A7A87', marginBottom:4 }}>{label}</div>
                        <img src={docsData.docs[key]} alt={label} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:10, border:'1px solid #EFE1E7', cursor:'pointer' }} onClick={() => window.open(docsData.docs[key], '_blank')} />
                      </div>
                    ) : null
                  ))}
                </div>
                {docsData.status === 'pending' && (
                  <>
                    <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Rejection reason (only needed if rejecting)" style={inp} />
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => reviewDocs('approve')} style={btn('#22c55e')}>✅ Approve Seller</button>
                      <button onClick={() => reviewDocs('reject')} style={btn('#ef4444')}>❌ Reject</button>
                    </div>
                  </>
                )}
              </>
            )}
            <button onClick={() => { setViewDocsUser(null); setDocsData(null); setRejectReason(''); }} style={{ ...btnOut('#8A7A87'), marginTop:14, width:'100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
