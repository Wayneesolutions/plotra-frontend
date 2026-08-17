import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Wires POST /api/v1/public/request-access — the self-service entry point
// for a prospective dealer. No landing/signup page existed at all before
// this; a super-admin could only create a tenant directly, with no way for
// a dealer to ask for an account themselves.
export default function RequestAccess() {
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/request-access`, form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Request received ✅</h2>
          <p style={styles.subtitle}>Our team will review and contact you shortly.</p>
          <Link to="/login" style={styles.link}>Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Get Plotra for your business</h2>
        <p style={styles.subtitle}>List a property by sending a WhatsApp message. Tell us about your business and we'll get you set up.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Business name</label>
        <input name="business_name" value={form.business_name} onChange={handleChange} required style={styles.input} placeholder="e.g. Vinay Sir Property" />

        <label style={styles.label}>Your name</label>
        <input name="contact_name" value={form.contact_name} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} required style={styles.input} placeholder="9876543210" />

        <label style={styles.label}>Anything else? (optional)</label>
        <textarea name="message" value={form.message} onChange={handleChange} style={{ ...styles.input, height: '70px' }} />

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Submitting…' : 'Request Access'}
        </button>
        <Link to="/login" style={styles.link}>Already have an account? Log in</Link>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px 0' },
  card: { display: 'flex', flexDirection: 'column', gap: '4px', width: '380px', backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { margin: 0, fontSize: '20px', color: '#111827' },
  subtitle: { margin: '2px 0 20px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
  label: { fontSize: '12px', color: '#4b5563', marginTop: '10px', marginBottom: '4px', fontWeight: '600' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' },
  button: { marginTop: '20px', padding: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '4px' },
  link: { marginTop: '16px', fontSize: '13px', color: '#2563eb', textAlign: 'center', textDecoration: 'none' },
};
