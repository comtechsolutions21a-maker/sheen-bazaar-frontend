import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

export default function CompareBar() {
  const { items, toggleCompare } = useCompare();
  const location = useLocation();

  if (items.length === 0 || location.pathname === '/compare') return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: '#1A0A12', color: '#fff', padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>⚖️ Compare ({items.length})</span>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
        {items.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 50, padding: '4px 10px 4px 4px', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>{p.icon || '🛍️'}</span>
            <span style={{ fontSize: 11, maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <span onClick={() => toggleCompare(p)} style={{ cursor: 'pointer', fontSize: 13, opacity: 0.6 }}>×</span>
          </div>
        ))}
      </div>
      <Link to="/compare" style={{ background: '#E91E8C', color: '#fff', padding: '8px 18px', borderRadius: 50, fontWeight: 700, fontSize: 12.5, textDecoration: 'none', flexShrink: 0 }}>
        Compare Now →
      </Link>
    </div>
  );
}
