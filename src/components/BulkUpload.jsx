import { useState } from 'react';
import { readSpreadsheet, toCSV, downloadFile } from '../utils/spreadsheet';
import { BASE_URL, getToken } from '../api/client';

// Columns of the template, in order. Only sku/name/category/price are needed for
// a new product; for an update, sku plus whatever you want to change.
export const BULK_COLUMNS = [
  ['sku', 'Your own product code (used to update later)'],
  ['name', 'Product name'],
  ['category', 'Fashion, Electronics, Home, Beauty, Sports, Books, Grocery, Toys…'],
  ['price', 'Selling price ₹'],
  ['mrp', 'Original price ₹ (shown crossed out)'],
  ['stock', 'Units in stock'],
  ['brand', 'Brand'],
  ['description', 'Description'],
  ['image_urls', 'Photo links, separated by |'],
  ['highlights', 'Key points, separated by |'],
  ['delivery_days', 'Days to deliver'],
  ['return_days', 'Return window (days)'],
  ['weight_kg', 'Parcel weight in kg (for courier)'],
  ['flash_price', 'Flash sale price ₹ (optional)'],
  ['flash_ends', 'Flash sale ends, e.g. 2026-12-31 18:00'],
];
const KEYS = BULK_COLUMNS.map(c => c[0]);
const ALIASES = { title: 'name', product: 'name', product_name: 'name', cat: 'category', selling_price: 'price', old: 'mrp', mrp_price: 'mrp', original_price: 'mrp', qty: 'stock', quantity: 'stock', desc: 'description', images: 'image_urls', image: 'image_urls', image_url: 'image_urls', weight: 'weight_kg' };

function normalizeHeader(h) {
  const k = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return KEYS.includes(k) ? k : ALIASES[k] || null;
}

export function downloadTemplate() {
  downloadFile('sheen-bazaar-products-template.csv', toCSV([
    KEYS,
    ['SHAWL-RED-01', 'Kashmiri Pashmina Shawl - Red', 'Fashion', 2499, 3200, 15, 'Kashmir Looms', 'Pure hand-woven pashmina wool.', 'https://example.com/shawl-1.jpg|https://example.com/shawl-2.jpg', 'Hand-woven|Pure wool|Free size', 5, 7, 0.4, '', ''],
    ['TEA-KAHWA-250', 'Kashmiri Kahwa Tea 250g', 'Grocery', 349, 399, 60, 'Valley Fresh', 'Saffron and almond kahwa blend.', '', 'Real saffron|No preservatives', 4, 0, 0.3, 299, '2026-12-31 23:59'],
  ]));
}

