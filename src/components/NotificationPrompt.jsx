import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pushSupported, isIOS, isStandalone, enablePush } from '../utils/pushClient';
import { appWelcomePending } from './AppWelcome';

const KEY = 'sb_push_prompt_v1';

// Friendly one-time "Get offers like WhatsApp messages" sheet. Shown ~20s into
// a visit, only if the browser can do notifications and the person hasn't
// already answered. "Later" hides it for 5 days.
export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!pushSupported() || Notification.permission !== 'default') return;
    if (appWelcomePending()) return; // the installed app's welcome screen asks instead
    if (isIOS() && !isStandalone()) return; // iPhone: only works from the home-screen app
    if (/^\/(admin|sb-admin|login|checkout)/.test(location.pathname)) return;
    let until = 0;
    try { until = Number(localStorage.getItem(KEY)) || 0; } catch { /* ignore */ }
    if (until && Date.now() < until) return;
    const t = setTimeout(() => setShow(true), 20000);
    return () => clearTimeout(t);
  }, [location.pathname]);

  function later() {
    try { localStorage.setItem(KEY, String(Date.now() + 5 * 24 * 3600e3)); } catch { /* ignore */ }
    setShow(false);
  }

  async function allow() {
    setBusy(true);
    try { await enablePush(); } catch { /* denied — browser remembers */ }
    try { localStorage.setItem(KEY, String(Date.now() + 365 * 24 * 3600e3)); } catch { /* ignore */ }
    setBusy(false);
    setShow(false);
  }

  if (!show) return null;
  return (
    <>
      <div className="sb-sheet-backdrop" onClick={later} />
      <div className="sb-sheet" role="dialog" aria-label="Turn on notifications">
        <div style={{ background: 'linear-gradient(135deg,#1A0A12,#B5006E)', padding: '22px 18px 18px' }}>
          <div className="sb-fake-notif">
            <img src="/icon-192.png" alt="" width="32" height="32" style={{ borderRadius: 8 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1A0A12' }}>⚡ Flash sale — 40% off!</div>
              <div style={{ fontSize: 11.5, color: '#6B5A67' }}>Sheen Bazaar · now</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '18px 20px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 20, fontWeight: 800, color: '#1A0A12' }}>Never miss a deal 🔔</div>
          <p style={{ fontSize: 13.5, color: '#6B5A67', margin: '6px 0 16px', lineHeight: 1.55 }}>Get flash sales, price drops on your wishlist and order updates right on your phone — just like WhatsApp messages.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={later} style={{ flex: 1, padding: '12px 0', borderRadius: 50, border: '1.5px solid #EFE1E7', background: '#fff', fontWeight: 700, color: '#6B5A67', cursor: 'pointer' }}>Later</button>
            <button onClick={allow} disabled={busy} className="btn-primary" style={{ flex: 1.4, padding: '12px 0', borderRadius: 50, border: 'none', fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : 'Yes, notify me'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
