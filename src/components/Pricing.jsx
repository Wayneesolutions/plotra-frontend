import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Wires GET /api/v1/public/billing/plans — referenced by both the dealer
// PDF and investor deck; no page rendered it.
export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/public/billing/plans`)
      .then((res) => setPlans(res.data.plans || []))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load plans.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plotra Pricing</h1>
        <p style={styles.subtitle}>List a property by sending a WhatsApp message. Choose a plan based on how many active listings you run at once.</p>
      </header>

      {loading && <p style={styles.emptyText}>Loading plans…</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      <div style={styles.grid}>
        {plans.map((plan) => (
          <div key={plan.key} style={styles.planCard}>
            <div style={styles.planLabel}>{plan.label}</div>
            <div style={styles.planPrice}>₹{Number(plan.price_inr).toLocaleString('en-IN')}<span style={styles.perMo}>/mo</span></div>
            <div style={styles.planListings}>{plan.listing_limit ? `Up to ${plan.listing_limit} listings` : 'Unlimited listings'}</div>
            <ul style={styles.featureList}>
              {(plan.features || []).map((f, i) => <li key={i} style={styles.featureItem}>✓ {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div style={styles.ctaRow}>
        <Link to="/request-access" style={styles.ctaBtn}>Request Access</Link>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: '960px', margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: '40px' },
  title: { margin: 0, fontSize: '32px', color: '#111827' },
  subtitle: { margin: '8px 0 0 0', color: '#6b7280', fontSize: '15px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  planCard: { border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', backgroundColor: '#fff' },
  planLabel: { fontSize: '13px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: '10px' },
  planPrice: { fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '6px' },
  perMo: { fontSize: '14px', fontWeight: '500', color: '#6b7280' },
  planListings: { fontSize: '13px', color: '#6b7280', marginBottom: '16px' },
  featureList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  featureItem: { fontSize: '13px', color: '#374151' },
  ctaRow: { textAlign: 'center', marginTop: '40px' },
  ctaBtn: { display: 'inline-block', padding: '12px 28px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '15px' },
  emptyText: { textAlign: 'center', color: '#9ca3af' },
  errorText: { textAlign: 'center', color: '#dc2626' },
};
