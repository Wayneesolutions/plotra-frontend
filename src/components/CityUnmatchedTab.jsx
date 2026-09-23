import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function CityUnmatchedTab({ cityId, showToast, onCountChange, onNewArea }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [assignTarget, setAssignTarget] = useState(null);
  const [assignLocalityId, setAssignLocalityId] = useState('');
  const [saveAsAlias, setSaveAsAlias] = useState(true);
  const [aliasText, setAliasText] = useState('');
  const [assignAreas, setAssignAreas] = useState([]); // for the searchable select's option list
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/cities/${cityId}/unmatched`, { params: { status: 'pending' } });
      const list = (Array.isArray(res.data) ? res.data : (res.data.unmatched || res.data.rows || [])).map((r) => ({
        ...r,
        // backend returns locality_unmatched rows as-is: raw_text + suggested_confidence
        dealer_text: r.dealer_text ?? r.raw_text,
        confidence: r.confidence ?? (r.suggested_confidence != null ? Number(r.suggested_confidence) : null),
      }));
      setRows(list);
      onCountChange?.(list.length);
    } catch {
      showToast('Failed to load unmatched queue.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const fetchAssignAreas = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/admin/cities/${cityId}/localities`, { params: { status: 'active' } });
      setAssignAreas(Array.isArray(res.data) ? res.data : (res.data.localities || res.data.rows || []));
    } catch { /* non-fatal — select just stays empty */ }
  }, [cityId]);

  const openAssign = (row) => {
    setAssignTarget(row);
    setAssignLocalityId(row.suggested_locality_id || '');
    setSaveAsAlias(true);
    setAliasText(row.dealer_text || row.text || '');
    fetchAssignAreas();
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignLocalityId) return;
    setAssignLoading(true);
    try {
      const payload = { locality_id: assignLocalityId };
      if (saveAsAlias && aliasText.trim()) payload.alias_phrase = aliasText.trim();
      await apiClient.post(`/api/v1/admin/unmatched/${assignTarget.id}/resolve`, payload);
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== assignTarget.id);
        onCountChange?.(next.length);
        return next;
      });
      showToast('Resolved.');
      setAssignTarget(null);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to resolve.', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleIgnore = async (row) => {
    setActionLoading(row.id);
    try {
      await apiClient.post(`/api/v1/admin/unmatched/${row.id}/ignore`);
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== row.id);
        onCountChange?.(next.length);
        return next;
      });
      showToast('Ignored.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to ignore.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div style={S.headRow}>
        <p style={S.hint}>Dealer-typed address text the auto-matcher couldn't confidently resolve — assign it to an area, spin up a new one, or ignore it.</p>
        <button style={S.refreshBtn} onClick={fetchRows}>Refresh</button>
      </div>

      {loading ? (
        <div style={S.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={S.emptyIcon}>✓</div>
          <p style={S.emptyText}>Nothing unmatched right now.</p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{['Dealer text', 'Times seen', 'Suggested area', 'Listing', 'Last seen', ''].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={S.tr}>
                  <td style={S.td}>"{r.dealer_text || r.text}"</td>
                  <td style={S.td}>{r.seen_count ?? 1}</td>
                  <td style={S.td}>
                    {r.suggested_name ? (
                      <>{r.suggested_name} {r.confidence != null && <span style={S.confidence}>({Math.round(r.confidence * (r.confidence <= 1 ? 100 : 1))}%)</span>}</>
                    ) : '—'}
                  </td>
                  <td style={S.td}>
                    {r.listing_id ? <a href={`/p/${r.listing_slug || r.listing_id}`} target="_blank" rel="noreferrer" style={S.link}>View</a> : '—'}
                  </td>
                  <td style={S.td}>{fmtDate(r.last_seen_at || r.updated_at)}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.approveBtn} onClick={() => openAssign(r)}>Assign</button>
                      <button style={S.planEditBtn} onClick={() => onNewArea?.(r.dealer_text || r.text)}>New area</button>
                      <button
                        style={{ ...S.rejectBtn, opacity: actionLoading === r.id ? 0.6 : 1 }}
                        disabled={actionLoading === r.id}
                        onClick={() => handleIgnore(r)}
                      >
                        {actionLoading === r.id ? '…' : 'Ignore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign modal */}
      {assignTarget && (
        <div style={S.modalOverlay} onClick={() => !assignLoading && setAssignTarget(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '28px' }}>
              <h3 style={S.modalTitle}>Assign "{assignTarget.dealer_text || assignTarget.text}"</h3>

              <div style={S.formField}>
                <label style={S.formLabel}>Area</label>
                <select style={S.formInput} value={assignLocalityId} onChange={(e) => setAssignLocalityId(e.target.value)}>
                  <option value="">Select an area…</option>
                  {assignAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <label style={S.checkboxRow}>
                <input type="checkbox" checked={saveAsAlias} onChange={(e) => setSaveAsAlias(e.target.checked)} />
                Save this as a spelling for this area
              </label>

              {saveAsAlias && (
                <div style={S.formField}>
                  <label style={S.formLabel}>Spelling text</label>
                  <input style={S.formInput} value={aliasText} onChange={(e) => setAliasText(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={S.planEditBtn} onClick={() => setAssignTarget(null)} disabled={assignLoading}>Cancel</button>
                <button style={{ ...S.createBtn, opacity: assignLoading || !assignLocalityId ? 0.6 : 1 }} disabled={assignLoading || !assignLocalityId} onClick={handleAssign}>
                  {assignLoading ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  headRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' },
  hint: { fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '520px' },
  refreshBtn: { padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: '9px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  empty: { color: '#94a3b8', fontSize: '14px', padding: '40px 0', textAlign: 'center' },
  emptyCard: { background: '#fff', borderRadius: '16px', padding: '56px 32px', textAlign: 'center', border: '1px solid #e2e8f0' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },

  tableWrap: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 16px', fontSize: '13px', color: '#334155' },
  confidence: { color: '#94a3b8', fontSize: '11px' },
  link: { color: '#0c1b2e', fontWeight: '600' },

  approveBtn: { padding: '7px 14px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  rejectBtn: { padding: '7px 14px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  planEditBtn: { padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  createBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  formField: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px' },
  formInput: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', width: '100%' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '14px', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: '20px' },
  modal: { width: '100%', maxWidth: '460px', backgroundColor: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(12,27,46,0.25)' },
  modalTitle: { fontSize: '17px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 18px 0' },
};
