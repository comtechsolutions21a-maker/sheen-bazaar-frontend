import { useEffect, useState } from 'react';
import { api } from '../api/client';

const TEMPLATES = [
  { name: '⚡ Flash sale', title: '⚡ Flash Sale is LIVE!', body: 'Up to 50% off for the next 3 hours only. Tap to grab the deals before they\'re gone!', url: '/products?flash=1' },
  { name: '🎉 Weekend offer', title: '🎉 Weekend Special — Extra 10% OFF', body: 'Use code WEEKEND10 at checkout. Valid till Sunday midnight.', url: '/offers' },
  { name: '🆕 New arrivals', title: '🆕 Fresh arrivals just dropped', body: 'New styles and essentials are here. Be the first to shop them!', url: '/products' },
  { name: '🛒 Cart reminder', title: '🛒 Your cart misses you!', body: 'The items in your cart are selling fast. Complete your order now.', url: '/cart', audience: 'cart' },
  { name: '🎡 Spin & Win', title: '🎡 Your free spin is ready!', body: 'Spin the wheel today and win up to 20% OFF your next order.', url: '/spin' },
];

const STATUS = {
  scheduled: ['⏰ Scheduled', '#3b82f6'], sending: ['📤 Sending…', '#f59e0b'], sent: ['✅ Sent', '#16a34a'],
  cancelled: ['🚫 Cancelled', '#8A7A87'], failed: ['⚠️ Failed', '#dc2626'],
};

const empty = { title: '', body: '', url: '/offers', image: '', audience: 'all', when: 'now', scheduledAt: '' };

