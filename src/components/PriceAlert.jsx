import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// "🎯 Tell me when it drops below ₹X" — sends a phone notification + inbox
// message the moment the price (or a flash sale) reaches the target.
export default function PriceAlert({ product }) {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [target, setTarget] = useState('');
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    api.getPriceAlerts().then(list => setAlert(list.find(a => a.productId === product.id) || null)).catch(() => {});
  }, [user, product.id]);

  useEffect(() => { setTarget(String(Math.max(1, Math.floor(product.price * 0.9)))); }, [product.price]);

  async function save() {
    setMsg('');
    try {
      const list = await api.setPriceAlert(product.id, Number(target));
      setAlert(list.find(a => a.productId === product.id) || null);
      setOpen(false);
    } catch (e) { setMsg(e.message); }
  }

  async function remove() {
    await api.removePriceAlert(product.id).catch(() => {});
    setAlert(null);
  }

  const box = { border: '1px dashed #E91E8C', background: '#FFF8FC', borderRadius: 12, padding: '10px 12px', marginBottom: 16, fontSize: 13 };
  if (!user) return <div style={box}>🎯 Want it cheaper? <Link to="/login" style={{ color: '#B5006E', fontWeight: 700 }}>Log in</Link> to set a price alert.</div>;

  if (alert) {
    return (
      <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span>🎯 We'll notify you when it drops to <strong>₹{alert.targetPrice}</strong> or less.</span>
        <button onClick={remove} style={{ background: 'none', border: 'none', color: '#8A7A87', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
      </div>
    );
  }

  return (
    <div style={box}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#B5006E', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🎯 Alert me if the price drops</button>
      ) : (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Notify me when the price is at or below:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EFE1E7', borderRadius: 8, background: '#fff', padding: '0 10px', flex: 1 }}>
              <span style={{ color: '#8A7A87' }}>₹</span>
              <input type="number" inputMode="numeric" min="1" value={target} onChange={e => setTarget(e.target.value)} aria-label="Target price" style={{ border: 'none', outline: 'none', padding: '9px 6px', width: '100%', fontSize: 14 }} />
            </div>
            <button onClick={save} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>Set alert</button>
          </div>
          {msg && <div style={{ color: '#b91c1c', marginTop: 6, fontSize: 12.5 }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
