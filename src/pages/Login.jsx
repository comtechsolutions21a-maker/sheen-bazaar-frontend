import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const presetAs = searchParams.get('as');
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'emailotp' | 'email'
  const [mode, setMode] = useState(presetAs ? 'signup' : 'login');
  const [accountType, setAccountType] = useState(
    presetAs === 'seller' || presetAs === 'reseller' ? presetAs : 'customer'
  );

  // Phone OTP
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [phoneNewUser, setPhoneNewUser] = useState(false);
  const [phoneName, setPhoneName] = useState('');

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
  const [phone2, setPhone2] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

  function startTimer(setTimer) {
    setTimer(30);
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
  }

  async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }

  // Phone OTP handlers
  async function sendPhoneOtp() {
    if (!phone || phone.length !== 10) return setError('Enter a valid 10-digit mobile number');
    setError(''); setLoading(true);
    try { await post('/auth/send-otp', { phone }); setPhoneOtpSent(true); startTimer(setPhoneTimer); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function verifyPhoneOtp() {
    if (!phoneOtp || phoneOtp.length !== 6) return setError('Enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const data = await post('/auth/verify-otp', { phone, otp: phoneOtp, name: phoneName || undefined });
      if (data.isNewUser && !phoneName) { setPhoneNewUser(true); setLoading(false); return; }
      localStorage.setItem('bazaario_token', data.token);
      window.location.href = '/';
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  // Email OTP handlers
  async function sendEmailOtp() {
    if (!emailOtpAddr || !emailOtpAddr.includes('@')) return setError('Enter a valid email address');
    setError(''); setLoading(true);
    try { await post('/auth/send-email-otp', { email: emailOtpAddr }); setEmailOtpSent(true); startTimer(setEmailTimer); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function verifyEmailOtp() {
    if (!emailOtp || emailOtp.length !== 6) return setError('Enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const data = await post('/auth/verify-email-otp', { email: emailOtpAddr, otp: emailOtp, name: emailName || undefined });
      if (data.isNewUser && !emailName) { setEmailNewUser(true); setLoading(false); return; }
      localStorage.setItem('bazaario_token', data.token);
      window.location.href = '/';
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  // Email/password handler
  async function handleEmailSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await signup(name, email, password, phone2, accountType, businessName);
        navigate(accountType === 'seller' ? '/seller' : accountType === 'reseller' ? '/reseller' : '/');
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #EFE1E7', fontSize: 14, color: '#2B1330', background: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 14 };
  const btnPrimary = { width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#D9276B', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 };
  const tabBtn = (active) => ({ flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: active ? '#D9276B' : 'transparent', color: active ? '#fff' : '#8A7A87' });
  const tabRow = { display: 'flex', background: '#FFF6F2', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid #EFE1E7' };

  function OtpInput({ value, onChange }) {
    return <input type="text" maxLength={6} placeholder="• • • • • •" value={value} onChange={e => onChange(e.target.value.replace(/\D/g, ''))} style={{ ...inp, fontSize: 24, letterSpacing: 12, textAlign: 'center', fontWeight: 700 }} />;
  }

  function TimerResend({ timer, onResend }) {
    return <div style={{ fontSize: 12, color: '#8A7A87', marginBottom: 14, textAlign: 'center' }}>
      {timer > 0 ? `Resend OTP in ${timer}s` : <span onClick={onResend} style={{ color: '#D9276B', cursor: 'pointer', fontWeight: 700 }}>Resend OTP</span>}
    </div>;
  }

  function NewUserName({ value, onChange, onSubmit }) {
    return <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
        <p style={{ fontWeight: 700, color: '#2B1330', margin: '0 0 4px' }}>Welcome! What's your name?</p>
        <p style={{ fontSize: 12, color: '#8A7A87', margin: 0 }}>Just this once to set up your account</p>
      </div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Your Name</label>
      <input type="text" placeholder="Enter your full name" value={value} onChange={e => onChange(e.target.value)} style={inp} />
      <button onClick={onSubmit} disabled={loading || !value} style={btnPrimary}>{loading ? 'Setting up…' : 'Start Shopping →'}</button>
    </div>;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: '#FFF6F2' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(43,19,48,0.10)', border: '1px solid #EFE1E7' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🛍️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#A8114F', margin: '0 0 4px' }}>Sheen Bazaar</h1>
          <p style={{ fontSize: 13, color: '#8A7A87', margin: 0 }}>Sign in or create your account</p>
        </div>

        {/* 3 login method tabs */}
        <div style={tabRow}>
          <button onClick={() => { setLoginMethod('phone'); setError(''); }} style={tabBtn(loginMethod === 'phone')}>📱 Phone OTP</button>
          <button onClick={() => { setLoginMethod('emailotp'); setError(''); }} style={tabBtn(loginMethod === 'emailotp')}>✉️ Email OTP</button>
          <button onClick={() => { setLoginMethod('email'); setError(''); }} style={tabBtn(loginMethod === 'email')}>🔒 Password</button>
        </div>

        {error && <div style={{ background: '#FFE8F0', color: '#A8114F', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

        {/* PHONE OTP */}
        {loginMethod === 'phone' && (
          phoneNewUser
            ? <NewUserName value={phoneName} onChange={setPhoneName} onSubmit={verifyPhoneOtp} />
            : <>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Mobile Number</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#FFF6F2', border: '1px solid #EFE1E7', borderRadius: 10, padding: '12px 14px', fontWeight: 700, fontSize: 14 }}>+91</div>
                <input type="tel" maxLength={10} placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} disabled={phoneOtpSent} style={{ ...inp, marginBottom: 0, flex: 1 }} />
              </div>
              {phoneOtpSent && <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>OTP sent to +91{phone}</label>
                <OtpInput value={phoneOtp} onChange={setPhoneOtp} />
                <TimerResend timer={phoneTimer} onResend={sendPhoneOtp} />
              </>}
              <button onClick={phoneOtpSent ? verifyPhoneOtp : sendPhoneOtp} disabled={loading} style={btnPrimary}>
                {loading ? 'Please wait…' : phoneOtpSent ? 'Verify OTP →' : 'Send OTP →'}
              </button>
              {phoneOtpSent && <button onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setError(''); }} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #EFE1E7', background: 'transparent', color: '#8A7A87', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>← Change Number</button>}
            </>
        )}

        {/* EMAIL OTP */}
        {loginMethod === 'emailotp' && (
          emailNewUser
            ? <NewUserName value={emailName} onChange={setEmailName} onSubmit={verifyEmailOtp} />
            : <>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={emailOtpAddr} onChange={e => setEmailOtpAddr(e.target.value)} disabled={emailOtpSent} style={inp} />
              {emailOtpSent && <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>OTP sent to {emailOtpAddr}</label>
                <OtpInput value={emailOtp} onChange={setEmailOtp} />
                <TimerResend timer={emailTimer} onResend={sendEmailOtp} />
              </>}
              <button onClick={emailOtpSent ? verifyEmailOtp : sendEmailOtp} disabled={loading} style={btnPrimary}>
                {loading ? 'Please wait…' : emailOtpSent ? 'Verify OTP →' : 'Send OTP →'}
              </button>
              {emailOtpSent && <button onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); }} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #EFE1E7', background: 'transparent', color: '#8A7A87', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>← Change Email</button>}
            </>
        )}

        {/* EMAIL/PASSWORD */}
        {loginMethod === 'email' && (
          <>
            <div style={tabRow}>
              <button onClick={() => setMode('login')} style={tabBtn(mode === 'login')}>Log In</button>
              <button onClick={() => setMode('signup')} style={tabBtn(mode === 'signup')}>Sign Up</button>
            </div>
            <form onSubmit={handleEmailSubmit}>
              {mode === 'signup' && <>
                <div style={tabRow}>
                  {['customer','seller','reseller'].map(t => <button key={t} type="button" onClick={() => setAccountType(t)} style={tabBtn(accountType === t)}>{t === 'customer' ? '🛍️' : t === 'seller' ? '📦' : '📢'} {t}</button>)}
                </div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required style={inp} />
                {(accountType === 'seller' || accountType === 'reseller') && <>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>{accountType === 'seller' ? 'Business Name' : 'Store Name'}</label>
                  <input type="text" placeholder={accountType === 'seller' ? 'e.g. Sharma Textiles' : "e.g. Priya's Picks"} value={businessName} onChange={e => setBusinessName(e.target.value)} required={accountType === 'seller'} style={inp} />
                </>}
              </>}
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
              {mode === 'signup' && <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7A87', display: 'block', marginBottom: 6 }}>Phone (optional)</label>
                <input type="tel" placeholder="10-digit mobile" value={phone2} onChange={e => setPhone2(e.target.value)} style={inp} />
              </>}
              <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Please wait…' : mode === 'login' ? 'Log In →' : 'Create Account →'}</button>
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
