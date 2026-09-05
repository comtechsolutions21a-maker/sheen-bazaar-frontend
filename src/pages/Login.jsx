import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const referralCode = searchParams.get('ref') || '';
  const [loginMethod, setLoginMethod] = useState('emailotp');
  const [mode, setMode] = useState((presetAs || referralCode) ? 'signup' : 'login');
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
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Remember this device — remembers the email locally so returning
  // customers don't have to retype it (the actual login/session behaviour
  // is unchanged; this only pre-fills the email field next time).
  const [rememberDevice, setRememberDevice] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
  const REMEMBERED_EMAIL_KEY = 'sb_remembered_email';

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) { setEmail(saved); setEmailOtpAddr(saved); }
  }, []);

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

  function rememberEmailIfNeeded(addr) {
    if (rememberDevice && addr) localStorage.setItem(REMEMBERED_EMAIL_KEY, addr);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
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
      rememberEmailIfNeeded(emailOtpAddr);
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
        rememberEmailIfNeeded(email);
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await signup(name, email, password, phone, accountType, businessName, referralCode);
        rememberEmailIfNeeded(email);
        navigate(accountType === 'seller' ? '/seller' : accountType === 'reseller' ? '/reseller' : '/');
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const inp = {
    width: '100%', padding: '13px 15px', borderRadius: 12,
    border: '1.5px solid #F0E0EC', fontSize: 14.5, color: '#2B1330',
    background: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 14,
    transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'Inter, sans-serif',
  };
  const btnPrimary = {
    width: '100%', padding: 15, borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #E91E8C, #B5006E)',
    color: '#fff', fontWeight: 800, fontSize: 15.5,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1, marginTop: 4,
    boxShadow: '0 8px 24px rgba(233,30,140,0.35)',
    letterSpacing: 0.2,
  };
  const tabBtn = (active) => ({
    flex: 1, padding: '11px 4px', borderRadius: 10, border: 'none',
    cursor: 'pointer', fontWeight: 800, fontSize: 13,
    background: active ? 'linear-gradient(135deg,#E91E8C,#B5006E)' : 'transparent',
    color: active ? '#fff' : '#8A7A87',
    boxShadow: active ? '0 4px 14px rgba(233,30,140,0.3)' : 'none',
    transition: 'all 0.2s',
  });
  const tabRow = {
    display: 'flex', background: '#FFF6F2', borderRadius: 12,
    padding: 5, marginBottom: 20, border: '1px solid #F0E0EC', gap: 4,
  };
  const label = { fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'center',
      background: '#FFF6F2', fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes floatBlob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-14px,18px) scale(1.06); } }
        @keyframes floatBlob2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(16px,-14px) scale(1.05); } }
        @keyframes floatIcon { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(6deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .login-card-anim { animation: fadeSlideUp 0.5s ease both; }
        .login-input-focus:focus { border-color: #E91E8C !important; box-shadow: 0 0 0 4px rgba(233,30,140,0.12); }
      `}</style>

      {/* LEFT — decorative brand panel (hidden on small screens) */}
      <div className="login-side-panel" style={{
        flex: 1, display: 'none', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #1A0A12 0%, #3D0A2A 45%, #6B0F45 100%)',
        alignItems: 'center', justifyContent: 'center', padding: 40,
      }}>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.35), transparent)', top: '10%', left: '-8%', animation: 'floatBlob 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', bottom: '8%', right: '-6%', animation: 'floatBlob2 8s ease-in-out infinite' }} />

        {['👗','📱','👟','💍','👜','💄'].map((emoji, i) => (
          <span key={i} style={{
            position: 'absolute', fontSize: 30, opacity: 0.55,
            top: `${[12, 22, 68, 78, 45, 8][i]}%`, left: `${[10, 82, 14, 78, 4, 55][i]}%`,
            animation: `floatIcon ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`,
          }}>{emoji}</span>
        ))}

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 60, marginBottom: 18 }}>🛍️</div>
          <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            Welcome to Sheen Bazaar
          </h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
            Fashion, electronics and everyday essentials — with a wallet, fast delivery, and deals refreshed daily.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
            {[['52K+', 'Customers'], ['4.8K+', 'Sellers'], ['120+', 'Cities']].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>{num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — the actual login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="login-card-anim" style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          width: '100%', maxWidth: 440,
          boxShadow: '0 12px 40px rgba(107,15,69,0.12)',
          border: '1px solid #F0E0EC',
        }}>
          {/* Header (mobile-visible brand mark) */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 42, marginBottom: 6 }}>🛍️</div>
            <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 23, fontWeight: 800, color: '#B5006E', margin: '0 0 4px' }}>
              Sheen Bazaar
            </h1>
            <p style={{ fontSize: 13, color: '#8A7A87', margin: 0 }}>
              Sign in or create your account
            </p>
          </div>

          {referralCode && mode === 'signup' && (
            <div style={{ background: 'linear-gradient(135deg,#FFE8F5,#FFD6EC)', border: '1.5px solid #E91E8C', borderRadius: 12, padding: '11px 14px', marginBottom: 16, fontSize: 12.5, color: '#A8114F', textAlign: 'center', fontWeight: 700 }}>
              🎁 You were invited! Sign up now and get wallet cash on your first order.
            </div>
          )}

          {/* 2 tabs — Email OTP and Password */}
          <div style={tabRow}>
            <button onClick={() => { setLoginMethod('emailotp'); setError(''); }} style={tabBtn(loginMethod === 'emailotp')}>
              ✉️ Email OTP
            </button>
            <button onClick={() => { setLoginMethod('email'); setError(''); }} style={tabBtn(loginMethod === 'email')}>
              🔒 Password
            </button>
          </div>

          {error && (
            <div style={{
              background: '#FFE8F0', color: '#A8114F', padding: '11px 14px',
              borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
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
                <label style={label}>Your Name</label>
                <input
                  type="text" placeholder="Enter your full name" className="login-input-focus"
                  value={emailName} onChange={e => setEmailName(e.target.value)}
                  style={inp}
                />
                <button onClick={verifyEmailOtp} disabled={loading || !emailName} style={btnPrimary}>
                  {loading ? 'Setting up…' : 'Start Shopping →'}
                </button>
              </div>
            ) : (
              <>
                <label style={label}>Email Address</label>
                <input
                  type="email" placeholder="you@example.com" className="login-input-focus"
                  value={emailOtpAddr}
                  onChange={e => setEmailOtpAddr(e.target.value)}
                  disabled={emailOtpSent}
                  style={inp}
                />
                {emailOtpSent && (
                  <>
                    <label style={label}>OTP sent to {emailOtpAddr}</label>
                    <input
                      type="text" maxLength={6} placeholder="Enter 6-digit OTP" className="login-input-focus"
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
                      border: '1px solid #F0E0EC', background: 'transparent',
                      color: '#8A7A87', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', marginTop: 8,
                    }}
                  >
                    ← Change Email
                  </button>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#8A7A87', marginTop: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} style={{ accentColor: '#E91E8C', width: 15, height: 15 }} />
                  Remember my email on this device
                </label>
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
                    <label style={label}>Full Name</label>
                    <input type="text" placeholder="Your name" className="login-input-focus" value={name} onChange={e => setName(e.target.value)} required style={inp} />
                    <label style={label}>Phone Number <span style={{ fontWeight: 400, color: '#B0A0AC' }}>(optional — for contact only)</span></label>
                    <input type="tel" placeholder="+91 XXXXX XXXXX" className="login-input-focus" value={phone} onChange={e => setPhone(e.target.value)} style={inp} />
                    {(accountType === 'seller' || accountType === 'reseller') && (
                      <>
                        <label style={label}>{accountType === 'seller' ? 'Business Name' : 'Store Name'}</label>
                        <input
                          type="text" className="login-input-focus"
                          placeholder={accountType === 'seller' ? 'e.g. Sharma Textiles' : "e.g. Priya's Picks"}
                          value={businessName} onChange={e => setBusinessName(e.target.value)}
                          required={accountType === 'seller'} style={inp}
                        />
                      </>
                    )}
                  </>
                )}
                <label style={label}>Email Address</label>
                <input type="email" placeholder="you@example.com" className="login-input-focus" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
                <label style={label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="Enter password" className="login-input-focus"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    style={{ ...inp, paddingRight: 44 }}
                  />
                  <span
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 14, top: 13, cursor: 'pointer', fontSize: 15, color: '#B0A0AC', userSelect: 'none' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
                {mode === 'login' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#8A7A87', marginBottom: 14, marginTop: -4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} style={{ accentColor: '#E91E8C', width: 15, height: 15 }} />
                    Remember my email on this device
                  </label>
                )}
                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: 11, color: '#B0A0AC', marginTop: 18, marginBottom: 0, lineHeight: 1.6 }}>
            By continuing, you agree to Sheen Bazaar's Terms & Privacy Policy
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-side-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
