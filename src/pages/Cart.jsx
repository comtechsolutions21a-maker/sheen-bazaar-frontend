import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { cart, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="e-icon">🔒</div>
          Please <Link to="/login" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>log in</Link> to view your cart.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="crumbs"><Link to="/">Home</Link> / <span>Cart</span></nav>

      <div className="section" style={{ paddingTop: 20 }}>
        <div className="sec-title">
          <h2>Your Cart</h2>
          <Link to="/products">Add more items →</Link>
        </div>

        <div className="cart-layout">
          <div>
            {cart.items.length === 0 ? (
              <div className="empty-state">
                <div className="e-icon">🛍️</div>
                Your cart is empty.<br />
                <Link to="/products" style={{ color: 'var(--pink-dark)', fontWeight: 700 }}>Start shopping →</Link>
              </div>
            ) : (
              cart.items.map(({ product, qty, lineTotal, price, reseller, key }) => (
                <div className="cart-item" key={key}>
                  <Link to={`/products/${product.id}`} className="ci-img">
                    {product.image ? <img src={product.image} alt={product.name} /> : product.icon}
                  </Link>
                  <div className="ci-info">
                    <Link to={`/products/${product.id}`}><div className="n">{product.name}</div></Link>
                    <div className="p">
                      ₹{lineTotal}{qty > 1 ? ` (₹${price} each)` : ''}
                      {reseller && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--muted)' }}>· via reseller</span>}
                    </div>
                    <div className="ci-remove" onClick={() => removeFromCart(product.id, reseller)}>Remove</div>
                  </div>
                  <div className="ci-qty">
                    <button onClick={() => addToCart(product.id, -1, reseller)}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => addToCart(product.id, 1, reseller)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="panel sticky">
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Order Summary</h3>
              <div className="srow"><span>Item total</span><span>₹{cart.itemsTotal}</span></div>
              <div className="srow"><span>Delivery fee</span><span>{cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}</span></div>
              <div className="srow total"><span>Order total</span><span>₹{cart.total}</span></div>
              <div style={{ marginTop: 16 }}>
                <button className="btn-primary green" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
