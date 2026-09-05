import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to your Orders page from the account menu, select the order, and you\'ll see live status updates — Placed, Confirmed, Packed, Shipped, Out for Delivery, and Delivered.' },
  { q: 'What is your return policy?', a: 'Most products can be returned within 7 days of delivery. Open the order, click "Request Return," and once approved, you\'ll get a prepaid return label with pickup arranged by our courier partner.' },
  { q: 'How do refunds work?', a: 'Refunds are credited to your Sheen Bazaar Wallet instantly once your return is received and verified. You can also choose refund to your original payment method.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI, Credit/Debit Cards, Net Banking, Wallets, EMI, Cash on Delivery, and payments directly from your Sheen Bazaar Wallet.' },
  { q: 'Is Cash on Delivery available everywhere?', a: 'COD is available on most pincodes across India. It will show as an option at checkout if it\'s available for your delivery address.' },
  { q: 'How do I become a seller?', a: 'Click "Sell on Sheen Bazaar," sign up as a Seller, and upload your PAN, Aadhaar, and bank proof for verification. Once approved (usually within 24-48 hours), you can start listing products.' },
  { q: 'How does the Wallet work?', a: 'Add money via UPI/Card, use it to pay for any order, send money to other Sheen Bazaar users, and receive refunds/cashback instantly — no waiting for bank transfers.' },
  { q: 'How does Refer & Earn work?', a: 'Share your referral link or code with friends. When they sign up and place their first paid order, you both instantly get wallet cash as a reward.' },
  { q: 'My order hasn\'t arrived — what do I do?', a: 'Check the tracking details on your Order page first. If it\'s past the estimated delivery date, contact us via WhatsApp or email and we\'ll follow up with the courier immediately.' },
  { q: 'Can I cancel an order after placing it?', a: 'Yes — orders can be cancelled anytime before they\'re shipped. Go to the order page and click "Cancel Order." If already paid, the refund goes to your wallet instantly.' },
];

export default function HelpCenter() {
  const [social, setSocial] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${BASE}/admin/public/social`).then(r => r.json()).then(setSocial).catch(() => {});
  }, []);

  const whatsappLink = social?.whatsappNumber
    ? `https://wa.me/${social.whatsappNumber}?text=${encodeURIComponent('Hi! I need help with my Sheen Bazaar order.')}`
    : null;

  const filteredFaqs = FAQS.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 20, marginBottom: 16 };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A0A12,#6B0F45)', borderRadius: 20, padding: '32px 24px', color: '#fff', marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🙋</div>
        <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>How can we help you?</h1>
        <p style={{ fontSize: 13, opacity: 0.75, margin: '0 0 18px' }}>Search our FAQs or reach out directly — we're happy to help</p>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search for help (e.g. return, payment, delivery)..."
          style={{ width: '100%', padding: '13px 16px', borderRadius: 50, border: 'none', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif' }}
        />
      </div>

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        <Link to="/orders" style={{ ...card, textAlign: 'center', textDecoration: 'none', color: 'inherit', padding: '18px 10px' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>📦</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Track an Order</div>
        </Link>
        <Link to="/orders" style={{ ...card, textAlign: 'center', textDecoration: 'none', color: 'inherit', padding: '18px 10px' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>↩️</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Returns & Refunds</div>
        </Link>
        <Link to="/wallet" style={{ ...card, textAlign: 'center', textDecoration: 'none', color: 'inherit', padding: '18px 10px' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>👛</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Wallet Help</div>
        </Link>
      </div>

      {/* FAQs */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, fontFamily: 'Baloo 2,sans-serif' }}>❓ Frequently Asked Questions</h2>
        {filteredFaqs.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#8A7A87', fontSize: 13 }}>No results — try a different search, or contact us below</div>}
        {filteredFaqs.map((f, i) => (
          <div key={i} style={{ borderBottom: i < filteredFaqs.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
            <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: '13px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1A0A12' }}>{f.q}</span>
              <span style={{ fontSize: 16, color: '#E91E8C', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
            </div>
            {openFaq === i && <div style={{ fontSize: 13, color: '#4A2040', lineHeight: 1.7, paddingBottom: 14 }}>{f.a}</div>}
          </div>
        ))}
      </div>

      {/* Contact options */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, fontFamily: 'Baloo 2,sans-serif' }}>💬 Still need help?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontSize: 22 }}>💬</span>
              <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Chat on WhatsApp</div><div style={{ fontSize: 11.5, color: '#8A7A87' }}>Usually replies within a few hours</div></div>
            </a>
          ) : null}
          {social?.supportEmail && (
            <a href={`mailto:${social.supportEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FFF6F2', border: '1.5px solid #EFE1E7', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontSize: 22 }}>📧</span>
              <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Email Support</div><div style={{ fontSize: 11.5, color: '#8A7A87' }}>{social.supportEmail}</div></div>
            </a>
          )}
          {social?.supportPhone && (
            <a href={`tel:${social.supportPhone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FFF6F2', border: '1.5px solid #EFE1E7', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontSize: 22 }}>📞</span>
              <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Call Us</div><div style={{ fontSize: 11.5, color: '#8A7A87' }}>{social.supportPhone}</div></div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
