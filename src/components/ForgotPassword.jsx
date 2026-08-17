import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      // The backend always returns a generic success message regardless of
      // whether the email matched an account (prevents email enumeration) —
      // an actual error here means something else broke (network, 500, etc).
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e" />
            </svg>
          </div>
          <span style={S.brand}>WayneState Pro</span>
        </div>

        <h1 style={S.title}>Forgot your password?</h1>
        <p style={S.sub}>Enter the email on your account and we'll send you a reset link.</p>

        {message ? (
          <div style={{
            ...S.banner,
            backgroundColor: message.type === 'error' ? '#fff5f5' : '#ecfdf5',
            color: message.type === 'error' ? '#c53030' : '#059669',
            border: `1px solid ${message.type === 'error' ? '#fed7d7' : '#a7f3d0'}`,
          }}>
            {message.text}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={S.form}>
            <label style={S.field}>
              <span style={S.label}>Email</span>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={S.input} placeholder="you@company.com"
              />
            </label>
            <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <a href="/login" style={S.backLink}>← Back to login</a>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f2f5fb', padding: '20px',
  },
  card: {
    width: '100%', maxWidth: '420px', backgroundColor: '#fff', borderRadius: '18px',
    padding: '36px 32px', boxShadow: '0 24px 64px rgba(12,27,46,0.10)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
  logoIcon: { width: '32px', height: '32px', borderRadius: '9px', backgroundColor: '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: '13px', fontWeight: '800', color: '#0c1b2e', letterSpacing: '1.5px', textTransform: 'uppercase' },
  title: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 8px' },
  sub: { fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: '1.6' },
  banner: { padding: '14px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px' },
  input: {
    padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '13px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  backLink: { display: 'block', textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b', textDecoration: 'none' },
};
