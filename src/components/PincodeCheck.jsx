import { useEffect, useState } from 'react';
import { api } from '../api/client';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// "Check delivery" box on the product page: delivery date estimate + COD availability.
export default function PincodeCheck({ productId }) {
  const [pin, setPin] = useState(() => { try { return localStorage.getItem('sb_pincode') || ''; } catch { return ''; } });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function check(p = pin) {
    if (!/^[1-9]\d{5}$/.test(p)) { setResult({ valid: false, message: 'Please enter a valid 6-digit pincode.' }); return; }
    setBusy(true);
    try {
      const r = await api.checkPincode(p, productId);
      setResult(r);
      try { localStorage.setItem('sb_pincode', p); } catch { /* storage blocked */ }
    } catch (e) { setResult({ valid: false, message: e.message }); }
    finally { setBusy(false); }
  }

  // Re-check automatically if the shopper already entered a pincode before
  useEffect(() => { if (/^[1-9]\d{5}$/.test(pin)) check(pin); }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = result?.deliverable;
  return (
    <div style={{ border: '1px solid #EFE1E7', borderRadius: 12, padding: 14, marginBottom: 16, background: '#fff' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📍 Check delivery</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && check()}
          inputMode="numeric" placeholder="Enter pincode" aria-label="Pincode"
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 8, border: '1px solid #EFE1E7', fontSize: 14, outline: 'none', letterSpacing: 1 }} />
        <button onClick={() => check()} disabled={busy} style={{ background: '#1A0A12', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{busy ? '…' : 'Check'}</button>
      </div>
      {result && (
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
          {!result.valid || !ok ? (
            <div style={{ color: '#b91c1c', fontWeight: 600 }}>❌ {result.message}</div>
          ) : (
            <>
              <div style={{ color: '#15803d', fontWeight: 700 }}>🚚 Delivery by {fmt(result.etaFrom)} – {fmt(result.etaTo)}</div>
              <div style={{ color: result.cod ? '#15803d' : '#c2410c' }}>{result.cod ? '💵 Cash on Delivery available' : '💳 Online payment only for this pincode'}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
