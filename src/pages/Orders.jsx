import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useSEO } from '../utils/useSEO';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const STATUS_COLORS = { placed:'#f59e0b', confirmed:'#3b82f6', packed:'#8b5cf6', shipped:'#6366f1', out_for_delivery:'#f97316', delivered:'#22c55e', cancelled:'#ef4444', return_requested:'#ec4899', returned:'#64748b' };
const STATUS_ICONS = { placed:'🕐', confirmed:'✅', packed:'📦', shipped:'🚚', out_for_delivery:'🛵', delivered:'🎉', cancelled:'❌', return_requested:'↩️', returned:'✔️' };
const CANCELLABLE = ['placed', 'confirmed', 'packed'];

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  useSEO('My Orders', 'Track and manage your Sheen Bazaar orders.');

  function loadOrders() {
    if (!user) return;
    setLoading(true);
    api.getOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }
  useEffect(loadOrders, [user]);

  function showMsg(text) { setMsg(text); setTimeout(() => setMsg(''), 3500); }

  async function confirmCancel(orderId) {
    if (!cancelReason.trim()) return showMsg('Please tell us why you\'re cancelling');
    setBusyId(orderId);
    try {
      const res = await authFetch(`/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason: cancelReason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCancellingId(null); setCancelReason('');
      if (data.refund?.method === 'original_payment') showMsg('Order cancelled — refund sent to your original payment method.');
      else if (data.refund?.method === 'manual') showMsg('Order cancelled — our team will process your refund shortly.');
      else showMsg('Order cancelled.');
      loadOrders();
    } catch (e) { showMsg(e.message); }
    finally { setBusyId(null); }
  }

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="e-icon">🔒</div>
          Please <Link to="/login" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>log in</Link> to track your orders.
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <div className="sec-title"><h2>📋 Your Orders</h2></div>

      {msg && (
        <div style={{ background:'#FFF6F2', border:'1px solid #F0E0EC', color:'#A8114F', padding:'12px 16px', borderRadius:12, fontSize:13.5, fontWeight:600, marginBottom:18 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#8A7A87' }}>Loading your orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="e-icon">📦</div>
          No orders yet. <Link to="/products" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>Start shopping →</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {orders.map((o) => {
            const firstItem = o.items?.[0];
            const moreCount = (o.items?.length || 1) - 1;
            const color = STATUS_COLORS[o.status] || '#8A7A87';
            const canCancel = CANCELLABLE.includes(o.status);
            const isCancelling = cancellingId === o._id;

            return (
              <div key={o._id} style={{ background:'#fff', border:'1px solid #F0E0EC', borderRadius:18, padding:18, boxShadow:'0 2px 10px rgba(233,30,140,0.05)' }}>
                {/* Header row: order id/date + status pill */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#8A7A87', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4 }}>Order #{o._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize:12, color:'#B0A0AC', marginTop:2 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                  </div>
                  <span style={{ background:`${color}18`, color, fontWeight:800, fontSize:12, padding:'6px 14px', borderRadius:50, whiteSpace:'nowrap' }}>
                    {STATUS_ICONS[o.status] || '•'} {o.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>

                {/* Product preview */}
                {firstItem && (
                  <Link to={`/orders/${o._id}`} style={{ display:'flex', gap:12, alignItems:'center', textDecoration:'none', color:'inherit', marginBottom:14 }}>
                    <div style={{ width:56, height:56, borderRadius:12, background:'#FFF6F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, overflow:'hidden' }}>
                      {firstItem.image ? <img src={firstItem.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : firstItem.icon || '🛍️'}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1A0A12', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{firstItem.name}</div>
                      <div style={{ fontSize:12.5, color:'#8A7A87', marginTop:2 }}>
                        Qty {firstItem.qty}{moreCount > 0 && ` · +${moreCount} more item${moreCount > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Payment / total row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid #F5EEF2', borderBottom:'1px solid #F5EEF2', marginBottom:14 }}>
                  <div style={{ fontSize:12.5, color:'#8A7A87' }}>
                    {o.paymentMethod} · <span style={{ color: o.paymentStatus==='paid' ? '#22c55e' : o.paymentStatus==='refunded' ? '#3b82f6' : '#f59e0b', fontWeight:700 }}>{o.paymentStatus?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1A0A12' }}>₹{o.total}</div>
                </div>

                {/* Refund status, if relevant */}
                {o.refund?.processedAt && (
                  <div style={{ fontSize:12.5, color:'#16a34a', fontWeight:700, marginBottom:14 }}>✅ Refunded ₹{o.refund.amount} to your original payment method</div>
                )}
                {o.refund?.method === 'manual' && !o.refund?.processedAt && (
                  <div style={{ fontSize:12.5, color:'#d97706', fontWeight:700, marginBottom:14 }}>⏳ Refund of ₹{o.refund.amount} is being processed by our support team</div>
                )}

                {/* Actions */}
                {!isCancelling ? (
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <Link to={`/orders/${o._id}`} style={{ flex:1, minWidth:140, textAlign:'center', background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', padding:'11px 16px', borderRadius:12, fontWeight:700, fontSize:13.5, textDecoration:'none' }}>
                      📍 Track Order
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => { setCancellingId(o._id); setCancelReason(''); }}
                        style={{ flex:1, minWidth:140, background:'#fff', color:'#ef4444', border:'1.5px solid #FCA5A5', padding:'11px 16px', borderRadius:12, fontWeight:700, fontSize:13.5, cursor:'pointer' }}
                      >
                        ❌ Cancel Order
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ background:'#FFF6F2', borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Why are you cancelling?</div>
                    <textarea
                      value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                      placeholder="e.g. Ordered by mistake, found a better price…" rows={2}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #EFE1E7', fontSize:13, outline:'none', fontFamily:'Inter,sans-serif', resize:'none', boxSizing:'border-box', marginBottom:10 }}
                    />
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => confirmCancel(o._id)} disabled={busyId === o._id} style={{ flex:1, background:'#ef4444', color:'#fff', border:'none', padding:'10px 16px', borderRadius:10, fontWeight:700, fontSize:13, cursor: busyId === o._id ? 'not-allowed' : 'pointer', opacity: busyId === o._id ? 0.7 : 1 }}>
                        {busyId === o._id ? 'Cancelling…' : 'Confirm Cancellation'}
                      </button>
                      <button onClick={() => setCancellingId(null)} style={{ flex:1, background:'#fff', color:'#8A7A87', border:'1.5px solid #EFE1E7', padding:'10px 16px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                        Never mind
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
