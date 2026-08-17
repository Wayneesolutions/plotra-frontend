import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Wires POST /api/v1/auth/reset-password — the landing page the emailed
// reset link (forgotPassword's resetUrl, "${PUBLIC_APP_URL}/reset-password?token=...")
// actually points at. Without this route/page the link 404'd.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/reset-password`, { token, newPassword });
      setIsError(false);
      setMessage('Password reset. You can now log in with your new password.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Invalid link</h2>
          <p style={styles.subtitle}>This reset link is missing its token. Request a new one.</p>
          <Link to="/forgot-password" style={styles.link}>Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Set a new password</h2>

        {message && (
          <div style={{ ...styles.banner, backgroundColor: isError ? '#fef2f2' : '#f0fdf4', color: isError ? '#991b1b' : '#166534' }}>
            {message}
          </div>
        )}

        <label style={styles.label}>New password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={styles.input} />

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Saving…' : 'Set new password'}
        </button>
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
  banner: { padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '4px' },
  link: { marginTop: '16px', fontSize: '13px', color: '#2563eb', textAlign: 'center', textDecoration: 'none' },
};
