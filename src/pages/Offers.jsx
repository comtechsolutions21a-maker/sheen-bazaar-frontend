import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useSEO } from '../utils/useSEO';
import { EmptyState } from '../components/Illustrations';

// /offers — coupon codes + flash-sale products in one place.
export default function Offers() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  useSEO('Offers & Flash Sales', 'Coupon codes and limited-time flash deals on Sheen Bazaar.');

  function load() { api.getOffers().then(setData).catch(e => setError(e.message)); }
  useEffect(load, []);

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked — code is still visible */ }
    setCopied(code);
    setTimeout(() => setCopied(''), 1800);
  }

  return (
    <div className="container" style={{ padding: '24px 16px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>🎁 Offers & Deals</h1>
      <p style={{ color: '#8A7A87', margin: '0 0 18px', fontSize: 14 }}>Copy a coupon code and apply it at checkout.</p>

      <Link to="/spin" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: '#fff', background: 'linear-gradient(120deg,#1A0A12,#7C3AED 55%,#E91E8C)', borderRadius: 18, padding: '16px 20px', marginBottom: 26, boxShadow: '0 12px 30px rgba(124,58,237,.25)', position: 'relative', overflow: 'hidden' }}>
        <span style={{ fontSize: 44, animation: 'sbSpin 6s linear infinite', display: 'inline-block' }}>🎡</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontFamily: 'Baloo 2,sans-serif', fontSize: 20, fontWeight: 800 }}>Spin & Win — free every day!</span>
          <span style={{ display: 'block', fontSize: 13, opacity: 0.85 }}>Win up to 20% OFF with today's free spin.</span>
        </span>
        <span style={{ background: '#fff', color: '#7C3AED', borderRadius: 50, padding: '8px 16px', fontWeight: 800, fontSize: 13 }}>Spin →</span>
      </Link>

      {error && <div style={{ color: '#b91c1c' }}>⚠️ {error}</div>}
      {!data && !error && <div style={{ color: '#8A7A87', padding: 30, textAlign: 'center' }}>Loading offers…</div>}

      {data && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>🏷️ Coupon codes</h2>
          {data.coupons.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, marginBottom: 28 }}><EmptyState type="offers" title="No coupon codes right now" cta={null} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 32 }}>
              {data.coupons.map(c => (
                <div key={c.code} style={{ position: 'relative', background: 'linear-gradient(135deg,#fff,#FFF0F7)', border: '2px dashed #E91E8C', borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#E91E8C', lineHeight: 1 }}>{c.discountPercent}% OFF</div>
                  {c.description && <div style={{ fontSize: 13, color: '#4A2040', marginTop: 6 }}>{c.description}</div>}
                  <div style={{ fontSize: 12, color: '#8A7A87', marginTop: 6, lineHeight: 1.6 }}>
                    {c.minOrderValue > 0 ? `On orders above ₹${c.minOrderValue}` : 'No minimum order'}
                    {c.expiresAt && <> · Valid till {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>}
                    {c.usesLeft != null && c.usesLeft <= 20 && <> · <strong style={{ color: '#e11d48' }}>Only {c.usesLeft} left</strong></>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <code style={{ flex: 1, background: '#fff', border: '1px solid #EFE1E7', borderRadius: 8, padding: '9px 12px', fontWeight: 800, letterSpacing: 1.5, fontSize: 15 }}>{c.code}</code>
                    <button onClick={() => copy(c.code)} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontWeight: 700, cursor: 'pointer' }}>{copied === c.code ? '✓ Copied' : 'Copy'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>⚡ Flash sales</h2>
          {data.flashSales.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 24, color: '#8A7A87' }}>
              No flash sales running right now. <Link to="/products" style={{ color: '#E91E8C', fontWeight: 700 }}>Browse all products →</Link>
            </div>
          ) : (
            <div className="grid">
              {data.flashSales.map(p => <ProductCard key={p.id} product={p} onFlashEnd={load} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
