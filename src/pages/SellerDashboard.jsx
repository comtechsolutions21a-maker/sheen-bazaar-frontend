import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COURIERS = ['Delhivery', 'Blue Dart', 'DTDC', 'Ekart', 'Shadowfax', 'Xpressbees', 'Amazon Logistics'];
const CATS = ['Fashion', 'Electronics', 'Home', 'Beauty', 'Footwear', 'Jewellery', 'Bags', 'Kids', 'Sports', 'Books', 'Food', 'Other'];
const STATUS_COLORS = { placed:'#f59e0b', confirmed:'#3b82f6', packed:'#8b5cf6', shipped:'#6366f1', out_for_delivery:'#f97316', delivered:'#22c55e', cancelled:'#ef4444', return_requested:'#ec4899', returned:'#64748b' };
const TABS = ['overview', 'products', 'orders', 'returns', 'earnings'];

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 2;

function ImageUploader({ images, onChange }) {
  const ref = useRef();

  function handleFiles(files) {
    const arr = Array.from(files).slice(0, MAX_IMAGES - images.length);
    arr.forEach(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { alert(`${file.name} is too large. Max ${MAX_SIZE_MB}MB`); return; }
      const reader = new FileReader();
      reader.onload = e => onChange([...images, e.target.result]);
      reader.readAsDataURL(file);
    });
  }

  function removeImg(idx) { onChange(images.filter((_, i) => i !== idx)); }

  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
        {images.map((img, i) => (
          <div key={i} style={{ position:'relative', width:90, height:90, borderRadius:10, overflow:'hidden', border:'2px solid #EFE1E7' }}>
            <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            {i === 0 && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(233,30,140,0.85)', color:'#fff', fontSize:9, fontWeight:700, textAlign:'center', padding:'2px 0' }}>COVER</div>}
            <button onClick={() => removeImg(i)} style={{ position:'absolute', top:3, right:3, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <div onClick={() => ref.current.click()} style={{ width:90, height:90, borderRadius:10, border:'2px dashed #EFE1E7', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#FFF6F2', transition:'border-color 0.2s', fontSize:24, color:'#E91E8C' }}>
            <span>+</span>
            <span style={{ fontSize:10, color:'#8A7A87', marginTop:4 }}>Add Photo</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
      <div style={{ fontSize:11, color:'#8A7A87' }}>Max {MAX_IMAGES} photos · Each up to {MAX_SIZE_MB}MB · First photo is cover image</div>
    </div>
  );
}

const EMPTY_FORM = { name:'', price:'', old:'', cat:'', desc:'', icon:'🛍️', badge:'', stock:'100', brand:'', sku:'', deliveryDays:'5', returnDays:'7', warrantyMonths:'0', highlights:'', specifications:'', returnPolicy:'7 days easy return', images:[] };

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [msg, setMsg] = useState({ text:'', type:'' });
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [shipModal, setShipModal] = useState(null);
  const [shipData, setShipData] = useState({ method:'self_ship', courier:'Delhivery', tracking:'', trackingUrl:'' });
  const [loading, setLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('');

  function showMsg(text, type='success') { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 3000); }

  async function load() {
    const [p, o, e] = await Promise.all([
      authFetch('/seller/products').then(r => r.json()),
      authFetch('/seller/orders').then(r => r.json()),
      authFetch('/seller/earnings').then(r => r.json()),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setOrders(Array.isArray(o) ? o : []);
    setEarnings(e);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setEditProduct(null); setShowForm(true); }
  function openEdit(p) {
    setForm({ name:p.name, price:p.price, old:p.old, cat:p.cat, desc:p.desc||'', icon:p.icon||'🛍️', badge:p.badge||'', stock:p.stock, brand:p.brand||'', sku:p.sku||'', deliveryDays:p.deliveryDays||5, returnDays:p.returnDays||7, warrantyMonths:p.warrantyMonths||0, highlights:(p.highlights||[]).join('\n'), specifications:(p.specifications||[]).map(s=>`${s.key}: ${s.value}`).join('\n'), returnPolicy:p.returnPolicy||'7 days easy return', images:p.images||[] });
    setEditProduct(p); setShowForm(true);
  }

  async function saveProduct() {
    if (!form.name || !form.price || !form.cat) return showMsg('Name, price and category are required', 'error');
    setLoading(true);
    try {
      // "Material: Cotton" per line -> [{ key: 'Material', value: 'Cotton' }] for the specs table
      const parsedSpecs = form.specifications.split('\n').filter(Boolean).map(line => {
        const idx = line.indexOf(':');
        return idx === -1 ? { key: line.trim(), value: '' } : { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      });
      const body = { ...form, price:Number(form.price), old:Number(form.old)||Number(form.price), stock:Number(form.stock)||100, deliveryDays:Number(form.deliveryDays)||5, returnDays:Number(form.returnDays)||7, warrantyMonths:Number(form.warrantyMonths)||0, highlights:form.highlights.split('\n').filter(Boolean), specifications: parsedSpecs, image:form.images[0]||'' };
      if (editProduct) {
        await authFetch(`/seller/products/${editProduct.id}`, { method:'PUT', body:JSON.stringify(body) });
        showMsg('Product updated!');
      } else {
        await authFetch('/seller/products', { method:'POST', body:JSON.stringify(body) });
        showMsg('Product listed! It will go live after admin approval.');
      }
      setShowForm(false); load();
    } catch(e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function toggleProduct(p) {
    await authFetch(`/seller/products/${p.id}`, { method:'PUT', body:JSON.stringify({ active:!p.active }) });
    load(); showMsg(p.active ? 'Product deactivated' : 'Product activated');
  }
  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await authFetch(`/seller/products/${p.id}`, { method:'DELETE' });
    load(); showMsg('Product deleted');
  }

  async function confirmOrder(orderId) {
    const res = await authFetch(`/seller/orders/${orderId}/status`, { method:'PATCH', body:JSON.stringify({ status:'confirmed', note:'Order confirmed by seller' }) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); return showMsg(d.message || 'Could not confirm order', 'error'); }
    load(); showMsg('Order confirmed!');
  }
  async function packOrder(orderId) {
    const res = await authFetch(`/seller/orders/${orderId}/status`, { method:'PATCH', body:JSON.stringify({ status:'packed', note:'Order packed and ready to ship' }) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); return showMsg(d.message || 'Could not mark order as packed', 'error'); }
    load(); showMsg('Order marked as packed!');
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
        @page { size: A6; margin: 6mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; padding: 12px; max-width: 420px; margin: auto; color: #111; }
        .label-box { border: 2px solid #111; border-radius: 8px; padding: 14px; }
        .brand-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
        .brand { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
        .brand span { color: #E91E8C; }
        .cod-badge { background: #111; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; }
        .prepaid-badge { background: #16a34a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; }
        .section { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #999; }
        .section:last-child { border-bottom: none; }
        .label-title { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .ship-name { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
        .ship-addr { font-size: 13px; line-height: 1.5; }
        .ship-phone { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .two-col { display: flex; gap: 16px; }
        .two-col > div { flex: 1; }
        .barcode-wrap { text-align: center; margin: 12px 0; }
        .order-id-big { font-size: 13px; font-weight: 800; text-align: center; letter-spacing: 2px; margin-top: 4px; }
        .items-box { background: #f5f5f5; border-radius: 6px; padding: 8px 10px; font-size: 11.5px; line-height: 1.6; }
        .footer-row { display: flex; justify-content: space-between; font-size: 11px; color: #444; margin-top: 8px; }
      </style>
      </head><body>
        <div class="label-box">
          <div class="brand-row">
            <div class="brand">🛍️ Sheen<span>Bazaar</span></div>
            ${codAmount > 0 ? `<div class="cod-badge">COD ₹${codAmount}</div>` : `<div class="prepaid-badge">PREPAID</div>`}
          </div>

          <div class="section">
            <div class="label-title">Deliver To</div>
            <div class="ship-name">${o.address?.fullName || ''}</div>
            <div class="ship-addr">${o.address?.addressLine || ''}<br>${o.address?.city || ''}, ${o.address?.state || ''} — ${o.address?.pincode || ''}</div>
            <div class="ship-phone">📞 ${o.address?.phone || ''}</div>
          </div>

          <div class="two-col section">
            <div>
              <div class="label-title">Courier Partner</div>
              <div style="font-weight:700;font-size:13px">${courier}</div>
            </div>
            <div>
              <div class="label-title">Order Date</div>
              <div style="font-weight:700;font-size:13px">${new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="barcode-wrap">
            <svg id="barcode"></svg>
            <div class="order-id-big">TRK: ${trackingNum}</div>
          </div>

          <div class="section">
            <div class="label-title">Package Contents</div>
            <div class="items-box">${itemsSummary}</div>
          </div>

          <div class="section" style="border-bottom:none">
            <div class="label-title">Ship From (Seller)</div>
            <div style="font-size:12.5px; line-height:1.6">
              <strong>${o.items?.[0]?.sellerName || 'Sheen Bazaar Seller'}</strong><br>
              Order Ref: #${orderShort}
            </div>
          </div>

          <div class="footer-row">
            <span>Weight: ___ kg</span>
            <span>Order #${orderShort}</span>
          </div>
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

  async function shipOrder() {
    if (!shipData.tracking && shipData.method === 'self_ship') return showMsg('Enter tracking number', 'error');
    setLoading(true);
    try {
      await authFetch(`/seller/orders/${shipModal._id}/status`, { method:'PATCH', body:JSON.stringify({ status:'shipped', shippingMethod:shipData.method, courierPartner:shipData.courier, trackingNumber:shipData.tracking, note:`Shipped via ${shipData.courier}` }) });
      setShipModal(null); load(); showMsg('Order marked as shipped!');
    } catch(e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #EFE1E7', fontSize:13, color:'#2B1330', background:'#fff', boxSizing:'border-box', outline:'none', marginBottom:10, fontFamily:'Inter,sans-serif' };
  const btn = (color='#E91E8C') => ({ background:color, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontWeight:700, fontSize:13, cursor:'pointer' });
  const btnOut = (color='#E91E8C') => ({ background:'transparent', color, border:`1.5px solid ${color}`, borderRadius:8, padding:'7px 12px', fontWeight:700, fontSize:12, cursor:'pointer' });
  const lbl = { fontSize:12, fontWeight:700, color:'#8A7A87', display:'block', marginBottom:4 };
  const card = { background:'#fff', border:'1px solid #EFE1E7', borderRadius:14, padding:20, marginBottom:16 };

  const returnOrders = orders.filter(o => o.status === 'return_requested' || o.returnRequested);
  const filteredOrders = orders.filter(o => !orderFilter || o.status === orderFilter);

  if (!user?.sellerApproved) {
    return (
      <div style={{ maxWidth:600, margin:'80px auto', padding:40, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🪪</div>
        <h2 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, color:'#1A0A12', marginBottom:12 }}>Verification Required</h2>
        <p style={{ color:'#8A7A87', fontSize:15, lineHeight:1.7 }}>Before you can start selling, please upload your verification documents (PAN, Aadhaar, bank proof). Our team reviews submissions within 24-48 hours.</p>
        <a href="/seller-verification" style={{ display:'inline-block', marginTop:20, background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', padding:'13px 28px', borderRadius:50, fontWeight:800, fontSize:14, textDecoration:'none' }}>
          📤 Upload Documents
        </a>
        <div style={{ background:'#FFF6F2', border:'1px solid #EFE1E7', borderRadius:12, padding:20, marginTop:24, textAlign:'left' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>What happens next:</div>
          <div style={{ fontSize:14, color:'#4A2040', lineHeight:2 }}>1. Upload PAN, Aadhaar & bank proof<br/>2. Admin reviews your documents<br/>3. You get notified once approved<br/>4. Start listing products<br/>5. Customers start buying!</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A0A12', fontFamily:'Baloo 2,sans-serif', marginBottom:4 }}>📦 Seller Dashboard</h1>
          <div style={{ fontSize:13, color:'#8A7A87' }}>Welcome, {user?.name} · {user?.businessName}</div>
        </div>
        <button onClick={openAdd} style={btn()}>+ List New Product</button>
      </div>

      {msg.text && <div style={{ background:msg.type==='error'?'#FFE8F0':'#e8f5e9', color:msg.type==='error'?'#A8114F':'#2e7d32', padding:'12px 16px', borderRadius:10, marginBottom:16, fontWeight:600, fontSize:13 }}>{msg.type==='error'?'⚠️':'✅'} {msg.text}</div>}

      {/* TABS */}
      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'9px 18px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13, background:tab===t?'#E91E8C':'#fff', color:tab===t?'#fff':'#8A7A87', boxShadow:tab===t?'0 2px 8px rgba(233,30,140,0.2)':'0 1px 4px rgba(0,0,0,0.06)' }}>
            {t==='overview'?'📊 Overview':t==='products'?'🛍️ My Products':t==='orders'?`🛒 Orders (${orders.filter(o=>o.status==='placed'||o.status==='confirmed').length} new)`:t==='returns'?`↩️ Returns (${returnOrders.length})`:'💰 Earnings'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==='overview' && earnings && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              { label:'Total Earnings', value:`₹${earnings.paidTotal||0}`, color:'#22c55e', icon:'💰' },
              { label:'Pending (COD)', value:`₹${earnings.pendingTotal||0}`, color:'#f59e0b', icon:'⏳' },
              { label:'Paid Orders', value:earnings.paidOrders||0, color:'#3b82f6', icon:'✅' },
              { label:'Active Products', value:products.filter(p=>p.active).length, color:'#8b5cf6', icon:'📦' },
              { label:'New Orders', value:orders.filter(o=>o.status==='placed').length, color:'#E91E8C', icon:'🔔' },
              { label:'To Ship', value:orders.filter(o=>o.status==='confirmed'||o.status==='packed').length, color:'#f97316', icon:'🚚' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:`2px solid ${s.color}22`, borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-8, right:-8, fontSize:48, opacity:0.08 }}>{s.icon}</div>
                <div style={{ fontSize:11, color:'#8A7A87', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:'Baloo 2,sans-serif' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* New orders alert */}
          {orders.filter(o=>o.status==='placed').length > 0 && (
            <div style={{ background:'#FFF6F2', border:'2px solid #E91E8C', borderRadius:14, padding:20, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:16, color:'#E91E8C', marginBottom:12 }}>🔔 {orders.filter(o=>o.status==='placed').length} New Order{orders.filter(o=>o.status==='placed').length>1?'s':''} Waiting!</div>
              {orders.filter(o=>o.status==='placed').slice(0,3).map(o => (
                <div key={o._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #EFE1E7' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>#{o._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize:12, color:'#8A7A87' }}>{o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}</div>
                  </div>
                  <button onClick={() => confirmOrder(o._id)} style={btn()}>✅ Confirm</button>
                </div>
              ))}
              <button onClick={() => setTab('orders')} style={{ ...btnOut(), marginTop:12 }}>View All Orders →</button>
            </div>
          )}

          {/* Process guide */}
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📋 Order Flow — Step by Step</div>
            {[
              { step:1, icon:'🛒', title:'Customer Places Order', desc:'Customer buys your product and pays (Razorpay or COD). You get notified instantly.' },
              { step:2, icon:'✅', title:'You Confirm the Order', desc:'Go to Orders tab → click Confirm. This tells customer their order is accepted.' },
              { step:3, icon:'📦', title:'Pack the Product', desc:'Pack it securely. Click "Mark as Packed" so customer knows its being prepared.' },
              { step:4, icon:'🚚', title:'Ship It', desc:'Choose your courier, enter tracking number, click Ship. Customer gets tracking details.' },
              { step:5, icon:'🏠', title:'Out for Delivery', desc:'Update to "Out for Delivery" on the day of delivery. Customer gets notified.' },
              { step:6, icon:'💰', title:'Delivered & Paid', desc:'COD: mark as delivered when cash collected. Online: already paid. You get your earnings minus commission.' },
            ].map(s => (
              <div key={s.step} style={{ display:'flex', gap:14, marginBottom:14, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>Step {s.step}: {s.title}</div>
                  <div style={{ fontSize:12, color:'#8A7A87', marginTop:2 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab==='products' && (
        <div>
          {products.length === 0 && (
            <div style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🛍️</div>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No products yet</div>
              <div style={{ color:'#8A7A87', marginBottom:20 }}>Start by listing your first product</div>
              <button onClick={openAdd} style={btn()}>+ List Your First Product</button>
            </div>
          )}
          {products.map(p => (
            <div key={p._id} style={{ ...card, display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', border:`1.5px solid ${p.active?'#EFE1E7':'#fca5a5'}` }}>
              <div style={{ width:70, height:70, borderRadius:10, background:'#FFF6F2', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {(p.images?.[0]||p.image) ? <img src={p.images?.[0]||p.image} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:36 }}>{p.icon||'🛍️'}</span>}
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{p.name} {!p.active&&<span style={{ color:'#ef4444', fontSize:11 }}>(Inactive)</span>} {!p.approved&&<span style={{ color:'#f59e0b', fontSize:11 }}>(Pending Approval)</span>}</div>
                <div style={{ fontSize:12, color:'#8A7A87' }}>₹{p.price} · {p.cat} · Stock: {p.stock} {p.stock<=5?'⚠️':''}</div>
                <div style={{ fontSize:11, color:'#8A7A87' }}>Rating: ⭐{p.rating||4.0} · {p.reviewCount||0} reviews</div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button onClick={() => openEdit(p)} style={btnOut('#3b82f6')}>✏️ Edit</button>
                <button onClick={() => toggleProduct(p)} style={btnOut(p.active?'#f59e0b':'#22c55e')}>{p.active?'Deactivate':'Activate'}</button>
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
            {['','placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => setOrderFilter(s)} style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:11, background:orderFilter===s?'#E91E8C':'#fff', color:orderFilter===s?'#fff':'#8A7A87', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                {s===''?'All':s.replace(/_/g,' ')} ({s===''?orders.length:orders.filter(o=>o.status===s).length})
              </button>
            ))}
          </div>
          {filteredOrders.length===0 && <div style={{ textAlign:'center', padding:60, color:'#8A7A87' }}>No orders yet</div>}
          {filteredOrders.map(o => (
            <div key={o._id} style={{ ...card, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14 }}>#{o._id.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize:12, color:'#8A7A87' }}>{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}</div>
                  {o.address && <div style={{ fontSize:12, color:'#8A7A87', marginTop:4 }}>📍 {o.address.fullName}, {o.address.addressLine}, {o.address.city} {o.address.pincode}</div>}
                  {o.address && <div style={{ fontSize:12, color:'#8A7A87' }}>📞 {o.address.phone}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:50, fontSize:12, fontWeight:700, background:`${STATUS_COLORS[o.status]}22`, color:STATUS_COLORS[o.status] }}>{o.status.replace(/_/g,' ').toUpperCase()}</span>
                  {o.shipping?.trackingNumber && <div style={{ fontSize:11, color:'#8A7A87', marginTop:4 }}>🚚 {o.shipping.courierPartner} · {o.shipping.trackingNumber}</div>}
                </div>
              </div>

              {/* Items */}
              <div style={{ background:'#FFF6F2', borderRadius:10, padding:12, marginBottom:12 }}>
                {o.items.map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:i<o.items.length-1?'1px solid #EFE1E7':'none' }}>
                    <div style={{ width:44, height:44, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, border:'1px solid #EFE1E7' }}>
                      {item.image?<img src={item.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<span style={{ fontSize:22 }}>{item.icon||'🛍️'}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{item.name} {item.variant?<span style={{ color:'#8A7A87', fontSize:11 }}>({item.variant})</span>:''}</div>
                      <div style={{ fontSize:12, color:'#8A7A87' }}>Qty: {item.qty} · ₹{item.price} each</div>
                    </div>
                    <div style={{ fontWeight:700, color:'#E91E8C' }}>₹{item.price*item.qty}</div>
                  </div>
                ))}
              </div>

              {/* Actions based on status */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                {o.status==='placed' && <button onClick={() => confirmOrder(o._id)} style={btn()}>✅ Confirm Order</button>}
                {o.status==='confirmed' && <button onClick={() => packOrder(o._id)} style={btn('#8b5cf6')}>📦 Mark as Packed</button>}
                {['confirmed','packed','shipped','out_for_delivery','delivered'].includes(o.status) && <button onClick={() => printShippingLabel(o)} style={btn('#1A0A12')}>🏷️ Print Label</button>}
                {(o.status==='confirmed'||o.status==='packed') && <button onClick={() => { setShipModal(o); setShipData({ method:'self_ship', courier:'Delhivery', tracking:'', trackingUrl:'' }); }} style={btn('#3b82f6')}>🚚 Ship Order</button>}
                {o.status==='shipped' && <button onClick={async()=>{await authFetch(`/seller/orders/${o._id}/status`,{method:'PATCH',body:JSON.stringify({status:'out_for_delivery',note:'Out for delivery'})});load();showMsg('Updated!');}} style={btn('#f97316')}>🏃 Out for Delivery</button>}
                {o.status==='out_for_delivery' && <button onClick={async()=>{
                  const res = await authFetch(`/seller/orders/${o._id}/status`,{method:'PATCH',body:JSON.stringify({status:'delivered',note: o.paymentMethod==='COD' ? 'Delivered — cash collected' : 'Delivered'})});
                  if (!res.ok) { const d = await res.json().catch(()=>({})); return showMsg(d.message || 'Could not mark as delivered', 'error'); }
                  load();
                  showMsg(o.paymentMethod==='COD' ? '✅ Marked delivered — cash collection recorded!' : '✅ Marked as delivered!');
                }} style={btn('#22c55e')}>✅ Mark as Delivered{o.paymentMethod==='COD' ? ' (Cash Collected)' : ''}</button>}
                <span style={{ fontSize:12, color:'#8A7A87', marginLeft:'auto' }}>Payment: <strong style={{ color:o.paymentStatus==='paid'?'#22c55e':'#f59e0b' }}>{o.paymentStatus.toUpperCase()}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RETURNS */}
      {tab==='returns' && (
        <div>
          {returnOrders.length===0 ? (
            <div style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
              <div style={{ fontWeight:700, fontSize:18 }}>No return requests</div>
              <div style={{ color:'#8A7A87' }}>Great — your customers are happy!</div>
            </div>
          ) : returnOrders.map(o => (
            <div key={o._id} style={{ ...card, border:'1.5px solid #ec4899' }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#ec4899', marginBottom:8 }}>↩️ Return Request — #{o._id.slice(-8).toUpperCase()}</div>
              <div style={{ fontSize:13, color:'#8A7A87', marginBottom:12 }}>Reason: {o.returnReason || 'Not specified'}</div>
              <div style={{ fontSize:12, color:'#8A7A87', marginBottom:12 }}>Items: {o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={async()=>{await authFetch(`/seller/orders/${o._id}/return`,{method:'PATCH',body:JSON.stringify({action:'approve'})});load();showMsg('Return approved');}} style={btn('#22c55e')}>✅ Approve Return</button>
                <button onClick={async()=>{await authFetch(`/seller/orders/${o._id}/return`,{method:'PATCH',body:JSON.stringify({action:'reject'})});load();showMsg('Return rejected');}} style={btn('#ef4444')}>❌ Reject Return</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EARNINGS */}
      {tab==='earnings' && earnings && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            <div style={{ ...card, border:'2px solid #22c55e22' }}><div style={{ fontSize:11, color:'#8A7A87', fontWeight:700, marginBottom:4 }}>TOTAL EARNED</div><div style={{ fontSize:28, fontWeight:800, color:'#22c55e', fontFamily:'Baloo 2,sans-serif' }}>₹{earnings.paidTotal||0}</div><div style={{ fontSize:11, color:'#8A7A87' }}>From {earnings.paidOrders} paid orders</div></div>
            <div style={{ ...card, border:'2px solid #f59e0b22' }}><div style={{ fontSize:11, color:'#8A7A87', fontWeight:700, marginBottom:4 }}>PENDING (COD)</div><div style={{ fontSize:28, fontWeight:800, color:'#f59e0b', fontFamily:'Baloo 2,sans-serif' }}>₹{earnings.pendingTotal||0}</div><div style={{ fontSize:11, color:'#8A7A87' }}>From {earnings.pendingOrders} pending orders</div></div>
          </div>

          <div style={card}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Transaction History</div>
            {earnings.transactions?.length===0 && <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No transactions yet</div>}
            {earnings.transactions?.map((t, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #F5F5F5', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>#{String(t.orderId).slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize:12, color:'#8A7A87' }}>{new Date(t.date).toLocaleDateString()} · {t.paymentMethod}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:800, color:'#22c55e', fontSize:16 }}>₹{t.amount}</div>
                  <div style={{ fontSize:11, color:'#8A7A87' }}>Gross ₹{t.grossAmount} · Commission ₹{t.commission||0}</div>
                  <div style={{ fontSize:11, color:t.paymentStatus==='paid'?'#22c55e':'#f59e0b', fontWeight:700 }}>{t.paymentStatus.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:1000, padding:20, overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:680, margin:'20px auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:20, fontWeight:800 }}>{editProduct?'✏️ Edit Product':'📸 List New Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8A7A87' }}>×</button>
            </div>

            {/* Photos */}
            <div style={{ marginBottom:20 }}>
              <span style={lbl}>Product Photos *</span>
              <ImageUploader images={form.images} onChange={imgs => setForm({ ...form, images:imgs })} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'span 2' }}><span style={lbl}>Product Name *</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Handloom Cotton Saree" style={inp} /></div>
              <div><span style={lbl}>Selling Price (₹) *</span><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="e.g. 499" style={inp} /></div>
              <div><span style={lbl}>Original Price (₹)</span><input type="number" value={form.old} onChange={e=>setForm({...form,old:e.target.value})} placeholder="e.g. 999" style={inp} /></div>
              <div><span style={lbl}>Category *</span><select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} style={inp}><option value="">Select category</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><span style={lbl}>Stock Quantity</span><input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} style={inp} /></div>
              <div><span style={lbl}>Brand Name</span><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="e.g. Your Brand Name" style={inp} /></div>
              <div><span style={lbl}>Badge (optional)</span><input value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} placeholder="e.g. 50% OFF, NEW, BESTSELLER" style={inp} /></div>
              <div><span style={lbl}>Delivery Days</span><input type="number" value={form.deliveryDays} onChange={e=>setForm({...form,deliveryDays:e.target.value})} style={inp} /></div>
              <div><span style={lbl}>Return Days</span><input type="number" value={form.returnDays} onChange={e=>setForm({...form,returnDays:e.target.value})} style={inp} /></div>
              <div style={{ gridColumn:'span 2' }}><span style={lbl}>Product Description</span><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={3} placeholder="Describe your product in detail..." style={{ ...inp, resize:'vertical' }} /></div>
              <div style={{ gridColumn:'span 2' }}><span style={lbl}>Key Highlights (one per line)</span><textarea value={form.highlights} onChange={e=>setForm({...form,highlights:e.target.value})} rows={4} placeholder="Pure cotton fabric&#10;Hand-woven by artisans&#10;Machine washable&#10;Available in 5 colors" style={{ ...inp, resize:'vertical' }} /></div>
              <div style={{ gridColumn:'span 2' }}>
                <span style={lbl}>Specifications (one "Key: Value" per line)</span>
                <textarea value={form.specifications} onChange={e=>setForm({...form,specifications:e.target.value})} rows={4} placeholder="Material: Pure Cotton&#10;Weight: 250g&#10;Color: Blue&#10;Size: M, L, XL" style={{ ...inp, resize:'vertical' }} />
                <div style={{ fontSize:11, color:'#8A7A87', marginTop:2 }}>Shown as a specs table on the product page. Example: Material: Cotton</div>
              </div>
              <div style={{ gridColumn:'span 2' }}><span style={lbl}>Return Policy</span><input value={form.returnPolicy} onChange={e=>setForm({...form,returnPolicy:e.target.value})} style={inp} /></div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={saveProduct} disabled={loading} style={{ ...btn(), opacity:loading?0.7:1, flex:1, justifyContent:'center' }}>{loading?'Saving…':editProduct?'Save Changes':'List Product'}</button>
              <button onClick={() => setShowForm(false)} style={{ ...btnOut('#8A7A87'), flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SHIP ORDER MODAL */}
      {shipModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:440 }}>
            <h3 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:18, marginBottom:20 }}>🚚 Ship Order #{shipModal._id.slice(-8).toUpperCase()}</h3>
            <span style={lbl}>Shipping Method</span>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <button onClick={() => setShipData({...shipData, method:'self_ship'})} style={{ ...btnOut(shipData.method==='self_ship'?'#E91E8C':'#8A7A87'), flex:1 }}>📦 Self Ship</button>
              <button onClick={() => setShipData({...shipData, method:'courier_pickup'})} style={{ ...btnOut(shipData.method==='courier_pickup'?'#E91E8C':'#8A7A87'), flex:1 }}>🏪 Courier Pickup</button>
            </div>
            <span style={lbl}>Courier Partner</span>
            <select value={shipData.courier} onChange={e=>setShipData({...shipData,courier:e.target.value})} style={inp}>
              {COURIERS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <span style={lbl}>Tracking Number *</span>
            <input value={shipData.tracking} onChange={e=>setShipData({...shipData,tracking:e.target.value})} placeholder="e.g. 1234567890" style={inp} />
            <span style={lbl}>Tracking URL (optional)</span>
            <input value={shipData.trackingUrl} onChange={e=>setShipData({...shipData,trackingUrl:e.target.value})} placeholder="https://courier.com/track/..." style={inp} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={shipOrder} disabled={loading} style={btn()}>🚚 Mark as Shipped</button>
              <button onClick={() => setShipModal(null)} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
