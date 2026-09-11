import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Landing page for redirect-based social logins (currently X/Twitter).
// The backend finishes the OAuth exchange itself and sends us either
// ?token=... (success) or ?error=... (failure) as a query param.
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { applyToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(searchParams.get('error') || '');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;
    applyToken(token)
      .then((user) => {
        navigate(user.role === 'seller' ? '/seller' : user.role === 'reseller' ? '/reseller' : '/', { replace: true });
      })
      .catch(() => setError('Could not complete sign-in. Please try again.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#FFF6F2',
      fontFamily: 'Inter, sans-serif', padding: 24, textAlign: 'center', gap: 12,
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 42 }}>⚠️</div>
          <p style={{ color: '#A8114F', fontWeight: 700, fontSize: 15.5 }}>Sign-in failed</p>
          <p style={{ color: '#8A7A87', fontSize: 13, maxWidth: 320 }}>{error}</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: 8, padding: '11px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #E91E8C, #B5006E)', color: '#fff',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            Back to Login
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 42 }}>🛍️</div>
          <p style={{ color: '#A8114F', fontWeight: 700, fontSize: 15.5 }}>Signing you in…</p>
        </>
      )}
    </div>
  );
}
