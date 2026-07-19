import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="fbrand">Sheen Bazaar</div>
            <p>Your everyday marketplace for fashion, home and electronics at prices that make sense.</p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?cat=Fashion">Fashion</Link></li>
              <li><Link to="/products?cat=Electronics">Electronics</Link></li>
              <li><Link to="/products?cat=Home">Home</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/orders">Returns &amp; Refunds</Link></li>
              <li><Link to="/orders">Shipping Info</Link></li>
              <li><a href="mailto:support@sheenbazaar.com">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Sellers</h4>
            <ul>
              <li><Link to="/login?as=seller">Become a Seller</Link></li>
              <li><Link to="/login?as=reseller">Become a Reseller</Link></li>
              <li><Link to="/seller">Seller Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sheen Bazaar. All rights reserved.</span>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="Twitter">🐦</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
