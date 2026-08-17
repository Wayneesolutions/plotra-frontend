import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, { email, password });
      localStorage.setItem('pve_token', res.data.token);
      localStorage.setItem('pve_user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={S.root}>

      {/* ══ LEFT — Brand Panel ══════════════════════════════════ */}
      <div style={S.brand}>

        {/* Decorative background orbs */}
        <div className="pve-orb" style={S.orb1} />
        <div className="pve-orb" style={{ ...S.orb1, ...S.orb2 }} />

        {/* Dot-grid overlay */}
        <div style={S.dotGrid} />

        <div className="pve-fade-up" style={S.brandInner}>

          {/* Logo mark */}
          <div style={S.logoRow}>
            <div style={S.logoBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e"/>
              </svg>
            </div>
            <span style={S.logoBrand}>WayneState Pro</span>
          </div>

          {/* Hero headline */}
          <h1 style={S.heroTitle}>
            Your Real Estate<br />
            <span className="pve-grad-text" style={S.heroAccent}>Command Centre.</span>
          </h1>

          <p style={S.heroCopy}>
            One platform for listings, buyer leads, satellite imagery, and WhatsApp automation.
          </p>

          {/* Feature list */}
          <div style={S.features}>
            {[
              { icon: '🛰',  text: 'Satellite + street view imagery' },
              { icon: '💬',  text: 'WhatsApp lead automation'        },
              { icon: '📍',  text: 'Landmark & infrastructure maps'   },
              { icon: '📊',  text: 'Real-time engagement analytics'   },
            ].map(({ icon, text }) => (
              <div key={text} className="pve-feature-item" style={S.featureRow}>
                <div style={S.featureIcon}>{icon}</div>
                <span style={S.featureText}>{text}</span>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div style={S.trustStrip}>
            {[
              { num: '500+', lbl: 'Properties' },
              { num: '80+',  lbl: 'Dealers'    },
              { num: '12',   lbl: 'Cities'     },
            ].map(({ num, lbl }, i) => (
              <React.Fragment key={lbl}>
                {i > 0 && <div style={S.trustDivider} />}
                <div style={S.trustItem}>
                  <span style={S.trustNum}>{num}</span>
                  <span style={S.trustLbl}>{lbl}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Form Panel ══════════════════════════════════ */}
      <div style={S.formPanel}>
        <form onSubmit={handleSubmit} className="pve-fade-up" style={S.card}>

          {/* Gold top stripe */}
          <div style={S.cardStripe} />

          <div style={S.cardHead}>
            <p style={S.cardEyebrow}>Dealer &amp; Agent Portal</p>
            <h2 style={S.cardTitle}>Welcome back</h2>
            <p style={S.cardSub}>Sign in to manage your property portfolio</p>
          </div>

          {error && (
            <div style={S.errorBox}>
              <span style={S.errorIcon}>!</span>
              {error}
            </div>
          )}

          <div style={S.field}>
            <label style={S.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={S.input}
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={S.input}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ ...S.submitBtn, opacity: submitting ? 0.72 : 1 }}
          >
            {submitting
              ? <span style={S.btnInner}><span style={S.btnSpinner} /> Signing in…</span>
              : <span style={S.btnInner}>Sign in <span style={S.btnArrow}>→</span></span>
            }
          </button>

          <p style={S.forgotLink}>
            <a href="/forgot-password" style={S.forgotLinkA}>Forgot your password?</a>
          </p>

          <p style={S.footnote}>
            Secure access · Property Visual Explorer
          </p>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════ */
const S = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },

  /* ── Brand panel ─────────────────────────────────── */
  brand: {
    flex: '0 0 46%',
    background: 'linear-gradient(148deg, #060d18 0%, #0b1929 50%, #101f35 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 52px',
    position: 'relative',
    overflow: 'hidden',
  },

  /* Decorative orbs */
  orb1: {
    position: 'absolute',
    width: '420px', height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(200,169,110,0.09) 0%, transparent 65%)',
    top: '10%', left: '-10%',
    pointerEvents: 'none',
  },
  orb2: {
    width: '350px', height: '350px',
    background: 'radial-gradient(circle, rgba(29,78,216,0.10) 0%, transparent 65%)',
    top: '55%', left: '45%',
    animationDelay: '-5s',
  },

  /* Dot grid */
  dotGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(rgba(200,169,110,0.13) 1.2px, transparent 1.2px)',
    backgroundSize: '26px 26px',
    pointerEvents: 'none',
  },

  brandInner: {
    position: 'relative', zIndex: 1,
    maxWidth: '390px', width: '100%',
  },

  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logoBox: {
    width: '42px', height: '42px', borderRadius: '11px',
    backgroundColor: '#c8a96e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(200,169,110,0.35)',
  },
  logoBrand: {
    fontSize: '14px', fontWeight: '800',
    color: '#c8a96e', letterSpacing: '2.5px', textTransform: 'uppercase',
  },

  heroTitle: {
    fontSize: '44px', fontWeight: '900',
    lineHeight: '1.1', color: '#ffffff',
    margin: '0 0 16px 0', letterSpacing: '-0.5px',
  },
  heroAccent: {
    display: 'block',
    fontSize: '44px',
  },

  heroCopy: {
    fontSize: '14px', lineHeight: '1.8',
    color: '#7fa8c9', margin: '0 0 36px 0',
    maxWidth: '340px',
  },

  features: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' },
  featureRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  featureIcon: {
    width: '36px', height: '36px', borderRadius: '9px',
    background: 'rgba(200,169,110,0.10)',
    border: '1px solid rgba(200,169,110,0.20)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', flexShrink: 0,
  },
  featureText: { fontSize: '13px', color: '#9cc0d8', fontWeight: '500', lineHeight: '1.4' },

  trustStrip: {
    display: 'flex', alignItems: 'center', gap: '0px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  trustItem: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, alignItems: 'center' },
  trustNum: { fontSize: '22px', fontWeight: '800', color: '#c8a96e' },
  trustLbl: { fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' },
  trustDivider: { width: '1px', height: '36px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 8px' },

  /* ── Form panel ──────────────────────────────────── */
  formPanel: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(155deg, #eef2f9 0%, #f4f7fb 50%, #edf1f8 100%)',
    padding: '32px',
    overflowY: 'auto',
  },

  card: {
    width: '100%', maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(12,27,46,0.08), 0 20px 60px rgba(12,27,46,0.10)',
    display: 'flex', flexDirection: 'column',
  },
  cardStripe: {
    height: '4px',
    background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)',
  },
  cardHead: { padding: '32px 36px 24px' },
  cardEyebrow: {
    margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700',
    color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.8px',
  },
  cardTitle: { margin: '0 0 6px 0', fontSize: '28px', fontWeight: '800', color: '#0c1b2e' },
  cardSub: { margin: 0, fontSize: '14px', color: '#64748b' },

  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: '#fff5f5', color: '#c53030',
    padding: '12px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: '500',
    margin: '0 36px 16px',
    border: '1px solid #fed7d7',
  },
  errorIcon: {
    width: '20px', height: '20px', borderRadius: '50%',
    backgroundColor: '#fed7d7', color: '#c53030',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '800', flexShrink: 0,
  },

  field: { display: 'flex', flexDirection: 'column', gap: '7px', padding: '0 36px 16px' },
  label: {
    fontSize: '11px', fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.7px',
  },
  input: {
    padding: '13px 15px', fontSize: '14px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    width: '100%', color: '#0c1b2e',
    backgroundColor: '#fafbfd', transition: 'border-color 0.15s, box-shadow 0.15s',
  },

  submitBtn: {
    margin: '8px 36px 0',
    width: 'calc(100% - 72px)',
    padding: '15px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', border: 'none', borderRadius: '11px',
    fontWeight: '700', fontSize: '15px', cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: '0 4px 16px rgba(12,27,46,0.28)',
  },
  btnInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  btnArrow: { fontSize: '17px', lineHeight: 1 },
  btnSpinner: {
    width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },

  footnote: {
    textAlign: 'center', fontSize: '11px', color: '#94a3b8',
    padding: '20px 36px 32px', margin: 0, letterSpacing: '0.3px',
  },
  forgotLink: { textAlign: 'center', margin: '14px 0 0' },
  forgotLinkA: { fontSize: '13px', color: '#0c1b2e', fontWeight: '600', textDecoration: 'none' },
};
