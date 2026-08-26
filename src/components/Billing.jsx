import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires GET /api/v1/dashboard/billing/status, POST .../create-checkout-session,
// POST .../cancel-subscription — no billing UI existed at all.
export default function Billing() {
  const [billing, setBilling] = useState(null);
  const [history, setHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/dashboard/billing/status'),
      apiClient.get('/api/v1/public/billing/plans'),
    ])
      .then(([statusRes, plansRes]) => {
        setBilling(statusRes.data.billing);
        setHistory(statusRes.data.history || []);
        setPlans(plansRes.data.plans || []);
      })
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load billing.'))
      .finally(() => setLoading(false));
  }, []);

  const startCheckout = async (planKey) => {
    setBusy(true);
    try {
      const res = await apiClient.post('/api/v1/dashboard/billing/create-checkout-session', {
        plan: planKey,
        successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/dashboard/billing?checkout=cancelled`,
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start checkout.');
      setBusy(false);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Cancel your subscription? You’ll keep access until the end of the current billing period.')) return;
    setBusy(true);
    try {
      const res = await apiClient.post('/api/v1/dashboard/billing/cancel-subscription');
      alert(res.data.message);
      const statusRes = await apiClient.get('/api/v1/dashboard/billing/status');
      setBilling(statusRes.data.billing);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel subscription.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Layout><p style={styles.emptyText}>Loading…</p></Layout>;

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Billing</h2>

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Current Plan</h3>
          <p style={styles.currentPlan}>{billing?.plan || 'starter'} — {billing?.subscription_status || 'no active subscription'}</p>
          {billing?.current_period_end && (
            <p style={styles.helpText}>Renews / ends: {new Date(billing.current_period_end).toLocaleDateString()}</p>
          )}
          {billing?.subscription_status === 'active' && (
            <button onClick={cancelSubscription} disabled={busy} style={styles.dangerBtn}>Cancel Subscription</button>
          )}
        </section>

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Change Plan</h3>
          <div style={styles.planGrid}>
            {plans.map((p) => (
              <div key={p.key} style={styles.planCard}>
                <div style={styles.planLabel}>{p.label}</div>
                <div style={styles.planPrice}>₹{Number(p.price_inr).toLocaleString('en-IN')}/mo</div>
                <button
                  onClick={() => startCheckout(p.key)}
                  disabled={busy || billing?.plan === p.key}
                  style={styles.primaryBtn}
                >
                  {billing?.plan === p.key ? 'Current plan' : 'Switch to this plan'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Payment History</h3>
          {history.length === 0 ? (
            <p style={styles.emptyText}>No payments yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Plan</th><th style={styles.th}>Amount</th><th style={styles.th}>Date</th></tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{h.plan}</td>
                    <td style={styles.td}>₹{(h.amount_paise / 100).toLocaleString('en-IN')}</td>
                    <td style={styles.td}>{new Date(h.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </Layout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '16px', color: 'oklch(0.219 0.032 264.2)' },
  currentPlan: { fontSize: '18px', fontWeight: '700', color: 'oklch(0.219 0.032 264.2)', textTransform: 'capitalize', margin: '0 0 4px 0' },
  helpText: { fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' },
  dangerBtn: { padding: '8px 14px', border: '1px solid oklch(0.577 0.245 27.325)', color: 'oklch(0.577 0.245 27.325)', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' },
  planCard: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', textAlign: 'center' },
  planLabel: { fontSize: '13px', fontWeight: '700', color: 'oklch(0.7 0.184 33.5)', marginBottom: '6px' },
  planPrice: { fontSize: '16px', fontWeight: '700', color: 'oklch(0.219 0.032 264.2)', marginBottom: '10px' },
  primaryBtn: { width: '100%', padding: '8px', border: 'none', backgroundColor: 'oklch(0.7 0.184 33.5)', color: '#fff', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '8px', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '8px', fontSize: '13px', borderBottom: '1px solid #f3f4f6' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' },
};
