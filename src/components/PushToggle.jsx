import { useEffect, useState } from 'react';
import { api } from '../api/client';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;

// On/off switch for order notifications on this phone / browser.
export default function PushToggle() {
  const [state, setState] = useState('loading'); // loading | unsupported | ios-install | blocked | off | on
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!supported()) { setState(isIOS() && !isStandalone() ? 'ios-install' : 'unsupported'); return; }
      if (Notification.permission === 'denied') { setState('blocked'); return; }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? 'on' : 'off');
      } catch { setState('off'); }
    })();
  }, []);

  async function turnOn() {
    setBusy(true); setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'blocked' : 'off'); return; }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.pushPublicKey();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await api.pushSubscribe(sub.toJSON());
      setState('on');
      setMsg('Done! You should get a test notification in a few seconds.');
    } catch (e) {
      setMsg(e.message || 'Could not turn on notifications');
    } finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api.pushUnsubscribe(sub.endpoint).catch(() => {}); await sub.unsubscribe(); }
      setState('off');
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const note = { fontSize: 13, color: '#8A7A87', lineHeight: 1.6 };
  if (state === 'loading') return <div style={note}>Checking…</div>;
  if (state === 'unsupported') return <div style={note}>This browser doesn't support notifications. Try Chrome on Android or a computer.</div>;
  if (state === 'ios-install') return <div style={note}>On iPhone: tap the Share button ⬆️ → <strong>Add to Home Screen</strong>, open Sheen Bazaar from your home screen, then turn notifications on here.</div>;
  if (state === 'blocked') return <div style={note}>Notifications are blocked for this site. Allow them in your browser's site settings (🔒 icon next to the address), then reload.</div>;

  const on = state === 'on';
  return (
    <div>
      <button type="button" onClick={on ? turnOff : turnOn} disabled={busy} aria-pressed={on}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: on ? '#dcfce7' : '#E91E8C', color: on ? '#15803d' : '#fff', opacity: busy ? 0.6 : 1 }}>
        <span style={{ width: 34, height: 20, borderRadius: 50, background: on ? '#16a34a' : 'rgba(255,255,255,0.4)', position: 'relative', display: 'inline-block', transition: 'background .2s' }}>
          <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
        </span>
        {busy ? 'Please wait…' : on ? 'Notifications ON' : 'Turn on notifications'}
      </button>
      {msg && <div style={{ ...note, marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
