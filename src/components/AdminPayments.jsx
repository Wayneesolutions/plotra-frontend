import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Super-admin "Payments" tab — agent package payments (backend: PR 2,
 * already live). Two screens: pending receipts (review queue) and all
 * agents' payment status (roster view). Self-contained like OpsPanel.jsx —
 * own data fetching, own toast calls up to the parent (showToast prop,
 * same as every other AdminPanel.jsx tab) — but styled to match
 * AdminPanel.jsx's OWN super-admin theme (gold/navy, not OpsPanel's
 * separate "WayneState Pro" charcoal/stone theme), since this tab lives
 * in the super-admin section, not the dealer ops one. Token values below
 * (colors, radii, spacing) are copied from AdminPanel.jsx's `S` object,
 * not re-derived — kept in lockstep by eye, not by import, same as how
 * OpsPanel.jsx already keeps its own independent copy rather than
 * threading a shared style module through every tab component.
 */

const STATUS_COLORS = {
  paid:            { background: '#f0fdf4', color: '#15803d' },
  unpaid:          { background: '#fff5f5', color: '#dc2626' },
  pending_review:  { background: '#fef3c7', color: '#92400e' },
};

const STATUS_LABELS = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  pending_review: 'Pending Review',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`;

export default function AdminPayments({ showToast }) {
  const [subTab, setSubTab] = useState('pending'); // 'pending' | 'agents'

  // Screen 1 — Pending Receipts
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // submission id being approved/rejected
  const [rejectTarget, setRejectTarget] = useState(null);   // submission being rejected (reason modal)
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);     // receipt photo shown full-size

  // Screen 2 — All Agents Payment Status
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDueDate, setSortByDueDate] = useState(true);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/payment-submissions?status=pending');
      setPending(res.data.submissions || []);
    } catch {
      showToast('Failed to load pending receipts.', 'error');
    } finally {
      setPendingLoading(false);
    }
  }, [showToast]);

  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/agents-payments');
      setAgents(res.data.agents || []);
    } catch {
      showToast('Failed to load agents.', 'error');
    } finally {
      setAgentsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (subTab === 'pending') fetchPending();
    if (subTab === 'agents') fetchAgents();
  }, [subTab, fetchPending, fetchAgents]);

  const handleApprove = async (submission) => {
    setActionLoading(submission.id);
    try {
      await apiClient.patch(`/api/v1/admin/payment-submissions/${submission.id}/approve`);
      setPending((prev) => prev.filter((p) => p.id !== submission.id));
      showToast(`Approved ${submission.agent_name}'s payment.`);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to approve.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (submission) => {
    setRejectTarget(submission);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await apiClient.patch(`/api/v1/admin/payment-submissions/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setPending((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      showToast(`Rejected ${rejectTarget.agent_name}'s receipt.`);
      setRejectTarget(null);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to reject.', 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  const filteredAgents = agents
    .filter((a) => !statusFilter || a.payment_status === statusFilter)
    .sort((a, b) => {
      if (!sortByDueDate) return 0;
      return new Date(a.next_due_date) - new Date(b.next_due_date);
    });

  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <div>
          <h1 style={S.pageTitle}>Payments</h1>
          <p style={S.pageSubtitle}>Agent package payments, receipt review, and subscription status</p>
        </div>
        <button style={S.refreshBtn} onClick={() => (subTab === 'pending' ? fetchPending() : fetchAgents())}>
          Refresh
        </button>
      </div>

      {/* Sub-nav — two screens within this one tab */}
      <div style={S.subNav}>
        <button
          style={{ ...S.subNavBtn, ...(subTab === 'pending' ? S.subNavBtnActive : {}) }}
          onClick={() => setSubTab('pending')}
        >
          Pending Receipts{pending.length > 0 ? ` (${pending.length})` : ''}
        </button>
        <button
          style={{ ...S.subNavBtn, ...(subTab === 'agents' ? S.subNavBtnActive : {}) }}
          onClick={() => setSubTab('agents')}
        >
          All Agents
        </button>
      </div>

      {/* ── Screen 1: Pending Receipts ─────────────────────── */}
      {subTab === 'pending' && (
        pendingLoading ? (
          <div style={S.empty}>Loading…</div>
        ) : pending.length === 0 ? (
          <div style={S.emptyCard}>
            <div style={S.emptyIcon}>🧾</div>
            <p style={S.emptyText}>No pending receipts</p>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Agent', 'Package', 'Amount', 'Submitted', 'Receipt', ''].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={S.tenantName}>{p.agent_name}</div>
                      <div style={S.subText}>{p.agent_phone} · {p.tenant_business_name}</div>
                    </td>
                    <td style={S.td}>{p.package_name || '—'}</td>
                    <td style={S.td}>{fmtAmount(p.amount_inr ?? p.package_amount_inr)}</td>
                    <td style={S.td}>{fmtDate(p.submitted_at)}</td>
                    <td style={S.td}>
                      {p.receipt_photo_url ? (
                        <img
                          src={p.receipt_photo_url}
                          alt="Payment receipt"
                          style={S.thumbnail}
                          onClick={() => setLightboxUrl(p.receipt_photo_url)}
                        />
                      ) : '—'}
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{ ...S.approveBtn, opacity: actionLoading === p.id ? 0.6 : 1 }}
                          disabled={actionLoading === p.id}
                          onClick={() => handleApprove(p)}
                        >
                          {actionLoading === p.id ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          style={{ ...S.rejectBtn, opacity: actionLoading === p.id ? 0.6 : 1 }}
                          disabled={actionLoading === p.id}
                          onClick={() => openReject(p)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Screen 2: All Agents Payment Status ────────────── */}
      {subTab === 'agents' && (
        <>
          <div style={S.filterRow}>
            <select style={S.formInputCompact} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending_review">Pending Review</option>
            </select>
            <button
              style={{ ...S.refreshBtn, ...(sortByDueDate ? S.sortBtnActive : {}) }}
              onClick={() => setSortByDueDate((v) => !v)}
              title="Sort by next due date"
            >
              {sortByDueDate ? '↑ Sorted by next due date' : 'Sort by next due date'}
            </button>
          </div>

          {agentsLoading ? (
            <div style={S.empty}>Loading…</div>
          ) : filteredAgents.length === 0 ? (
            <div style={S.emptyCard}>
              <div style={S.emptyIcon}>👤</div>
              <p style={S.emptyText}>No agents match this filter</p>
            </div>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Agent', 'Package', 'Last Payment', 'Next Due', 'Status', 'Can Add Listing'].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((a) => (
                    <tr key={a.id} style={S.tr}>
                      <td style={S.td}>
                        <div style={S.tenantName}>{a.name}</div>
                        <div style={S.subText}>{a.phone} · {a.tenant_business_name}</div>
                      </td>
                      <td style={S.td}>{a.package_name || '—'}</td>
                      <td style={S.td}>{fmtDate(a.last_payment_date)}</td>
                      <td style={S.td}>{fmtDate(a.next_due_date)}</td>
                      <td style={S.td}>
                        <span style={{ ...S.statusBadge, ...(STATUS_COLORS[a.payment_status] || STATUS_COLORS.unpaid) }}>
                          {STATUS_LABELS[a.payment_status] || a.payment_status}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.statusBadge, ...(a.can_add_listing ? STATUS_COLORS.paid : STATUS_COLORS.unpaid) }}>
                          {a.can_add_listing ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Receipt lightbox */}
      {lightboxUrl && (
        <div style={S.modalOverlay} onClick={() => setLightboxUrl(null)}>
          <div style={S.lightboxBody} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Payment receipt full size" style={S.lightboxImg} />
            <button style={S.modalClose} onClick={() => setLightboxUrl(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectTarget && (
        <div style={S.modalOverlay} onClick={() => !rejectLoading && setRejectTarget(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalStripe} />
            <div style={S.modalBody}>
              <div style={S.modalIcon}>❌</div>
              <h3 style={S.modalTitle}>Reject Receipt</h3>
              <p style={S.modalSub}>
                Rejecting <strong>{rejectTarget.agent_name}</strong>'s receipt — they'll be notified to resubmit.
              </p>
              <textarea
                style={S.formTextarea}
                placeholder="Reason (optional) — e.g. blurry photo, wrong amount"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '20px' }}>
                <button style={{ ...S.planEditBtn, flex: 1 }} disabled={rejectLoading} onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button style={{ ...S.rejectBtnSolid, flex: 1, opacity: rejectLoading ? 0.7 : 1 }} disabled={rejectLoading} onClick={handleReject}>
                  {rejectLoading ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Copied from AdminPanel.jsx's `S` object (same super-admin theme) plus a
// handful of new tokens this tab needs (subNav, thumbnail, lightbox,
// textarea, solid reject button for the modal's filled variant) built in
// the same visual language — see file docstring above.
const S = {
  section: { padding: '36px 40px' },
  sectionHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 6px 0' },
  pageSubtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  refreshBtn: {
    padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },

  subNav: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' },
  subNavBtn: {
    padding: '10px 4px', marginBottom: '-1px', border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    marginRight: '20px',
  },
  subNavBtnActive: { color: '#c8a96e', borderBottom: '2px solid #c8a96e' },

  filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' },
  formInputCompact: {
    padding: '9px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0',
    borderRadius: '9px', color: '#0c1b2e', backgroundColor: '#fff', cursor: 'pointer',
  },
  sortBtnActive: { borderColor: '#c8a96e', color: '#c8a96e' },

  empty: { color: '#94a3b8', fontSize: '14px', padding: '40px 0', textAlign: 'center' },
  emptyCard: { background: '#fff', borderRadius: '16px', padding: '56px 32px', textAlign: 'center', border: '1px solid #e2e8f0' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },

  tableWrap: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#334155' },
  tenantName: { fontWeight: '600', color: '#0c1b2e' },
  subText: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  statusBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },

  thumbnail: {
    width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover',
    border: '1px solid #e2e8f0', cursor: 'pointer',
  },

  approveBtn: {
    padding: '8px 16px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px',
    fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.30)',
  },
  rejectBtn: {
    padding: '8px 16px', background: '#fff', color: '#dc2626',
    border: '1.5px solid #fca5a5', borderRadius: '8px',
    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
  },
  rejectBtnSolid: {
    padding: '12px 20px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px',
    fontWeight: '700', cursor: 'pointer',
  },
  planEditBtn: {
    padding: '12px 20px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    background: '#f8fafc', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: '100%', maxWidth: '440px', backgroundColor: '#fff',
    borderRadius: '20px', overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(12,27,46,0.25)',
  },
  modalStripe: { height: '4px', background: 'linear-gradient(90deg, #dc2626 0%, #f87171 50%, #dc2626 100%)' },
  modalBody: { padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  modalIcon: { fontSize: '36px', marginBottom: '16px' },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 10px 0' },
  modalSub: { fontSize: '14px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.6' },
  modalClose: {
    padding: '12px 36px', background: 'linear-gradient(135deg, #0c1b2e, #1a3558)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer', marginTop: '16px',
  },
  formTextarea: {
    width: '100%', padding: '12px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd',
    boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
  },

  lightboxBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    maxWidth: '90vw', maxHeight: '90vh',
  },
  lightboxImg: {
    maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)', objectFit: 'contain',
  },
};
