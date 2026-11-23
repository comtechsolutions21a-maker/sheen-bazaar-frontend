import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSEO } from '../utils/useSEO';
import { EmptyState } from '../components/Illustrations';

export { useWishlist } from '../utils/wishlist';
import { useWishlist as useWishlistHook } from '../utils/wishlist';

export default function Wishlist() {
  const { wishlist, remove: removeFromWishlist } = useWishlistHook();
  const { addToCart } = useCart();
  useSEO('Wishlist', "Products you've saved for later on Sheen Bazaar.");

  function remove(id) { removeFromWishlist(id); }

  if (wishlist.length === 0) return (
    <div style={{ padding:'40px 16px', fontFamily:'Inter,sans-serif' }}>
      <EmptyState type="wishlist" />
    </div>
  );

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <h1 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, fontWeight:800, marginBottom:24 }}>💖 My Wishlist ({wishlist.length})</h1>
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
