import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const EMPTY_ADDR = { label: 'Home', fullName: '', phone: '', addressLine: '', city: '', state: '', pincode: '' };

export default function Profile() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);

  function showMsg(text) { setMsg(text); setTimeout(() => setMsg(''), 3000); }

  function loadAddresses() { authFetch('/orders/addresses/mine').then(r => r.json()).then(d => Array.isArray(d) && setAddresses(d)).catch(() => {}); }
  useEffect(() => { loadAddresses(); }, []);

  async function saveProfile(e) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await authFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name, phone }) });
      if (!res.ok) throw new Error((await res.json()).message);
      showMsg('Profile updated successfully!');
    } catch (e) { showMsg(e.message); } finally { setLoading(false); }
  }

  function openAddAddr() { setAddrForm(EMPTY_ADDR); setEditingAddr(null); setShowAddrForm(true); }
  function openEditAddr(a) { setAddrForm(a); setEditingAddr(a); setShowAddrForm(true); }

  async function saveAddress() {
    if (!addrForm.fullName || !addrForm.phone || !addrForm.addressLine || !addrForm.city || !addrForm.pincode) return showMsg('Please fill all required fields');
    try {
      if (editingAddr) {
        await authFetch(`/orders/addresses/mine/${editingAddr._id}`, { method: 'PATCH', body: JSON.stringify(addrForm) });
      } else {
        await authFetch('/orders/addresses/mine', { method: 'POST', body: JSON.stringify(addrForm) });
      }
      setShowAddrForm(false); loadAddresses(); showMsg('Address saved!');
    } catch (e) { showMsg(e.message); }
  }

  async function deleteAddress(a) {
    if (!confirm('Delete this address?')) return;
    await authFetch(`/orders/addresses/mine/${a._id}`, { method: 'DELETE' });
    loadAddresses(); showMsg('Address deleted');
  }

  async function makeDefault(a) {
    await authFetch(`/orders/addresses/mine/${a._id}`, { method: 'PATCH', body: JSON.stringify({ isDefault: true }) });
    loadAddresses(); showMsg('Default address updated');
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #EFE1E7', fontSize: 14, color: '#2B1330', background: '#fff', boxSizing: 'border-box', outline: 'none', marginBottom: 14, fontFamily: 'Inter,sans-serif' };
  const lbl = { fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 5 };
  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 24, marginBottom: 16 };
  const btn = (color = '#E91E8C') => ({ background: color, color: '#fff', border: 'none', borderRadius: 50, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' });
  const btnOut = (color = '#E91E8C') => ({ background: 'transparent', color, border: `1.5px solid ${color}`, borderRadius: 50, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' });

  const MEMBERSHIP_COLORS = { Free: '#8A7A87', Basic: '#3b82f6', Pro: '#8b5cf6', VIP: '#f59e0b' };
  const MEMBERSHIP_BADGES = { Free: '🆓', Basic: '🥉', Pro: '🥈', VIP: '👑' };
  const tier = user?.membershipTier || 'Free';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 24 }}>👤 My Profile</h1>

      {msg && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 13 }}>✅ {msg}</div>}

      {/* Membership */}
      <div style={{ ...card, background: `linear-gradient(135deg,${MEMBERSHIP_COLORS[tier]}22,${MEMBERSHIP_COLORS[tier]}11)`, border: `2px solid ${MEMBERSHIP_COLORS[tier]}44` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{MEMBERSHIP_BADGES[tier]}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: MEMBERSHIP_COLORS[tier] }}>{tier} Member</div>
            <div style={{ fontSize: 13, color: '#8A7A87', marginTop: 2 }}>{tier === 'Free' ? 'Upgrade for exclusive discounts and free delivery' : 'Enjoy your membership benefits!'}</div>
          </div>
          {tier === 'Free' && <Link to="/products" style={{ background: MEMBERSHIP_COLORS['Basic'], color: '#fff', padding: '10px 20px', borderRadius: 50, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Upgrade →</Link>}
        </div>
      </div>

      {/* Profile */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Personal Information</h2>
        <form onSubmit={saveProfile}>
          <label style={lbl}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inp} />
          <label style={lbl}>Email Address</label>
          <input value={user?.email || ''} disabled style={{ ...inp, background: '#F3F4F8', color: '#8A7A87' }} />
          <label style={lbl}>Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={inp} />
          <button type="submit" disabled={loading} style={btn()}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>

      {/* Address Book */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>📍 Saved Addresses</h2>
          <button onClick={openAddAddr} style={btnOut()}>+ Add New</button>
        </div>

        {addresses.length === 0 && !showAddrForm && <div style={{ textAlign: 'center', padding: 20, color: '#8A7A87', fontSize: 13 }}>No saved addresses yet. Add one for faster checkout!</div>}

        {addresses.map(a => (
          <div key={a._id} style={{ border: `1.5px solid ${a.isDefault ? '#E91E8C' : '#EFE1E7'}`, borderRadius: 12, padding: 14, marginBottom: 10, background: a.isDefault ? '#FFF6F2' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  📍 {a.label} {a.isDefault && <span style={{ background: '#E91E8C', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 50, fontWeight: 800, marginLeft: 6 }}>DEFAULT</span>}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{a.fullName} · {a.phone}</div>
                <div style={{ fontSize: 12.5, color: '#8A7A87', marginTop: 2 }}>{a.addressLine}, {a.city}, {a.state} — {a.pincode}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!a.isDefault && <button onClick={() => makeDefault(a)} style={btnOut('#22c55e')}>Set Default</button>}
                <button onClick={() => openEditAddr(a)} style={btnOut('#3b82f6')}>Edit</button>
                <button onClick={() => deleteAddress(a)} style={btnOut('#ef4444')}>Delete</button>
              </div>
            </div>
          </div>
        ))}

        {showAddrForm && (
          <div style={{ background: '#FFF6F2', borderRadius: 12, padding: 16, marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Label</label>
                <select value={addrForm.label} onChange={e => setAddrForm({ ...addrForm, label: e.target.value })} style={inp}>
                  <option>Home</option><option>Work</option><option>Other</option>
                </select>
              </div>
              <div><label style={lbl}>Full Name *</label><input value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Phone *</label><input value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Pincode *</label><input value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} style={inp} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Address *</label><input value={addrForm.addressLine} onChange={e => setAddrForm({ ...addrForm, addressLine: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>City *</label><input value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>State</label><input value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveAddress} style={btn()}>Save Address</button>
              <button onClick={() => setShowAddrForm(false)} style={btnOut('#8A7A87')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Quick Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['📋 My Orders', '/orders'], ['🤍 Wishlist', '/wishlist'], ['🛒 Cart', '/cart'], ['🎁 Refer & Earn', '/refer-earn'], ['👛 My Wallet', '/wallet'], ['🏬 Become a Seller', '/login?as=seller']].map(([label, to]) => (
            <Link key={to} to={to} style={{ display: 'block', padding: '12px 16px', background: '#FFF6F2', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1A0A12', textDecoration: 'none', border: '1px solid #EFE1E7' }}>{label}</Link>
          ))}
        </div>
      </div>

      <button onClick={logout} style={{ width: '100%', padding: '14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>🚪 Log Out</button>
    </div>
  );
}
