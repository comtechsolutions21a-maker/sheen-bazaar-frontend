import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  function showMsg(text) { setMsg(text); setTimeout(() => setMsg(''), 3000); }

  async function saveProfile(e) {
    e.preventDefault(); setLoading(true);
    try {
      const token = localStorage.getItem('bazaario_token');
      const res = await fetch(`${BASE}/auth/profile`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ name, phone }) });
      if (!res.ok) throw new Error((await res.json()).message);
      showMsg('Profile updated successfully!');
    } catch(e) { showMsg(e.message); } finally { setLoading(false); }
  }

  const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #EFE1E7', fontSize:14, color:'#2B1330', background:'#fff', boxSizing:'border-box', outline:'none', marginBottom:14, fontFamily:'Inter,sans-serif' };
  const lbl = { fontSize:12, fontWeight:700, color:'#8A7A87', display:'block', marginBottom:5 };
  const card = { background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:24, marginBottom:16 };

  const MEMBERSHIP_COLORS = { Free:'#8A7A87', Basic:'#3b82f6', Pro:'#8b5cf6', VIP:'#f59e0b' };
  const MEMBERSHIP_BADGES = { Free:'🆓', Basic:'🥉', Pro:'🥈', VIP:'👑' };
  const tier = user?.membershipTier || 'Free';

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <h1 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, fontWeight:800, marginBottom:24 }}>👤 My Profile</h1>

      {msg && <div style={{ background:'#e8f5e9', color:'#2e7d32', padding:'12px 16px', borderRadius:10, marginBottom:16, fontWeight:600, fontSize:13 }}>✅ {msg}</div>}

      {/* Membership */}
      <div style={{ ...card, background:`linear-gradient(135deg,${MEMBERSHIP_COLORS[tier]}22,${MEMBERSHIP_COLORS[tier]}11)`, border:`2px solid ${MEMBERSHIP_COLORS[tier]}44` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:32, marginBottom:4 }}>{MEMBERSHIP_BADGES[tier]}</div>
            <div style={{ fontWeight:800, fontSize:18, color:MEMBERSHIP_COLORS[tier] }}>{tier} Member</div>
            <div style={{ fontSize:13, color:'#8A7A87', marginTop:2 }}>{tier==='Free'?'Upgrade for exclusive discounts and free delivery':'Enjoy your membership benefits!'}</div>
          </div>
          {tier==='Free' && <Link to="/products" style={{ background:MEMBERSHIP_COLORS['Basic'], color:'#fff', padding:'10px 20px', borderRadius:50, fontWeight:700, fontSize:13, textDecoration:'none' }}>Upgrade →</Link>}
        </div>
      </div>

      {/* Profile */}
      <div style={card}>
        <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Personal Information</h2>
        <form onSubmit={saveProfile}>
          <label style={lbl}>Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} style={inp} />
          <label style={lbl}>Email Address</label>
          <input value={user?.email||''} disabled style={{ ...inp, background:'#F3F4F8', color:'#8A7A87' }} />
          <label style={lbl}>Phone Number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={inp} />
          <button type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:50, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {loading?'Saving…':'Save Changes'}
          </button>
        </form>
      </div>

      {/* Quick links */}
      <div style={card}>
        <h2 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Quick Links</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['📋 My Orders','/orders'],['🤍 Wishlist','/wishlist'],['🛒 Cart','/cart'],['🏬 Become a Seller','/login?as=seller']].map(([label,to]) => (
            <Link key={to} to={to} style={{ display:'block', padding:'12px 16px', background:'#FFF6F2', borderRadius:10, fontSize:14, fontWeight:600, color:'#1A0A12', textDecoration:'none', border:'1px solid #EFE1E7' }}>{label}</Link>
          ))}
        </div>
      </div>

      <button onClick={logout} style={{ width:'100%', padding:'14px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>🚪 Log Out</button>
    </div>
  );
}
