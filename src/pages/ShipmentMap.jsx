import { useEffect, useRef, useState } from 'react';

// Real India outline is fetched from a public, verified GeoJSON source and
// rendered with D3's geographic projection — this guarantees an accurate
// shape (actual surveyed coastline/borders), not a hand-drawn approximation.
const INDIA_GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/geojson/india.geojson';

// [longitude, latitude] for each city — real-world coordinates, so placement
// on the rendered map lines up correctly with the actual outline.
const CITIES = [
  { name: 'Srinagar', lon: 74.80, lat: 34.08 },
  { name: 'Delhi', lon: 77.10, lat: 28.61 },
  { name: 'Jaipur', lon: 75.79, lat: 26.91 },
  { name: 'Lucknow', lon: 80.95, lat: 26.85 },
  { name: 'Kolkata', lon: 88.36, lat: 22.57 },
  { name: 'Mumbai', lon: 72.88, lat: 19.08 },
  { name: 'Ahmedabad', lon: 72.57, lat: 23.02 },
  { name: 'Hyderabad', lon: 78.49, lat: 17.39 },
  { name: 'Bengaluru', lon: 77.59, lat: 12.97 },
  { name: 'Chennai', lon: 80.27, lat: 13.08 },
  { name: 'Guwahati', lon: 91.74, lat: 26.15 },
];

const SHIPMENTS = [
  { from: 0, to: 5, label: '👗 Pashmina Shawl' },
  { from: 1, to: 8, label: '📱 Phone Case' },
  { from: 6, to: 4, label: '👜 Handbag' },
  { from: 5, to: 9, label: '👟 Sneakers' },
  { from: 3, to: 7, label: '💄 Beauty Kit' },
  { from: 0, to: 4, label: '🧣 Kashmiri Stole' },
];

export default function ShipmentMap() {
  const svgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [projected, setProjected] = useState(null); // { pathD, cityPoints }
  const [activeShipment, setActiveShipment] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // d3-geo does the real cartographic math (Mercator-style projection +
        // path generation) so the shape renders exactly as it should, not
        // approximated by hand.
        const d3geo = await import('https://esm.sh/d3-geo@3');
        const res = await fetch(INDIA_GEOJSON_URL);
        if (!res.ok) throw new Error('Failed to fetch India outline data');
        const geojson = await res.json();

        const width = 400, height = 440;
        const projection = d3geo.geoMercator().fitSize([width - 20, height - 20], geojson);
        projection.translate([projection.translate()[0] + 10, projection.translate()[1] + 10]);
        const pathGen = d3geo.geoPath(projection);
        const pathD = pathGen(geojson);

        const cityPoints = CITIES.map(c => {
          const [x, y] = projection([c.lon, c.lat]);
          return { ...c, x, y };
        });

        if (!cancelled) {
          setProjected({ pathD, cityPoints, width, height });
          setReady(true);
        }
      } catch (err) {
        console.error('ShipmentMap: could not load India geography, falling back to text view.', err);
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveShipment(s => (s + 1) % SHIPMENTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const ship = SHIPMENTS[activeShipment];

  return (
    <div style={{ background: 'linear-gradient(135deg,#1A0A12,#3D0A2A)', borderRadius: 20, padding: '28px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes dashMove { to { stroke-dashoffset: -20; } }
        @keyframes packetMove { 0% { offset-distance: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
        @keyframes cityPulse { 0%,100% { r: 4; opacity: 1; } 50% { r: 7; opacity: 0.6; } }
        @keyframes labelFade { 0%,100% { opacity: 0; transform: translateY(4px); } 15%,85% { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>🚚 Live Deliveries Across India</h2>
          <p style={{ fontSize: 13, opacity: 0.65, margin: '4px 0 0' }}>Orders flying from sellers to happy customers, right now!</p>
        </div>
        {ready && (
          <div key={activeShipment} style={{ background: 'rgba(233,30,140,0.2)', border: '1px solid rgba(233,30,140,0.5)', borderRadius: 50, padding: '8px 18px', fontSize: 13, fontWeight: 700, animation: 'labelFade 3s ease infinite' }}>
            {ship.label}: {CITIES[ship.from].name} → {CITIES[ship.to].name}
          </div>
        )}
      </div>

      {error ? (
        <div style={{ textAlign: 'center', padding: '40px 10px', opacity: 0.6, fontSize: 13 }}>
          Map is taking a moment to load — deliveries are still moving! 📦
        </div>
      ) : !ready ? (
        <div style={{ textAlign: 'center', padding: '60px 10px', opacity: 0.5, fontSize: 13 }}>
          Loading map…
        </div>
      ) : (
        <svg viewBox={`0 0 ${projected.width} ${projected.height}`} style={{ width: '100%', maxHeight: 380, display: 'block' }}>
          <path d={projected.pathD} fill="rgba(233,30,140,0.1)" stroke="rgba(233,30,140,0.4)" strokeWidth="1" strokeLinejoin="round" />

          {/* Faint lines for every route */}
          {SHIPMENTS.map((s, i) => {
            const f = projected.cityPoints[s.from], t = projected.cityPoints[s.to];
            const midX = (f.x + t.x) / 2, midY = Math.min(f.y, t.y) - 24;
            return <path key={i} d={`M${f.x},${f.y} Q${midX},${midY} ${t.x},${t.y}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />;
          })}

          {/* Active animated route */}
          {(() => {
            const f = projected.cityPoints[ship.from], t = projected.cityPoints[ship.to];
            const midX = (f.x + t.x) / 2, midY = Math.min(f.y, t.y) - 24;
            const d = `M${f.x},${f.y} Q${midX},${midY} ${t.x},${t.y}`;
            return (
              <g key={activeShipment}>
                <path d={d} fill="none" stroke="#E91E8C" strokeWidth="2.2" strokeDasharray="6 6" style={{ animation: 'dashMove 0.6s linear infinite' }} />
                <g style={{ offsetPath: `path('${d}')`, animation: 'packetMove 3s linear infinite' }}>
                  <text fontSize="16" x="-8" y="6">📦</text>
                </g>
              </g>
            );
          })()}

          {/* City markers */}
          {projected.cityPoints.map((c, i) => (
            <g key={c.name}>
              <circle cx={c.x} cy={c.y} r={i === ship.from || i === ship.to ? 5 : 3}
                fill={i === ship.from || i === ship.to ? '#E91E8C' : 'rgba(255,255,255,0.55)'}
                style={i === ship.from || i === ship.to ? { animation: 'cityPulse 1.2s ease infinite' } : {}} />
              <text x={c.x + 8} y={c.y + 4} fontSize="11" fill="rgba(255,255,255,0.75)" fontWeight="600">{c.name}</text>
            </g>
          ))}
        </svg>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: 12, opacity: 0.7 }}>
        <span>📦 3,891 orders delivered</span>
        <span>🏙️ 120+ cities</span>
        <span>⚡ Avg delivery 3.2 days</span>
      </div>
    </div>
  );
}
