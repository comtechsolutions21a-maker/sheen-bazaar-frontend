// Lightweight recently-viewed tracker — stored in localStorage, no backend needed.
const KEY = 'sb_recently_viewed';
const MAX_ITEMS = 12;

export function recordView(product) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || [];
    const entry = {
      id: product.id, name: product.name, price: product.price, old: product.old,
      icon: product.icon, image: product.images?.[0] || product.image || '', cat: product.cat,
      viewedAt: Date.now(),
    };
    const filtered = list.filter(p => p.id !== product.id);
    filtered.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch { /* localStorage unavailable — silently skip */ }
}

export function getRecentlyViewed(excludeId = null) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || [];
    return excludeId ? list.filter(p => p.id !== excludeId) : list;
  } catch { return []; }
}
