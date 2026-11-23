// Small line icons for the top bar (emoji render as empty boxes on some Windows PCs)
const base = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const StoreIcon = (p) => (
  <svg {...base} {...p}><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 11.5V20h14v-8.5" /><path d="M10 20v-5h4v5" /></svg>
);
export const MegaphoneIcon = (p) => (
  <svg {...base} {...p}><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></svg>
);
export const BellIcon = (p) => (
  <svg {...base} {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8.5 3 8.5H3S6 15 6 8z" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></svg>
);
export const HeartIcon = (p) => (
  <svg {...base} {...p}><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.7 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.3 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20z" /></svg>
);
export const CartIcon = (p) => (
  <svg {...base} {...p}><path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const ChevronDown = (p) => (
  <svg {...base} width={14} height={14} strokeWidth={2.4} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
