import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="fbrand">🛍️ Sheen Bazaar</div>
            <p>Your everyday marketplace for fashion, home and electronics at prices that make sense. Quality products, fast delivery, happy customers.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📸</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="WhatsApp">💬</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?cat=Fashion">Fashion</Link></li>
              <li><Link to="/products?cat=Electronics">Electronics</Link></li>
              <li><Link to="/products?cat=Home">Home & Living</Link></li>
              <li><Link to="/products?cat=Beauty">Beauty</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><Link to="/orders">Track Order</Link></li>
              <li><a href="#">Returns & Refunds</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="mailto:support@sheenbazaar.online">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Sellers</h4>
            <ul>
              <li><Link to="/login?as=seller">Become a Seller</Link></li>
              <li><Link to="/login?as=reseller">Become a Reseller</Link></li>
              <li><Link to="/seller">Seller Dashboard</Link></li>
              <li><a href="#">Seller Guidelines</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sheen Bazaar. All rights reserved.</span>
          <span>Made with ❤️ in India</span>
        </div>
      </div>
    </footer>
  );
}
