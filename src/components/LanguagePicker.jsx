import { useEffect, useRef, useState } from 'react';

// Hindi / Urdu / English switcher. Uses Google's free website translator, so
// every page (products, sellers' descriptions, admin messages) is translated
// automatically without us maintaining translation files. Urdu switches the
// page to right-to-left.
const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'ur', label: 'اردو', short: 'اردو' },
];

function currentLang() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[a-z-]+\/([a-z-]+)/i);
  return m ? m[1] : 'en';
}

function setCookie(value) {
  const host = window.location.hostname;
  const expires = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const v = value || '';
  document.cookie = `googtrans=${v}; path=/${expires}`;
  // Also set on the parent domain (e.g. .sheenbazaar.online) so it survives subdomains
  const parts = host.split('.');
  if (parts.length >= 2 && !/^\d+$/.test(parts[parts.length - 1])) {
    document.cookie = `googtrans=${v}; path=/; domain=.${parts.slice(-2).join('.')}${expires}`;
  }
}

let scriptLoaded = false;
function loadTranslator() {
  if (scriptLoaded || typeof window === 'undefined') return;
  scriptLoaded = true;
  window.googleTranslateElementInit = () => {
    try {
      new window.google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,hi,ur', autoDisplay: false }, 'google_translate_element');
    } catch { /* translator unavailable — page stays in English */ }
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.body.appendChild(s);
}

function applyDirection(lang) {
  document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
  document.documentElement.classList.toggle('lang-rtl', lang === 'ur');
}

export default function LanguagePicker({ variant = 'nav' }) {
  const [lang, setLang] = useState('en');
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const l = currentLang();
    setLang(l);
    applyDirection(l);
    if (l !== 'en') loadTranslator();
  }, []);

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function choose(code) {
    setOpen(false);
    if (code === lang) return;
    if (code === 'en') setCookie(null); else setCookie(`/en/${code}`);
    window.location.reload(); // translator picks the new language up on load
  }

  const cur = LANGS.find(l => l.code === lang) || LANGS[0];

  if (variant === 'inline') {
    return (
      <div translate="no" className="notranslate" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {LANGS.map(l => (
          <button key={l.code} type="button" onClick={() => choose(l.code)}
            style={{ padding: '8px 16px', borderRadius: 50, border: `1.5px solid ${lang === l.code ? '#E91E8C' : '#EFE1E7'}`, background: lang === l.code ? '#FFE8F5' : '#fff', color: lang === l.code ? '#B5006E' : '#4A2040', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {l.label}
          </button>
        ))}
        <div id="google_translate_element" style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div ref={ref} translate="no" className="notranslate lang-picker-nav" style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} title="Language" aria-label="Change language"
        style={{ display: 'flex', alignItems: 'center', gap: 4, height: 38, padding: '0 10px', borderRadius: 50, border: '1.5px solid #F5E5EF', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12.5, color: '#4A2040' }}>
        🌐 {cur.short}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #F3E6EC', borderRadius: 12, boxShadow: '0 12px 30px rgba(26,10,18,0.15)', padding: 6, zIndex: 3000, minWidth: 140 }}>
          {LANGS.map(l => (
            <button key={l.code} type="button" onClick={() => choose(l.code)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 8, background: lang === l.code ? '#FFE8F5' : 'none', color: lang === l.code ? '#B5006E' : '#1A0A12', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
      <div id="google_translate_element" style={{ display: 'none' }} />
    </div>
  );
}
