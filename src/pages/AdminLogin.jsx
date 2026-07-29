import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'admin') {
        setError('This account does not have admin access.');
        setLoading(false);
        return;
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0410 0%, #1A0A12 40%, #3D0A2A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow accents */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(233,30,140,0.25), transparent)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(107,15,69,0.3), transparent)', borderRadius: '50%' }} />

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(233,30,140,0.25)',
        borderRadius: 20, padding: '44px 36px', width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1,
      }}>
        {/* Shield icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18,
            background: 'linear-gradient(135deg, #E91E8C, #B5006E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: '0 8px 24px rgba(233,30,140,0.4)',
          }}>🛡️</div>
          <h1 style={{ color: '#fff', fontFamily: 'Baloo 2, sans-serif', fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
            Admin Control Panel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, letterSpacing: 0.5 }}>
            Sheen Bazaar · Restricted Access
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(233,30,140,0.15)', border: '1px solid rgba(233,30,140,0.4)',
            color: '#FF8FC7', padding: '11px 14px', borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
            Admin Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@sheenbazaar.online" required
            style={{
              width: '100%', padding: '13px 15px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
            }}
          />
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password" required
            style={{
              width: '100%', padding: '13px 15px', borderRadius: 10, marginBottom: 24,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
            }}
          />
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14, borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #E91E8C, #B5006E)', color: '#fff',
            fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, boxShadow: '0 6px 24px rgba(233,30,140,0.35)',
          }}>
            {loading ? 'Verifying…' : '🔓 Unlock Dashboard'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 22, lineHeight: 1.6 }}>
          This area is restricted to authorized Sheen Bazaar administrators only.<br />Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}
