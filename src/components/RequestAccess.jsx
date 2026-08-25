import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '', message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/request-access`, form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={S.root}>
        <div style={S.brand}>
          <div className="pve-orb" style={S.orb1} />
          <div className="pve-orb" style={{ ...S.orb1, ...S.orb2 }} />
          <div style={S.dotGrid} />
          <div style={S.brandInner}>
            <div style={S.logoRow}>
              <div style={S.logoBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e"/>
                </svg>
              </div>
              <span style={S.logoBrand}>WayneState Pro</span>
            </div>
            <h1 style={S.heroTitle}>One platform.<br /><span className="pve-grad-text" style={S.heroAccent}>Every deal.</span></h1>
            <p style={S.heroCopy}>Listings, satellite imagery, buyer leads, and WhatsApp automation — all in one place.</p>
          </div>
        </div>
        <div style={S.formPanel}>
          <div className="pve-fade-up" style={S.successCard}>
            <div style={S.successStripe} />
            <div style={S.successBody}>
              <div style={S.successIcon}>✓</div>
              <h2 style={S.successTitle}>Request Submitted</h2>
              <p style={S.successText}>
                Thank you! Our team at Wayne E Solutions will review your request and reach out to you shortly.
              </p>
              <button style={S.backBtn} onClick={() => navigate('/login')}>Back to Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>

      {/* ══ LEFT — Brand Panel ══════════════════════════════════ */}
      <div style={S.brand}>
        <div className="pve-orb" style={S.orb1} />
        <div className="pve-orb" style={{ ...S.orb1, ...S.orb2 }} />
        <div style={S.dotGrid} />
        <div className="pve-fade-up" style={S.brandInner}>
          <div style={S.logoRow}>
            <div style={S.logoBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e"/>
              </svg>
            </div>
            <span style={S.logoBrand}>WayneState Pro</span>
          </div>
          <h1 style={S.heroTitle}>Grow your<br /><span className="pve-grad-text" style={S.heroAccent}>Real Estate Business.</span></h1>
          <p style={S.heroCopy}>
            Request access to the platform trusted by real estate professionals. We'll set up your account within 24 hours.
          </p>
          <div style={S.features}>
            {[
              { icon: '🛰', text: 'Satellite + street view imagery' },
              { icon: '💬', text: 'WhatsApp lead automation'        },
              { icon: '📍', text: 'Landmark & infrastructure maps'  },
              { icon: '📊', text: 'Real-time engagement analytics'  },
            ].map(({ icon, text }) => (
              <div key={text} style={S.featureRow}>
                <div style={S.featureIcon}>{icon}</div>
                <span style={S.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Form Panel ══════════════════════════════════ */}
      <div style={S.formPanel}>
        <form onSubmit={handleSubmit} className="pve-fade-up" style={S.card}>

          <div style={S.cardStripe} />

          <div style={S.cardHead}>
            <p style={S.cardEyebrow}>New Dealer Onboarding</p>
            <h2 style={S.cardTitle}>Request Access</h2>
            <p style={S.cardSub}>Fill in your details and our team will review your application</p>
          </div>

          {error && (
            <div style={S.errorBox}>
              <span style={S.errorIcon}>!</span>
              {error}
            </div>
          )}

          <div style={S.field}>
            <label style={S.label}>Business / Company Name</label>
            <input style={S.input} type="text" required placeholder="e.g. Sunrise Realty" value={form.business_name} onChange={set('business_name')} />
          </div>

          <div style={S.field}>
            <label style={S.label}>Your Name</label>
            <input style={S.input} type="text" required placeholder="e.g. Rajesh Sharma" value={form.contact_name} onChange={set('contact_name')} />
          </div>

          <div style={S.twoCol}>
            <div style={S.field}>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" required placeholder="you@company.com" value={form.email} onChange={set('email')} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Phone Number</label>
              <input style={S.input} type="tel" required placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Tell us about your business <span style={S.optional}>(optional)</span></label>
            <textarea
              style={{ ...S.input, ...S.textarea }}
              placeholder="How many listings do you manage? Which cities?"
              value={form.message}
              onChange={set('message')}
              rows={3}
            />
          </div>

          <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.72 : 1 }}>
            {submitting
              ? <span style={S.btnInner}><span style={S.btnSpinner} /> Submitting…</span>
              : <span style={S.btnInner}>Submit Request <span style={S.btnArrow}>→</span></span>
            }
          </button>

          <p style={S.footnote}>
            Already have an account?{' '}
            <span style={S.loginLink} onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </form>
      </div>
    </div>
  );
}

const S = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },

  brand: {
    flex: '0 0 46%',
    background: 'linear-gradient(148deg, #060d18 0%, #0b1929 50%, #101f35 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 52px', position: 'relative', overflow: 'hidden',
  },
  orb1: {
    position: 'absolute', width: '420px', height: '420px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(200,169,110,0.09) 0%, transparent 65%)',
    top: '10%', left: '-10%', pointerEvents: 'none',
  },
  orb2: {
    width: '350px', height: '350px',
    background: 'radial-gradient(circle, rgba(29,78,216,0.10) 0%, transparent 65%)',
    top: '55%', left: '45%', animationDelay: '-5s',
  },
  dotGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(rgba(200,169,110,0.13) 1.2px, transparent 1.2px)',
    backgroundSize: '26px 26px', pointerEvents: 'none',
  },
  brandInner: { position: 'relative', zIndex: 1, maxWidth: '390px', width: '100%' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logoBox: {
    width: '42px', height: '42px', borderRadius: '11px', backgroundColor: '#c8a96e',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 4px 16px rgba(200,169,110,0.35)',
  },
  logoBrand: { fontSize: '14px', fontWeight: '800', color: '#c8a96e', letterSpacing: '2.5px', textTransform: 'uppercase' },
  heroTitle: { fontSize: '40px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff', margin: '0 0 16px 0', letterSpacing: '-0.5px' },
  heroAccent: { display: 'block', fontSize: '40px' },
  heroCopy: { fontSize: '14px', lineHeight: '1.8', color: '#7fa8c9', margin: '0 0 32px 0', maxWidth: '340px' },
  features: { display: 'flex', flexDirection: 'column', gap: '14px' },
  featureRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  featureIcon: {
    width: '36px', height: '36px', borderRadius: '9px',
    background: 'rgba(200,169,110,0.10)', border: '1px solid rgba(200,169,110,0.20)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0,
  },
  featureText: { fontSize: '13px', color: '#9cc0d8', fontWeight: '500', lineHeight: '1.4' },

  formPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(155deg, #eef2f9 0%, #f4f7fb 50%, #edf1f8 100%)',
    padding: '32px', overflowY: 'auto',
  },
  card: {
    width: '100%', maxWidth: '480px', backgroundColor: '#ffffff',
    borderRadius: '20px', overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(12,27,46,0.08), 0 20px 60px rgba(12,27,46,0.10)',
    display: 'flex', flexDirection: 'column',
  },
  cardStripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  cardHead: { padding: '28px 36px 20px' },
  cardEyebrow: { margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.8px' },
  cardTitle: { margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', color: '#0c1b2e' },
  cardSub: { margin: 0, fontSize: '13px', color: '#64748b' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: '#fff5f5', color: '#c53030',
    padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
    margin: '0 36px 16px', border: '1px solid #fed7d7',
  },
  errorIcon: {
    width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '800', flexShrink: 0,
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', padding: '0 36px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px', padding: '0 36px 14px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px' },
  optional: { fontWeight: '400', textTransform: 'none', color: '#94a3b8', letterSpacing: 0 },
  input: {
    padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', width: '100%', color: '#0c1b2e',
    backgroundColor: '#fafbfd', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  textarea: { resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' },
  submitBtn: {
    margin: '8px 36px 0', width: 'calc(100% - 72px)', padding: '14px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', border: 'none', borderRadius: '11px',
    fontWeight: '700', fontSize: '15px', cursor: 'pointer', letterSpacing: '0.3px',
    boxShadow: '0 4px 16px rgba(12,27,46,0.28)',
  },
  btnInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  btnArrow: { fontSize: '17px', lineHeight: 1 },
  btnSpinner: {
    width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  footnote: { textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '16px 36px 28px', margin: 0 },
  loginLink: { color: '#c8a96e', cursor: 'pointer', fontWeight: '600' },

  // Success state
  successCard: {
    width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '20px',
    overflow: 'hidden', boxShadow: '0 4px 24px rgba(12,27,46,0.08), 0 20px 60px rgba(12,27,46,0.10)',
  },
  successStripe: { height: '4px', background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #22c55e 100%)' },
  successBody: { padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  successIcon: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '24px', boxShadow: '0 8px 24px rgba(34,197,94,0.30)',
  },
  successTitle: { fontSize: '24px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 12px 0' },
  successText: { fontSize: '14px', color: '#64748b', lineHeight: '1.7', margin: '0 0 32px 0', maxWidth: '320px' },
  backBtn: {
    padding: '12px 32px', background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(12,27,46,0.25)',
  },
};
