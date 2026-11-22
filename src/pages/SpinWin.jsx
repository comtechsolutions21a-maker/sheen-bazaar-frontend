import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSEO } from '../utils/useSEO';

const COLORS = ['#E91E8C', '#FFB300', '#7C3AED', '#14B8A6', '#F97316', '#3B82F6', '#B5006E', '#22C55E'];

function wheelBackground(n) {
  const step = 360 / n;
  return `conic-gradient(${Array.from({ length: n }, (_, i) => `${COLORS[i % COLORS.length]} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
}

function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, dur: 2 + Math.random() * 1.4, color: COLORS[i % COLORS.length], rot: Math.random() * 360,
  }));
  return (
    <div className="sb-confetti" aria-hidden="true">
      {pieces.map((p, i) => <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />)}
    </div>
  );
}

function useCountdown(to) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!to) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [to]);
  if (!to) return '';
  const s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

// Spin & Win: one free spin every 24 hours for a personal discount code.
export default function SpinWin() {
  useSEO('Spin & Win', 'Spin the wheel every day for a discount on Sheen Bazaar.');
  const [status, setStatus] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(status?.nextSpinAt);

  function load() { api.spinStatus().then(setStatus).catch(e => setError(e.message)); }
  useEffect(load, []);

  async function spin() {
    if (spinning || !status?.canSpin) return;
    setError(''); setResult(null); setSpinning(true);
    try {
      const r = await api.spin();
      const n = status.prizes.length;
      const seg = 360 / n;
      // Land the pointer (top) in the middle of the winning segment, after 6 full turns
      const target = 360 * 6 + (360 - (r.index * seg + seg / 2));
      setRotation(rot => rot - (rot % 360) + target);
      setTimeout(() => {
        setSpinning(false);
        setResult(r);
        setStatus(s => ({ ...s, canSpin: false, nextSpinAt: r.nextSpinAt, myCoupons: r.coupon ? [r.coupon, ...(s.myCoupons || [])] : s.myCoupons }));
      }, 4800);
    } catch (e) {
      setSpinning(false);
      setError(e.message);
      load();
    }
  }

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); } catch { /* code is visible anyway */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  const n = status?.prizes?.length || 8;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', background: 'radial-gradient(circle at 50% 0%, #FFE0F0, #FFF6F2 60%)', padding: '28px 16px 50px', fontFamily: 'Inter,sans-serif' }}>
      <div className="sb-blobs" aria-hidden="true"><span /><span /><span /></div>
      {result?.coupon && <Confetti />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 30, fontWeight: 800, margin: '0 0 4px', color: '#1A0A12' }}>🎡 Spin & Win</h1>
        <p style={{ color: '#6B5A67', margin: '0 0 22px', fontSize: 14 }}>One free spin every day. Win up to <strong>20% OFF</strong> your next order!</p>

        <div className="sb-wheel-wrap">
          <div className="sb-wheel-pointer" />
          <div className="sb-wheel" style={{ position: 'relative', background: wheelBackground(n), transform: `rotate(${rotation}deg)` }}>
            {(status?.prizes || []).map((label, i) => {
              const angle = i * (360 / n) + 180 / n;
              return (
                <div key={i} style={{ position: 'absolute', inset: 0, transform: `rotate(${angle}deg)` }}>
                  <span style={{ position: 'absolute', top: '7%', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontWeight: 900, fontSize: 'clamp(11px, 3.4vw, 14px)', textShadow: '0 1px 3px rgba(0,0,0,.4)', writingMode: 'vertical-rl', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              );
            })}
          </div>
          <button className="sb-wheel-hub" onClick={spin} disabled={spinning || !status?.canSpin} aria-label="Spin the wheel" style={{ border: 'none', cursor: status?.canSpin && !spinning ? 'pointer' : 'default' }}>
            {spinning ? '…' : 'SPIN'}
          </button>
        </div>

        <div style={{ marginTop: 24, minHeight: 120 }}>
          {error && <div style={{ color: '#b91c1c', fontWeight: 600 }}>⚠️ {error}</div>}
          {!status && !error && <div style={{ color: '#8A7A87' }}>Loading…</div>}

          {result && (
            result.coupon ? (
              <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 12px 30px rgba(185,0,110,.18)', border: '2px dashed #E91E8C' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#E91E8C', fontFamily: 'Baloo 2,sans-serif' }}>🎉 You won {result.prize}!</div>
                <div style={{ fontSize: 13, color: '#6B5A67', margin: '4px 0 12px' }}>Use this code at checkout on orders above ₹{status?.minOrder || 299}. Valid for 24 hours, only on your account.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <code style={{ background: '#FFF0F7', border: '1px solid #F5C6DF', borderRadius: 10, padding: '10px 16px', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>{result.coupon.code}</code>
                  <button onClick={() => copy(result.coupon.code)} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</button>
                </div>
                <Link to="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: 14 }}>Shop now →</Link>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>😅 So close!</div>
                <div style={{ fontSize: 13.5, color: '#6B5A67', marginTop: 4 }}>No prize this time — come back tomorrow for another free spin.</div>
              </div>
            )
          )}

          {status && !status.canSpin && !spinning && (
            <div style={{ marginTop: 14, fontSize: 14, color: '#4A2040' }}>⏳ Next free spin in <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#B5006E' }}>{countdown}</strong></div>
          )}
          {status?.canSpin && !spinning && !result && <div style={{ fontSize: 13.5, color: '#6B5A67' }}>Tap <strong>SPIN</strong> in the middle of the wheel!</div>}
        </div>

        {status?.myCoupons?.length > 0 && !result?.coupon && (
          <div style={{ marginTop: 20, textAlign: 'left', background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #EFE1E7' }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>🎟️ Your active reward codes</div>
            {status.myCoupons.map(c => (
              <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #F7EEF3', fontSize: 13.5 }}>
                <span><code style={{ fontWeight: 900, letterSpacing: 1 }}>{c.code}</code> — {c.discountPercent}% off</span>
                <span style={{ color: '#8A7A87', fontSize: 12 }}>till {new Date(c.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
