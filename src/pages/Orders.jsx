import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) api.getOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="e-icon">🔒</div>
          Please <Link to="/login" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>log in</Link> to track your orders.
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="sec-title"><h2>Your Orders</h2></div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="e-icon">📦</div>
          No orders yet. <Link to="/products" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>Start shopping →</Link>
        </div>
      ) : (
        orders.map((o) => (
          <Link to={`/orders/${o._id}`} key={o._id} style={{ display: 'block' }}>
            <div className="panel" style={{ marginBottom: 14, cursor: 'pointer' }}>
              <div className="srow"><span>Order #{o._id.slice(-6).toUpperCase()}</span><span>{new Date(o.createdAt).toLocaleDateString()}</span></div>
              <div className="srow"><span>{o.items.length} item(s)</span><span style={{ textTransform: 'capitalize' }}>Status: {o.status.replace(/_/g, ' ')}</span></div>
              <div className="srow total"><span>Total</span><span>₹{o.total}</span></div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
