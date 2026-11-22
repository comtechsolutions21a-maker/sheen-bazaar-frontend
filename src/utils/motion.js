import { useEffect, useRef, useState } from 'react';

// Respect the phone/computer "reduce motion" accessibility setting
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Elements that slide/fade in when they scroll into view — across the whole
// site, the seller dashboard and the admin panel, without editing every page.
const REVEAL_SELECTOR = [
  '.product-card', '.cat-grid > *', '.trust-item', '.sec-title', '.grid > *', '.stat-item',
  '.sb-reveal-children > *', '[data-reveal]', '.testimonial-card', '.footer-col',
].join(',');

// Run once in App. Uses one IntersectionObserver for everything, and a
// MutationObserver so content that loads later (products from the API)
// animates too. Elements already on screen when found are left alone, so
// nothing ever flashes or stays hidden.
export function useAutoReveal() {
  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('sb-in');
          io.unobserve(e.target);
        }
      }
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    const seen = new WeakSet();
    function scan(root) {
      const list = root.querySelectorAll ? root.querySelectorAll(REVEAL_SELECTOR) : [];
      list.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return; // already visible → don't hide it
        const idx = Array.prototype.indexOf.call(el.parentNode?.children || [], el);
        el.style.setProperty('--sb-d', `${Math.min(idx % 8, 7) * 60}ms`);
        el.classList.add('sb-reveal');
        io.observe(el);
      });
    }

    scan(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n.parentNode || n); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: never leave anything invisible
    const failsafe = setInterval(() => {
      document.querySelectorAll('.sb-reveal:not(.sb-in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('sb-in');
      });
    }, 1500);

    return () => { io.disconnect(); mo.disconnect(); clearInterval(failsafe); };
  }, []);
}

// Animated number: counts up from 0 when it first appears.
export function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const end = Number(target) || 0;
    if (prefersReducedMotion()) { setVal(end); return; }
    let raf; let start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return [val, ref];
}

// Short-lived flag that is true for a moment after the route changes —
// drives the thin loading bar at the top of the page.
export function useRouteFlash(pathname) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
    const t = setTimeout(() => setOn(false), 650);
    return () => clearTimeout(t);
  }, [pathname]);
  return on;
}
