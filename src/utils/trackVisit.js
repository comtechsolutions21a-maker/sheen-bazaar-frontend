const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
const VISITOR_ID_KEY = 'sb_visitor_id';

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / storage disabled — fall back to a per-session id
    // that won't count as a *returning* visitor but still gets tracked.
    return `v_session_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Fire-and-forget page view ping. Never throws — analytics should never be
// able to break the page it's tracking.
export function trackVisit(path) {
  try {
    fetch(`${BASE}/admin/public/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, visitorId: getVisitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
