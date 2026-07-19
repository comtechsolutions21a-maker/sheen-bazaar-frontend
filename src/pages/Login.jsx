import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VISUALS = {
  customer: {
    icon: '🛍️',
    title: 'Shop smarter with Sheen Bazaar',
    text: "Track orders, save your addresses, and unlock member-only flash deals every day.",
  },
  seller: {
    icon: '🏬',
    title: 'Grow your business with Sheen Bazaar',
    text: 'Reach thousands of buyers, manage listings and orders, and grow your storefront — all in one place.',
  },
  reseller: {
    icon: '💼',
    title: 'Earn with Sheen Bazaar',
    text: 'Curate your own storefront, resell trending products, and earn margins with zero inventory.',
  },
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const [mode, setMode] = useState(presetAs ? 'signup' : 'login'); // 'login' | 'signup'
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

  const visual = VISUALS[mode === 'signup' ? accountType : 'customer'];

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-float-icons" aria-hidden="true">
          <span className="fi fi-1">✨</span>
          <span className="fi fi-2">🛒</span>
          <span className="fi fi-3">📦</span>
          <span className="fi fi-4">💳</span>
          <span className="fi fi-5">🏷️</span>
        </div>
        <div className="auth-icon-wrap">
          <span className="auth-icon-glow" />
          <div className="icon">{visual.icon}</div>
        </div>
        <h2>{visual.title}</h2>
        <p>{visual.text}</p>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card fade-up d1">
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>{mode === 'login' ? 'Log in to continue shopping' : 'Join Sheen Bazaar in under a minute'}</p>

          <div className="tabs">
            <div className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Log In</div>
            <div className={`tab${mode === 'signup' ? ' active' : ''}`} onClick={() => setMode('signup')}>Sign Up</div>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="tabs" style={{ marginBottom: 18 }}>
                <div
                  className={`tab${accountType === 'customer' ? ' active' : ''}`}
                  onClick={() => setAccountType('customer')}
                >
                  Customer
                </div>
                <div
                  className={`tab${accountType === 'seller' ? ' active' : ''}`}
                  onClick={() => setAccountType('seller')}
                >
                  Seller / Supplier
                </div>
                <div
                  className={`tab${accountType === 'reseller' ? ' active' : ''}`}
                  onClick={() => setAccountType('reseller')}
                >
                  Reseller
                </div>
              </div>
            )}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="flabel">Full Name</label>
                <input className="field" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            {mode === 'signup' && accountType === 'seller' && (
              <div className="form-group">
                <label className="flabel">Business / Store Name</label>
                <input className="field" type="text" placeholder="e.g. Sharma Textiles" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
            )}
            {mode === 'signup' && accountType === 'reseller' && (
              <div className="form-group">
                <label className="flabel">Store Name (optional)</label>
                <input className="field" type="text" placeholder="e.g. Priya's Picks" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="flabel">Email Address</label>
              <input className="field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="flabel">Password</label>
              <input className="field" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="flabel">Phone Number (optional)</label>
                <input className="field" type="tel" placeholder="Enter 10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}

            {error && <p style={{ color: 'var(--pink-dark)', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
            {mode === 'signup' && accountType === 'seller' && (
              <div className="otp-note">Seller accounts need admin approval before listings go live — you can still add products right away.</div>
            )}
            <div className="otp-note">By continuing, you agree to Sheen Bazaar's Terms & Privacy Policy</div>
          </form>
        </div>
      </div>
    </div>
  );
}
