import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name || 'Aarav Sharma');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [addressLine, setAddressLine] = useState('Flat 302, Green Residency, Sector 21, Noida, UP 201301');
  const [payment, setPayment] = useState('UPI');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="e-icon">🔒</div>
          Please <Link to="/login" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>log in</Link> to checkout.
        </div>
      </div>
    );
  }

  async function placeOrder() {
    if (cart.count === 0) return;
    try {
      const order = await api.placeOrder({
        address: { fullName, phone, addressLine },
        paymentMethod: payment,
      });
      setPlacedOrder(order);
      await refreshCart();
    } catch (err) {
      setError(err.message);
    }
  }

  if (placedOrder) {
    const paidOnline = placedOrder.paymentStatus === 'paid';
    return (
      <div className="container">
        <div className="success-screen">
          <div className="tick">🎉</div>
          <h2>Order placed!</h2>
          <p>Order of ₹{placedOrder.total} confirmed. Estimated delivery in 3-5 days.</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {paidOnline
              ? `✓ Paid via ${placedOrder.paymentMethod} · Ref ${placedOrder.transactionId}`
              : `Pay ₹${placedOrder.total} in cash when your order is delivered.`}
          </p>
          <Link to="/products" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/cart">Cart</Link> / <span>Checkout</span></nav>

      <div className="section" style={{ paddingTop: 20 }}>
        {cart.count === 0 ? (
          <div className="empty-state">
            <div className="e-icon">🛍️</div>
            Your cart is empty. <Link to="/products" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>Go shopping →</Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <div>
              <div className="sec-title"><h2>Delivery Address</h2></div>
              <div className="panel" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="flabel">Full Name</label>
                  <input className="field" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="flabel">Phone Number</label>
                  <input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="flabel">Delivery Address</label>
                  <input className="field" type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
                </div>
              </div>

              <div className="sec-title"><h2>Payment Method</h2></div>
              <div className="panel">
                {[
                  { key: 'UPI', label: 'UPI (Google Pay / PhonePe)' },
                  { key: 'CARD', label: 'Credit / Debit Card' },
                  { key: 'COD', label: 'Cash on Delivery' },
                ].map((opt) => (
                  <label key={opt.key} className={`pay-opt${payment === opt.key ? ' active' : ''}`}>
                    <input type="radio" name="pay" checked={payment === opt.key} onChange={() => setPayment(opt.key)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="panel sticky">
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Order Summary</h3>
              <div className="srow"><span>{cart.count} item(s)</span><span>₹{cart.itemsTotal}</span></div>
              <div className="srow"><span>Delivery fee</span><span>{cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}</span></div>
              <div className="srow total"><span>Total Payable</span><span>₹{cart.total}</span></div>
              {error && <p style={{ color: 'var(--pink-dark)', fontSize: 12.5, marginTop: 8 }}>{error}</p>}
              <div style={{ marginTop: 16 }}>
                <button className="btn-primary green" onClick={placeOrder}>Place Order</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
