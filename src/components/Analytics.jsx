import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires GET /api/v1/dashboard/analytics — fully built server-side
// (KPIs, per-listing performance, recent scored leads), no page rendered it.
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p style={styles.emptyText}>Loading…</p></Layout>;
  if (error) return <Layout><p style={styles.errorText}>{error}</p></Layout>;

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Analytics</h2>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{data.summary.activeInventory}</div>
            <div style={styles.statLabel}>Active Listings</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{data.summary.capturedLeads}</div>
            <div style={styles.statLabel}>Leads Captured</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{data.summary.totalStorefrontViews}</div>
            <div style={styles.statLabel}>Storefront Views</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{data.summary.overallConversionRate}%</div>
            <div style={styles.statLabel}>Conversion Rate</div>
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Per-Listing Performance</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Listing</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Views</th>
              <th style={styles.th}>Converted Leads</th>
            </tr>
          </thead>
          <tbody>
            {data.propertyPerformance.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{p.title}</td>
                <td style={styles.td}>{p.status}</td>
                <td style={styles.td}>{p.total_views}</td>
                <td style={styles.td}>{p.converted_leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.propertyPerformance.length === 0 && <p style={styles.emptyText}>No listings yet.</p>}

        <h3 style={styles.sectionTitle}>Recent Leads</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentLeads.map((l) => (
              <tr key={l.id}>
                <td style={styles.td}>{l.name || '—'}</td>
                <td style={styles.td}>{l.phone}</td>
                <td style={styles.td}>{l.score}</td>
                <td style={styles.td}>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.recentLeads.length === 0 && <p style={styles.emptyText}>No leads yet.</p>}
      </div>
    </Layout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' },
  statCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  statValue: { fontSize: '24px', fontWeight: '800', color: 'oklch(0.219 0.032 264.2)' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  sectionTitle: { fontSize: '15px', color: '#374151', margin: '8px 0 4px 0' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
  th: { textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  td: { padding: '10px 12px', fontSize: '13px', color: 'oklch(0.219 0.032 264.2)', borderBottom: '1px solid #f3f4f6' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' },
  errorText: { color: 'oklch(0.577 0.245 27.325)', fontSize: '13px' },
};
