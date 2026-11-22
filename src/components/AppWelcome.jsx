import { useEffect, useState } from 'react';
import { BagLogo } from './Illustrations';
import { pushSupported, enablePush, isStandalone } from '../utils/pushClient';

// First-launch screen for the INSTALLED app (home-screen icon). Like a normal
// phone app, it welcomes the customer and asks for permissions one by one:
// notifications (offers + order updates), location (delivery date for their
// area) and camera (review photos). Shown once.
const DONE_KEY = 'sb_app_welcome_done';

const isApp = () => typeof window !== 'undefined' && isStandalone();

export function appWelcomePending() {
  try { return isApp() && !localStorage.getItem(DONE_KEY); } catch { return false; }
}

// Turn GPS position into a pincode (OpenStreetMap, free) and remember it for
// the "Check delivery" box and checkout.
async function detectPincode() {
  const pos = await new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }));
  try {
    const { latitude, longitude } = pos.coords;
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&addressdetails=1&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en' } });
    const d = await r.json();
    const pin = String(d?.address?.postcode || '').replace(/\D/g, '').slice(0, 6);
    if (/^[1-9]\d{5}$/.test(pin)) {
      localStorage.setItem('sb_pincode', pin);
      if (d.address.city || d.address.town || d.address.village || d.address.state_district) {
        localStorage.setItem('sb_location_name', d.address.city || d.address.town || d.address.village || d.address.state_district);
      }
      return pin;
    }
  } catch { /* lookup failed — permission still granted */ }
  return '';
}

async function askCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach(t => t.stop()); // only asking permission — camera turns off straight away
}

const PERMS = [
  { key: 'notifications', icon: '🔔', title: 'Notifications', text: 'Flash sales, price drops on your wishlist and order updates — like WhatsApp messages.', important: true },
  { key: 'location', icon: '📍', title: 'Location', text: 'Shows the delivery date and Cash on Delivery for your area automatically.' },
  { key: 'camera', icon: '📷', title: 'Camera & photos', text: 'Take photos for your product reviews.' },
];

