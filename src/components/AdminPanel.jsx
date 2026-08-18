import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires the entire /api/v1/admin/* surface — previously 0% covered by the
// frontend. Onboarding a dealer (the product's whole reason to exist) was
// only possible via a raw API call before this existed.
const TABS = ['Requests', 'Tenants', 'Plans', 'Ads'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('Requests');

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Admin</h2>
        <div style={styles.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Requests' && <RequestsTab />}
        {activeTab === 'Tenants' && <TenantsTab />}
        {activeTab === 'Plans' && <PlansTab />}
        {activeTab === 'Ads' && <AdsTab />}
      </div>
    </Layout>
  );
}

// ─── Requests ────────────────────────────────────────────────────────────

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [lastCreated, setLastCreated] = useState(null); // shows the temp password after an approve

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/admin/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const approve = async (id) => {
    setBusyId(id);
    try {
      const res = await apiClient.post(`/api/v1/admin/requests/${id}/approve`);
      setLastCreated(res.data);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve request.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this request?')) return;
    setBusyId(id);
    try {
      await apiClient.post(`/api/v1/admin/requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reject request.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p style={styles.emptyText}>Loading…</p>;
  if (error) return <p style={styles.errorText}>{error}</p>;

  return (
    <div>
      {lastCreated && (
        <div style={styles.successBanner}>
          ✅ Tenant created for <strong>{lastCreated.user.email}</strong>. Temporary password:{' '}
          <code style={styles.codeBadge}>{lastCreated.temporaryPassword}</code>{' '}
          (also emailed automatically, if SMTP is configured).
        </div>
      )}

      {requests.length === 0 ? (
        <p style={styles.emptyText}>No access requests.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Business</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Requested</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.business_name}</td>
                <td style={styles.td}>{r.contact_name}</td>
                <td style={styles.td}>{r.email}</td>
                <td style={styles.td}>{r.phone}</td>
                <td style={styles.td}><StatusPill status={r.status} /></td>
                <td style={styles.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={styles.td}>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button disabled={busyId === r.id} onClick={() => approve(r.id)} style={styles.approveBtn}>Approve</button>
                      <button disabled={busyId === r.id} onClick={() => reject(r.id)} style={styles.rejectBtn}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Tenants ─────────────────────────────────────────────────────────────

function TenantsTab() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTenant, setDetailTenant] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/admin/tenants');
      setTenants(res.data.tenants || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/v1/admin/tenants', form);
      setCreatedCreds(res.data);
      setShowCreate(false);
      setForm({ business_name: '', contact_name: '', email: '', phone: '' });
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/v1/admin/tenants/${id}/status`, { status });
      fetchTenants();
      if (detailTenant?.tenant?.id === id) openDetail(id);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status.');
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await apiClient.get(`/api/v1/admin/tenants/${id}`);
      setDetailTenant(res.data);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to load tenant detail.');
    }
  };

  if (loading) return <p style={styles.emptyText}>Loading…</p>;
  if (error) return <p style={styles.errorText}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>+ Create Tenant Directly</button>
      </div>

      {createdCreds && (
        <div style={styles.successBanner}>
          ✅ Tenant created for <strong>{createdCreds.user.email}</strong>. Temporary password:{' '}
          <code style={styles.codeBadge}>{createdCreds.temporaryPassword}</code>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Business</th>
            <th style={styles.th}>Plan</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Users</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td style={styles.td}>
                <button onClick={() => openDetail(t.id)} style={styles.linkBtn}>{t.business_name}</button>
              </td>
              <td style={styles.td}>{t.plan}</td>
              <td style={styles.td}><StatusPill status={t.status} /></td>
              <td style={styles.td}>{t.user_count}</td>
              <td style={styles.td}>{new Date(t.created_at).toLocaleDateString()}</td>
              <td style={styles.td}>
                {t.status === 'active' ? (
                  <button onClick={() => changeStatus(t.id, 'suspended')} style={styles.rejectBtn}>Suspend</button>
                ) : (
                  <button onClick={() => changeStatus(t.id, 'active')} style={styles.approveBtn}>Reactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tenants.length === 0 && <p style={styles.emptyText}>No tenants yet.</p>}

      {showCreate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Create Tenant Directly</h3>
            <form onSubmit={handleCreate} style={styles.form}>
              <input required placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} style={styles.input} />
              <input required placeholder="Owner contact name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} style={styles.input} />
              <input required type="email" placeholder="Owner email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} />
              <input required placeholder="Owner phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={styles.input} />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreate(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailTenant && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{detailTenant.tenant.businessName}</h3>
              <button onClick={() => setDetailTenant(null)} style={styles.cancelBtn}>Close</button>
            </div>
            <p style={styles.detailLine}>Owner: {detailTenant.owner ? `${detailTenant.owner.name} (${detailTenant.owner.email})` : '—'}</p>
            <p style={styles.detailLine}>Plan: {detailTenant.tenant.planLabel || detailTenant.tenant.plan} · Status: {detailTenant.tenant.status}</p>
            <p style={styles.detailLine}>This month: {detailTenant.usageThisMonth.views} views · {detailTenant.usageThisMonth.leadsCapture} leads · {detailTenant.usageThisMonth.calculatorUses} calculator uses</p>
            <h4 style={{ marginBottom: '6px' }}>Listings ({detailTenant.listings.length})</h4>
            <ul style={styles.plainList}>
              {detailTenant.listings.map((l) => (
                <li key={l.id} style={styles.detailLine}>{l.title} — {l.status} — {l.visit_count} views</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plans ───────────────────────────────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/admin/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const toggleActive = async (plan) => {
    try {
      await apiClient.patch(`/api/v1/admin/plans/${plan.key}`, { is_active: !plan.is_active });
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update plan.');
    }
  };

  const editPrice = async (plan) => {
    const newPrice = window.prompt(`New price (INR/mo) for ${plan.label}:`, plan.price_inr);
    if (!newPrice || Number(newPrice) <= 0) return;
    try {
      await apiClient.patch(`/api/v1/admin/plans/${plan.key}`, { price_inr: Number(newPrice) });
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update plan.');
    }
  };

  if (loading) return <p style={styles.emptyText}>Loading…</p>;

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Plan</th>
          <th style={styles.th}>Price/mo</th>
          <th style={styles.th}>Listing limit</th>
          <th style={styles.th}>Active</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {plans.map((p) => (
          <tr key={p.key}>
            <td style={styles.td}>{p.label} <span style={{ color: '#9ca3af' }}>({p.key})</span></td>
            <td style={styles.td}>₹{p.price_inr}</td>
            <td style={styles.td}>{p.listing_limit ?? 'Unlimited'}</td>
            <td style={styles.td}><StatusPill status={p.is_active ? 'active' : 'suspended'} /></td>
            <td style={styles.td}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => editPrice(p)} style={styles.approveBtn}>Edit price</button>
                <button onClick={() => toggleActive(p)} style={styles.rejectBtn}>{p.is_active ? 'Deactivate' : 'Activate'}</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Ads ─────────────────────────────────────────────────────────────────

const AD_POSITIONS = ['calculator_result', 'listing_sidebar', 'listing_footer'];

function AdsTab() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    advertiser_name: '', position: AD_POSITIONS[0], image_url: '', click_url: '',
    city_filter: '', revenue_model: 'flat_fee', active_from: '', active_to: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/admin/ads');
      setPlacements(res.data.placements || []);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to load ad placements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlacements(); }, [fetchPlacements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/admin/ads', form);
      setShowCreate(false);
      fetchPlacements();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create ad placement.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (placement) => {
    try {
      await apiClient.patch(`/api/v1/admin/ads/${placement.id}`, { is_active: !placement.is_active });
      fetchPlacements();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update ad placement.');
    }
  };

  if (loading) return <p style={styles.emptyText}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>+ New Placement</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Advertiser</th>
            <th style={styles.th}>Position</th>
            <th style={styles.th}>Impressions</th>
            <th style={styles.th}>Clicks</th>
            <th style={styles.th}>Active</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {placements.map((p) => (
            <tr key={p.id}>
              <td style={styles.td}>{p.advertiser_name}</td>
              <td style={styles.td}>{p.position}</td>
              <td style={styles.td}>{p.impressions}</td>
              <td style={styles.td}>{p.clicks}</td>
              <td style={styles.td}><StatusPill status={p.is_active ? 'active' : 'suspended'} /></td>
              <td style={styles.td}>
                <button onClick={() => toggleActive(p)} style={styles.rejectBtn}>{p.is_active ? 'Deactivate' : 'Activate'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {placements.length === 0 && <p style={styles.emptyText}>No ad placements yet.</p>}

      {showCreate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>New Ad Placement</h3>
            <form onSubmit={handleCreate} style={styles.form}>
              <input required placeholder="Advertiser name" value={form.advertiser_name} onChange={(e) => setForm({ ...form, advertiser_name: e.target.value })} style={styles.input} />
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} style={styles.input}>
                {AD_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input required placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={styles.input} />
              <input required placeholder="Click-through URL" value={form.click_url} onChange={(e) => setForm({ ...form, click_url: e.target.value })} style={styles.input} />
              <input placeholder="City filter (optional)" value={form.city_filter} onChange={(e) => setForm({ ...form, city_filter: e.target.value })} style={styles.input} />
              <label style={styles.smallLabel}>Active from</label>
              <input required type="date" value={form.active_from} onChange={(e) => setForm({ ...form, active_from: e.target.value })} style={styles.input} />
              <label style={styles.smallLabel}>Active to</label>
              <input required type="date" value={form.active_to} onChange={(e) => setForm({ ...form, active_to: e.target.value })} style={styles.input} />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreate(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const positive = ['active', 'approved'].includes(status);
  const negative = ['suspended', 'churned', 'rejected'].includes(status);
  const bg = positive ? '#e8f5e9' : negative ? '#fef2f2' : '#fff3e0';
  const color = positive ? '#2e7d32' : negative ? '#991b1b' : '#ef6c00';
  return <span style={{ ...styles.statusBadge, backgroundColor: bg, color }}>{status}</span>;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  tabRow: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb' },
  tabBtn: { padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid transparent' },
  tabBtnActive: { color: '#2563eb', borderBottom: '2px solid #2563eb' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
  th: { textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  td: { padding: '10px 12px', fontSize: '13px', color: '#111827', borderBottom: '1px solid #f3f4f6' },
  statusBadge: { fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' },
  errorText: { color: '#dc2626', fontSize: '13px' },
  successBanner: { backgroundColor: '#f0fdf4', color: '#166534', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' },
  codeBadge: { backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' },
  approveBtn: { padding: '6px 10px', border: '1px solid #16a34a', color: '#16a34a', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  rejectBtn: { padding: '6px 10px', border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  primaryBtn: { padding: '9px 16px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  linkBtn: { border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'underline', padding: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  smallLabel: { fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '-6px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
  cancelBtn: { padding: '8px 16px', border: 'none', backgroundColor: '#eee', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  detailLine: { fontSize: '13px', color: '#4b5563', margin: '4px 0' },
  plainList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
};
