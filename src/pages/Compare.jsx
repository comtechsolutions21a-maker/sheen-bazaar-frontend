import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';

export default function Compare() {
  const { items, toggleCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'Inter,sans-serif' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚖️</div>
        <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, marginBottom: 8 }}>Nothing to compare yet</h2>
        <p style={{ color: '#8A7A87', marginBottom: 24 }}>Tap "Compare" on any product to add it here — compare up to 4 side by side.</p>
        <Link to="/products" style={{ background: '#E91E8C', color: '#fff', padding: '12px 28px', borderRadius: 50, fontWeight: 700, textDecoration: 'none' }}>Browse Products</Link>
      </div>
    );
  }

  const ROWS = [
    { label: 'Price', render: p => <span style={{ fontSize: 18, fontWeight: 800, color: '#E91E8C' }}>₹{p.price}</span> },
    { label: 'MRP', render: p => p.old > p.price ? <span style={{ textDecoration: 'line-through', color: '#8A7A87' }}>₹{p.old}</span> : '—' },
    { label: 'Rating', render: p => <span>⭐ {p.rating?.toFixed(1) || '—'} ({p.reviewCount || 0})</span> },
    { label: 'Brand', render: p => p.brand || '—' },
    { label: 'Category', render: p => p.cat || '—' },
    { label: 'Delivery', render: p => `${p.deliveryDays || 5} days` },
    { label: 'Return Policy', render: p => `${p.returnDays || 7} days` },
    { label: 'Warranty', render: p => p.warrantyMonths ? `${p.warrantyMonths} months` : '—' },
    { label: 'Stock', render: p => p.stock > 0 ? <span style={{ color: '#22c55e', fontWeight: 700 }}>In Stock</span> : <span style={{ color: '#ef4444', fontWeight: 700 }}>Out of Stock</span> },
    { label: 'Highlights', render: p => p.highlights?.length ? <ul style={{ margin: 0, paddingLeft: 16, textAlign: 'left', fontSize: 12 }}>{p.highlights.slice(0, 4).map((h, i) => <li key={i}>{h}</li>)}</ul> : '—' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, fontWeight: 800 }}>⚖️ Compare Products</h1>
        <button onClick={clearCompare} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 50, padding: '9px 18px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Clear All</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <td style={{ width: 140 }}></td>
              {items.map(p => (
                <th key={p.id} style={{ padding: 14, verticalAlign: 'top', minWidth: 200 }}>
                  <div style={{ position: 'relative', background: '#fff', border: '1.5px solid #EFE1E7', borderRadius: 14, padding: 14 }}>
                    <button onClick={() => toggleCompare(p)} style={{ position: 'absolute', top: 8, right: 8, background: '#F3F4F8', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 13, color: '#8A7A87' }}>×</button>
                    <div style={{ background: 'linear-gradient(135deg,#FFF6F2,#FFE8F5)', borderRadius: 10, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' }}>
                      {(p.images?.[0] || p.image) ? <img src={p.images?.[0] || p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40 }}>{p.icon || '🛍️'}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, minHeight: 34, lineHeight: 1.4 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/products/${p.id}`} style={{ flex: 1, textAlign: 'center', background: '#F3F4F8', color: '#4A2040', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>View</Link>
                      <button onClick={() => addToCart(p)} style={{ flex: 1, background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🛒 Add</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 0 ? '#FFF6F2' : '#fff' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 12.5, color: '#8A7A87' }}>{row.label}</td>
                {items.map(p => (
                  <td key={p.id} style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', borderLeft: '1px solid #F0E0EC' }}>{row.render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
