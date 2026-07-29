import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminGate() {
  const { user, logout } = useAuth();
  const [, forceRerender] = useState(0);

  // Not logged in, or logged in but not an admin → show the admin-only login screen
  if (!user || user.role !== 'admin') {
    return <AdminLogin onSuccess={() => forceRerender(n => n + 1)} />;
  }

  // Logged in as admin → show the dashboard, with its own small top bar (no normal Navbar/Footer)
  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F8' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A0A12, #3D0A2A)', color: '#fff',
        padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 800, fontSize: 15 }}>Sheen Bazaar — Admin Control Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, opacity: 0.7 }}>{user.email}</span>
          <button onClick={logout} style={{
            background: 'rgba(233,30,140,0.2)', border: '1px solid rgba(233,30,140,0.4)',
            color: '#fff', padding: '7px 16px', borderRadius: 50, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}>🚪 Log Out</button>
        </div>
      </div>
      <AdminDashboard />
    </div>
  );
}
