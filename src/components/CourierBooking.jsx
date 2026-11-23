import { useEffect, useState } from 'react';
import { BASE_URL, getToken } from '../api/client';

const call = async (path, opts = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

let enabledCache = null;
export function useShiprocketEnabled() {
  const [on, setOn] = useState(enabledCache);
  useEffect(() => {
    if (enabledCache !== null) return;
    fetch(`${BASE_URL}/shipping/enabled`).then(r => r.json()).then(d => { enabledCache = !!d.shiprocket; setOn(enabledCache); }).catch(() => setOn(false));
  }, []);
  return on;
}

// Buttons on a seller's order card: book the courier in one click, then label + tracking
export function CourierActions({ order, sellerId, onChange, btn }) {
  const enabled = useShiprocketEnabled();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = (order.shipments || []).find(s => !sellerId || String(s.seller) === String(sellerId));

  if (!enabled) return null;

  async function label() {
    setBusy(true);
    try { const d = await call(`/shipping/orders/${order._id}/label`); if (d.labelUrl) window.open(d.labelUrl, '_blank', 'noopener'); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  if (mine?.awb) {
    return (
      <>
        <button onClick={label} disabled={busy} style={btn('#0f766e')}>{busy ? '…' : '🧾 Courier label (PDF)'}</button>
        <a href={mine.trackUrl} target="_blank" rel="noopener noreferrer" style={{ ...btn('#fff'), color: '#0f766e', border: '1.5px solid #99f6e4', textDecoration: 'none', display: 'inline-block' }}>📍 Track {mine.courierName ? `(${mine.courierName})` : ''}</a>
      </>
    );
  }
  if (!['placed', 'confirmed', 'packed'].includes(order.status)) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} style={btn('#0f766e')}>🚀 Book courier pickup</button>
      {mine?.error && <span style={{ fontSize: 11.5, color: '#b91c1c', alignSelf: 'center' }}>⚠️ {mine.error}</span>}
      {open && <BookModal order={order} onClose={() => setOpen(false)} onDone={() => { setOpen(false); onChange?.(); }} />}
    </>
  );
}

function BookModal({ order, onClose, onDone }) {
  const [addr, setAddr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [pkg, setPkg] = useState({ weightKg: '', length: '', breadth: '', height: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    call('/shipping/pickup-address').then(a => { setAddr(a || {}); if (!a?.addressLine) setEditing(true); }).catch(() => { setAddr({}); setEditing(true); });
  }, []);

  async function saveAddr() {
    setBusy(true); setMsg('');
    try { setAddr(await call('/shipping/pickup-address', { method: 'PUT', body: JSON.stringify(addr) })); setEditing(false); }
    catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function book() {
    setBusy(true); setMsg('');
    try {
      const d = await call(`/shipping/orders/${order._id}/book`, { method: 'POST', body: JSON.stringify(pkg) });
      if (!d.shipment?.awb) throw new Error(d.shipment?.error || 'The courier could not be booked.');
      if (d.shipment.labelUrl) window.open(d.shipment.labelUrl, '_blank', 'noopener');
      onDone();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const inp = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid #EFE1E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'Inter,sans-serif' };
  const a = addr || {};
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,18,.5)', zIndex: 2147483500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 'min(480px,100%)', maxHeight: '92vh', overflowY: 'auto', padding: 20, fontFamily: 'Inter,sans-serif', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
        <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'Baloo 2,sans-serif' }}>🚀 Book courier pickup</div>
        <div style={{ fontSize: 12.5, color: '#6B5A67', marginBottom: 14 }}>Order #{String(order._id).slice(-6).toUpperCase()} · {order.paymentStatus === 'paid' ? 'Prepaid' : `COD ₹${order.total}`} → {order.address?.city} {order.address?.pincode}</div>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📍 Pickup address (where the courier collects)</div>
        {!addr ? <div style={{ fontSize: 13, color: '#8A7A87' }}>Loading…</div> : editing ? (
          <div>
            <input value={a.name || ''} onChange={e => setAddr({ ...a, name: e.target.value })} placeholder="Shop / contact name" style={inp} />
            <input value={a.phone || ''} onChange={e => setAddr({ ...a, phone: e.target.value })} placeholder="10-digit phone" inputMode="numeric" style={inp} />
            <input value={a.addressLine || ''} onChange={e => setAddr({ ...a, addressLine: e.target.value })} placeholder="Shop no., building, street" style={inp} />
            <input value={a.landmark || ''} onChange={e => setAddr({ ...a, landmark: e.target.value })} placeholder="Landmark (optional)" style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input value={a.city || ''} onChange={e => setAddr({ ...a, city: e.target.value })} placeholder="City" style={inp} />
              <input value={a.state || ''} onChange={e => setAddr({ ...a, state: e.target.value })} placeholder="State" style={inp} />
              <input value={a.pincode || ''} onChange={e => setAddr({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Pincode" inputMode="numeric" style={inp} />
            </div>
            <button onClick={saveAddr} disabled={busy} style={{ background: '#1A0A12', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Save address</button>
          </div>
        ) : (
          <div style={{ background: '#F8FAF9', border: '1px solid #E5EFEA', borderRadius: 12, padding: '10px 12px', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
            <strong>{a.name}</strong> · {a.phone}<br />{a.addressLine}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} {a.pincode}
            <button onClick={() => setEditing(true)} style={{ display: 'block', background: 'none', border: 'none', color: '#0f766e', fontWeight: 700, fontSize: 12.5, padding: '4px 0 0', cursor: 'pointer' }}>Change</button>
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 13, margin: '6px 0' }}>📦 Parcel <span style={{ fontWeight: 400, color: '#8A7A87' }}>(leave blank to use the product weights)</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          <input value={pkg.weightKg} onChange={e => setPkg({ ...pkg, weightKg: e.target.value })} placeholder="kg" inputMode="decimal" style={inp} />
          <input value={pkg.length} onChange={e => setPkg({ ...pkg, length: e.target.value })} placeholder="L cm" inputMode="numeric" style={inp} />
          <input value={pkg.breadth} onChange={e => setPkg({ ...pkg, breadth: e.target.value })} placeholder="W cm" inputMode="numeric" style={inp} />
          <input value={pkg.height} onChange={e => setPkg({ ...pkg, height: e.target.value })} placeholder="H cm" inputMode="numeric" style={inp} />
        </div>
        <div style={{ fontSize: 12, color: '#8A7A87', margin: '2px 0 12px' }}>Shiprocket picks the best courier, schedules pickup and gives you the shipping label to stick on the parcel. The customer gets tracking updates automatically.</div>

        {msg && <div style={{ background: '#FFF1F2', border: '1px solid #fecdd3', color: '#b91c1c', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚠️ {msg}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={book} disabled={busy || editing || !addr} style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, cursor: 'pointer', opacity: busy || editing ? 0.6 : 1 }}>{busy ? 'Booking…' : '🚀 Book pickup & get label'}</button>
        </div>
      </div>
    </div>
  );
}

// Customer's tracking timeline on the order page
export function TrackingTimeline({ orderId }) {
  const [data, setData] = useState(null);
  useEffect(() => { call(`/shipping/track/${orderId}`).then(setData).catch(() => setData(null)); }, [orderId]);
  const list = data?.shipments || [];
  if (!list.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 18, marginBottom: 16 }}>
      {list.map(s => (
        <div key={s.awb} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>🚚 {s.courierName || 'Courier'}</div>
              <div style={{ fontSize: 12.5, color: '#6B5A67' }}>Tracking no. <strong>{s.awb}</strong>{s.etd ? ` · Expected by ${new Date(s.etd).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}</div>
            </div>
            {s.trackUrl && <a href={s.trackUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: '#0f766e' }}>Open courier tracking ↗</a>}
          </div>
          {s.events?.length ? (
            <div style={{ position: 'relative', paddingLeft: 18 }}>
              <div style={{ position: 'absolute', left: 5, top: 4, bottom: 4, width: 2, background: '#E5EFEA' }} />
              {s.events.slice(0, 12).map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
                  <span style={{ position: 'absolute', left: -18, top: 3, width: 12, height: 12, borderRadius: '50%', background: i === 0 ? '#0f766e' : '#C9DED5', boxShadow: i === 0 ? '0 0 0 4px rgba(15,118,110,.15)' : 'none' }} />
                  <div style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: '#1A0A12' }}>{e.activity || e.status}</div>
                  <div style={{ fontSize: 11.5, color: '#8A7A87' }}>{[e.location, e.at].filter(Boolean).join(' · ')}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 13, color: '#8A7A87' }}>Pickup booked — tracking updates appear here once the courier collects the parcel.</div>}
        </div>
      ))}
    </div>
  );
}
