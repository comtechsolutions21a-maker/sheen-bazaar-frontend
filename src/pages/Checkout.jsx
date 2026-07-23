import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '📲', desc: 'Google Pay, PhonePe, Paytm, BHIM' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'NETBANKING', label: 'Net Banking', icon: '🏦', desc: 'All major Indian banks' },
  { id: 'WALLET', label: 'Wallets', icon: '👛', desc: 'Paytm, Amazon Pay, Mobikwik' },
  { id: 'EMI', label: 'EMI', icon: '📅', desc: 'No-cost EMI on cards' },
  { id: 'WALLET_PAY', label: 'Sheen Bazaar Wallet', icon: '👛', desc: 'Pay instantly from wallet balance' },
  { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
];

function loadCashfreeScript() {
  return new Promise(resolve => {
    if (window.Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=review
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: user?.phone || '', addressLine: '', city: '', state: '', pincode: '' });
  const [savedAddresses] = useState([]); // future: load from user profile
  const [payment, setPayment] = useState('UPI');
  const [gateway, setGateway] = useState('razorpay');
  const [gateways, setGateways] = useState({ razorpay: true, cashfree: false, primary: 'razorpay' });

  useEffect(() => {
    fetch(`${BASE}/admin/public/gateways`).then(r => r.json()).then(g => {
      setGateways(g);
      setGateway(g.primary || 'razorpay');
    }).catch(() => {});
  }, []);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = cart.itemsTotal >= 499 ? 0 : 49;
  const discount = couponApplied ? Math.floor(cart.itemsTotal * couponApplied.discountPercent / 100) : 0;
  const total = cart.itemsTotal + deliveryFee - discount;

  async function applyCoupon() {
    setCouponError('');
    try {
      const token = localStorage.getItem('bazaario_token');
      const res = await fetch(`${BASE}/orders/validate-coupon`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ code:couponCode, orderTotal:cart.itemsTotal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCouponApplied(data.coupon);
    } catch(e) { setCouponError(e.message); }
  }

  async function handleRazorpay() {
    const loaded = await loadRazorpayScript();
    if (!loaded) return setError('Failed to load Razorpay. Please try again.');
    try {
      const token = localStorage.getItem('bazaario_token');
      const rzpRes = await fetch(`${BASE}/admin/razorpay/create-order`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ amount: total }) });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error(rzpData.message);

      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rzpData.keyId,
          amount: total * 100,
          currency: 'INR',
          name: 'Sheen Bazaar',
          description: 'Order Payment',
          order_id: rzpData.orderId,
          prefill: { name: address.fullName, contact: address.phone },
          theme: { color: '#E91E8C' },
          handler: async (response) => resolve(response),
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });
    } catch(e) { throw e; }
  }

  async function handleCashfree() {
    const loaded = await loadCashfreeScript();
    if (!loaded) throw new Error('Failed to load Cashfree');
    const token = localStorage.getItem('bazaario_token');
    const res = await fetch(`${BASE}/admin/cashfree/create-order`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ amount: total }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const cashfree = window.Cashfree({ mode: data.liveMode ? 'production' : 'sandbox' });
    const result = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_modal' });
    if (result.error) throw new Error(result.error.message || 'Payment cancelled');
    return { cfOrderId: data.orderId };
  }

  async function placeOrder() {
    if (!address.fullName || !address.phone || !address.addressLine || !address.city || !address.pincode) {
      return setError('Please fill in all address fields');
    }
    setError(''); setLoading(true);
    try {
      let razorpayData = null;
      if (payment === 'WALLET_PAY') {
        // Pay from wallet balance
        const token = localStorage.getItem('bazaario_token');
        const wRes = await fetch(`${BASE}/wallet`, { headers: { Authorization: `Bearer ${token}` } });
        const wData = await wRes.json();
        if (wData.balance < total) { setLoading(false); return setError(`Insufficient wallet balance (₹${wData.balance}). Add money to your wallet first.`); }
      } else if (payment !== 'COD') {
        let cfData = null;
        try {
          if (gateway === 'cashfree' && gateways.cashfree) cfData = await handleCashfree();
          else razorpayData = await handleRazorpay();
        } catch(e) {
          // Automatic failover to the other gateway
          try {
            if (gateway === 'cashfree' && gateways.razorpay) { razorpayData = await handleRazorpay(); }
            else if (gateway === 'razorpay' && gateways.cashfree) { cfData = await handleCashfree(); }
            else throw e;
          } catch(e2) { setLoading(false); return setError(e2.message); }
        }
        if (cfData) window.__cfData = cfData;
      }

      const order = await api.placeOrder({
        address,
        paymentMethod: payment === 'COD' ? 'COD' : payment === 'WALLET_PAY' ? 'UPI' : 'RAZORPAY',
        couponCode: couponApplied ? couponCode : '',
        razorpayOrderId: razorpayData?.razorpay_order_id || '',
        razorpayPaymentId: razorpayData?.razorpay_payment_id || '',
        razorpaySignature: razorpayData?.razorpay_signature || '',
      });
      if (payment === 'WALLET_PAY' && order?._id) {
        const token = localStorage.getItem('bazaario_token');
        await fetch(`${BASE}/wallet/pay`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ amount: total, orderId: order._id, description: `Order #${order._id.slice(-8).toUpperCase()}` }) });
      }
      setPlacedOrder(order);
      await refreshCart();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (!user) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🔒</div>
      <h2 style={{ fontFamily:'Baloo 2,sans-serif', marginBottom:12 }}>Login to Checkout</h2>
      <Link to="/login" style={{ background:'#E91E8C', color:'#fff', padding:'12px 28px', borderRadius:50, fontWeight:700, textDecoration:'none' }}>Login / Sign Up</Link>
    </div>
  );

  if (cart.count === 0 && !placedOrder) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🛒</div>
      <h2 style={{ fontFamily:'Baloo 2,sans-serif', marginBottom:12 }}>Your cart is empty</h2>
      <Link to="/products" style={{ background:'#E91E8C', color:'#fff', padding:'12px 28px', borderRadius:50, fontWeight:700, textDecoration:'none' }}>Shop Now</Link>
    </div>
  );

  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState('');
  const [fbSent, setFbSent] = useState(false);

  async function sendOrderFeedback() {
    if (!fbRating) return;
    const token = localStorage.getItem('bazaario_token');
    await fetch(`${BASE}/feedback`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ rating: fbRating, comment: fbComment, type: 'order', city: address.city }) });
    setFbSent(true);
  }

  if (placedOrder) return (
    <div style={{ maxWidth:500, margin:'60px auto', padding:20, textAlign:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:80, marginBottom:16 }}>🎉</div>
      <h2 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:28, color:'#1A0A12', marginBottom:8 }}>Order Placed!</h2>
      <p style={{ color:'#8A7A87', fontSize:15, marginBottom:24 }}>Thank you for shopping with Sheen Bazaar!</p>
      <div style={{ background:'#FFF6F2', border:'1px solid #EFE1E7', borderRadius:14, padding:20, marginBottom:20, textAlign:'left' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ color:'#8A7A87' }}>Order ID</span><strong>#{placedOrder._id?.slice(-8).toUpperCase()}</strong></div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ color:'#8A7A87' }}>Amount</span><strong style={{ color:'#E91E8C' }}>₹{placedOrder.total}</strong></div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ color:'#8A7A87' }}>Payment</span><strong>{placedOrder.paymentMethod} — <span style={{ color: placedOrder.paymentStatus==='paid'?'#22c55e':'#f59e0b' }}>{placedOrder.paymentStatus?.toUpperCase()}</span></strong></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8A7A87' }}>Delivery to</span><strong>{placedOrder.address?.city}</strong></div>
      </div>
      {placedOrder.paymentMethod === 'COD' && <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:12, marginBottom:20, fontSize:13, color:'#c2410c' }}>💵 Pay ₹{placedOrder.total} in cash when your order arrives</div>}
      {/* Quick feedback */}
      <div style={{ background:'#fff', border:'1.5px solid #F0E0EC', borderRadius:16, padding:20, marginBottom:20 }}>
        {fbSent ? (
          <div style={{ fontSize:15, fontWeight:700, color:'#22c55e' }}>💖 Thanks for your feedback!</div>
        ) : (
          <>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>😊 How was your shopping experience?</div>
            <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:12 }}>
              {[1,2,3,4,5].map(s => <span key={s} onClick={() => setFbRating(s)} style={{ fontSize:30, cursor:'pointer', color:s<=fbRating?'#FFB300':'#E0E0E0', transition:'transform 0.15s', transform:s<=fbRating?'scale(1.15)':'scale(1)' }}>★</span>)}
            </div>
            {fbRating > 0 && (
              <>
                <textarea value={fbComment} onChange={e=>setFbComment(e.target.value)} placeholder="Tell us more (shown on our website!)..." rows={2} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #EFE1E7', fontSize:13, outline:'none', fontFamily:'Inter,sans-serif', resize:'none', boxSizing:'border-box', marginBottom:10 }} />
                <button onClick={sendOrderFeedback} style={{ background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:50, padding:'10px 24px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Submit Feedback</button>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <Link to={`/orders/${placedOrder._id}`} style={{ background:'#E91E8C', color:'#fff', padding:'12px 24px', borderRadius:50, fontWeight:700, textDecoration:'none' }}>Track Order →</Link>
        <Link to="/products" style={{ background:'#fff', color:'#E91E8C', padding:'12px 24px', borderRadius:50, fontWeight:700, textDecoration:'none', border:'2px solid #E91E8C' }}>Continue Shopping</Link>
      </div>
    </div>
  );

  const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #EFE1E7', fontSize:14, color:'#2B1330', background:'#fff', boxSizing:'border-box', outline:'none', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' };
  const lbl = { fontSize:12, fontWeight:700, color:'#8A7A87', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <h1 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:24, fontWeight:800, marginBottom:8 }}>Checkout</h1>

      {/* Steps */}
      <div style={{ display:'flex', gap:0, marginBottom:28 }}>
        {['Delivery Address','Payment','Review Order'].map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:8, background: step===i+1?'#E91E8C':step>i+1?'#22c55e':'#F3F4F8', color: step>=i+1?'#fff':'#8A7A87', fontWeight:700, fontSize:13, cursor: step>i+1?'pointer':'default' }} onClick={() => step>i+1 && setStep(i+1)}>
              <span>{step>i+1?'✅':i+1}</span> {s}
            </div>
            {i < 2 && <div style={{ width:24, height:2, background: step>i+1?'#22c55e':'#EFE1E7' }} />}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>

        {/* LEFT */}
        <div>

          {/* STEP 1 — ADDRESS */}
          {step === 1 && (
            <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:24 }}>
              <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>📍 Delivery Address</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Full Name *</label><input value={address.fullName} onChange={e=>setAddress({...address,fullName:e.target.value})} placeholder="Enter full name" style={inp} /></div>
                <div><label style={lbl}>Phone *</label><input value={address.phone} onChange={e=>setAddress({...address,phone:e.target.value})} placeholder="+91 XXXXX XXXXX" style={inp} /></div>
                <div style={{ gridColumn:'span 2' }}><label style={lbl}>Address *</label><input value={address.addressLine} onChange={e=>setAddress({...address,addressLine:e.target.value})} placeholder="House no, Street, Area, Landmark" style={inp} /></div>
                <div><label style={lbl}>City *</label><input value={address.city} onChange={e=>setAddress({...address,city:e.target.value})} placeholder="City" style={inp} /></div>
                <div><label style={lbl}>State</label><input value={address.state} onChange={e=>setAddress({...address,state:e.target.value})} placeholder="State" style={inp} /></div>
                <div><label style={lbl}>Pincode *</label><input value={address.pincode} onChange={e=>setAddress({...address,pincode:e.target.value})} placeholder="6-digit pincode" style={inp} /></div>
              </div>
              <button onClick={() => { if (!address.fullName||!address.phone||!address.addressLine||!address.city||!address.pincode) return setError('Fill all required fields'); setError(''); setStep(2); }} style={{ background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:50, padding:'14px 32px', fontWeight:800, fontSize:15, cursor:'pointer', marginTop:20, boxShadow:'0 4px 20px rgba(233,30,140,0.25)' }}>
                Continue to Payment →
              </button>
              {error && <div style={{ color:'#E91E8C', fontSize:13, marginTop:10, fontWeight:600 }}>⚠️ {error}</div>}
            </div>
          )}

          {/* STEP 2 — PAYMENT */}
          {step === 2 && (
            <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:24 }}>
              <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>💳 Choose Payment Method</h2>

              {PAYMENT_METHODS.map(m => (
                <div key={m.id} onClick={() => setPayment(m.id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:12, border:`2px solid ${payment===m.id?'#E91E8C':'#EFE1E7'}`, background: payment===m.id?'#FFF6F2':'#fff', cursor:'pointer', marginBottom:10, transition:'all 0.2s' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${payment===m.id?'#E91E8C':'#8A7A87'}`, background: payment===m.id?'#E91E8C':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {payment===m.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />}
                  </div>
                  <span style={{ fontSize:24, flexShrink:0 }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color: payment===m.id?'#E91E8C':'#1A0A12' }}>{m.label}</div>
                    <div style={{ fontSize:12, color:'#8A7A87' }}>{m.desc}</div>
                  </div>
                  {m.id === 'COD' && <span style={{ fontSize:11, background:'#fff7ed', color:'#c2410c', padding:'3px 8px', borderRadius:50, fontWeight:700 }}>₹49 extra</span>}
                  {m.id !== 'COD' && <span style={{ fontSize:11, background:'#dcfce7', color:'#16a34a', padding:'3px 8px', borderRadius:50, fontWeight:700 }}>Instant</span>}
                </div>
              ))}

              {/* Gateway selection for online payments */}
              {payment !== 'COD' && gateways.razorpay && gateways.cashfree && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#8A7A87', marginBottom:8, textTransform:'uppercase' }}>Pay Through</div>
                  <div style={{ display:'flex', gap:10 }}>
                    {[['razorpay','💳 Razorpay'],['cashfree','💰 Cashfree']].map(([id, lbl]) => (
                      <button key={id} onClick={() => setGateway(id)} style={{ flex:1, padding:'12px', borderRadius:10, border:`2px solid ${gateway===id?'#E91E8C':'#EFE1E7'}`, background:gateway===id?'#FFE8F5':'#fff', fontWeight:700, fontSize:13, cursor:'pointer', color:gateway===id?'#E91E8C':'#4A2040' }}>
                        {lbl} {gateways.primary===id?'⭐':''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {payment === 'COD' && (
                <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:'#c2410c' }}>
                  💵 Cash on Delivery: Pay ₹{total} when your order arrives. Extra ₹49 COD charge applies.
                </div>
              )}
              {payment !== 'COD' && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:'#15803d' }}>
                  🔒 Secure payment via Razorpay. Your card details are never stored.
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(1)} style={{ background:'#F3F4F8', color:'#8A7A87', border:'none', borderRadius:50, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:50, padding:'14px 32px', fontWeight:800, fontSize:15, cursor:'pointer', flex:1, boxShadow:'0 4px 20px rgba(233,30,140,0.25)' }}>Review Order →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — REVIEW */}
          {step === 3 && (
            <div>
              {/* Address summary */}
              <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:20, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <h3 style={{ fontSize:15, fontWeight:700 }}>📍 Delivering to</h3>
                  <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'#E91E8C', fontWeight:700, fontSize:13, cursor:'pointer' }}>Change</button>
                </div>
                <div style={{ fontSize:14, color:'#1A0A12', fontWeight:600 }}>{address.fullName} · {address.phone}</div>
                <div style={{ fontSize:13, color:'#8A7A87' }}>{address.addressLine}, {address.city}, {address.state} {address.pincode}</div>
              </div>

              {/* Payment summary */}
              <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:20, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <h3 style={{ fontSize:15, fontWeight:700 }}>💳 Payment</h3>
                  <button onClick={() => setStep(2)} style={{ background:'none', border:'none', color:'#E91E8C', fontWeight:700, fontSize:13, cursor:'pointer' }}>Change</button>
                </div>
                <div style={{ fontSize:14, fontWeight:600 }}>{PAYMENT_METHODS.find(m=>m.id===payment)?.icon} {PAYMENT_METHODS.find(m=>m.id===payment)?.label}</div>
              </div>

              {/* Items */}
              <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:20, marginBottom:16 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>🛍️ Your Items ({cart.count})</h3>
                {cart.items?.map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom: i < cart.items.length-1 ? '1px solid #F5F5F5' : 'none' }}>
                    <div style={{ width:56, height:56, borderRadius:10, background:'#FFF6F2', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {item.image?<img src={item.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<span style={{ fontSize:28 }}>{item.icon||'🛍️'}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                      {item.variant && <div style={{ fontSize:11, color:'#8A7A87' }}>{item.variant}</div>}
                      <div style={{ fontSize:12, color:'#8A7A87' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight:800, color:'#E91E8C' }}>₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              {error && <div style={{ background:'#FFE8F0', color:'#A8114F', padding:'12px 16px', borderRadius:10, marginBottom:14, fontWeight:600, fontSize:13 }}>⚠️ {error}</div>}

              <button onClick={placeOrder} disabled={loading} style={{ width:'100%', background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', border:'none', borderRadius:50, padding:'16px', fontWeight:800, fontSize:16, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'0 4px 20px rgba(233,30,140,0.3)' }}>
                {loading ? '⏳ Processing...' : payment === 'COD' ? `Place Order — Pay ₹${total} on Delivery` : `Pay ₹${total} Securely →`}
              </button>
              <p style={{ textAlign:'center', fontSize:12, color:'#8A7A87', marginTop:10 }}>🔒 Your payment is 100% secure and encrypted</p>
            </div>
          )}
        </div>

        {/* RIGHT — Order Summary */}
        <div style={{ position:'sticky', top:80 }}>
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:20, marginBottom:14 }}>
            <h3 style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>Order Summary</h3>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}><span style={{ color:'#8A7A87' }}>Items ({cart.count})</span><span>₹{cart.itemsTotal}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}><span style={{ color:'#8A7A87' }}>Delivery</span><span style={{ color: deliveryFee===0?'#22c55e':'inherit' }}>{deliveryFee===0?'FREE':'₹'+deliveryFee}</span></div>
            {couponApplied && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}><span style={{ color:'#22c55e' }}>Coupon ({couponApplied.code})</span><span style={{ color:'#22c55e' }}>−₹{discount}</span></div>}
            <div style={{ borderTop:'2px solid #EFE1E7', paddingTop:12, marginTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:17 }}>
              <span>Total</span><span style={{ color:'#E91E8C' }}>₹{total}</span>
            </div>
            {deliveryFee === 0 && <div style={{ fontSize:12, color:'#22c55e', fontWeight:600, marginTop:6 }}>🎉 You saved ₹49 on delivery!</div>}
          </div>

          {/* Coupon */}
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:16, padding:20, marginBottom:14 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>🏷️ Have a Coupon?</h3>
            {couponApplied ? (
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ fontWeight:700, color:'#16a34a' }}>✅ {couponApplied.code}</div><div style={{ fontSize:12, color:'#16a34a' }}>You save ₹{discount}!</div></div>
                <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} style={{ background:'none', border:'none', color:'#ef4444', fontWeight:700, cursor:'pointer', fontSize:12 }}>Remove</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'1.5px solid #EFE1E7', fontSize:13, outline:'none', fontFamily:'Inter,sans-serif', letterSpacing:1, fontWeight:700 }} />
                <button onClick={applyCoupon} style={{ background:'#E91E8C', color:'#fff', border:'none', borderRadius:8, padding:'10px 16px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Apply</button>
              </div>
            )}
            {couponError && <div style={{ color:'#ef4444', fontSize:12, marginTop:6, fontWeight:600 }}>⚠️ {couponError}</div>}
          </div>

          {/* Trust badges */}
          <div style={{ background:'#FFF6F2', border:'1px solid #EFE1E7', borderRadius:14, padding:16 }}>
            {[['🔒','Secure Payment','256-bit SSL encrypted'],['🚚','Fast Delivery','2-5 business days'],['↩️','Easy Returns','7 day return policy'],['🎁','Best Prices','Lowest price guarantee']].map(([icon,title,sub]) => (
              <div key={title} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                <div><div style={{ fontSize:13, fontWeight:700 }}>{title}</div><div style={{ fontSize:11, color:'#8A7A87' }}>{sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
