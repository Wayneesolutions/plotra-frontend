import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires GET /api/v1/dashboard/analytics — fully built server-side
// (KPIs, per-listing performance, recent scored leads), no page rendered it.
export default function Analytics({ bare = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return bare ? <p style={styles.emptyText}>Loading…</p> : <Layout><p style={styles.emptyText}>Loading…</p></Layout>;
  if (error) return bare ? <p style={styles.errorText}>{error}</p> : <Layout><p style={styles.errorText}>{error}</p></Layout>;

  const content = (
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
  );

  return bare ? content : <Layout>{content}</Layout>;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  pageTitle: { margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0c1b2e' },

  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' },
  statCard: {
    backgroundColor: '#fff', border: '1px solid #e8edf4',
    borderRadius: '12px', padding: '20px 18px',
    boxShadow: '0 2px 8px rgba(12,27,46,0.06)',
  },
  statValue: { fontSize: '28px', fontWeight: '900', color: '#0c1b2e', lineHeight: 1 },
  statLabel: {
    fontSize: '11px', color: '#94a3b8', marginTop: '6px',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
  },

  sectionTitle: {
    fontSize: '13px', fontWeight: '800', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.7px',
    margin: '4px 0 10px 0',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    backgroundColor: '#fff', border: '1px solid #e8edf4',
    borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(12,27,46,0.06)',
  },
  th: {
    textAlign: 'left', fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.6px',
    color: '#94a3b8', padding: '12px 16px',
    borderBottom: '1px solid #e8edf4', backgroundColor: '#f8fafd',
  },
  td: {
    padding: '12px 16px', fontSize: '13px', color: '#1e293b',
    fontWeight: '500', borderBottom: '1px solid #f1f5f9',
  },
  emptyText: {
    textAlign: 'center', padding: '40px 24px',
    color: '#94a3b8', fontStyle: 'italic', fontSize: '13px',
  },
  errorText: { color: '#dc2626', fontSize: '13px' },
};
