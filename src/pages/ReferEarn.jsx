import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function ReferEarn() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { authFetch('/auth/referral').then(r => r.json()).then(setStats).catch(() => {}); }, []);

  const referralLink = stats ? `${window.location.origin}/login?ref=${stats.referralCode}` : '';

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `Hey! Join Sheen Bazaar using my link and we both get ₹${stats?.rewardAmount || 50} wallet cash on your first order! 🎉\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 24, marginBottom: 16 };

  if (!stats) return <div style={{ textAlign: 'center', padding: 60 }}>⏳</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>🎁 Refer & Earn</h1>
      <p style={{ color: '#8A7A87', fontSize: 13.5, marginBottom: 20 }}>Invite friends to Sheen Bazaar. When they place their first order, you both get ₹{stats.rewardAmount} in your wallet — instantly!</p>

      {/* Hero card */}
      <div style={{ background: 'linear-gradient(135deg,#1A0A12,#6B0F45)', borderRadius: 20, padding: '28px 24px', color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, background: 'radial-gradient(circle,rgba(233,30,140,0.35),transparent)', borderRadius: '50%' }} />
        <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
        <div style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 32, fontWeight: 800 }}>₹{stats.rewardAmount} for you</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>+ ₹{stats.rewardAmount} for your friend, on their first order</div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginTop: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your Referral Code</div>
          <div style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>{stats.referralCode}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={copyLink} style={{ flex: 1, background: copied ? '#22c55e' : '#E91E8C', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
          <button onClick={shareWhatsApp} style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            💬 Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#E91E8C', fontFamily: 'Baloo 2,sans-serif' }}>{stats.totalReferred}</div>
          <div style={{ fontSize: 11, color: '#8A7A87' }}>Invited</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e', fontFamily: 'Baloo 2,sans-serif' }}>{stats.successfulReferrals}</div>
          <div style={{ fontSize: 11, color: '#8A7A87' }}>Joined & Ordered</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', fontFamily: 'Baloo 2,sans-serif' }}>₹{stats.totalEarned}</div>
          <div style={{ fontSize: 11, color: '#8A7A87' }}>Earned</div>
        </div>
      </div>

      {/* How it works */}
      <div style={card}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>How it works</h3>
        {[
          ['1️⃣', 'Share your link', 'Send your referral link or code to friends'],
          ['2️⃣', 'They sign up', 'Your friend creates an account using your link'],
          ['3️⃣', 'They order', 'Once they place their first paid order'],
          ['4️⃣', 'You both earn', `₹${stats.rewardAmount} lands in both your wallets — instantly!`],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div><div style={{ fontSize: 12.5, color: '#8A7A87' }}>{desc}</div></div>
          </div>
        ))}
      </div>

      {/* Referred list */}
      {stats.referredUsers?.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>People you've invited</h3>
          {stats.referredUsers.map((u, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < stats.referredUsers.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
              <span style={{ fontSize: 13 }}>{u.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: u.rewarded ? '#22c55e' : '#f59e0b' }}>{u.rewarded ? '✅ Rewarded' : '⏳ Awaiting first order'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
