import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

const SOCIAL_ICONS = [
  ['facebookUrl', '📘', 'Facebook'],
  ['instagramUrl', '📸', 'Instagram'],
  ['twitterUrl', '🐦', 'Twitter / X'],
  ['youtubeUrl', '▶️', 'YouTube'],
  ['linkedinUrl', '💼', 'LinkedIn'],
  ['pinterestUrl', '📌', 'Pinterest'],
  ['telegramUrl', '✈️', 'Telegram'],
  ['threadsUrl', '🧵', 'Threads'],
];

export default function Footer() {
  const [social, setSocial] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/admin/public/social`).then(r => r.json()).then(setSocial).catch(() => {});
  }, []);

  const whatsappLink = social?.whatsappNumber
    ? `https://wa.me/${social.whatsappNumber}?text=${encodeURIComponent(social.whatsappMessage || 'Hi! I have a question about a product on Sheen Bazaar.')}`
    : null;

  return (
    <footer className="site">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="fbrand">🛍️ Sheen Bazaar</div>
            <p>Your everyday marketplace for fashion, home and electronics at prices that make sense. Quality products, fast delivery, happy customers.</p>
            <div className="footer-social">
              {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>}
              {social && SOCIAL_ICONS.filter(([key]) => social[key]).map(([key, icon, label]) => (
                <a key={key} href={social[key]} target="_blank" rel="noopener noreferrer" aria-label={label}>{icon}</a>
              ))}
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
              <li><a href={`mailto:${social?.supportEmail || 'support@sheenbazaar.online'}`}>Contact Us</a></li>
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
