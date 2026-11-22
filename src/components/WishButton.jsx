import { useState } from 'react';
import { useWishlist } from '../utils/wishlist';

// ♡ button — tap to save; pops and bursts little hearts.
export default function WishButton({ product, size = 36, style }) {
  const { isWishlisted, toggle } = useWishlist();
  const [burst, setBurst] = useState(0);
  const on = isWishlisted(product.id);
  return (
    <button type="button"
      aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={on}
      title={on ? 'Saved — we\'ll tell you if the price drops' : 'Save to wishlist'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (toggle(product)) setBurst(b => b + 1); }}
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.92)', boxShadow: '0 3px 10px rgba(26,10,18,0.15)', fontSize: size * 0.5, lineHeight: 1, padding: 0, ...style }}>
      <span key={on ? `on${burst}` : 'off'} className={on ? 'sb-pop' : ''} style={{ color: on ? '#E91E8C' : '#8A7A87' }}>{on ? '♥' : '♡'}</span>
      {burst > 0 && on && (
        <span key={burst} aria-hidden="true" className="sb-heart-burst">
          {[0, 1, 2, 3, 4, 5].map(i => <i key={i} style={{ '--a': `${i * 60}deg` }}>♥</i>)}
        </span>
      )}
    </button>
  );
}
