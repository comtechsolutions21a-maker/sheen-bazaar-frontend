import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
const TYPE_ICONS = { info: 'ℹ️', promo: '🏷️', order: '📦', alert: '⚠️' };
const READ_KEY = 'sb_notifs_read';

function getReadIds() {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch { return []; }
}
function markAllRead(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const role = user?.role || 'customer';
    fetch(`${BASE}/admin/public/notifications?role=${role}`).then(r => r.json()).then(d => Array.isArray(d) && setNotifs(d)).catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const readIds = getReadIds();
  const unreadCount = notifs.filter(n => !readIds.includes(n._id)).length;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead(notifs.map(n => n._id));
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div onClick={toggleOpen} title="Notifications" style={{ position: 'relative', fontSize: 20, cursor: 'pointer', padding: '6px 8px' }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#E91E8C', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '130%', background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, width: 320, maxHeight: 420, overflowY: 'auto', zIndex: 300, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #EFE1E7', fontWeight: 800, fontSize: 14, fontFamily: 'Baloo 2,sans-serif' }}>🔔 Notifications</div>
          {notifs.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#8A7A87', fontSize: 13 }}>No notifications yet</div>}
          {notifs.map(n => (
            <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[n.type] || 'ℹ️'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#8A7A87', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: 10.5, color: '#B0A0AC', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
