import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '🧾' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'shipped', label: 'Shipped', icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container section"><div className="empty-state">{error}</div></div>;
  if (!order) return <div className="container section">Loading…</div>;

  const isCancelled = order.status === 'cancelled';
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/orders">Orders</Link> / <span>Tracking</span></nav>

      <div className="section" style={{ paddingTop: 20 }}>
        <div className="sec-title"><h2>Order #{order._id.slice(-6).toUpperCase()}</h2></div>

        {isCancelled ? (
          <div className="panel" style={{ borderColor: 'var(--pink)', background: '#FFF0F5' }}>
            This order was cancelled.
          </div>
        ) : (
          <div className="panel" style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                return (
                  <div key={step.key} style={{ flex: 1, minWidth: 100, textAlign: 'center', opacity: done ? 1 : 0.4 }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: '50%', margin: '0 auto 6px',
                        background: done ? 'var(--pink)' : '#EFE1E7', color: done ? '#fff' : 'var(--muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.shipping?.method && (
          <div className="panel" style={{ marginBottom: 22, background: '#F3F0FF', borderColor: '#B9A9FF' }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Shipping</h3>
            <div className="srow">
              <span>{order.shipping.method === 'courier_pickup' ? 'Courier' : 'Shipped via'}</span>
              <span>{order.shipping.courierPartner}</span>
            </div>
            {order.shipping.trackingNumber && (
              <div className="srow"><span>Tracking No.</span><span>{order.shipping.trackingNumber}</span></div>
            )}
          </div>
        )}

        <div className="panel" style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Items</h3>
          {order.items.map((i) => (
            <div className="srow" key={i.productId}>
              <span>
                {i.image ? <img src={i.image} alt={i.name} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} /> : `${i.icon} `}
                {i.name} × {i.qty}
              </span>
              <span>₹{i.price * i.qty}</span>
            </div>
          ))}
          <div className="srow"><span>Delivery fee</span><span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span></div>
          <div className="srow total"><span>Total</span><span>₹{order.total}</span></div>
          <div className="srow">
            <span>Payment</span>
            <span>
              {order.paymentMethod}
              <span className={`pay-status ${order.paymentStatus}`}>
                {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Pending'}
              </span>
            </span>
          </div>
          {order.transactionId && (
            <div className="srow"><span>Reference</span><span>{order.transactionId}</span></div>
          )}
        </div>

        <div className="panel">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Status History</h3>
          {order.statusHistory.map((h, i) => (
            <div className="srow" key={i}>
              <span style={{ textTransform: 'capitalize' }}>{h.status.replace(/_/g, ' ')}</span>
              <span>{new Date(h.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
