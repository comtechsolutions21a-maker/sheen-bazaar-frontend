import { useEffect, useState } from 'react';

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const two = (n) => String(n).padStart(2, '0');

// Live "Ends in 02:14:09" timer for flash-sale products.
// compact = small pill for product cards; otherwise a banner for the product page.
export default function FlashCountdown({ endsAt, compact = false, onEnd }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = end - now;
  useEffect(() => { if (left <= 0 && onEnd) onEnd(); }, [left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!endsAt || Number.isNaN(end) || left <= 0) return null;

  const { d, h, m, s } = parts(left);
  const text = `${d > 0 ? `${d}d ` : ''}${two(h)}:${two(m)}:${two(s)}`;

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFF1F2', color: '#e11d48', borderRadius: 50, padding: '2px 8px', fontSize: 11, fontWeight: 800, marginTop: 4 }}>
        ⚡ {text}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'linear-gradient(135deg,#e11d48,#E91E8C)', color: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
      <span style={{ fontWeight: 800, fontSize: 14 }}>⚡ Flash Sale</span>
      <span style={{ fontSize: 13 }}>Ends in <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: 16 }}>{text}</strong></span>
    </div>
  );
}
