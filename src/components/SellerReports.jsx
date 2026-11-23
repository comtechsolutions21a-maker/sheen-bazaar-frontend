import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const BAR = '#E91E8C';
const INK = '#1A0A12';
const MUTED = '#8A7A87';
const GRID = '#F3E6EC';
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const METRICS = [
  { key: 'sales', label: 'Sales', fmt: rupees },
  { key: 'payout', label: 'Your payout', fmt: rupees },
  { key: 'orders', label: 'Orders', fmt: (n) => String(n) },
];

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
}

// Single-series monthly bar chart with a hover tooltip on each bar.
function MonthlyChart({ months, metric }) {
  const [hover, setHover] = useState(null);
  const m = METRICS.find((x) => x.key === metric);
  const W = 640, H = 240, padL = 52, padR = 10, padT = 14, padB = 30;
  const max = niceMax(Math.max(...months.map((d) => d[metric])));
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const slot = innerW / months.length;
  const barW = Math.min(30, slot - 2); // ≥2px gap between bars
  const y = (v) => padT + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${m.label} per month, last 12 months`} style={{ display: 'block' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill={MUTED}>{metric === 'orders' ? Math.round(t) : t >= 1000 ? `₹${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `₹${Math.round(t)}`}</text>
          </g>
        ))}
        {months.map((d, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const v = d[metric];
          const h = Math.max(0, padT + innerH - y(v));
          const r = Math.min(4, h / 2, barW / 2);
          // Rounded top corners only; flat on the baseline
          const path = h > 0
            ? `M${x},${y(0)} V${y(v) + r} Q${x},${y(v)} ${x + r},${y(v)} H${x + barW - r} Q${x + barW},${y(v)} ${x + barW},${y(v) + r} V${y(0)} Z`
            : '';
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} style={{ outline: 'none' }}>
              <rect x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent" />
              {path && <path d={path} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.45} />}
              <text x={padL + i * slot + slot / 2} y={H - 10} textAnchor="middle" fontSize="10.5" fill={hover === i ? INK : MUTED} fontWeight={hover === i ? 700 : 400}>{d.label.split(' ')[0]}</text>
            </g>
          );
        })}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="#D8C8D2" strokeWidth="1" />
      </svg>
      {hover !== null && (
        <div style={{ position: 'absolute', top: 0, left: `${Math.min(78, Math.max(4, ((padL + hover * slot + slot / 2) / W) * 100 - 10))}%`, background: '#fff', border: `1px solid ${GRID}`, boxShadow: '0 6px 18px rgba(26,10,18,0.12)', borderRadius: 10, padding: '8px 10px', fontSize: 12, pointerEvents: 'none', minWidth: 130 }}>
          <div style={{ fontWeight: 800, color: INK, marginBottom: 4 }}>{months[hover].label}</div>
          <div style={{ color: INK }}>Sales: <strong>{rupees(months[hover].sales)}</strong></div>
          <div style={{ color: INK }}>Payout: <strong>{rupees(months[hover].payout)}</strong></div>
          <div style={{ color: MUTED }}>{months[hover].orders} order{months[hover].orders === 1 ? '' : 's'}</div>
        </div>
      )}
    </div>
  );
}

