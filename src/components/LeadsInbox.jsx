import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires GET /api/v1/dashboard/leads + PATCH /api/v1/dashboard/leads/:id/status
// — previously no UI at all despite this being the core promise of the
// product ("every lead saved automatically, ranked by interest").
const STATUS_FILTERS = ['all', 'new', 'contacted', 'qualified', 'closed', 'lost'];
const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'closed', 'lost'];

export default function LeadsInbox({ bare = false }) {
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

  const content = (
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
  );

  return bare ? content : <Layout>{content}</Layout>;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { marginBottom: '4px' },
  pageTitle: { margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0c1b2e' },
  pageSub: { margin: 0, color: '#64748b', fontSize: '13px' },

  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '7px 14px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    cursor: 'pointer', fontSize: '12px', fontWeight: '700',
    color: '#64748b', transition: 'all 0.12s',
  },
  filterBtnActive: {
    backgroundColor: '#0c1b2e', color: '#c8a96e',
    borderColor: '#0c1b2e',
  },

  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  leadCard: {
    backgroundColor: '#fff',
    border: '1px solid #e8edf4',
    borderLeft: '4px solid #c8a96e',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(12,27,46,0.06)',
  },
  leadTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  leadName: { fontWeight: '800', fontSize: '15px', color: '#0c1b2e', marginRight: '10px' },
  leadPhone: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  scoreBadge: {
    fontSize: '12px', fontWeight: '800', color: '#92702f',
    backgroundColor: '#fef3c7', padding: '4px 12px',
    borderRadius: '20px', border: '1px solid #fde68a',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  leadListing: {
    fontSize: '13px', color: '#374151',
    backgroundColor: '#f8fafd', borderRadius: '6px',
    padding: '7px 10px', marginBottom: '8px',
  },
  leadMeta: { display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.2px' },
  leadActions: { display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  statusSelect: {
    padding: '7px 10px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', fontSize: '12px',
    fontWeight: '600', color: '#0c1b2e', backgroundColor: '#fafbfd',
  },
  waBtn: {
    padding: '7px 14px', borderRadius: '8px',
    backgroundColor: '#16a34a', color: '#fff',
    fontSize: '12px', fontWeight: '700', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
  },
  emptyText: {
    textAlign: 'center', padding: '48px 24px',
    color: '#94a3b8', fontStyle: 'italic', fontSize: '14px',
  },
  errorText: { color: '#dc2626', fontSize: '13px' },
};
