import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  function loadThread() {
    authFetch('/chat/mine').then(r => r.json()).then(setThread).catch(() => {});
  }

  useEffect(() => { if (user && open) loadThread(); }, [user, open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread?.messages?.length]);

  // Poll for new admin replies every 8s while open
  useEffect(() => {
    if (!open || !user) return;
    const iv = setInterval(loadThread, 8000);
    return () => clearInterval(iv);
  }, [open, user]);

  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch('/chat/mine', { method: 'POST', body: JSON.stringify({ text }) });
      const data = await res.json();
      setThread(data); setText('');
    } catch (e) {} finally { setLoading(false); }
  }

  if (!user) return null; // chat requires login

  return (
    <>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', right: 20, bottom: 20, width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'pointer', zIndex: 999,
          boxShadow: '0 6px 24px rgba(233,30,140,0.4)', transition: 'transform 0.2s',
        }}
      >
        {open ? '×' : '💬'}
      </div>

      {open && (
        <div style={{
          position: 'fixed', right: 20, bottom: 86, width: 330, maxWidth: 'calc(100vw - 40px)', height: 440,
          background: '#fff', borderRadius: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', zIndex: 998,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #EFE1E7',
        }}>
          <div style={{ background: 'linear-gradient(135deg,#1A0A12,#3D0A2A)', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, fontFamily: 'Baloo 2,sans-serif' }}>Sheen Bazaar Support</div>
              <div style={{ fontSize: 10.5, opacity: 0.6 }}>We usually reply within a few hours</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#FFF6F2' }}>
            {!thread && <div style={{ textAlign: 'center', color: '#8A7A87', fontSize: 13, marginTop: 30 }}>Loading…</div>}
            {thread?.messages?.length === 0 && (
              <div style={{ textAlign: 'center', color: '#8A7A87', fontSize: 13, marginTop: 30 }}>
                👋 Hi {user.name.split(' ')[0]}! How can we help you today?
              </div>
            )}
            {thread?.messages?.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'customer' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{
                  maxWidth: '78%', padding: '9px 13px', borderRadius: 14,
                  background: m.from === 'customer' ? 'linear-gradient(135deg,#E91E8C,#B5006E)' : '#fff',
                  color: m.from === 'customer' ? '#fff' : '#1A0A12',
                  fontSize: 13, lineHeight: 1.4, border: m.from === 'admin' ? '1px solid #EFE1E7' : 'none',
                }}>
                  {m.text}
                  <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 3 }}>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #EFE1E7', display: 'flex', gap: 8 }}>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your message…"
              style={{ flex: 1, padding: '10px 12px', borderRadius: 50, border: '1.5px solid #EFE1E7', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif' }}
            />
            <button onClick={send} disabled={loading} style={{ background: '#E91E8C', color: '#fff', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', fontSize: 15, flexShrink: 0 }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
