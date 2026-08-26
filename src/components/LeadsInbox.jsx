import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires GET /api/v1/dashboard/leads + PATCH /api/v1/dashboard/leads/:id/status
// — previously no UI at all despite this being the core promise of the
// product ("every lead saved automatically, ranked by interest").
const STATUS_FILTERS = ['all', 'new', 'contacted', 'qualified', 'closed', 'lost'];
const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'closed', 'lost'];

export default function LeadsInbox() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async (status) => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/dashboard/leads', { params: status !== 'all' ? { status } : {} });
      setLeads(res.data.leads || []);
      setCounts(res.data.counts || {});
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(filter); }, [filter, fetchLeads]);

  const updateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/v1/dashboard/leads/${id}/status`, { status });
      fetchLeads(filter);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update lead.');
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>Leads</h2>
          <p style={styles.pageSub}>Every buyer who's shared a number, ranked hottest first.</p>
        </header>

        <div style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
            >
              {f[0].toUpperCase() + f.slice(1)} {counts[f] !== undefined ? `(${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading && <p style={styles.emptyText}>Loading…</p>}
        {error && <p style={styles.errorText}>{error}</p>}

        {!loading && !error && leads.length === 0 && (
          <p style={styles.emptyText}>No leads in this view yet.</p>
        )}

        {!loading && !error && leads.length > 0 && (
          <div style={styles.list}>
            {leads.map((lead) => (
              <div key={lead.id} style={styles.leadCard}>
                <div style={styles.leadTop}>
                  <div>
                    <span style={styles.leadName}>{lead.name || 'Unnamed lead'}</span>
                    <span style={styles.leadPhone}>{lead.phone}</span>
                  </div>
                  <span style={styles.scoreBadge}>🔥 {lead.score}</span>
                </div>
                {lead.listing && (
                  <div style={styles.leadListing}>
                    Interested in: <strong>{lead.listing.title}</strong> — {lead.listing.address}
                  </div>
                )}
                <div style={styles.leadMeta}>
                  <span>Source: {lead.source}</span>
                  <span>{new Date(lead.created_at).toLocaleString()}</span>
                </div>
                <div style={styles.leadActions}>
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    style={styles.statusSelect}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.waBtn}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { borderBottom: '1px solid #eaeaea', paddingBottom: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  pageSub: { margin: '4px 0 0 0', color: '#666', fontSize: '14px' },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#4b5563' },
  filterBtnActive: { backgroundColor: 'oklch(0.7 0.184 33.5)', color: '#fff', borderColor: 'oklch(0.7 0.184 33.5)' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  leadCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px' },
  leadTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { fontWeight: '700', fontSize: '14px', color: 'oklch(0.219 0.032 264.2)', marginRight: '10px' },
  leadPhone: { fontSize: '13px', color: '#6b7280' },
  scoreBadge: { fontSize: '12px', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 10px', borderRadius: '12px' },
  leadListing: { fontSize: '13px', color: '#374151', marginTop: '8px' },
  leadMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', marginTop: '8px' },
  leadActions: { display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' },
  statusSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' },
  waBtn: { padding: '6px 12px', borderRadius: '6px', backgroundColor: 'oklch(0.6 0.13 178.5)', color: '#fff', fontSize: '12px', fontWeight: '600', textDecoration: 'none' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' },
  errorText: { color: 'oklch(0.577 0.245 27.325)', fontSize: '13px' },
};
