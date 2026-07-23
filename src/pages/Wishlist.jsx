import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const STORAGE_KEY = 'sheenbazaar_wishlist';

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  function toggle(product) {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      const next = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }
  function isWishlisted(id) { return wishlist.some(p => p.id === id); }
  return { wishlist, toggle, isWishlisted };
}

export default function Wishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const { addToCart } = useCart();

  function remove(id) {
    const next = wishlist.filter(p => p.id !== id);
    setWishlist(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  if (wishlist.length === 0) return (
    <div style={{ textAlign:'center', padding:80, fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🤍</div>
      <h2 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, marginBottom:8 }}>Your wishlist is empty</h2>
      <p style={{ color:'#8A7A87', marginBottom:24 }}>Save items you love and buy them later!</p>
      <Link to="/products" style={{ background:'#E91E8C', color:'#fff', padding:'12px 28px', borderRadius:50, fontWeight:700, textDecoration:'none' }}>Start Shopping</Link>
    </div>
  );

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <h1 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, fontWeight:800, marginBottom:24 }}>🤍 My Wishlist ({wishlist.length})</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {wishlist.map(p => (
          <div key={p.id} style={{ background:'#fff', border:'1.5px solid #EFE1E7', borderRadius:14, overflow:'hidden' }}>
            <Link to={`/products/${p.id}`}>
              <div style={{ background:'linear-gradient(135deg,#FFF6F2,#FFE8F5)', height:160, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {(p.images?.[0]||p.image)?<img src={p.images?.[0]||p.image} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<span style={{ fontSize:72 }}>{p.icon||'🛍️'}</span>}
              </div>
            </Link>
            <div style={{ padding:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6, lineHeight:1.4 }}>{p.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:17, fontWeight:800, color:'#E91E8C' }}>₹{p.price}</span>
                {p.old > p.price && <span style={{ fontSize:11, color:'#8A7A87', textDecoration:'line-through' }}>₹{p.old}</span>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => addToCart(p)} style={{ flex:1, padding:'9px', background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>🛒 Add to Cart</button>
                <button onClick={() => remove(p.id)} style={{ padding:'9px 12px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
