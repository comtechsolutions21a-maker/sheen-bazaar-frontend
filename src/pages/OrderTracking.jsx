import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '🧾' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'packed', label: 'Packed', icon: '📦' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🏠' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

const STATUS_COLORS = { placed:'#f59e0b', confirmed:'#3b82f6', packed:'#8b5cf6', shipped:'#6366f1', out_for_delivery:'#f97316', delivered:'#22c55e', cancelled:'#ef4444', return_requested:'#ec4899', returned:'#64748b' };

export default function OrderTracking() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  function showMsg(text, type = 'success') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3500); }

  async function cancelOrder() {
    setLoading(true);
    try {
      const res = await authFetch(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: cancelReason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrder(data); setShowCancelForm(false); setCancelReason('');
      showMsg('Order cancelled. Refund (if applicable) has been credited to your wallet.');
    } catch (e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  function buyAgain() {
    order.items.forEach(item => {
      addToCart({ id: item.productId, name: item.name, icon: item.icon, image: item.image, price: item.price, old: item.price, variant: item.variant }, item.qty);
    });
    showMsg('Items added to your cart! 🛒');
  }


  function load() { api.getOrder(id).then(setOrder).catch(e => setError(e.message)); }
  useEffect(() => { load(); }, [id]);

  async function requestReturn() {
    if (!returnReason.trim()) return showMsg('Please tell us the reason', 'error');
    setLoading(true);
    try {
      const res = await authFetch(`/orders/${id}/return`, { method: 'POST', body: JSON.stringify({ reason: returnReason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrder(data); setShowReturnForm(false); setReturnReason('');
      showMsg('Return request submitted! We\'ll review it shortly.');
    } catch (e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  const [taxConfig, setTaxConfig] = useState({ gstEnabled: false, gstin: '', gstPercent: 18 });

  useEffect(() => {
    fetch(`${BASE}/admin/public/tax-config`).then(r => r.json()).then(setTaxConfig).catch(() => {});
  }, []);

  function downloadReceipt() {
    const o = order;
    const gstOn = taxConfig.gstEnabled;
    const gstRate = taxConfig.gstPercent || 18;
    // Grand total is treated as tax-inclusive; back-calculate the base amount and GST split for display.
    const baseAmount = gstOn ? +(o.total / (1 + gstRate / 100)).toFixed(2) : o.total;
    const gstAmount = gstOn ? +(o.total - baseAmount).toFixed(2) : 0;
    const cgst = +(gstAmount / 2).toFixed(2);
    const sgst = +(gstAmount / 2).toFixed(2);

    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Receipt #${o._id.slice(-8).toUpperCase()}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:36px;max-width:560px;margin:auto;color:#1A0A12}
        .brand{font-size:22px;font-weight:900} .brand span{color:#E91E8C}
        h2{font-size:16px;margin:16px 0 8px;border-bottom:2px solid #eee;padding-bottom:6px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
        .total{font-size:19px;font-weight:800;text-align:right;margin-top:10px}
        .meta{font-size:13px;color:#555;line-height:1.8}
        .paid{color:#16a34a;font-weight:700}
        .foot{margin-top:24px;font-size:11px;color:#999;text-align:center}
        .tax-table td{font-size:12.5px}
      </style></head><body>
        <div class="brand">🛍️ Sheen<span>Bazaar</span></div>
        <h2>${gstOn ? 'Tax Invoice' : 'Payment Receipt'}</h2>
        <div class="meta">
          Order ID: <strong>#${o._id.slice(-8).toUpperCase()}</strong><br>
          Date: ${new Date(o.createdAt).toLocaleString()}<br>
          Payment Method: ${o.paymentMethod} — <span class="paid">${o.paymentStatus.toUpperCase()}</span><br>
          ${o.transactionId ? `Transaction ID: ${o.transactionId}<br>` : ''}
          ${gstOn && taxConfig.gstin ? `Seller GSTIN: <strong>${taxConfig.gstin}</strong><br>` : ''}
          Delivered To: ${o.address?.fullName || ''}, ${o.address?.addressLine || ''}, ${o.address?.city || ''} ${o.address?.pincode || ''}
        </div>
        <h2>Items</h2>
        <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${o.items.map(i => `<tr><td>${i.name}${i.variant ? ` (${i.variant})` : ''}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price * i.qty}</td></tr>`).join('')}
        </table>
        <div class="meta" style="margin-top:10px">
          Items Total: ₹${o.itemsTotal}<br>
          Delivery Fee: ${o.deliveryFee === 0 ? 'FREE' : `₹${o.deliveryFee}`}<br>
          ${o.discount > 0 ? `Discount: −₹${o.discount}<br>` : ''}
        </div>
        ${gstOn ? `
        <h2>Tax Breakdown</h2>
        <table class="tax-table">
          <tr><td>Taxable Amount</td><td style="text-align:right">₹${baseAmount}</td></tr>
          <tr><td>CGST (${(gstRate/2).toFixed(1)}%)</td><td style="text-align:right">₹${cgst}</td></tr>
          <tr><td>SGST (${(gstRate/2).toFixed(1)}%)</td><td style="text-align:right">₹${sgst}</td></tr>
        </table>` : ''}
        <div class="total">Grand Total: ₹${o.total}</div>
        <div class="foot">${gstOn ? 'This is a computer-generated tax invoice and does not require a signature.' : 'This is a system-generated receipt from Sheen Bazaar.'} Thank you for shopping with us! 💖</div>
        <script>window.print();</script>
      </body></html>
    `);
  }

  function printReturnLabel() {
    const o = order;
    const returnTrackingNum = o.returnPickup?.pickupTrackingNumber || `RET-${o._id.slice(-8).toUpperCase()}`;
    const courier = o.returnPickup?.courierPartner || 'Awaiting courier assignment';
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Return Label — #${o._id.slice(-8).toUpperCase()}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
      <style>
        @page { size: A6; margin: 6mm; } * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; padding: 12px; max-width: 420px; margin: auto; color: #111; }
        .label-box { border: 2px solid #ec4899; border-radius: 8px; padding: 14px; }
        .brand-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
        .brand { font-size: 18px; font-weight: 900; } .brand span { color: #E91E8C; }
        .return-badge { background: #ec4899; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; }
        .section { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #999; }
        .section:last-child { border-bottom: none; }
        .label-title { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .ship-name { font-size: 15px; font-weight: 800; margin-bottom: 2px; }
        .ship-addr { font-size: 13px; line-height: 1.5; }
        .barcode-wrap { text-align: center; margin: 12px 0; }
        .order-id-big { font-size: 13px; font-weight: 800; text-align: center; letter-spacing: 2px; margin-top: 4px; }
        .items-box { background: #f5f5f5; border-radius: 6px; padding: 8px 10px; font-size: 11.5px; line-height: 1.6; }
      </style></head><body>
        <div class="label-box">
          <div class="brand-row"><div class="brand">🛍️ Sheen<span>Bazaar</span></div><div class="return-badge">↩️ RETURN</div></div>
          <div class="section"><div class="label-title">Return From (You)</div><div class="ship-name">${o.address?.fullName || ''}</div><div class="ship-addr">${o.address?.addressLine || ''}<br>${o.address?.city || ''}, ${o.address?.state || ''} — ${o.address?.pincode || ''}</div><div style="font-weight:700;margin-top:4px">📞 ${o.address?.phone || ''}</div></div>
          <div class="section"><div class="label-title">Pickup Courier</div><div style="font-weight:700;font-size:13px">${courier}</div>${o.returnPickup?.scheduledDate ? `<div style="font-size:12px;color:#666;margin-top:2px">Scheduled: ${new Date(o.returnPickup.scheduledDate).toLocaleDateString()}</div>` : ''}</div>
          <div class="barcode-wrap"><svg id="barcode"></svg><div class="order-id-big">RET: ${returnTrackingNum}</div></div>
          <div class="section" style="border-bottom:none"><div class="label-title">Items to Return</div><div class="items-box">${o.items.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.qty}`).join(', ')}</div></div>
        </div>
        <script>
          window.onload = function() {
            JsBarcode("#barcode", "${returnTrackingNum}", { format: "CODE128", width: 2, height: 50, displayValue: false, margin: 0 });
            setTimeout(() => window.print(), 300);
          };
        <\/script>
      </body></html>
    `);
  }

  if (error) return <div className="container section"><div className="empty-state">{error}</div></div>;
  if (!order) return <div className="container section" style={{ textAlign: 'center', padding: 60 }}>⏳ Loading…</div>;

  const isCancelled = order.status === 'cancelled';
  const isReturnFlow = ['return_requested', 'returned'].includes(order.status);
  const currentIndex = STEPS.findIndex(s => s.key === order.status);
  const canRequestReturn = order.status === 'delivered' && order.returnStatus === 'none';
  const canCancel = ['placed', 'confirmed', 'packed'].includes(order.status);

  const btn = (color = '#E91E8C') => ({ background: color, color: '#fff', border: 'none', borderRadius: 50, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' });
  const btnOut = (color = '#E91E8C') => ({ background: 'transparent', color, border: `1.5px solid ${color}`, borderRadius: 50, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' });
  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 20, marginBottom: 16 };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ fontSize: 13, color: '#8A7A87', marginBottom: 16 }}>
        <Link to="/" style={{ color: '#E91E8C' }}>Home</Link> / <Link to="/orders" style={{ color: '#E91E8C' }}>Orders</Link> / <span>Tracking</span>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, fontWeight: 800 }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={buyAgain} style={btn('#22c55e')}>🔁 Buy Again</button>
          <button onClick={downloadReceipt} style={btnOut('#3b82f6')}>🧾 Download Receipt</button>
        </div>
      </div>

      {msg.text && <div style={{ background: msg.type === 'error' ? '#FFE8F0' : '#e8f5e9', color: msg.type === 'error' ? '#A8114F' : '#2e7d32', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 13 }}>{msg.type === 'error' ? '⚠️' : '✅'} {msg.text}</div>}

      {isCancelled ? (
        <div style={{ ...card, borderColor: '#E91E8C', background: '#FFF0F5' }}>This order was cancelled.</div>
      ) : isReturnFlow ? (
        <div style={{ ...card, background: '#FFF6F2', border: '1.5px solid #ec4899' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#ec4899', marginBottom: 8 }}>↩️ Return {order.status === 'returned' ? 'Completed' : 'In Progress'}</div>
          <div style={{ fontSize: 13, color: '#4A2040', marginBottom: 4 }}>Reason: {order.returnReason}</div>
          <div style={{ fontSize: 13, color: '#4A2040' }}>Status: <strong style={{ textTransform: 'capitalize' }}>{order.returnStatus}</strong></div>
          {order.returnPickup?.courierPartner && (
            <div style={{ fontSize: 13, color: '#4A2040', marginTop: 6 }}>Pickup by: <strong>{order.returnPickup.courierPartner}</strong>{order.returnPickup.scheduledDate ? ` · Scheduled ${new Date(order.returnPickup.scheduledDate).toLocaleDateString()}` : ''}</div>
          )}
          {order.refund?.processedAt && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginTop: 6 }}>✅ Refunded ₹{order.refund.amount} to your {order.refund.method === 'wallet' ? 'Sheen Bazaar Wallet' : 'original payment method'}</div>}
          {order.returnStatus === 'approved' && (
            <button onClick={printReturnLabel} style={{ ...btn('#ec4899'), marginTop: 12 }}>🏷️ Print Return Label</button>
          )}
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            {STEPS.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <div key={step.key} style={{ flex: 1, minWidth: 70, textAlign: 'center', opacity: done ? 1 : 0.35 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', margin: '0 auto 6px', background: done ? 'linear-gradient(135deg,#E91E8C,#B5006E)' : '#EFE1E7', color: done ? '#fff' : '#8A7A87', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700 }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.shipping?.trackingNumber && !isReturnFlow && (
        <div style={{ ...card, background: '#F3F0FF', borderColor: '#B9A9FF' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🚚 Shipping</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span>Courier</span><strong>{order.shipping.courierPartner}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Tracking No.</span><strong>{order.shipping.trackingNumber}</strong></div>
        </div>
      )}

      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🛍️ Items</h3>
        {order.items.map((i, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < order.items.length - 1 ? '1px solid #F5F5F5' : 'none', fontSize: 13.5 }}>
            <span>{i.name}{i.variant ? ` (${i.variant})` : ''} × {i.qty}</span>
            <strong>₹{i.price * i.qty}</strong>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '2px solid #EFE1E7', fontWeight: 800, fontSize: 16 }}>
          <span>Total</span><span style={{ color: '#E91E8C' }}>₹{order.total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: '#8A7A87' }}>
          <span>{order.paymentMethod}</span>
          <span style={{ color: order.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Pending'}</span>
        </div>
      </div>

      {canCancel && (
        <div style={{ ...card, borderColor: '#f59e0b' }}>
          {!showCancelForm ? (
            <button onClick={() => setShowCancelForm(true)} style={btnOut('#f59e0b')}>❌ Cancel Order</button>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Why are you cancelling?</h3>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Ordered by mistake, found cheaper elsewhere..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EFE1E7', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={cancelOrder} disabled={loading} style={btn('#f59e0b')}>{loading ? 'Cancelling…' : 'Confirm Cancellation'}</button>
                <button onClick={() => setShowCancelForm(false)} style={btnOut('#8A7A87')}>Never Mind</button>
              </div>
            </>
          )}
        </div>
      )}

      {canRequestReturn && (
        <div style={card}>
          {!showReturnForm ? (
            <button onClick={() => setShowReturnForm(true)} style={btnOut('#ec4899')}>↩️ Request Return</button>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Why are you returning this?</h3>
              <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="e.g. Wrong size, item damaged, not as described..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EFE1E7', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={requestReturn} disabled={loading} style={btn('#ec4899')}>{loading ? 'Submitting…' : 'Submit Return Request'}</button>
                <button onClick={() => setShowReturnForm(false)} style={btnOut('#8A7A87')}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 Status History</h3>
        {order.statusHistory.map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12.5 }}>
            <span style={{ textTransform: 'capitalize', color: STATUS_COLORS[h.status] || '#1A0A12', fontWeight: 700 }}>{h.status.replace(/_/g, ' ')}</span>
            <span style={{ color: '#8A7A87' }}>{new Date(h.at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
