import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Super-admin "Seller Leads" tab — property owners who submitted the public
 * "Sell your property" form. The admin forwards each lead to any active
 * dealer (which also drops it into that dealer's leads inbox) or closes it.
 */

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'closed', label: 'Closed' },
];
const PILL = {
  new:      { background: '#fef3c7', color: '#92400e' },
  assigned: { background: '#f0fdf4', color: '#15803d' },
  closed:   { background: '#f1f5f9', color: '#475569' },
};

export default function AdminSellerLeads({ showToast }) {
  const [filter, setFilter] = useState('new');
  const [leads, setLeads] = useState([]);
  const [byStatus, setByStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [pick, setPick] = useState({}); // leadId -> tenantId
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/seller-leads', { params: filter ? { status: filter } : {} });
      setLeads(res.data.leads || []);
      setByStatus(res.data.byStatus || {});
    } catch {
      showToast('Failed to load seller leads.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiClient.get('/api/v1/admin/tenants')
      .then((r) => setDealers((r.data.tenants || []).filter((t) => (t.status || 'active') === 'active')))
      .catch(() => showToast('Failed to load dealers.', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assign = async (lead) => {
    const tenant_id = pick[lead.id];
    if (!tenant_id) return;
    setBusy(lead.id);
    try {
      await apiClient.patch(`/api/v1/admin/seller-leads/${lead.id}/assign`, { tenant_id });
      showToast('Lead sent to dealer.');
      await load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to assign lead.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (lead, status) => {
    setBusy(lead.id);
    try {
      await apiClient.patch(`/api/v1/admin/seller-leads/${lead.id}`, { status });
      await load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update lead.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Seller Leads</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Owners who want to sell — forward each to the dealer you choose.
          </p>
        </div>
        <button style={S.btn} onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ ...S.btn, ...(filter === f.key ? S.btnActive : {}) }}
          >
            {f.label}{f.key && byStatus[f.key] != null ? ` (${byStatus[f.key]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : leads.length === 0 ? (
        <p style={{ color: '#64748b' }}>No seller leads here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {leads.map((l) => (
            <div key={l.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>{l.name} · {l.phone}{l.email ? ` · ${l.email}` : ''}</div>
                <span style={{ ...S.pill, ...(PILL[l.status] || {}) }}>{l.status}</span>
              </div>
              <div style={S.meta}>
                {[l.property_type, l.size_text, [l.locality, l.city].filter(Boolean).join(', '), l.expected_price && `Expects ${l.expected_price}`]
                  .filter(Boolean).join(' · ') || 'No property details given'}
              </div>
              {l.description && <div style={{ ...S.meta, color: '#334155' }}>{l.description}</div>}
              <div style={S.meta}>Received {new Date(l.created_at).toLocaleString()}</div>
              {l.status === 'assigned' && (
                <div style={{ ...S.meta, color: '#15803d' }}>
                  Sent to {l.assigned_tenant_name || 'dealer'}{l.assigned_at ? ` on ${new Date(l.assigned_at).toLocaleDateString()}` : ''}
                </div>
              )}

              {l.status !== 'closed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <select
                    value={pick[l.id] || ''}
                    onChange={(e) => setPick((p) => ({ ...p, [l.id]: e.target.value }))}
                    style={S.select}
                  >
                    <option value="">{l.status === 'assigned' ? 'Reassign to dealer…' : 'Send to dealer…'}</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>{d.businessName || d.business_name}</option>
                    ))}
                  </select>
                  <button
                    style={{ ...S.btn, ...S.btnActive, opacity: pick[l.id] ? 1 : 0.5 }}
                    disabled={!pick[l.id] || busy === l.id}
                    onClick={() => assign(l)}
                  >
                    {busy === l.id ? 'Working…' : 'Send'}
                  </button>
                  <button style={S.btn} disabled={busy === l.id} onClick={() => setStatus(l, 'closed')}>Close</button>
                </div>
              )}
              {l.status === 'closed' && (
                <div style={{ marginTop: 12 }}>
                  <button style={S.btn} disabled={busy === l.id} onClick={() => setStatus(l, 'new')}>Reopen</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const S = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  pill: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999 },
  btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnActive: { background: '#0c1b2e', color: '#fff', borderColor: '#0c1b2e' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 220 },
};
