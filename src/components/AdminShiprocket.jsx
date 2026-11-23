import { useState } from 'react';
import { BASE_URL, getToken } from '../api/client';

// Admin → Settings → 🚚 Shiprocket: connect the courier account.
// Uses the page's shared site-content state so other settings forms never
// overwrite these values with old ones.
export default function AdminShiprocket({ content, setContent, apiCall, showMsg }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(null);
  const c = content || {};
  const webhookUrl = `${BASE_URL}/shipping/courier-updates`;

  async function save() {
    setBusy(true);
    try {
      const body = { ...c, shiprocketPassword: password };
      const saved = await apiCall('/admin/site-content', 'PUT', body);
      if (saved && !saved.message) setContent(saved);
      setPassword('');
      showMsg('Shiprocket settings saved!');
    } catch (e) { showMsg(e.message || 'Save failed', 'error'); }
    finally { setBusy(false); }
  }

  async function runTest() {
    setBusy(true); setTest(null);
    try {
      const res = await fetch(`${BASE_URL}/shipping/admin/test`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await res.json();
      setTest(res.ok ? { ok: true, locations: d.locations || [] } : { ok: false, text: d.message });
    } catch (e) { setTest({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  }

  const copy = (t) => { try { navigator.clipboard.writeText(t); showMsg('Copied!'); } catch { /* visible anyway */ } };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EFE1E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', marginBottom: 10 };
  const label = { fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 4 };
  const ready = c.shiprocketEnabled && c.shiprocketEmail && c.shiprocketPasswordSet;

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${ready ? '#99f6e4' : '#EFE1E7'}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>🚚 Automatic courier (Shiprocket)</h3>
        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 50, background: ready ? '#ccfbf1' : '#F3F4F6', color: ready ? '#0f766e' : '#6B7280' }}>{ready ? '● On' : '● Off'}</span>
      </div>
      <p style={{ fontSize: 12.5, color: '#6B5A67', margin: '6px 0 14px' }}>Sellers get a <strong>🚀 Book courier pickup</strong> button: one tap books the courier, schedules pickup and prints the label. Customers see live tracking and get notified at every step.</p>

      <details style={{ background: '#F8FAF9', border: '1px solid #E5EFEA', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>How to set it up (5 minutes)</summary>
        <ol style={{ fontSize: 12.5, color: '#4A2040', lineHeight: 1.7, paddingLeft: 18, margin: '8px 0 0' }}>
          <li>Sign up at <strong>app.shiprocket.in</strong>, complete KYC, and add money to your Shiprocket wallet (shipping is charged from it).</li>
          <li>In Shiprocket: <strong>Settings → API → Configure → Create an API User</strong>. Use a <em>new</em> email that isn't your Shiprocket login. Copy that email and password into the boxes below.</li>
          <li>In Shiprocket: <strong>Settings → Pickup Addresses</strong> — add your main warehouse/shop address. Type its nickname below as the fallback pickup.</li>
          <li>In Shiprocket: <strong>Settings → API → Webhooks</strong> — paste the URL and token shown below, so tracking updates arrive instantly.</li>
          <li>Tick <strong>Switch on</strong>, press <strong>Save</strong>, then <strong>Test connection</strong>.</li>
        </ol>
      </details>

      <div className="admin-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><span style={label}>API user email</span><input value={c.shiprocketEmail || ''} onChange={e => setContent({ ...c, shiprocketEmail: e.target.value })} placeholder="api-user@yourdomain.com" style={inp} autoComplete="off" /></div>
        <div><span style={label}>API user password {c.shiprocketPasswordSet && <span style={{ color: '#0f766e' }}>(saved ✓ — type only to change)</span>}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={c.shiprocketPasswordSet ? '••••••••' : 'password'} style={inp} autoComplete="new-password" /></div>
        <div><span style={label}>Main pickup address nickname (fallback)</span><input value={c.shiprocketPickupLocation || ''} onChange={e => setContent({ ...c, shiprocketPickupLocation: e.target.value })} placeholder="e.g. Primary" style={inp} /></div>
        <div><span style={label}>Default parcel weight (kg)</span><input type="number" step="0.1" min="0.1" value={c.shiprocketDefaultWeight ?? 0.5} onChange={e => setContent({ ...c, shiprocketDefaultWeight: Number(e.target.value) })} style={inp} /></div>
      </div>
      <span style={label}>Default box size (cm): length × width × height</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[['shiprocketDefaultLength', 15], ['shiprocketDefaultBreadth', 12], ['shiprocketDefaultHeight', 10]].map(([k, d]) => (
          <input key={k} type="number" min="1" value={c[k] ?? d} onChange={e => setContent({ ...c, [k]: Number(e.target.value) })} style={inp} />
        ))}
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px', margin: '4px 0 14px', fontSize: 12.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>🔗 Tracking webhook (paste in Shiprocket → Settings → API → Webhooks)</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}><span style={{ width: 52, color: '#8A7A87' }}>URL</span><code style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', background: '#fff', padding: '5px 8px', borderRadius: 6 }}>{webhookUrl}</code><button onClick={() => copy(webhookUrl)} style={{ border: '1px solid #FDE68A', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Copy</button></div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ width: 52, color: '#8A7A87' }}>Token</span><code style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', background: '#fff', padding: '5px 8px', borderRadius: 6 }}>{c.shiprocketWebhookToken || '(reload the page)'}</code><button onClick={() => copy(c.shiprocketWebhookToken || '')} style={{ border: '1px solid #FDE68A', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Copy</button></div>
        <div style={{ color: '#8A7A87', marginTop: 6 }}>Without the webhook, tracking still updates every 30 minutes.</div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!c.shiprocketEnabled} onChange={e => setContent({ ...c, shiprocketEnabled: e.target.checked })} style={{ accentColor: '#0f766e', width: 18, height: 18 }} />
        Switch on automatic courier for all sellers
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={save} disabled={busy} style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>💾 Save</button>
        <button type="button" onClick={runTest} disabled={busy} style={{ background: '#fff', color: '#0f766e', border: '1.5px solid #99f6e4', borderRadius: 9, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>{busy ? '…' : '🔌 Test connection'}</button>
      </div>
      {test && (
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: test.ok ? '#0f766e' : '#b91c1c' }}>
          {test.ok ? <>✅ Connected to Shiprocket.{test.locations.length ? <> Pickup addresses: {test.locations.map(l => `${l.name} (${l.city} ${l.pincode})`).join(', ')}</> : ' No pickup addresses yet — add one in Shiprocket.'}</> : `⚠️ ${test.text}`}
        </div>
      )}
    </div>
  );
}
