// Original Sheen Bazaar artwork (inline SVG — no image files to load, sharp on
// every screen, animated with CSS in animations.css).
import { Link } from 'react-router-dom';

const PINK = '#E91E8C';
const DEEP = '#B5006E';
const GOLD = '#FFB300';
const INK = '#1A0A12';

// Chinar (Kashmiri maple) leaf — reused as a decorative motif
function Chinar({ x, y, s = 1, fill = '#FF7A45', className = '' }) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${s})`}>
      <path fill={fill} d="M0-30 L6-14 L20-22 L14-6 L30-4 L16 6 L24 20 L8 14 L4 28 L0 18 L-4 28 L-8 14 L-24 20 L-16 6 L-30-4 L-14-6 L-20-22 L-6-14 Z" />
      <path stroke="rgba(0,0,0,.18)" strokeWidth="1.4" fill="none" d="M0 30 L0-24 M0 0 L-16-12 M0 0 L16-12 M0 8 L-14 12 M0 8 L14 12" />
    </g>
  );
}

function Spark({ x, y, r = 6, fill = '#fff' }) {
  return <path className="spark" fill={fill} d={`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`} />;
}

function Bag({ x, y, w, h, body, flap, handle = INK, className, children }) {
  return (
    <g className={className}>
      <path d={`M${x + w * 0.28} ${y + 8} C${x + w * 0.28} ${y - h * 0.32}, ${x + w * 0.72} ${y - h * 0.32}, ${x + w * 0.72} ${y + 8}`} fill="none" stroke={handle} strokeWidth="6" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height={h} rx="14" fill={body} />
      <rect x={x} y={y} width={w} height={h * 0.2} rx="14" fill={flap} />
      <rect x={x} y={y + h * 0.12} width={w} height={h * 0.08} fill={flap} />
      {children}
    </g>
  );
}

// Big animated hero picture for the Home page
export function HeroArt() {
  return (
    <svg className="sb-hero-art" viewBox="0 0 400 360" role="img" aria-label="Colourful shopping bags">
      <defs>
        <linearGradient id="hgA" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#FF4FB0" /><stop offset="1" stopColor={DEEP} /></linearGradient>
        <linearGradient id="hgB" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#FFD166" /><stop offset="1" stopColor="#FF9F1C" /></linearGradient>
        <linearGradient id="hgC" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#B794F6" /><stop offset="1" stopColor="#6D28D9" /></linearGradient>
        <radialGradient id="hgGlow"><stop offset="0" stopColor="#FF7AC6" stopOpacity=".55" /><stop offset="1" stopColor="#FF7AC6" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="200" cy="190" r="170" fill="url(#hgGlow)" />
      <circle className="ring" cx="200" cy="190" r="140" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2" strokeDasharray="4 12" />
      <ellipse cx="200" cy="330" rx="140" ry="14" fill="rgba(0,0,0,.25)" />

      <Bag className="bag-b" x={40} y={150} w={110} h={150} body="url(#hgB)" flap="#F08C00">
        <circle cx={95} cy={235} r="22" fill="rgba(255,255,255,.9)" />
        <text x={95} y={243} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="22" fill="#F08C00">%</text>
      </Bag>
      <Bag className="bag-c" x={252} y={160} w={108} h={140} body="url(#hgC)" flap="#5B21B6">
        <rect x={276} y={215} width="60" height="34" rx="8" fill="rgba(255,255,255,.9)" />
        <text x={306} y={238} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="15" fill="#5B21B6">SALE</text>
      </Bag>
      <Bag className="bag-a" x={128} y={110} w={144} h={196} body="url(#hgA)" flap="#9D0060">
        <text x={200} y={232} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="30" fill="#fff">Sheen</text>
        <text x={200} y={262} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="22" fill="#FFD6EC">Bazaar</text>
        <path d="M168 282 h64" stroke="rgba(255,255,255,.5)" strokeWidth="3" strokeLinecap="round" />
      </Bag>

      <Chinar className="leaf" x={62} y={70} s={0.9} fill="#FF7A45" />
      <Chinar className="leaf l2" x={344} y={92} s={0.7} fill="#FFB347" />
      <Spark x={120} y={60} r={9} />
      <Spark x={300} y={50} r={7} fill={GOLD} />
      <Spark x={360} y={160} r={6} />
      <Spark x={30} y={210} r={7} fill={GOLD} />
      <Spark x={210} y={36} r={5} />
    </svg>
  );
}

// Bag logo used on the splash screen
export function BagLogo({ size = 88 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="blg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#FF4FB0" /><stop offset="1" stopColor={DEEP} /></linearGradient></defs>
      <path d="M34 34 C34 14, 66 14, 66 34" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <rect x="18" y="30" width="64" height="62" rx="14" fill="url(#blg)" />
      <rect x="18" y="30" width="64" height="12" rx="6" fill="#9D0060" />
      <text x="50" y="76" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="28" fill="#fff">S</text>
      <path d="M80 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill={GOLD} />
    </svg>
  );
}

export function Splash({ text = 'Sheen Bazaar' }) {
  return (
    <div className="sb-splash" role="status" aria-label="Loading">
      <div className="sb-blobs" aria-hidden="true"><span /><span /><span /></div>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <BagLogo />
        <div className="word">{text}</div>
        <div className="dots" style={{ marginTop: 10 }}><span /><span /><span /></div>
      </div>
    </div>
  );
}

// Empty-state pictures: cart, orders, wishlist, search, reviews, offers
const EMPTY = {
  cart: {
    title: 'Your cart is empty', text: 'Looks like you haven\'t added anything yet. Let\'s fix that!', cta: ['Start shopping', '/products'],
    art: (
      <>
        <ellipse cx="100" cy="150" rx="64" ry="8" fill="#F3E6EC" />
        <g className="float">
          <path d="M40 50 h18 l14 62 h62 l12-44 H66" fill="none" stroke={PINK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="82" cy="128" r="9" fill={INK} /><circle cx="128" cy="128" r="9" fill={INK} />
          <path d="M82 84 h52" stroke="#FFC2E2" strokeWidth="5" strokeLinecap="round" />
        </g>
        <Spark x={150} y={40} r={8} fill={GOLD} /><g className="spark s2"><Spark x={44} y={28} r={6} fill={PINK} /></g>
      </>
    ),
  },
  orders: {
    title: 'No orders yet', text: 'When you place an order, you can track it right here.', cta: ['Browse products', '/products'],
    art: (
      <>
        <ellipse cx="100" cy="150" rx="64" ry="8" fill="#F3E6EC" />
        <g className="float">
          <path d="M50 70 L100 46 L150 70 L150 124 L100 148 L50 124 Z" fill="#FFD9A8" />
          <path d="M50 70 L100 94 L150 70 M100 94 V148" fill="none" stroke="#E8A35E" strokeWidth="4" strokeLinejoin="round" />
          <path d="M75 58 L125 82" stroke="#E8A35E" strokeWidth="8" />
          <rect x="112" y="104" width="26" height="16" rx="3" fill="#fff" transform="rotate(-24 125 112)" />
        </g>
        <Spark x={160} y={44} r={8} fill={PINK} /><g className="spark s3"><Spark x={38} y={52} r={6} fill={GOLD} /></g>
      </>
    ),
  },
  wishlist: {
    title: 'Your wishlist is empty', text: 'Tap the ♡ on anything you love to save it for later.', cta: ['Find something you love', '/products'],
    art: (
      <>
        <ellipse cx="100" cy="150" rx="56" ry="8" fill="#F3E6EC" />
        <g className="float">
          <path d="M100 136 C40 96, 44 46, 76 44 C90 43, 98 54, 100 60 C102 54, 110 43, 124 44 C156 46, 160 96, 100 136 Z" fill={PINK} />
          <path d="M78 62 C70 64, 66 72, 68 80" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".7" />
        </g>
        <Spark x={150} y={40} r={9} fill={GOLD} /><g className="spark s2"><Spark x={46} y={36} r={6} fill="#A78BFA" /></g>
      </>
    ),
  },
  search: {
    title: 'Nothing found', text: 'Try a different word, category or price range.', cta: ['Clear search', '/products'],
    art: (
      <>
        <ellipse cx="100" cy="150" rx="56" ry="8" fill="#F3E6EC" />
        <g className="float">
          <circle cx="88" cy="80" r="38" fill="#fff" stroke={PINK} strokeWidth="8" />
          <path d="M116 108 L146 138" stroke={INK} strokeWidth="12" strokeLinecap="round" />
          <path d="M74 70 q14-14 28 0" fill="none" stroke="#FFC2E2" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className="spark s3"><Spark x={156} y={50} r={7} fill={GOLD} /></g>
      </>
    ),
  },
  offers: {
    title: 'No offers right now', text: 'New deals drop often — check back soon!', cta: ['Browse products', '/products'],
    art: (
      <>
        <ellipse cx="100" cy="150" rx="56" ry="8" fill="#F3E6EC" />
        <g className="float">
          <rect x="52" y="74" width="96" height="66" rx="8" fill={PINK} />
          <rect x="46" y="60" width="108" height="20" rx="6" fill={DEEP} />
          <rect x="92" y="60" width="16" height="80" fill={GOLD} />
          <path d="M100 60 C84 36, 64 50, 82 60 M100 60 C116 36, 136 50, 118 60" fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
        </g>
        <Spark x={156} y={46} r={8} fill={GOLD} /><g className="spark s2"><Spark x={40} y={50} r={6} fill={PINK} /></g>
      </>
    ),
  },
};

export function EmptyState({ type = 'cart', title, text, cta, children }) {
  const e = EMPTY[type] || EMPTY.cart;
  const [label, to] = cta === null ? [] : (cta || e.cta);
  return (
    <div className="sb-empty">
      <svg viewBox="0 0 200 165" aria-hidden="true">{e.art}</svg>
      <h3>{title || e.title}</h3>
      <p>{text || e.text}</p>
      {children}
      {label && <Link to={to} className="btn-primary" style={{ display: 'inline-block' }}>{label} →</Link>}
    </div>
  );
}

// Wavy divider on top of the footer
export function FooterWave({ color = '#1A0A12' }) {
  return (
    <svg className="sb-wave" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true">
      <path fill={color} d="M0 24 C 180 0, 360 48, 540 24 S 900 0, 1080 24 S 1360 48, 1480 24 L1480 48 L0 48 Z" />
    </svg>
  );
}

// Rotating mandala-style pattern for dashboard headers
export function DashPattern() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg className="sb-pattern" viewBox="-100 -100 200 200" aria-hidden="true">
      {petals.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -18 C 14 -40, 14 -70, 0 -92 C -14 -70, -14 -40, 0 -18 Z" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cy="-56" r="4" fill="#fff" />
        </g>
      ))}
      <circle r="16" fill="none" stroke="#fff" strokeWidth="2" />
      <circle r="98" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 8" />
    </svg>
  );
}
