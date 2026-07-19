import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const [mode, setMode] = useState(presetAs ? 'signup' : 'login');
  const [accountType, setAccountType] = useState(
    presetAs === 'seller' || presetAs === 'reseller' ? presetAs : 'customer'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await signup(name, email, password, phone, accountType, businessName);
        navigate(accountType === 'seller' ? '/seller' : accountType === 'reseller' ? '/reseller' : '/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: '#FFF6F2'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 4px 24px rgba(43,19,48,0.10)',
        border: '1px solid #EFE1E7'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛍️</div>
          <h1 style={{ fontSize: '24px', color: '#A8114F', margin: '0 0 6px 0', fontWeight: 800 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ fontSize: '13px', color: '#8A7A87', margin: 0 }}>
            {mode === 'login' ? 'Log in to continue shopping' : 'Join Sheen Bazaar today'}
          </p>
        </div>

        {/* Login / Signup tabs */}
        <div style={{ display: 'flex', background: '#FFF6F2', borderRadius: '10px', padding: '4px', marginBottom: '24px', border: '1px solid #EFE1E7' }}>
          <button onClick={() => setMode('login')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: mode === 'login' ? '#D9276B' : 'transparent',
            color: mode === 'login' ? '#fff' : '#8A7A87'
          }}>Log In</button>
          <button onClick={() => setMode('signup')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: mode === 'signup' ? '#D9276B' : 'transparent',
            color: mode === 'signup' ? '#fff' : '#8A7A87'
          }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ display: 'flex', background: '#FFF6F2', borderRadius: '10px', padding: '4px', marginBottom: '20px', border: '1px solid #EFE1E7' }}>
              {['customer', 'seller', 'reseller'].map(type => (
                <button key={type} type="button" onClick={() => setAccountType(type)} style={{
                  flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px',
                  background: accountType === type ? '#D9276B' : 'transparent',
                  color: accountType === type ? '#fff' : '#8A7A87'
                }}>{type === 'customer' ? 'Customer' : type === 'seller' ? 'Seller' : 'Reseller'}</button>
              ))}
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} required style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EFE1E7',
                fontSize: '13.5px', color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box'
              }} />
            </div>
          )}

          {mode === 'signup' && (accountType === 'seller' || accountType === 'reseller') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: '6px' }}>
                {accountType === 'seller' ? 'Business / Store Name' : 'Store Name (optional)'}
              </label>
              <input type="text" placeholder={accountType === 'seller' ? 'e.g. Sharma Textiles' : "e.g. Priya's Picks"}
                value={businessName} onChange={e => setBusinessName(e.target.value)}
                required={accountType === 'seller'} style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EFE1E7',
                fontSize: '13.5px', color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box'
              }} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EFE1E7',
              fontSize: '13.5px', color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box'
            }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EFE1E7',
              fontSize: '13.5px', color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box'
            }} />
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: '6px' }}>Phone (optional)</label>
              <input type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EFE1E7',
                fontSize: '13.5px', color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box'
              }} />
            </div>
          )}

          {error && (
            <p style={{ color: '#A8114F', fontSize: '12.5px', marginBottom: '12px', background: '#FFE8F0', padding: '10px 14px', borderRadius: '8px' }}>
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: '#D9276B', color: '#fff', fontWeight: 700, fontSize: '15px',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#8A7A87', marginTop: '16px' }}>
            By continuing, you agree to Sheen Bazaar's Terms & Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}
