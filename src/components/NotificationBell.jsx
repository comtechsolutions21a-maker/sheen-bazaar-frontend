import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { setAppBadge, relinkPush } from '../utils/pushClient';
import { syncWishlistToServer } from '../utils/wishlist';
import { BellIcon } from './NavIcons';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
const ICONS = { info: 'ℹ️', promo: '🏷️', order: '📦', alert: '⚠️', offer: '🎁', price: '💸', chat: '💬', reward: '🎉', system: '🔔' };
const READ_KEY = 'sb_notifs_read';

function getReadIds() {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch { return []; }
}
function saveReadIds(ids) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-200))); } catch { /* storage blocked */ }
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// 🔔 in the top bar: personal notifications (orders, offers, price drops, chat)
// + site-wide announcements. Also keeps the number on the app icon in sync.
export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mine, setMine] = useState([]);
  const [myUnread, setMyUnread] = useState(0);
  const [site, setSite] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const loadMine = useCallback(() => {
    if (!user) { setMine([]); setMyUnread(0); return; }
    api.myNotifications().then(d => { setMine(d.items || []); setMyUnread(d.unread || 0); }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const role = user?.role || 'customer';
    fetch(`${BASE}/admin/public/notifications?role=${role}`).then(r => r.json()).then(d => Array.isArray(d) && setSite(d)).catch(() => {});
    loadMine();
    if (user) { relinkPush(); syncWishlistToServer(); } // link this phone + saved wishlist to the account
  }, [user, loadMine]);

  // Refresh every minute and whenever the app comes back to the screen
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(loadMine, 60000);
    const onShow = () => { if (document.visibilityState === 'visible') loadMine(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onShow); };
  }, [user, loadMine]);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const siteUnread = site.filter(n => !readIds.includes(n._id)).length;
  const unread = myUnread + siteUnread;

  // App-icon badge = personal unread (site announcements don't count)
  useEffect(() => { setAppBadge(myUnread); }, [myUnread]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      const ids = [...new Set([...readIds, ...site.map(n => n._id)])];
      setReadIds(ids); saveReadIds(ids);
    }
  }

  async function openItem(n) {
    setOpen(false);
    if (!n.read) {
      setMine(list => list.map(x => (x._id === n._id ? { ...x, read: true } : x)));
      setMyUnread(c => Math.max(0, c - 1));
      api.readNotification(n._id).then(d => setMyUnread(d.unread)).catch(() => {});
    }
    if (n.url) {
      if (/^https?:\/\//.test(n.url)) window.open(n.url, '_blank', 'noopener');
      else navigate(n.url);
    }
  }

  async function markAll() {
    setMine(list => list.map(x => ({ ...x, read: true })));
    setMyUnread(0);
    api.readAllNotifications().catch(() => {});
  }

  // Merge, newest first
  const items = [
    ...mine.map(n => ({ ...n, kind: 'mine' })),
    ...site.map(n => ({ _id: n._id, title: n.title, body: n.message, type: n.type, createdAt: n.createdAt, read: true, kind: 'site' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div onClick={toggleOpen} title="Notifications" role="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleOpen()}
        style={{ position: 'relative', fontSize: 20, cursor: 'pointer', padding: '6px 8px' }}>
        <span className={unread > 0 ? 'sb-bell-ring' : ''} style={{ display: 'inline-flex' }}><BellIcon /></span>
        {unread > 0 && (
          <span key={unread} className="sb-pop" style={{ position: 'absolute', top: -3, right: -3, background: '#E91E8C', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      {open && (
        <div className="sb-notif-panel" style={{ position: 'absolute', right: 0, top: '130%', background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, width: 340, maxWidth: '92vw', maxHeight: 460, overflowY: 'auto', zIndex: 3000, boxShadow: '0 16px 40px rgba(26,10,18,0.16)' }}>
          <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '14px 16px', borderBottom: '1px solid #EFE1E7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'Baloo 2,sans-serif' }}>🔔 Notifications</span>
            {myUnread > 0 && <button onClick={markAll} style={{ background: 'none', border: 'none', color: '#B5006E', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Mark all read</button>}
          </div>
          {items.length === 0 && (
            <div style={{ padding: '34px 20px', textAlign: 'center', color: '#8A7A87', fontSize: 13 }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>📭</div>
              No notifications yet{!user && <> — <a href="/login" style={{ color: '#E91E8C', fontWeight: 700 }}>log in</a> to get order updates</>}
            </div>
          )}
          {items.map(n => (
            <button key={`${n.kind}-${n._id}`} onClick={() => (n.kind === 'mine' ? openItem(n) : null)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderWidth: '0 0 1px 0', borderStyle: 'solid', borderColor: '#F7EEF3', display: 'flex', gap: 12, background: n.read ? '#fff' : '#FFF5FA', cursor: n.kind === 'mine' ? 'pointer' : 'default', fontFamily: 'Inter,sans-serif' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: n.read ? '#F7EEF3' : '#FFE0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{ICONS[n.type] || '🔔'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: n.read ? 600 : 800, color: '#1A0A12', marginBottom: 2 }}>{n.title}</span>
                {n.body && <span style={{ display: 'block', fontSize: 12, color: '#6B5A67', lineHeight: 1.45 }}>{n.body}</span>}
                <span style={{ display: 'block', fontSize: 10.5, color: '#B0A0AC', marginTop: 4 }}>{timeAgo(n.createdAt)}{n.kind === 'site' ? ' · Announcement' : ''}</span>
              </span>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E91E8C', marginTop: 6, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
