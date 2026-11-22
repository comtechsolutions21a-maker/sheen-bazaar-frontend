import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading, checking } = useAuth();

  if (loading || (checking && !user)) return <div className="container section">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="e-icon">🚫</div>
          You don't have access to this page.
        </div>
      </div>
    );
  }
  return children;
}
