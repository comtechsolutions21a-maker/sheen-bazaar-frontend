import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const QUICK = [100, 200, 500, 1000, 2000, 5000];
const TXN_ICONS = { add_money:'💰', order_payment:'🛒', refund:'↩️', cashback:'🎁', transfer_in:'📥', transfer_out:'📤', recharge:'📱' };

// ─── RECHARGE PROVIDERS ───
const MOBILE_OPERATORS = [
  { id:'jio', name:'Jio', color:'#0A2885', logo:'Jio' },
  { id:'airtel', name:'Airtel', color:'#E40000', logo:'airtel' },
  { id:'vi', name:'Vi', color:'#EE008C', logo:'Vi' },
  { id:'bsnl', name:'BSNL', color:'#F7941D', logo:'BSNL' },
];
const DTH_OPERATORS = [
  { id:'tataplay', name:'Tata Play', color:'#3A0CA3' },
  { id:'airteldth', name:'Airtel DTH', color:'#E40000' },
  { id:'dishtv', name:'Dish TV', color:'#F26522' },
  { id:'d2h', name:'d2h', color:'#00A651' },
  { id:'sundirect', name:'Sun Direct', color:'#FFC20E' },
];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'];
const ELECTRICITY_BOARDS = { 'Jammu & Kashmir':['JKPDD / KPDCL','JPDCL'], 'Delhi':['BSES Rajdhani','BSES Yamuna','Tata Power DDL'], 'Maharashtra':['MSEB / Mahavitaran','Adani Electricity','Tata Power Mumbai','BEST'], 'Uttar Pradesh':['UPPCL Urban','UPPCL Rural','NPCL','Torrent Power Agra'], 'Karnataka':['BESCOM','HESCOM','GESCOM','MESCOM','CESC Mysore'], 'Tamil Nadu':['TNEB / TANGEDCO'], 'Gujarat':['Torrent Power','DGVCL','MGVCL','PGVCL','UGVCL'], 'Rajasthan':['JVVNL','AVVNL','JDVVNL'], 'Punjab':['PSPCL'], 'Haryana':['DHBVN','UHBVN'], 'West Bengal':['CESC','WBSEDCL'], 'Bihar':['NBPDCL','SBPDCL'], 'Telangana':['TSSPDCL','TSNPDCL'], 'Andhra Pradesh':['APSPDCL','APEPDCL'], 'Kerala':['KSEB'], 'Madhya Pradesh':['MPPKVVCL','MPMKVVCL','MPPoKVVCL'] };
const BROADBAND = ['JioFiber','Airtel Xstream Fiber','BSNL Broadband','ACT Fibernet','Hathway','Tata Play Fiber','Excitel','Tikona'];

const SERVICES = [
  { id:'mobile', icon:'📱', label:'Mobile', sub:'Prepaid & Postpaid' },
  { id:'dth', icon:'📺', label:'DTH', sub:'All operators' },
  { id:'electricity', icon:'💡', label:'Electricity', sub:'All states' },
  { id:'water', icon:'💧', label:'Water', sub:'All boards' },
  { id:'gas', icon:'🔥', label:'Gas / LPG', sub:'Indane, HP, Bharat' },
  { id:'broadband', icon:'🌐', label:'Broadband', sub:'Fiber & Landline' },
  { id:'landline', icon:'☎️', label:'Landline', sub:'BSNL, Airtel, Jio' },
  { id:'fastag', icon:'🚗', label:'FASTag', sub:'All banks' },
  { id:'insurance', icon:'🛡️', label:'Insurance', sub:'LIC & more' },
  { id:'loan', icon:'🏦', label:'Loan EMI', sub:'All lenders' },
  { id:'transfer', icon:'📤', label:'Send Money', sub:'To any user' },
  { id:'shop', icon:'🛍️', label:'Shop & Pay', sub:'On Sheen Bazaar' },
];

