import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Plain axios here (not apiClient) — there's no token yet to attach,
      // and we don't want a stale-token 401 handler firing on a login call.
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, { email, password });
      localStorage.setItem('pve_token', res.data.token);
      localStorage.setItem('pve_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Property Visual Explorer</h2>
        <p style={styles.subtitle}>Dealer / Agent Login</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
          placeholder="admin@wayneesolutions.com"
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
          placeholder="••••••••"
        />

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' },
  card: { display: 'flex', flexDirection: 'column', gap: '4px', width: '340px', backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { margin: 0, fontSize: '20px', color: '#111827' },
  subtitle: { margin: '2px 0 20px 0', fontSize: '13px', color: '#6b7280' },
  label: { fontSize: '12px', color: '#4b5563', marginTop: '10px', marginBottom: '4px', fontWeight: '600' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' },
  button: { marginTop: '20px', padding: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '4px' },
  forgotLink: { marginTop: '12px', textAlign: 'center', fontSize: '13px', color: '#2563eb', textDecoration: 'none' }
};
