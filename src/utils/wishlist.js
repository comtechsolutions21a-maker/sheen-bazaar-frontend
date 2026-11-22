import { useEffect, useState, useCallback } from 'react';
import { api, getToken } from '../api/client';

// Wishlist kept on the phone (works logged out) AND synced to the server when
// logged in, so we can send "price dropped on your wishlist" alerts.
const KEY = 'sheenbazaar_wishlist';
const EVT = 'sb-wishlist-change';

export function readWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage full/blocked */ }
  window.dispatchEvent(new Event(EVT));
}

// Small copy of the product — skip huge uploaded photos so storage doesn't fill up
function snapshot(p) {
  const img = p.images?.[0] || p.image || '';
  return { id: p.id, name: p.name, price: p.price, old: p.old, icon: p.icon, cat: p.cat, image: img.length < 150000 ? img : '' };
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(readWishlist);

  useEffect(() => {
    const sync = () => setWishlist(readWishlist());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const isWishlisted = useCallback((id) => wishlist.some(p => p.id === id), [wishlist]);

  const toggle = useCallback((product) => {
    const cur = readWishlist();
    const exists = cur.some(p => p.id === product.id);
    const next = exists ? cur.filter(p => p.id !== product.id) : [...cur, snapshot(product)];
    write(next);
    if (getToken()) (exists ? api.wishlistRemove(product.id) : api.wishlistAdd(product.id)).catch(() => {});
    return !exists;
  }, []);

  const remove = useCallback((id) => {
    write(readWishlist().filter(p => p.id !== id));
    if (getToken()) api.wishlistRemove(id).catch(() => {});
  }, []);

  return { wishlist, toggle, remove, isWishlisted };
}

// After login: send the phone's list to the server (merged with what's saved there)
export function syncWishlistToServer() {
  if (!getToken()) return;
  const ids = readWishlist().map(p => p.id);
  api.syncWishlist(ids, true).catch(() => {});
}
