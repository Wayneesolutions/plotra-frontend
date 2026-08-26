import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const PLAN_OPTIONS = ['starter', 'growth', 'unlimited'];

export default function TenantDetailModal({ tenantId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(false);
  const [planPick, setPlanPick] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return apiClient
      .get(`/api/v1/admin/tenants/${tenantId}`)
      .then((r) => {
        setData(r.data);
        setPlanPick(r.data.tenant.plan);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load tenant.'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusToggle = async () => {
    const next = data.tenant.status === 'suspended' ? 'active' : 'suspended';
    setActioning(true);
    try {
      await apiClient.patch(`/api/v1/admin/tenants/${tenantId}/status`, { status: next });
      await load();
      onChanged?.();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setActioning(false);
    }
  };

  const handlePlanChange = async () => {
    if (planPick === data.tenant.plan) return;
    setActioning(true);
    try {
      await apiClient.patch(`/api/v1/admin/tenants/${tenantId}/plan`, { plan: planPick });
      await load();
      onChanged?.();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update plan.');
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />
        {loading ? (
          <div style={S.loading}>Loading…</div>
        ) : error ? (
          <div style={{ padding: '30px 26px' }}>
            <div style={S.banner}>{error}</div>
            <button onClick={onClose} style={S.cancelBtn}>Close</button>
          </div>
        ) : (
          <>
            <div style={S.head}>
              <div>
                <p style={S.eyebrow}>Tenant Detail</p>
                <h3 style={S.title}>
                  {data.tenant.businessName}{' '}
                  <span style={{ ...S.statusPill, ...(data.tenant.status === 'active' ? S.statusActive : S.statusOther) }}>
                    {data.tenant.status.toUpperCase()}
                  </span>
                </h3>
              </div>
              <button onClick={onClose} style={S.closeBtn}>✕</button>
            </div>

            <div style={S.body}>
              <div style={S.infoGrid}>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Plan</div>
                  <div style={S.infoVal}>{data.tenant.planLabel || data.tenant.plan} {data.tenant.planPriceINR ? `— ₹${data.tenant.planPriceINR.toLocaleString('en-IN')}/mo` : ''}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Owner Email</div>
                  <div style={S.infoVal}>{data.owner?.email || '—'}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Joined</div>
                  <div style={S.infoVal}>{new Date(data.tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Total Listings</div>
                  <div style={S.infoVal}>{data.listings.length} {data.listings.filter(l => l.status === 'active').length !== data.listings.length ? `(${data.listings.filter(l => l.status === 'active').length} active)` : 'active'}</div>
                </div>
              </div>

              <div style={S.usageCard}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: '#0c1b2e' }}>Usage This Month</div>
                <div style={S.usageGrid}>
                  <div>
                    <div style={S.infoLabel}>Listing Views</div>
                    <div style={S.infoVal}>{data.usageThisMonth.views}</div>
                  </div>
                  <div>
                    <div style={S.infoLabel}>Leads Captured</div>
                    <div style={S.infoVal}>{data.usageThisMonth.leadsCapture}</div>
                  </div>
                  <div>
                    <div style={S.infoLabel}>Calculator Uses</div>
                    <div style={S.infoVal}>{data.usageThisMonth.calculatorUses}</div>
                  </div>
                </div>
              </div>

              {data.listings.length > 0 && (
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Listing', 'Price', 'Status', 'Visits'].map((h) => <th key={h} style={S.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.listings.map((l) => (
                        <tr key={l.id}>
                          <td style={S.td}>{l.title} — {l.raw_address}</td>
                          <td style={S.td}>₹{parseFloat(l.price).toLocaleString('en-IN')}</td>
                          <td style={S.td}>
                            <span style={{ ...S.statusPill, ...(l.status === 'active' ? S.statusActive : S.statusOther) }}>
                              {l.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={S.td}>{l.visit_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={S.actionsRow}>
                <button onClick={handleStatusToggle} disabled={actioning} style={S.dangerOrDarkBtn(data.tenant.status)}>
                  {actioning ? 'Working…' : data.tenant.status === 'suspended' ? 'Reactivate Tenant' : 'Suspend Tenant'}
                </button>
                <select value={planPick} onChange={(e) => setPlanPick(e.target.value)} style={S.planSelect}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <button onClick={handlePlanChange} disabled={actioning || planPick === data.tenant.plan} style={S.goldBtn}>
                  Change Plan
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: '20px', backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '720px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden', maxHeight: '88vh', overflowY: 'auto',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  loading: { padding: '60px', textAlign: 'center', color: '#94a3b8' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.2px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#0c1b2e', display: 'flex', alignItems: 'center', gap: '10px' },
  closeBtn: { width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', flexShrink: 0 },
  banner: { margin: '0 0 16px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' },
  body: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  infoItem: { background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(12,27,46,0.06)' },
  infoLabel: { fontSize: '10.5px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '4px' },
  infoVal: { fontSize: '14px', fontWeight: '700', color: '#0c1b2e' },
  usageCard: { background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 2px 10px rgba(12,27,46,0.06)' },
  usageGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  tableWrap: { overflowX: 'auto', border: '1px solid #eef2f7', borderRadius: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#0c1b2e' },
  statusPill: { fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '999px' },
  statusActive: { backgroundColor: '#dcfce7', color: '#166534' },
  statusOther: { backgroundColor: '#fef3c7', color: '#92400e' },
  actionsRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  dangerOrDarkBtn: (status) => ({
    padding: '10px 16px', borderRadius: '9px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    background: status === 'suspended' ? '#0c1b2e' : '#fee2e2',
    color: status === 'suspended' ? '#fff' : '#b91c1c',
  }),
  planSelect: { fontSize: '13px', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #e2e8f0', color: '#0c1b2e', background: '#fff' },
  goldBtn: { padding: '10px 16px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, #c8a96e, #e8c98e)', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  cancelBtn: { marginTop: '14px', padding: '10px 16px', borderRadius: '9px', border: 'none', background: '#f1f5f9', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};