export default function SellerReports({ transactions = [] }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [metric, setMetric] = useState('sales');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => { api.sellerGetReport().then(setData).catch((e) => setError(e.message)); }, []);

  const topMax = useMemo(() => Math.max(1, ...(data?.topProducts || []).map((p) => p.sales)), [data]);

  function downloadCsv() {
    const rows = [['Date', 'Order ID', 'Order status', 'Payment', 'Payment status', 'Gross (Rs)', 'Commission (Rs)', 'Shipping (Rs)', 'Your payout (Rs)', 'Payout settled']];
    for (const t of transactions) {
      rows.push([new Date(t.date).toLocaleDateString('en-IN'), String(t.orderId).slice(-8).toUpperCase(), t.orderStatus, t.paymentMethod, t.paymentStatus, t.grossAmount, t.commission, t.shippingCharge || 0, t.amount, t.payoutSettled ? 'Yes' : 'No']);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sheen-bazaar-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 14, padding: 18, marginBottom: 16 };
  if (error) return <div style={card}>⚠️ {error}</div>;
  if (!data) return <div style={{ ...card, color: MUTED }}>Loading reports…</div>;
  const t = data.totals;

  const tiles = [
    { label: 'Total sales', value: rupees(t.sales), sub: `${t.orders} orders` },
    { label: 'Paid out to you', value: rupees(t.settled), sub: 'Settled by admin' },
    { label: 'Awaiting payout', value: rupees(t.awaitingPayout), sub: 'Paid by customer, not yet settled' },
    { label: 'Pending COD', value: rupees(t.pendingCod), sub: 'Cash not collected yet' },
    { label: 'Platform commission', value: rupees(t.commission), sub: 'On paid orders' },
    { label: 'Shipping charges', value: rupees(t.shipping || 0), sub: 'Courier cost after customer delivery fee' },
    { label: 'Delivered', value: t.delivered, sub: `${t.cancelled} cancelled · ${t.returned} returned` },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map((x) => (
          <div key={x.label} style={{ ...card, marginBottom: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4 }}>{x.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: INK, fontFamily: 'Baloo 2,sans-serif', marginTop: 2 }}>{x.value}</div>
            <div style={{ fontSize: 11.5, color: MUTED }}>{x.sub}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📈 {METRICS.find((x) => x.key === metric).label} — last 12 months</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {METRICS.map((x) => (
              <button key={x.key} onClick={() => setMetric(x.key)} style={{ padding: '6px 12px', borderRadius: 50, border: `1.5px solid ${metric === x.key ? BAR : '#EFE1E7'}`, background: metric === x.key ? '#FFE8F5' : '#fff', color: metric === x.key ? '#B5006E' : '#4A2040', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{x.label}</button>
            ))}
          </div>
        </div>
        <MonthlyChart months={data.months} metric={metric} />
        <button onClick={() => setShowTable((v) => !v)} style={{ background: 'none', border: 'none', color: '#B5006E', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '6px 0' }}>{showTable ? 'Hide table' : 'Show as table'}</button>
        {showTable && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>{['Month', 'Orders', 'Sales', 'Commission', 'Payout'].map((h) => <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', padding: '6px 8px', color: MUTED, borderBottom: `1px solid ${GRID}` }}>{h}</th>)}</tr></thead>
              <tbody>{data.months.map((m) => (
                <tr key={m.key}>
                  <td style={{ padding: '6px 8px' }}>{m.label}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{m.orders}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{rupees(m.sales)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{rupees(m.commission)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{rupees(m.payout)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>🏆 Best-selling products</h3>
        {data.topProducts.length === 0 ? <div style={{ color: MUTED, fontSize: 13 }}>No sales yet.</div> : data.topProducts.map((p) => (
          <div key={p.productId} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, gap: 10 }}>
              <span style={{ color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ color: INK, whiteSpace: 'nowrap' }}><strong>{rupees(p.sales)}</strong> <span style={{ color: MUTED }}>· {p.qty} sold</span></span>
            </div>
            <div style={{ height: 8, background: GRID, borderRadius: 50 }}>
              <div style={{ width: `${(p.sales / topMax) * 100}%`, height: '100%', background: BAR, borderRadius: 50 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#4A2040' }}>📥 Download every order with its commission and payout, for your accounts or GST filing.</div>
        <button onClick={downloadCsv} disabled={!transactions.length} style={{ background: BAR, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: transactions.length ? 'pointer' : 'not-allowed', opacity: transactions.length ? 1 : 0.5 }}>Download CSV (Excel)</button>
      </div>
    </div>
  );
}
