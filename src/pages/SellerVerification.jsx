import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://sheen-bazaar-api.onrender.com/api';
function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bazaario_token');
  return fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const DOCS = [
  { key: 'panCard', label: 'PAN Card', required: true, hint: 'Clear photo or scan of your PAN card' },
  { key: 'aadhaarFront', label: 'Aadhaar Card — Front', required: true, hint: 'Front side showing your photo' },
  { key: 'aadhaarBack', label: 'Aadhaar Card — Back', required: true, hint: 'Back side showing your address' },
  { key: 'bankProof', label: 'Bank Proof', required: true, hint: 'Cancelled cheque or passbook first page' },
  { key: 'gstCertificate', label: 'GST Certificate', required: false, hint: 'Optional — if you have GST registration' },
  { key: 'shopPhoto', label: 'Shop / Business Photo', required: false, hint: 'Optional — photo of your shop or workspace' },
];

function DocUpload({ label, hint, required, value, onChange }) {
  const ref = useRef();
  function handleFile(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert('File too large. Max 4MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{label} {required && <span style={{ color: '#E91E8C' }}>*</span>}</div>
      <div style={{ fontSize: 11.5, color: '#8A7A87', marginBottom: 8 }}>{hint}</div>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: 10 }}>
          <img src={value} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, border: '1px solid #EFE1E7' }} />
          <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 700, flex: 1 }}>✅ Uploaded</span>
          <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Remove</button>
        </div>
      ) : (
        <div onClick={() => ref.current.click()} style={{ border: '2px dashed #EFE1E7', borderRadius: 10, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', background: '#FFF6F2' }}>
          <div style={{ fontSize: 22 }}>📤</div>
          <div style={{ fontSize: 12, color: '#E91E8C', fontWeight: 700, marginTop: 4 }}>Tap to upload photo</div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

export default function SellerVerification() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [docs, setDocs] = useState({ panCard: '', aadhaarFront: '', aadhaarBack: '', bankProof: '', gstCertificate: '', shopPhoto: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function load() { authFetch('/auth/seller-docs').then(r => r.json()).then(setStatus).catch(() => {}); }
  useEffect(() => { load(); }, []);

  async function submit() {
    const missing = DOCS.filter(d => d.required && !docs[d.key]);
    if (missing.length) return setError(`Please upload: ${missing.map(d => d.label).join(', ')}`);
    setError(''); setLoading(true);
    try {
      const res = await authFetch('/auth/seller-docs', { method: 'POST', body: JSON.stringify(docs) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubmitted(true);
      load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const card = { background: '#fff', border: '1px solid #EFE1E7', borderRadius: 16, padding: 24, marginBottom: 16 };

  // Already approved
  if (status?.sellerApproved) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 20, textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, marginBottom: 8 }}>You're Verified!</h2>
        <p style={{ color: '#8A7A87' }}>Your documents were approved. You can now list products and start selling.</p>
      </div>
    );
  }

  // Pending review
  if ((status?.status === 'pending' || submitted) && status?.status !== 'rejected') {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 20, textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, marginBottom: 8 }}>Documents Under Review</h2>
        <p style={{ color: '#8A7A87', lineHeight: 1.7 }}>Our team is reviewing your submitted documents. This usually takes 24-48 hours. You'll be notified once approved.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter,sans-serif' }}>
      <h1 style={{ fontFamily: 'Baloo 2,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🪪 Seller Verification</h1>
      <p style={{ color: '#8A7A87', fontSize: 13.5, marginBottom: 20 }}>Upload your documents to get approved and start selling on Sheen Bazaar. Your information is kept confidential and used only for verification.</p>

      {status?.status === 'rejected' && (
        <div style={{ background: '#FFE8F0', border: '1.5px solid #E91E8C', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 13, color: '#A8114F' }}>
          <strong>⚠️ Documents Rejected:</strong> {status.rejectReason}<br />Please re-upload correct documents below.
        </div>
      )}

      {error && <div style={{ background: '#FFE8F0', color: '#A8114F', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

      <div style={card}>
        {DOCS.map(d => (
          <DocUpload key={d.key} label={d.label} hint={d.hint} required={d.required} value={docs[d.key]} onChange={v => setDocs({ ...docs, [d.key]: v })} />
        ))}
        <button onClick={submit} disabled={loading} style={{
          width: '100%', padding: 14, borderRadius: 50, border: 'none',
          background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff', fontWeight: 800, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Submitting…' : '📤 Submit for Verification'}
        </button>
      </div>

      <p style={{ fontSize: 11.5, color: '#8A7A87', textAlign: 'center' }}>🔒 Your documents are stored securely and used only for seller verification.</p>
    </div>
  );
}