function Confetti({ show }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, overflow:'hidden' }}>
      {Array.from({ length:40 }).map((_, i) => (
        <div key={i} style={{
          position:'absolute', top:'-20px', left:`${Math.random()*100}%`,
          fontSize: 14 + Math.random()*14,
          animation:`confettiFall ${1.5 + Math.random()*2}s ease-in forwards`,
          animationDelay:`${Math.random()*0.5}s`,
        }}>{['🎉','✨','💖','🎊','⭐'][i%5]}</div>
      ))}
      <style>{`@keyframes confettiFall { to { transform: translateY(110vh) rotate(${Math.random()>0.5?'':'-'}360deg); opacity: 0.6; } }`}</style>
    </div>
  );
}

function FeedbackModal({ show, onClose, type }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  if (!show) return null;
  async function submit() {
    if (!rating) return;
    await authFetch('/feedback', { method:'POST', body:JSON.stringify({ rating, comment, type }) });
    setSent(true);
    setTimeout(() => { onClose(); setSent(false); setRating(0); setComment(''); }, 1500);
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001, padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400, textAlign:'center', animation:'popIn 0.3s ease' }}>
        <style>{`@keyframes popIn { from { transform: scale(0.85); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
        {sent ? (
          <><div style={{ fontSize:56 }}>💖</div><h3 style={{ fontFamily:'Baloo 2,sans-serif' }}>Thank you!</h3></>
        ) : (
          <>
            <div style={{ fontSize:44, marginBottom:8 }}>😊</div>
            <h3 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:19, marginBottom:6 }}>How was your experience?</h3>
            <div style={{ display:'flex', justifyContent:'center', gap:6, margin:'14px 0' }}>
              {[1,2,3,4,5].map(s => <span key={s} onClick={() => setRating(s)} style={{ fontSize:34, cursor:'pointer', color:s<=rating?'#FFB300':'#E0E0E0', transition:'transform 0.15s', transform:s<=rating?'scale(1.15)':'scale(1)' }}>★</span>)}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Tell us more (optional)..." rows={2} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #EFE1E7', fontSize:13, outline:'none', fontFamily:'Inter,sans-serif', resize:'none', boxSizing:'border-box', marginBottom:12 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={submit} disabled={!rating} style={{ flex:1, padding:12, borderRadius:50, border:'none', background:rating?'linear-gradient(135deg,#E91E8C,#B5006E)':'#E0E0E0', color:'#fff', fontWeight:800, fontSize:14, cursor:rating?'pointer':'not-allowed' }}>Submit</button>
              <button onClick={onClose} style={{ padding:'12px 20px', borderRadius:50, border:'1.5px solid #EFE1E7', background:'#fff', color:'#8A7A87', fontWeight:700, fontSize:13, cursor:'pointer' }}>Skip</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [view, setView] = useState('home');
  const [service, setService] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [rechargeForm, setRechargeForm] = useState({ operator:'', number:'', amount:'', state:'', board:'', planType:'prepaid' });
  const [msg, setMsg] = useState({ text:'', type:'' });
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('wallet');

  function showMsg(text, type='success') { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 3500); }
  function celebrate(fbType) { setConfetti(true); setTimeout(() => setConfetti(false), 3000); setFeedbackType(fbType); setTimeout(() => setShowFeedback(true), 1200); }
  function load() { authFetch('/wallet').then(r => r.json()).then(setWallet).catch(() => {}); }
  useEffect(() => { load(); }, []);

  async function addMoney() {
    const amt = Number(addAmount);
    if (!amt || amt < 10) return showMsg('Minimum ₹10', 'error');
    setLoading(true);
    try {
      await loadRazorpay();
      const res = await authFetch('/wallet/add-money/create', { method:'POST', body:JSON.stringify({ amount: amt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const rzp = new window.Razorpay({
        key: data.keyId, amount: amt * 100, currency: 'INR',
        name: 'Sheen Bazaar Wallet', description: `Add ₹${amt}`,
        order_id: data.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#E91E8C' },
        handler: async (response) => {
          const vr = await authFetch('/wallet/add-money/verify', { method:'POST', body:JSON.stringify({ ...response, amount: amt }) });
          if (vr.ok) { showMsg(`₹${amt} added! 🎉`); setAddAmount(''); setView('home'); load(); celebrate('wallet'); }
          else showMsg((await vr.json()).message, 'error');
        },
      });
      rzp.open();
    } catch(e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function transfer() {
    const amt = Number(transferAmount);
    if (!transferEmail || !amt) return showMsg('Enter email and amount', 'error');
    if (!confirm(`Send ₹${amt} to ${transferEmail}?`)) return;
    setLoading(true);
    try {
      const res = await authFetch('/wallet/transfer', { method:'POST', body:JSON.stringify({ toEmail: transferEmail, amount: amt }) });
      if (!res.ok) throw new Error((await res.json()).message);
      showMsg(`₹${amt} sent! 🎉`); setTransferEmail(''); setTransferAmount(''); setView('home'); load(); celebrate('wallet');
    } catch(e) { showMsg(e.message, 'error'); }
    finally { setLoading(false); }
  }

  const inp = { width:'100%', padding:'13px 15px', borderRadius:12, border:'1.5px solid #EFE1E7', fontSize:15, color:'#2B1330', background:'#fff', boxSizing:'border-box', outline:'none', marginBottom:14, fontFamily:'Inter,sans-serif' };
  const lbl = { fontSize:11, fontWeight:800, color:'#8A7A87', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:1 };
  const btnMain = { width:'100%', padding:15, borderRadius:14, border:'none', background:'linear-gradient(135deg,#E91E8C,#B5006E)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 6px 24px rgba(233,30,140,0.3)' };

  const rechargeService = SERVICES.find(s => s.id === service);

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 16px', fontFamily:'Inter,sans-serif' }}>
      <Confetti show={confetti} />
      <FeedbackModal show={showFeedback} onClose={() => setShowFeedback(false)} type={feedbackType} />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
        @keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes cardGlow { 0%,100% { box-shadow: 0 8px 40px rgba(233,30,140,0.25) } 50% { box-shadow: 0 8px 50px rgba(233,30,140,0.45) } }
        @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        .service-tile { transition: transform 0.2s, box-shadow 0.2s; }
        .service-tile:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 8px 24px rgba(233,30,140,0.15); }
        .wallet-view { animation: slideUp 0.35s ease; }
      `}</style>

      <h1 style={{ fontFamily:'Baloo 2,sans-serif', fontSize:26, fontWeight:800, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ animation:'floatY 3s ease-in-out infinite', display:'inline-block' }}>👛</span> My Wallet
      </h1>

      {msg.text && <div style={{ background: msg.type==='error'?'#FFE8F0':'#e8f5e9', color: msg.type==='error'?'#A8114F':'#2e7d32', padding:'12px 16px', borderRadius:12, marginBottom:16, fontWeight:600, fontSize:13, animation:'slideUp 0.3s ease' }}>{msg.type==='error'?'⚠️':'✅'} {msg.text}</div>}

      {/* ─── PREMIUM BALANCE CARD ─── */}
      <div style={{
        background:'linear-gradient(135deg,#1A0A12 0%,#3D0A2A 45%,#6B0F45 100%)',
        borderRadius:24, padding:'30px 26px', color:'#fff', marginBottom:22,
        position:'relative', overflow:'hidden', animation:'cardGlow 4s ease-in-out infinite',
      }}>
        {/* animated shine */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)', backgroundSize:'400px 100%', animation:'shimmer 3s infinite linear' }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, background:'radial-gradient(circle,rgba(233,30,140,0.4),transparent)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-30, left:-30, fontSize:120, opacity:0.06 }}>💎</div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ fontSize:11, opacity:0.65, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>💳 Sheen Bazaar Pay</div>
            <div style={{ fontFamily:'Baloo 2,sans-serif', fontSize:48, fontWeight:800, lineHeight:1 }}>₹{wallet.balance.toLocaleString()}</div>
            <div style={{ fontSize:12, opacity:0.6, marginTop:8 }}>{user?.name}</div>
          </div>
          <div style={{ fontSize:40, animation:'floatY 3s ease-in-out infinite' }}>✨</div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:24, position:'relative' }}>
          <button onClick={() => setView('add')} style={{ background:'#E91E8C', color:'#fff', border:'none', borderRadius:50, padding:'11px 22px', fontWeight:800, fontSize:13, cursor:'pointer', boxShadow:'0 4px 16px rgba(233,30,140,0.4)' }}>+ Add Money</button>
          <button onClick={() => { setService('transfer'); setView('service'); }} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:50, padding:'11px 22px', fontWeight:700, fontSize:13, cursor:'pointer' }}>📤 Send</button>
          <button onClick={() => setView('history')} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:50, padding:'11px 22px', fontWeight:700, fontSize:13, cursor:'pointer' }}>📋 History</button>
        </div>
      </div>

      {/* ─── HOME: SERVICES GRID ─── */}
      {view === 'home' && (
        <div className="wallet-view">
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:20, padding:22, marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16, fontFamily:'Baloo 2,sans-serif' }}>⚡ Recharge & Pay Bills</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {SERVICES.map(s => (
                <div key={s.id} className="service-tile" onClick={() => {
                  if (s.id === 'shop') return window.location.href = '/products';
                  setService(s.id); setView('service');
                  setRechargeForm({ operator:'', number:'', amount:'', state:'', board:'', planType:'prepaid' });
                }} style={{ textAlign:'center', padding:'16px 6px', borderRadius:16, background:'linear-gradient(135deg,#FFF6F2,#FFE8F5)', cursor:'pointer', border:'1px solid #EFE1E7' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#1A0A12' }}>{s.label}</div>
                  <div style={{ fontSize:8.5, color:'#8A7A87', marginTop:2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:20, padding:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontSize:15, fontWeight:800, fontFamily:'Baloo 2,sans-serif' }}>Recent Activity</h3>
              <span onClick={() => setView('history')} style={{ fontSize:13, color:'#E91E8C', fontWeight:700, cursor:'pointer' }}>See all →</span>
            </div>
            {wallet.transactions.length === 0 && (
              <div style={{ textAlign:'center', padding:30 }}>
                <div style={{ fontSize:44, marginBottom:8, animation:'floatY 3s ease-in-out infinite' }}>🌸</div>
                <div style={{ color:'#8A7A87', fontSize:14 }}>No transactions yet — add money to begin!</div>
              </div>
            )}
            {wallet.transactions.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:i<4?'1px solid #F5F5F5':'none' }}>
                <div style={{ width:42, height:42, borderRadius:14, background:'linear-gradient(135deg,#FFF6F2,#FFE8F5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{TXN_ICONS[t.type]||'💳'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{t.description}</div>
                  <div style={{ fontSize:11, color:'#8A7A87' }}>{new Date(t.at).toLocaleString()}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:15, color:t.amount>0?'#22c55e':'#1A0A12' }}>{t.amount>0?'+':''}₹{Math.abs(t.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD MONEY ─── */}
      {view === 'add' && (
        <div className="wallet-view" style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:20, padding:26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:18, fontWeight:800, fontFamily:'Baloo 2,sans-serif' }}>💰 Add Money</h3>
            <button onClick={() => setView('home')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8A7A87' }}>×</button>
          </div>
          <span style={lbl}>Enter Amount</span>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:30, fontWeight:800, color:'#E91E8C' }}>₹</span>
            <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} placeholder="0" style={{ ...inp, marginBottom:0, fontSize:26, fontWeight:800 }} />
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {QUICK.map(a => (
              <button key={a} onClick={() => setAddAmount(String(a))} style={{ padding:'9px 18px', borderRadius:50, border:`1.5px solid ${addAmount==String(a)?'#E91E8C':'#EFE1E7'}`, background:addAmount==String(a)?'#FFE8F5':'#fff', fontWeight:700, fontSize:13, cursor:'pointer', color:addAmount==String(a)?'#E91E8C':'#4A2040' }}>+₹{a}</button>
            ))}
          </div>
          <button onClick={addMoney} disabled={loading} style={{ ...btnMain, opacity:loading?0.7:1 }}>{loading?'Opening payment…':`Add ₹${addAmount||0} — UPI / Card / NetBanking`}</button>
          <p style={{ fontSize:11.5, color:'#8A7A87', textAlign:'center', marginTop:12 }}>🔒 Powered by Razorpay · Min ₹10 · Max ₹50,000</p>
        </div>
      )}

      {/* ─── SERVICE PAGES (recharge, bills, transfer) ─── */}
      {view === 'service' && (
        <div className="wallet-view" style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:20, padding:26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:18, fontWeight:800, fontFamily:'Baloo 2,sans-serif' }}>{rechargeService?.icon} {rechargeService?.label}</h3>
            <button onClick={() => setView('home')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8A7A87' }}>×</button>
          </div>

          {/* SEND MONEY — fully working */}
          {service === 'transfer' && (
            <>
              <span style={lbl}>Recipient's Email (Sheen Bazaar user)</span>
              <input type="email" value={transferEmail} onChange={e=>setTransferEmail(e.target.value)} placeholder="friend@example.com" style={inp} />
              <span style={lbl}>Amount</span>
              <input type="number" value={transferAmount} onChange={e=>setTransferAmount(e.target.value)} placeholder="₹0" style={inp} />
              <div style={{ fontSize:13, color:'#8A7A87', marginBottom:14 }}>Balance: <strong style={{ color:'#22c55e' }}>₹{wallet.balance}</strong></div>
              <button onClick={transfer} disabled={loading} style={btnMain}>{loading?'Sending…':`Send ₹${transferAmount||0} Instantly`}</button>
            </>
          )}

          {/* MOBILE RECHARGE */}
          {service === 'mobile' && (
            <>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {['prepaid','postpaid'].map(t => (
                  <button key={t} onClick={() => setRechargeForm({...rechargeForm, planType:t})} style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${rechargeForm.planType===t?'#E91E8C':'#EFE1E7'}`, background:rechargeForm.planType===t?'#FFE8F5':'#fff', fontWeight:800, fontSize:13, cursor:'pointer', color:rechargeForm.planType===t?'#E91E8C':'#8A7A87', textTransform:'capitalize' }}>{t}</button>
                ))}
              </div>
              <span style={lbl}>Select Operator</span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {MOBILE_OPERATORS.map(op => (
                  <div key={op.id} onClick={() => setRechargeForm({...rechargeForm, operator:op.id})} style={{ textAlign:'center', padding:'14px 6px', borderRadius:14, border:`2px solid ${rechargeForm.operator===op.id?op.color:'#EFE1E7'}`, cursor:'pointer', background:rechargeForm.operator===op.id?`${op.color}11`:'#fff' }}>
                    <div style={{ fontWeight:900, fontSize:15, color:op.color }}>{op.logo}</div>
                    <div style={{ fontSize:10, color:'#8A7A87', marginTop:2 }}>{op.name}</div>
                  </div>
                ))}
              </div>
              <span style={lbl}>Mobile Number</span>
              <input type="tel" maxLength={10} value={rechargeForm.number} onChange={e=>setRechargeForm({...rechargeForm, number:e.target.value.replace(/\D/g,'')})} placeholder="10-digit number" style={inp} />
              <span style={lbl}>Amount</span>
              <input type="number" value={rechargeForm.amount} onChange={e=>setRechargeForm({...rechargeForm, amount:e.target.value})} placeholder="₹" style={inp} />
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {[149,239,299,479,666,719].map(a => <button key={a} onClick={()=>setRechargeForm({...rechargeForm,amount:String(a)})} style={{ padding:'7px 14px', borderRadius:50, border:'1.5px solid #EFE1E7', background:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>₹{a}</button>)}
              </div>
              <button onClick={() => showMsg('Recharge service activating soon! We are connecting with BBPS partners. Your wallet money is safe.', 'error')} style={btnMain}>⚡ Recharge ₹{rechargeForm.amount||0}</button>
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:12, marginTop:14, fontSize:12, color:'#c2410c', textAlign:'center' }}>🚧 Recharges activating soon — BBPS partner integration in progress</div>
            </>
          )}

          {/* DTH */}
          {service === 'dth' && (
            <>
              <span style={lbl}>Select DTH Operator</span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {DTH_OPERATORS.map(op => (
                  <div key={op.id} onClick={() => setRechargeForm({...rechargeForm, operator:op.id})} style={{ textAlign:'center', padding:'14px 6px', borderRadius:14, border:`2px solid ${rechargeForm.operator===op.id?op.color:'#EFE1E7'}`, cursor:'pointer', background:rechargeForm.operator===op.id?`${op.color}11`:'#fff' }}>
                    <div style={{ fontWeight:800, fontSize:12, color:op.color }}>{op.name}</div>
                  </div>
                ))}
              </div>
              <span style={lbl}>Subscriber ID / Registered Mobile</span>
              <input value={rechargeForm.number} onChange={e=>setRechargeForm({...rechargeForm, number:e.target.value})} placeholder="Enter subscriber ID" style={inp} />
              <span style={lbl}>Amount</span>
              <input type="number" value={rechargeForm.amount} onChange={e=>setRechargeForm({...rechargeForm, amount:e.target.value})} placeholder="₹" style={inp} />
              <button onClick={() => showMsg('DTH recharge activating soon with BBPS partners!', 'error')} style={btnMain}>📺 Recharge DTH</button>
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:12, marginTop:14, fontSize:12, color:'#c2410c', textAlign:'center' }}>🚧 Activating soon</div>
            </>
          )}

          {/* ELECTRICITY */}
          {service === 'electricity' && (
            <>
              <span style={lbl}>Select State</span>
              <select value={rechargeForm.state} onChange={e=>setRechargeForm({...rechargeForm, state:e.target.value, board:''})} style={inp}>
                <option value="">Choose your state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {rechargeForm.state && (
                <>
                  <span style={lbl}>Electricity Board</span>
                  <select value={rechargeForm.board} onChange={e=>setRechargeForm({...rechargeForm, board:e.target.value})} style={inp}>
                    <option value="">Choose board</option>
                    {(ELECTRICITY_BOARDS[rechargeForm.state] || ['State Electricity Board']).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </>
              )}
              <span style={lbl}>Consumer Number</span>
              <input value={rechargeForm.number} onChange={e=>setRechargeForm({...rechargeForm, number:e.target.value})} placeholder="Enter consumer number" style={inp} />
              <button onClick={() => showMsg('Bill payments activating soon with BBPS partners!', 'error')} style={btnMain}>💡 Fetch Bill & Pay</button>
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:12, marginTop:14, fontSize:12, color:'#c2410c', textAlign:'center' }}>🚧 Activating soon — all state boards supported</div>
            </>
          )}

          {/* WATER / GAS / LANDLINE / FASTAG / INSURANCE / LOAN */}
          {['water','gas','landline','fastag','insurance','loan'].includes(service) && (
            <>
              {service==='water' && <><span style={lbl}>Select State</span><select value={rechargeForm.state} onChange={e=>setRechargeForm({...rechargeForm,state:e.target.value})} style={inp}><option value="">Choose state</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></>}
              {service==='gas' && <><span style={lbl}>Gas Provider</span><select value={rechargeForm.operator} onChange={e=>setRechargeForm({...rechargeForm,operator:e.target.value})} style={inp}><option value="">Choose provider</option>{['Indane (IndianOil)','HP Gas','Bharat Gas','Adani Gas','Mahanagar Gas','Indraprastha Gas'].map(g=><option key={g}>{g}</option>)}</select></>}
              {service==='landline' && <><span style={lbl}>Provider</span><select value={rechargeForm.operator} onChange={e=>setRechargeForm({...rechargeForm,operator:e.target.value})} style={inp}><option value="">Choose</option>{['BSNL Landline','Airtel Landline','Jio Fixed Line','MTNL'].map(g=><option key={g}>{g}</option>)}</select></>}
              {service==='fastag' && <><span style={lbl}>FASTag Bank</span><select value={rechargeForm.operator} onChange={e=>setRechargeForm({...rechargeForm,operator:e.target.value})} style={inp}><option value="">Choose bank</option>{['Paytm FASTag','ICICI Bank','HDFC Bank','SBI','Axis Bank','IDFC First','Airtel Payments Bank'].map(g=><option key={g}>{g}</option>)}</select></>}
              <span style={lbl}>{service==='fastag'?'Vehicle Number':'Account / Consumer Number'}</span>
              <input value={rechargeForm.number} onChange={e=>setRechargeForm({...rechargeForm,number:e.target.value})} placeholder={service==='fastag'?'e.g. JK01AB1234':'Enter number'} style={inp} />
              {['gas','fastag','loan','insurance'].includes(service) && <><span style={lbl}>Amount</span><input type="number" value={rechargeForm.amount} onChange={e=>setRechargeForm({...rechargeForm,amount:e.target.value})} placeholder="₹" style={inp} /></>}
              <button onClick={() => showMsg('This service is activating soon with BBPS partners!', 'error')} style={btnMain}>{rechargeService?.icon} Pay Bill</button>
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:12, marginTop:14, fontSize:12, color:'#c2410c', textAlign:'center' }}>🚧 Activating soon</div>
            </>
          )}

          {/* BROADBAND */}
          {service === 'broadband' && (
            <>
              <span style={lbl}>Broadband / Fiber Provider</span>
              <select value={rechargeForm.operator} onChange={e=>setRechargeForm({...rechargeForm,operator:e.target.value})} style={inp}>
                <option value="">Choose provider</option>
                {BROADBAND.map(b=><option key={b}>{b}</option>)}
              </select>
              <span style={lbl}>Account / Registered Number</span>
              <input value={rechargeForm.number} onChange={e=>setRechargeForm({...rechargeForm,number:e.target.value})} placeholder="Enter account number" style={inp} />
              <button onClick={() => showMsg('Broadband payments activating soon!', 'error')} style={btnMain}>🌐 Fetch Bill & Pay</button>
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:12, marginTop:14, fontSize:12, color:'#c2410c', textAlign:'center' }}>🚧 Activating soon</div>
            </>
          )}
        </div>
      )}

      {/* ─── HISTORY ─── */}
      {view === 'history' && (
        <div className="wallet-view" style={{ background:'#fff', border:'1px solid #EFE1E7', borderRadius:20, padding:26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:18, fontWeight:800, fontFamily:'Baloo 2,sans-serif' }}>📋 All Transactions</h3>
            <button onClick={() => setView('home')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8A7A87' }}>×</button>
          </div>
          {wallet.transactions.length === 0 && <div style={{ textAlign:'center', padding:40, color:'#8A7A87' }}>No transactions yet</div>}
          {wallet.transactions.map((t, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 0', borderBottom:i<wallet.transactions.length-1?'1px solid #F5F5F5':'none' }}>
              <div style={{ width:42, height:42, borderRadius:14, background:'linear-gradient(135deg,#FFF6F2,#FFE8F5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{TXN_ICONS[t.type]||'💳'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:600 }}>{t.description}</div>
                <div style={{ fontSize:11.5, color:'#8A7A87' }}>{new Date(t.at).toLocaleString()} · Bal: ₹{t.balance}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color:t.amount>0?'#22c55e':'#1A0A12' }}>{t.amount>0?'+':''}₹{Math.abs(t.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
