import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const [mode, setMode] = useState(presetAs ? 'signup' : 'login');
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'email'
  const [accountType, setAccountType] = useState(
    presetAs === 'seller' || presetAs === 'reseller' ? presetAs : 'customer'
  );

  // OTP fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  // Email fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone2, setPhone2] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

  function startTimer() {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  }

  async function sendOTP() {
    if (!phone || phone.length !== 10) return setError('Enter a valid 10-digit mobile number');
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      startTimer();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function verifyOTP() {
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name: newUserName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (data.isNewUser && !newUserName) {
        setIsNewUser(true); setLoading(false); return;
      }
      localStorage.setItem('bazaario_token', data.token);
      window.location.href = '/';
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await signup(name, email, password, phone2, accountType, businessName);
        navigate(accountType === 'seller' ? '/seller' : accountType === 'reseller' ? '/reseller' : '/');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #EFE1E7', fontSize: 14, color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 14 };
  const btnPrimary = { width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#D9276B', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 };
  const tab = (active) => ({ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: active ? '#D9276B' : 'transparent', color: active ? '#fff' : '#8A7A87' });

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: '#FFF6F2' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(43,19,48,0.10)', border: '1px solid #EFE1E7' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🛍️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#A8114F', margin: '0 0 4px' }}>Sheen Bazaar</h1>
          <p style={{ fontSize: 13, color: '#8A7A87', margin: 0 }}>Login or create your account</p>
        </div>

        {/* Login Method Toggle — only for login/customer */}
        {mode === 'login' && (
          <div style={{ display: 'flex', background: '#FFF6F2', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid #EFE1E7' }}>
            <button onClick={() => { setLoginMethod('otp'); setError(''); }} style={tab(loginMethod === 'otp')}>📱 OTP Login</button>
            <button onClick={() => { setLoginMethod('email'); setError(''); }} style={tab(loginMethod === 'email')}>✉️ Email Login</button>
          </div>
        )}

        {/* Mode tabs for email */}
        {loginMethod === 'email' && (
          <div style={{ display: 'flex', background: '#FFF6F2', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid #EFE1E7' }}>
            <button onClick={() => setMode('login')} style={tab(mode === 'login')}>Log In</button>
            <button onClick={() => setMode('signup')} style={tab(mode === 'signup')}>Sign Up</button>
          </div>
        )}

        {error && <div style={{ background: '#FFE8F0', color: '#A8114F', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

        {/* OTP LOGIN */}
        {loginMethod === 'otp' && (
          <div>
            {!isNewUser ? (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ background: '#FFF6F2', border: '1px solid #EFE1E7', borderRadius: 10, padding: '12px 14px', fontWeight: 700, fontSize: 14, color: '#2B1330' }}>+91</div>
                  <input
                    type="tel" maxLength={10} placeholder="10-digit mobile number"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={otpSent}
                    style={{ ...inp, marginBottom: 0, flex: 1 }}
                  />
                </div>

                {otpSent && (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Enter OTP sent to +91{phone}</label>
                    <input
                      type="text" maxLength={6} placeholder="6-digit OTP"
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ ...inp, fontSize: 20, letterSpacing: 8, textAlign: 'center' }}
                    />
                    <div style={{ fontSize: 12, color: '#8A7A87', marginBottom: 14, textAlign: 'center' }}>
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : <span onClick={sendOTP} style={{ color: '#D9276B', cursor: 'pointer', fontWeight: 700 }}>Resend OTP</span>}
                    </div>
                  </>
                )}

                <button onClick={otpSent ? verifyOTP : sendOTP} disabled={loading} style={btnPrimary}>
                  {loading ? 'Please wait…' : otpSent ? 'Verify OTP →' : 'Send OTP →'}
                </button>

                {otpSent && (
                  <button onClick={() => { setOtpSent(false); setOtp(''); setError(''); }} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #EFE1E7', background: 'transparent', color: '#8A7A87', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                    ← Change Number
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 32 }}>👋</div>
                  <p style={{ fontWeight: 700, color: '#2B1330' }}>Welcome! What's your name?</p>
                  <p style={{ fontSize: 12, color: '#8A7A87' }}>Just this once to set up your account</p>
                </div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Your Name</label>
                <input type="text" placeholder="Enter your full name" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={inp} />
                <button onClick={verifyOTP} disabled={loading || !newUserName} style={btnPrimary}>
                  {loading ? 'Setting up…' : 'Start Shopping →'}
                </button>
              </>
            )}
          </div>
        )}

        {/* EMAIL LOGIN / SIGNUP */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            {mode === 'signup' && (
              <div style={{ display: 'flex', background: '#FFF6F2', borderRadius: 10, padding: 4, marginBottom: 16, border: '1px solid #EFE1E7' }}>
                {['customer', 'seller', 'reseller'].map(type => (
                  <button key={type} type="button" onClick={() => setAccountType(type)} style={tab(accountType === type)}>
                    {type === 'customer' ? '🛍️ Customer' : type === 'seller' ? '📦 Seller' : '📢 Reseller'}
                  </button>
                ))}
              </div>
            )}
            {mode === 'signup' && (
              <><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required style={inp} /></>
            )}
            {mode === 'signup' && (accountType === 'seller' || accountType === 'reseller') && (
              <><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>{accountType === 'seller' ? 'Business Name' : 'Store Name'}</label>
              <input type="text" placeholder={accountType === 'seller' ? 'e.g. Sharma Textiles' : "e.g. Priya's Picks"} value={businessName} onChange={e => setBusinessName(e.target.value)} required={accountType === 'seller'} style={inp} /></>
            )}
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
            {mode === 'signup' && (
              <><label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Phone (optional)</label>
              <input type="tel" placeholder="10-digit mobile" value={phone2} onChange={e => setPhone2(e.target.value)} style={inp} /></>
            )}
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#8A7A87', marginTop: 16 }}>
          By continuing, you agree to Sheen Bazaar's Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