export function exportProducts(products) {
  downloadFile(`my-products-${new Date().toISOString().slice(0, 10)}.csv`, toCSV([
    KEYS,
    ...products.map(p => [
      p.sku || '', p.name, p.cat, p.regularPrice ?? p.price, p.old || '', p.stock ?? '', p.brand || '', p.desc || '',
      (p.images || []).filter(u => /^https?:\/\//.test(u)).join('|'), (p.highlights || []).join('|'),
      p.deliveryDays || '', p.returnDays ?? '', p.weightKg || '', p.flashPrice || '',
      p.flashEndsAt ? new Date(p.flashEndsAt).toISOString().slice(0, 16).replace('T', ' ') : '',
    ]),
  ]));
}

// Upload window: pick a file → preview with problems marked → upload
export default function BulkUpload({ onClose, onDone, existingSkus = [] }) {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const skuSet = new Set(existingSkus.filter(Boolean));

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setResult(null); setRows(null); setFileName(file.name);
    try {
      const grid = await readSpreadsheet(file);
      if (grid.length < 2) throw new Error('The file has no product rows under the header row.');
      const headers = grid[0].map(normalizeHeader);
      if (!headers.includes('sku') && !headers.includes('name')) throw new Error('Could not find the column names. The first row must be the header row from the template (sku, name, category, price…).');
      const parsed = grid.slice(1, 501).map((line, i) => {
        const o = { __row: i + 2 };
        headers.forEach((h, j) => { if (h) o[h] = String(line[j] ?? '').trim(); });
        const isUpdate = o.sku && skuSet.has(o.sku);
        const problems = [];
        if (!isUpdate) {
          if (!o.name) problems.push('name missing');
          if (!o.category) problems.push('category missing');
          if (!o.price) problems.push('price missing');
        }
        if (o.price && !(Number(String(o.price).replace(/[₹,\s]/g, '')) > 0)) problems.push('price is not a number');
        if (o.stock && !(Number(o.stock) >= 0)) problems.push('stock is not a number');
        return { ...o, __action: isUpdate ? 'update' : 'new', __problems: problems };
      });
      if (grid.length > 501) setError(`Only the first 500 products are read — upload the rest in a second file.`);
      setRows(parsed);
    } catch (err) { setError(err.message); }
  }

  async function upload() {
    const good = rows.filter(r => !r.__problems.length).map(({ __action, __problems, ...r }) => r); // eslint-disable-line no-unused-vars
    if (!good.length) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}/seller/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ rows: good }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setResult(data);
      onDone?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const bad = rows ? rows.filter(r => r.__problems.length).length : 0;
  const newCount = rows ? rows.filter(r => !r.__problems.length && r.__action === 'new').length : 0;
  const updCount = rows ? rows.filter(r => !r.__problems.length && r.__action === 'update').length : 0;
  const th = { textAlign: 'left', padding: '8px 10px', fontSize: 11.5, color: '#8A7A87', borderBottom: '1px solid #F3E6EC', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#fff' };
  const td = { padding: '7px 10px', fontSize: 12.5, borderBottom: '1px solid #F7EEF3', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,18,.5)', zIndex: 2147483500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 'min(820px, 100%)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.3)', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3E6EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'Baloo 2,sans-serif' }}>📥 Bulk upload products</div>
            <div style={{ fontSize: 12.5, color: '#8A7A87' }}>Add many products at once, or update prices & stock — from Excel or CSV.</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: '#F7EEF3', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }}>
          {!result && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#FFF8FC', border: '1px solid #F3E6EC', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>1. Get the template</div>
                  <div style={{ fontSize: 12.5, color: '#6B5A67', marginBottom: 10 }}>Opens in Excel or Google Sheets. One product per row.</div>
                  <button onClick={downloadTemplate} style={{ background: '#fff', border: '1.5px solid #E91E8C', color: '#B5006E', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>⬇️ Download template</button>
                </div>
                <div style={{ background: '#FFF8FC', border: '1px solid #F3E6EC', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>2. Upload your file</div>
                  <div style={{ fontSize: 12.5, color: '#6B5A67', marginBottom: 10 }}>Excel (.xlsx) or CSV. Up to 500 products.</div>
                  <label style={{ display: 'inline-block', background: '#E91E8C', color: '#fff', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    📂 Choose file
                    <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={pick} />
                  </label>
                  {fileName && <span style={{ marginLeft: 8, fontSize: 12, color: '#6B5A67' }}>{fileName}</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#8A7A87', marginBottom: 14, lineHeight: 1.6 }}>
                💡 <strong>Same SKU = update.</strong> If a row's <code>sku</code> matches one of your products, only the columns you filled in change, so a sheet with just <code>sku, price, stock</code> updates prices and stock in one go. Tip: use <strong>Export products</strong> to get your current list, edit it, and upload it back.
              </div>
            </>
          )}

          {error && <div style={{ background: '#FFF1F2', border: '1px solid #fecdd3', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚠️ {error}</div>}

          {rows && !result && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 50, padding: '4px 12px', fontSize: 12.5, fontWeight: 700 }}>🆕 {newCount} new</span>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 50, padding: '4px 12px', fontSize: 12.5, fontWeight: 700 }}>✏️ {updCount} updates</span>
                {bad > 0 && <span style={{ background: '#FFF1F2', color: '#b91c1c', borderRadius: 50, padding: '4px 12px', fontSize: 12.5, fontWeight: 700 }}>⚠️ {bad} with problems (skipped)</span>}
              </div>
              <div style={{ border: '1px solid #F3E6EC', borderRadius: 12, overflow: 'auto', maxHeight: 320 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead><tr>{['Row', '', 'SKU', 'Name', 'Category', 'Price', 'Stock', 'Problems'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.__row} style={{ background: r.__problems.length ? '#FFF7F7' : '#fff' }}>
                        <td style={{ ...td, color: '#8A7A87' }}>{r.__row}</td>
                        <td style={td}>{r.__problems.length ? '⚠️' : r.__action === 'update' ? '✏️' : '🆕'}</td>
                        <td style={td}>{r.sku || '—'}</td>
                        <td style={td} title={r.name}>{r.name || '—'}</td>
                        <td style={td}>{r.category || '—'}</td>
                        <td style={td}>{r.price ? `₹${r.price}` : '—'}</td>
                        <td style={td}>{r.stock || '—'}</td>
                        <td style={{ ...td, color: '#b91c1c' }}>{r.__problems.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 46 }} className="sb-pop">🎉</div>
              <div style={{ fontWeight: 800, fontSize: 19, margin: '6px 0' }}>Upload finished</div>
              <div style={{ fontSize: 14, color: '#4A2040' }}><strong>{result.created}</strong> products added · <strong>{result.updated}</strong> updated{result.failed.length ? <> · <strong style={{ color: '#b91c1c' }}>{result.failed.length}</strong> failed</> : ''}</div>
              {result.failed.length > 0 && (
                <div style={{ textAlign: 'left', marginTop: 14, background: '#FFF7F7', border: '1px solid #fecdd3', borderRadius: 12, padding: 12, maxHeight: 220, overflowY: 'auto' }}>
                  {result.failed.map(f => <div key={f.row} style={{ fontSize: 12.5, padding: '3px 0' }}>Row {f.row} {f.sku && `(${f.sku})`}: <span style={{ color: '#b91c1c' }}>{f.error}</span></div>)}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#8A7A87', marginTop: 10 }}>Customers who wishlisted a product get a notification automatically if its price dropped.</div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #F3E6EC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #EFE1E7', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>{result ? 'Close' : 'Cancel'}</button>
          {rows && !result && <button onClick={upload} disabled={busy || !(newCount + updCount)} className="btn-primary" style={{ border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 800, cursor: 'pointer', opacity: busy || !(newCount + updCount) ? 0.6 : 1 }}>{busy ? 'Uploading…' : `Upload ${newCount + updCount} product${newCount + updCount === 1 ? '' : 's'}`}</button>}
        </div>
      </div>
    </div>
  );
}