export default function AppWelcome() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0); // 0 welcome, 1 permissions, 2 done
  const [state, setState] = useState({}); // key → 'granted' | 'denied' | 'busy' | 'unsupported'
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!appWelcomePending()) return;
    const supported = {
      notifications: pushSupported(),
      location: 'geolocation' in navigator,
      camera: !!navigator.mediaDevices?.getUserMedia,
    };
    const init = {};
    for (const p of PERMS) if (!supported[p.key]) init[p.key] = 'unsupported';
    if (supported.notifications && Notification.permission === 'granted') init.notifications = 'granted';
    setState(init);
    // Already-granted permissions show as done
    navigator.permissions?.query?.({ name: 'geolocation' }).then(r => { if (r.state === 'granted') setState(s => ({ ...s, location: 'granted' })); }).catch(() => {});
    navigator.permissions?.query?.({ name: 'camera' }).then(r => { if (r.state === 'granted') setState(s => ({ ...s, camera: 'granted' })); }).catch(() => {});
    setShow(true);
  }, []);

  async function ask(key) {
    setState(s => ({ ...s, [key]: 'busy' }));
    try {
      if (key === 'notifications') await enablePush();
      if (key === 'location') setPin(await detectPincode());
      if (key === 'camera') await askCamera();
      setState(s => ({ ...s, [key]: 'granted' }));
      return true;
    } catch {
      setState(s => ({ ...s, [key]: 'denied' }));
      return false;
    }
  }

  async function allowAll() {
    for (const p of PERMS) {
      const st = state[p.key];
      if (st === 'granted' || st === 'unsupported') continue;
      await ask(p.key); // one system pop-up at a time, like other apps
    }
    setStep(2);
  }

  function finish() {
    try { localStorage.setItem(DONE_KEY, '1'); localStorage.setItem('sb_push_prompt_v1', String(Date.now() + 365 * 24 * 3600e3)); } catch { /* ignore */ }
    setShow(false);
  }

  if (!show) return null;

  const wrap = { position: 'fixed', inset: 0, zIndex: 2147483646, background: 'radial-gradient(circle at 30% 10%, #FFE0F0, #FFF6F2 55%)', display: 'flex', flexDirection: 'column', overflowY: 'auto', fontFamily: 'Inter,sans-serif' };

  return (
    <div style={wrap} role="dialog" aria-label="Welcome to Sheen Bazaar">
      <div className="sb-blobs" aria-hidden="true"><span /><span /><span /></div>
      <div className="sb-page" key={step} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 460, width: '100%', margin: '0 auto', padding: 'calc(28px + env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom))' }}>

        {step === 0 && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div className="sb-splash" style={{ minHeight: 0, background: 'none' }}><BagLogo size={110} /></div>
              <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 30, fontWeight: 800, color: '#1A0A12', margin: '14px 0 6px' }}>Welcome to Sheen Bazaar</h1>
              <p style={{ color: '#6B5A67', fontSize: 15, lineHeight: 1.6, margin: 0 }}>Thanks for installing our app! 🎉<br />Fashion, electronics and daily deals — delivered to your door.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['⚡ Flash sales', '🎡 Daily Spin & Win', '🚚 Live order tracking'].map(t => (
                  <span key={t} style={{ background: '#fff', border: '1px solid #F3E6EC', borderRadius: 50, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#4A2040', boxShadow: '0 4px 12px rgba(185,0,110,.08)' }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary" style={{ border: 'none', borderRadius: 16, padding: '16px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', width: '100%' }}>Get started →</button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 44 }}>🛡️</div>
              <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 25, fontWeight: 800, color: '#1A0A12', margin: '6px 0 4px' }}>Allow permissions</h2>
              <p style={{ color: '#6B5A67', fontSize: 14, margin: 0 }}>So the app can work at its best. You can change these anytime in your phone's settings.</p>
            </div>
            <div style={{ flex: 1 }}>
              {PERMS.map(p => {
                const st = state[p.key];
                return (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 18, padding: '14px 14px', marginBottom: 12, border: `1.5px solid ${st === 'granted' ? '#bbf7d0' : '#F3E6EC'}`, boxShadow: '0 6px 18px rgba(185,0,110,.06)' }}>
                    <span style={{ width: 48, height: 48, borderRadius: 14, background: st === 'granted' ? '#dcfce7' : '#FFE8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: '#1A0A12' }}>{p.title}{p.important && <span style={{ marginLeft: 6, fontSize: 10.5, background: '#E91E8C', color: '#fff', borderRadius: 50, padding: '2px 7px', verticalAlign: 'middle' }}>Recommended</span>}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: '#6B5A67', lineHeight: 1.45, marginTop: 2 }}>
                        {st === 'denied' ? 'Not allowed — you can turn it on later in phone Settings.' : st === 'unsupported' ? 'Not available on this phone.' : p.key === 'location' && st === 'granted' && pin ? `Your pincode: ${pin} ✓` : p.text}
                      </span>
                    </span>
                    {st === 'granted' ? <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 20 }}>✓</span>
                      : st === 'unsupported' ? <span style={{ color: '#B0A0AC', fontSize: 12 }}>—</span>
                      : <button onClick={() => ask(p.key)} disabled={st === 'busy'} style={{ background: st === 'denied' ? '#fff' : '#1A0A12', color: st === 'denied' ? '#8A7A87' : '#fff', border: st === 'denied' ? '1px solid #EFE1E7' : 'none', borderRadius: 50, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>{st === 'busy' ? '…' : st === 'denied' ? 'Retry' : 'Allow'}</button>}
                  </div>
                );
              })}
            </div>
            <button onClick={allowAll} className="btn-primary" style={{ border: 'none', borderRadius: 16, padding: '16px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', width: '100%', marginTop: 8 }}>✅ Allow all & continue</button>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#8A7A87', fontWeight: 700, fontSize: 14, padding: 14, cursor: 'pointer' }}>Skip for now</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 70 }} className="sb-pop">🎉</div>
              <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 28, fontWeight: 800, color: '#1A0A12', margin: '10px 0 6px' }}>You're all set!</h2>
              <p style={{ color: '#6B5A67', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {state.notifications === 'granted' ? 'We\'ll send you the best deals and every order update right here on your phone.' : 'You can turn on notifications anytime from your Profile.'}
              </p>
            </div>
            <button onClick={finish} className="btn-primary" style={{ border: 'none', borderRadius: 16, padding: '16px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', width: '100%' }}>Start shopping 🛍️</button>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: step === i ? 22 : 8, height: 8, borderRadius: 50, background: step === i ? '#E91E8C' : '#F3C6DF', transition: 'width .3s' }} />)}
        </div>
      </div>
    </div>
  );
}
