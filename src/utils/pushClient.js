// Shared helpers for turning on phone notifications and the app-icon badge.
import { api } from '../api/client';

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Asks permission (if needed) and registers this phone. Works logged in or as a guest.
export async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Notifications are blocked for this site' : 'Permission not given');
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await api.pushPublicKey();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  await api.pushSubscribe(sub.toJSON());
  try { localStorage.setItem('sb_push_on', '1'); } catch { /* ignore */ }
  return sub;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (sub) { await api.pushUnsubscribe(sub.endpoint).catch(() => {}); await sub.unsubscribe(); }
  try { localStorage.removeItem('sb_push_on'); } catch { /* ignore */ }
}

// Re-link this phone to the account after logging in (it may have subscribed as a guest)
export async function relinkPush() {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const sub = await currentSubscription();
    if (sub) await api.pushSubscribe(sub.toJSON());
  } catch { /* ignore */ }
}

// Number on the app icon (iPhone home-screen app, computers; Android shows a dot/number from the notifications)
export function setAppBadge(count) {
  const n = Math.max(0, Number(count) || 0);
  try {
    if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n).catch(() => {});
    else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
  } catch { /* not supported */ }
  try { navigator.serviceWorker?.controller?.postMessage({ type: 'sb-badge', count: n }); } catch { /* ignore */ }
}
