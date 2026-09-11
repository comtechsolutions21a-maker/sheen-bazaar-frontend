import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bazaario_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Add timeout so app never stays blank if API is slow
    const timeout = setTimeout(() => setLoading(false), 5000);
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('bazaario_token'))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
    return () => clearTimeout(timeout);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('bazaario_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password, phone, role, businessName, referralCode) => {
    const data = await api.signup({ name, email, password, phone, role, businessName, referralCode });
    localStorage.setItem('bazaario_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await api.googleLogin(credential);
    localStorage.setItem('bazaario_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithFacebook = useCallback(async (accessToken) => {
    const data = await api.facebookLogin(accessToken);
    localStorage.setItem('bazaario_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Used by the X (Twitter) redirect flow — the backend does its own OAuth
  // dance and sends the finished JWT back as a URL param, so there's no
  // token to POST here; we just need to adopt it and fetch the profile.
  const applyToken = useCallback(async (token) => {
    localStorage.setItem('bazaario_token', token);
    const data = await api.me();
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bazaario_token');
    setUser(null);
  }, []);

  // Lets an already-logged-in customer become a seller/reseller (or switch
  // back) without a new signup — same account, same token, role just changes.
  const upgradeRole = useCallback(async (role, businessName) => {
    const data = await api.upgradeRole(role, businessName);
    if (data.token) localStorage.setItem('bazaario_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Show loading spinner instead of blank white screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF6F2'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
          <p style={{ color: '#A8114F', fontWeight: 700, fontSize: '16px' }}>Loading Sheen Bazaar...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, loginWithFacebook, applyToken, upgradeRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
