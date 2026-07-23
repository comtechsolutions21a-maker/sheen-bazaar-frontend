import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const [loginMethod, setLoginMethod] = useState('emailotp');
  const [mode, setMode] = useState(presetAs ? 'signup' : 'login');
  const [accountType, setAccountType] = useState(
    presetAs === 'seller' || presetAs === 'reseller' ? presetAs : 'customer'
  );

  // Email OTP
  const [emailOtpAddr, setEmailOtpAddr] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [emailNewUser, setEmailNewUser] = useState(false);
  const [emailName, setEmailName] = useState('');

  // Email/Password
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

  function startTimer(setTimer) {
    setTimer(30);
    const iv = setInterval(() => setTimer(t => {
      if (t <= 1) { clearInterval(iv); return 0; }
      return t - 1;
    }), 1000);
  }

  async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  // Email OTP handlers
  async function sendEmailOtp() {
    if (!emailOtpAddr || !emailOtpAddr.includes('@')) return setError('Enter a valid email address');
    setError(''); setLoading(true);
    try {
      await post('/auth/send-email-otp', { email: emailOtpAddr });
      setEmailOtpSent(true);
      startTimer(setEmailTimer);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function verifyEmailOtp() {
    if (!emailOtp || emailOtp.length !== 6) return setError('Enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const data = await post('/auth/verify-email-otp', {
        email: emailOtpAddr,
        otp: emailOtp,
        name: emailName || undefined
      });
      if (data.isNewUser && !emailName) {
        setEmailNewUser(true); setLoading(false); return;
      }
      localStorage.setItem('bazaario_token', data.token);
      window.location.href = '/';
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // Email/password handler
  async function handleEmailSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await signup(name, email, password, '', accountType, businessName);
        navigate(accountType === 'seller' ? '/seller' : accountType === 'reseller' ? '/reseller' : '/');
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #EFE1E7', fontSize: 14, color: '#2B1330',
    background: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 14
  };
  const btnPrimary = {
    width: '100%', padding: 14, borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #E91E8C, #B5006E)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1, marginTop: 4,
    boxShadow: '0 4px 20px rgba(233,30,140,0.3)'
  };
  const tabBtn = (active) => ({
    flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    background: active ? '#E91E8C' : 'transparent',
    color: active ? '#fff' : '#8A7A87',
    transition: 'all 0.2s'
  });
  const tabRow = {
    display: 'flex', background: '#FFF6F2', borderRadius: 10,
    padding: 4, marginBottom: 20, border: '1px solid #EFE1E7'
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', backgroundColor: '#FFF6F2'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 32px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 4px 24px rgba(43,19,48,0.10)',
        border: '1px solid #EFE1E7'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🛍️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#B5006E', margin: '0 0 4px' }}>
            Sheen Bazaar
          </h1>
          <p style={{ fontSize: 13, color: '#8A7A87', margin: 0 }}>
            Sign in or create your account
          </p>
        </div>

        {/* 2 tabs only — Email OTP and Password */}
        <div style={tabRow}>
          <button onClick={() => { setLoginMethod('emailotp'); setError(''); }} style={tabBtn(loginMethod === 'emailotp')}>
            ✉️ Email OTP
          </button>
          <button onClick={() => { setLoginMethod('email'); setError(''); }} style={tabBtn(loginMethod === 'email')}>
            🔒 Password
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FFE8F0', color: '#A8114F', padding: '10px 14px',
            borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* EMAIL OTP */}
        {loginMethod === 'emailotp' && (
          emailNewUser ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
                <p style={{ fontWeight: 700, color: '#2B1330', margin: '0 0 4px' }}>Welcome! What's your name?</p>
                <p style={{ fontSize: 12, color: '#8A7A87', margin: 0 }}>Just this once to set up your account</p>
              </div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Your Name</label>
              <input
                type="text" placeholder="Enter your full name"
                value={emailName} onChange={e => setEmailName(e.target.value)}
                style={inp}
              />
              <button onClick={verifyEmailOtp} disabled={loading || !emailName} style={btnPrimary}>
                {loading ? 'Setting up…' : 'Start Shopping →'}
              </button>
            </div>
          ) : (
            <>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email" placeholder="you@example.com"
                value={emailOtpAddr}
                onChange={e => setEmailOtpAddr(e.target.value)}
                disabled={emailOtpSent}
                style={inp}
              />
              {emailOtpSent && (
                <>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>
                    OTP sent to {emailOtpAddr}
                  </label>
                  <input
                    type="text" maxLength={6} placeholder="Enter 6-digit OTP"
                    value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ ...inp, fontSize: 22, letterSpacing: 10, textAlign: 'center', fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 12, color: '#8A7A87', marginBottom: 14, textAlign: 'center' }}>
                    {emailTimer > 0
                      ? `Resend OTP in ${emailTimer}s`
                      : <span onClick={sendEmailOtp} style={{ color: '#E91E8C', cursor: 'pointer', fontWeight: 700 }}>Resend OTP</span>
                    }
                  </div>
                </>
              )}
              <button onClick={emailOtpSent ? verifyEmailOtp : sendEmailOtp} disabled={loading} style={btnPrimary}>
                {loading ? 'Please wait…' : emailOtpSent ? 'Verify OTP →' : 'Send OTP →'}
              </button>
              {emailOtpSent && (
                <button
                  onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); }}
                  style={{
                    width: '100%', padding: 10, borderRadius: 10,
                    border: '1px solid #EFE1E7', background: 'transparent',
                    color: '#8A7A87', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', marginTop: 8
                  }}
                >
                  ← Change Email
                </button>
              )}
            </>
          )
        )}

        {/* EMAIL/PASSWORD */}
        {loginMethod === 'email' && (
          <>
            <div style={tabRow}>
              <button onClick={() => setMode('login')} style={tabBtn(mode === 'login')}>Log In</button>
              <button onClick={() => setMode('signup')} style={tabBtn(mode === 'signup')}>Sign Up</button>
            </div>
            <form onSubmit={handleEmailSubmit}>
              {mode === 'signup' && (
                <>
                  <div style={tabRow}>
                    {['customer', 'seller', 'reseller'].map(t => (
                      <button key={t} type="button" onClick={() => setAccountType(t)} style={tabBtn(accountType === t)}>
                        {t === 'customer' ? '🛍️' : t === 'seller' ? '📦' : '📢'} {t}
                      </button>
                    ))}
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required style={inp} />
                  {(accountType === 'seller' || accountType === 'reseller') && (
                    <>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>
                        {accountType === 'seller' ? 'Business Name' : 'Store Name'}
                      </label>
                      <input
                        type="text"
                        placeholder={accountType === 'seller' ? 'e.g. Sharma Textiles' : "e.g. Priya's Picks"}
                        value={businessName} onChange={e => setBusinessName(e.target.value)}
                        required={accountType === 'seller'} style={inp}
                      />
                    </>
                  )}
                </>
              )}
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
              <button type="submit" disabled={loading} style={btnPrimary}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#8A7A87', marginTop: 16, marginBottom: 0 }}>
          By continuing, you agree to Sheen Bazaar's Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