// Admin → 📣 Push Offers: send offer notifications to customers' phones
export default function AdminCampaigns() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  function load() { api.adminCampaigns().then(setData).catch(e => setMsg({ ok: false, text: e.message })); }
  useEffect(load, []);

  async function send(e) {
    e.preventDefault();
    if (form.when === 'later' && !form.scheduledAt) return setMsg({ ok: false, text: 'Pick a date and time for the scheduled send.' });
    const aud = data?.audiences?.[form.audience];
    if (form.when === 'now' && !confirm(`Send this notification now to ${aud ? `${aud.people} people (${aud.phones} phones with notifications on)` : 'the selected audience'}?`)) return;
    setBusy(true); setMsg(null);
    try {
      const c = await api.adminCreateCampaign({
        title: form.title, body: form.body, url: form.url, image: form.image, audience: form.audience,
        scheduledAt: form.when === 'later' ? new Date(form.scheduledAt).toISOString() : null,
      });
      setMsg({ ok: true, text: c.status === 'sent' ? `Sent! Reached ${c.delivered} phone${c.delivered === 1 ? '' : 's'} and added to ${c.recipients} inboxes.` : `Scheduled for ${new Date(c.scheduledAt).toLocaleString('en-IN')}.` });
      setForm(empty);
      load();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  }

  async function cancel(id) {
    if (!confirm('Cancel this scheduled notification?')) return;
    try { await api.adminCancelCampaign(id); load(); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }

  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 20, marginBottom: 16 };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #EFE1E7', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', marginBottom: 12 };
  const label = { fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 5 };
  const totalPhones = data?.audiences?.all?.phones ?? 0;

  return (
    <div>
      <div style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(120deg,#FFF0F7,#F5F0FF)' }}>
        <div style={{ fontSize: 40 }}>📣</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'Baloo 2,sans-serif' }}>Send offers straight to phones</div>
          <div style={{ fontSize: 13, color: '#6B5A67' }}>Notifications pop up in the phone's notification bar like a WhatsApp message, and are saved in each customer's 🔔 inbox.</div>
        </div>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 18px', border: '1px solid #EFE1E7' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#B5006E', fontFamily: 'Baloo 2,sans-serif' }}>{totalPhones}</div>
          <div style={{ fontSize: 11.5, color: '#8A7A87' }}>phones with notifications on</div>
        </div>
      </div>

      {msg && <div style={{ ...card, padding: '12px 16px', background: msg.ok ? '#f0fdf4' : '#FFF1F2', borderColor: msg.ok ? '#bbf7d0' : '#fecdd3', color: msg.ok ? '#15803d' : '#b91c1c', fontWeight: 600, fontSize: 13.5 }}>{msg.ok ? '✅ ' : '⚠️ '}{msg.text}</div>}

      <div className="admin-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <form onSubmit={send} style={card}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>✍️ New notification</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {TEMPLATES.map(t => (
              <button type="button" key={t.name} onClick={() => setForm(f => ({ ...f, title: t.title, body: t.body, url: t.url, audience: t.audience || f.audience }))}
                style={{ padding: '6px 10px', borderRadius: 50, border: '1px solid #EFE1E7', background: '#FFF8FC', fontSize: 12, fontWeight: 700, color: '#4A2040', cursor: 'pointer' }}>{t.name}</button>
            ))}
          </div>
          <span style={label}>Title ({form.title.length}/70)</span>
          <input value={form.title} maxLength={70} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. ⚡ Flash Sale is LIVE!" style={inp} required />
          <span style={label}>Message ({form.body.length}/200)</span>
          <textarea value={form.body} maxLength={200} rows={3} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="What's the offer? Keep it short and exciting." style={{ ...inp, resize: 'vertical' }} required />
          <div className="admin-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><span style={label}>Opens page</span><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="/offers" style={inp} /></div>
            <div><span style={label}>Big picture link (optional)</span><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://…/banner.jpg" style={inp} /></div>
          </div>
          <span style={label}>Send to</span>
          <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} style={inp}>
            {Object.entries(data?.audiences || { all: { label: 'Everyone', people: 0, phones: 0 } }).map(([k, a]) => (
              <option key={k} value={k}>{a.label} — {a.phones} phone{a.phones === 1 ? '' : 's'}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['now', '🚀 Send now'], ['later', '⏰ Schedule']].map(([k, l]) => (
              <button type="button" key={k} onClick={() => setForm({ ...form, when: k })} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${form.when === k ? '#E91E8C' : '#EFE1E7'}`, background: form.when === k ? '#FFE8F5' : '#fff', fontWeight: 700, fontSize: 13, color: form.when === k ? '#B5006E' : '#4A2040', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {form.when === 'later' && <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} style={inp} />}
          <button type="submit" disabled={busy} className="btn-primary" style={{ width: '100%', border: 'none', padding: '13px 0', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            {busy ? 'Sending…' : form.when === 'later' ? '⏰ Schedule notification' : '🚀 Send notification'}
          </button>
          <div style={{ fontSize: 11.5, color: '#8A7A87', marginTop: 8 }}>Tip: the best times are 12–2 PM and 7–10 PM. Don't send more than 1–2 per day, or people turn notifications off.</div>
        </form>

        {/* Phone preview */}
        <div style={{ ...card, background: 'linear-gradient(160deg,#2B1330,#5B0B3B)', border: 'none', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Preview on a phone</div>
          <div style={{ fontSize: 44, fontWeight: 300, letterSpacing: 1 }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="sb-fake-notif" style={{ animation: 'none' }}>
            <img src="/icon-192.png" alt="" width="34" height="34" style={{ borderRadius: 8, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A7A87' }}><span>Sheen Bazaar</span><span>now</span></div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1A0A12', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title || 'Your title appears here'}</div>
              <div style={{ fontSize: 12, color: '#4A2040', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{form.body || 'Your message appears here.'}</div>
              {/^https?:\/\//.test(form.image) && <img src={form.image} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 6, maxHeight: 120, objectFit: 'cover' }} />}
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.85 }}>
            <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/icon-192.png" alt="" width="32" height="32" style={{ borderRadius: 7 }} />
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: 50, minWidth: 18, height: 18, fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #5B0B3B' }}>1</span>
            </span>
            App icon shows the unread count
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>🗂️ Sent & scheduled</div>
        {!data && <div style={{ color: '#8A7A87', fontSize: 13 }}>Loading…</div>}
        {data?.campaigns?.length === 0 && <div style={{ color: '#8A7A87', fontSize: 13 }}>Nothing sent yet — your first offer is one tap away!</div>}
        {data?.campaigns?.map(c => {
          const [st, color] = STATUS[c.status] || [c.status, '#8A7A87'];
          return (
            <div key={c._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid #F7EEF3', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#6B5A67' }}>{c.body}</div>
                <div style={{ fontSize: 11.5, color: '#8A7A87', marginTop: 3 }}>
                  {data.audiences?.[c.audience]?.label || c.audience}
                  {c.status === 'sent' && ` · ${c.recipients} inboxes · ${c.delivered} phones reached · ${new Date(c.sentAt).toLocaleString('en-IN')}`}
                  {c.status === 'scheduled' && c.scheduledAt && ` · goes out ${new Date(c.scheduledAt).toLocaleString('en-IN')}`}
                  {c.error && ` · ${c.error}`}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color, background: `${color}14`, padding: '4px 10px', borderRadius: 50 }}>{st}</span>
              {c.status === 'scheduled' && <button onClick={() => cancel(c._id)} style={{ background: 'none', border: '1px solid #EFE1E7', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#b91c1c' }}>Cancel</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
