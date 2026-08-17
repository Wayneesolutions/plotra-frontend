import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Wires POST /api/v1/auth/forgot-password — backend built (with the
// deliberately generic "if an account exists" response to avoid email
// enumeration), no UI existed to trigger it.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Reset your password</h2>
        <p style={styles.subtitle}>We'll email you a link to reset it, if an account exists for that address.</p>

        {message && <div style={styles.infoBox}>{message}</div>}

        <label style={styles.label}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
        <Link to="/login" style={styles.link}>Back to login</Link>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' },
  card: { display: 'flex', flexDirection: 'column', gap: '4px', width: '340px', backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { margin: 0, fontSize: '20px', color: '#111827' },
  subtitle: { margin: '2px 0 20px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
  label: { fontSize: '12px', color: '#4b5563', marginTop: '10px', marginBottom: '4px', fontWeight: '600' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' },
  button: { marginTop: '20px', padding: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  infoBox: { backgroundColor: '#eff6ff', color: '#1e40af', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '4px' },
  link: { marginTop: '16px', fontSize: '13px', color: '#2563eb', textAlign: 'center', textDecoration: 'none' },
};
