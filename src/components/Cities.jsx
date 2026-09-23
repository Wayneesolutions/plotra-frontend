import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import CityDetail from './CityDetail.jsx';
import { CityCenterPickerMap } from './AreaMapCircles.jsx';

/**
 * "Cities & Areas" — super-admin tab (PLATFORM MANAGEMENT section), built
 * against plotra-backend PR #41 (feature/cities-locality-master, not yet
 * merged). Self-contained like AdminPayments.jsx — own fetching, own local
 * `S` tokens copied from AdminPanel.jsx's own object, showToast passed down
 * from the root toast instance. List ↔ detail is local useState, not a
 * route, matching how the rest of the admin panel already navigates.
 */

const STATUS_BADGE = {
  draft: { background: '#fef3c7', color: '#92400e', label: 'Draft' },
  live: { background: '#f0fdf4', color: '#15803d', label: 'Live' },
  disabled: { background: '#fff5f5', color: '#dc2626', label: 'Disabled' },
};

const emptyAddForm = { name: '', state: '', center_lat: null, center_lng: null, bounds_radius_km: 25 };

export default function Cities({ showToast }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addError, setAddError] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const fetchCities = useCallback(async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/cities', { params: status ? { status } : {} });
      setCities(res.data.cities || []);
    } catch {
      showToast('Failed to load cities.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => { if (!selectedCityId) fetchCities(); }, [selectedCityId, fetchCities]);

  const openAddModal = () => {
    setAddForm(emptyAddForm);
    setAddError(null);
    setShowAddModal(true);
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();
    if (addForm.center_lat == null || addForm.center_lng == null) {
      setAddError('Click the map to set the city centre first.');
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const payload = {
        name: addForm.name,
        state: addForm.state,
        center_lat: Number(addForm.center_lat),
        center_lng: Number(addForm.center_lng),
        bounds_radius_km: Number(addForm.bounds_radius_km) || 25,
      };
      await apiClient.post('/api/v1/admin/cities', payload);
      setShowAddModal(false);
      showToast('City created as Draft.');
      fetchCities();
    } catch (err) {
      const e2 = err.response?.data?.error;
      setAddError(e2?.message || 'Failed to create city.');
    } finally {
      setAddLoading(false);
    }
  };

  if (selectedCityId) {
    return (
      <CityDetail
        cityId={selectedCityId}
        showToast={showToast}
        onBack={() => setSelectedCityId(null)}
      />
    );
  }

  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <div>
          <h1 style={S.pageTitle}>Cities &amp; Areas</h1>
          <p style={S.pageSubtitle}>Multi-city locality master — Draft → Live cities, each with its own areas, unmatched queue, and CSV import</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select style={S.formInputCompact} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchCities(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="disabled">Disabled</option>
          </select>
          <button style={S.refreshBtn} onClick={() => fetchCities()}>Refresh</button>
          <button style={S.createBtn} onClick={openAddModal}>+ Add city</button>
        </div>
      </div>

      {loading ? (
        <div style={S.empty}>Loading…</div>
      ) : cities.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={S.emptyIcon}>🏙️</div>
          <p style={S.emptyText}>No cities yet. Add one to start building its locality master.</p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['City', 'State', 'Status', 'Areas', 'Verified', 'Listings', 'Pending unmatched', ''].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => {
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                const pct = c.verified_pct != null ? Math.round(c.verified_pct) : 0;
                return (
                  <tr key={c.id} style={{ ...S.tr, cursor: 'pointer' }} onClick={() => setSelectedCityId(c.id)}>
                    <td style={S.td}><div style={S.tenantName}>{c.name}</div></td>
                    <td style={S.td}>{c.state}</td>
                    <td style={S.td}>
                      <span style={{ ...S.statusBadge, background: badge.background, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={S.td}>{c.locality_count ?? 0}</td>
                    <td style={S.td}>
                      <div style={S.progressWrap}>
                        <div style={S.progressTrack}>
                          <div style={{ ...S.progressFill, width: `${pct}%` }} />
                        </div>
                        <span style={S.progressLabel}>{c.verified_count ?? 0} / {c.locality_count ?? 0} · {pct}%</span>
                      </div>
                    </td>
                    <td style={S.td}>{c.listing_count ?? 0}</td>
                    <td style={S.td}>
                      {c.unmatched_pending > 0 ? (
                        <span style={{ ...S.statusBadge, background: '#fef3c7', color: '#92400e' }}>{c.unmatched_pending}</span>
                      ) : '—'}
                    </td>
                    <td style={S.td}>
                      <span style={S.rowArrow}>→</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add City modal */}
      {showAddModal && (
        <div style={S.modalOverlay} onClick={() => !addLoading && setShowAddModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalStripe} />
            <form onSubmit={handleCreateCity} style={S.modalForm}>
              <h3 style={S.modalTitle}>Add City</h3>

              {addError && (
                <div style={S.formError}>
                  <span style={S.formErrorIcon}>!</span>
                  {addError}
                </div>
              )}

              <div style={S.formGrid}>
                <div style={S.formField}>
                  <label style={S.formLabel}>City Name</label>
                  <input style={S.formInput} required placeholder="e.g. Ludhiana" value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>State</label>
                  <input style={S.formInput} required placeholder="e.g. Punjab" value={addForm.state}
                    onChange={(e) => setAddForm((p) => ({ ...p, state: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Centre Latitude</label>
                  <input style={S.formInput} type="number" step="any" required value={addForm.center_lat ?? ''}
                    onChange={(e) => setAddForm((p) => ({ ...p, center_lat: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Centre Longitude</label>
                  <input style={S.formInput} type="number" step="any" required value={addForm.center_lng ?? ''}
                    onChange={(e) => setAddForm((p) => ({ ...p, center_lng: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div style={{ ...S.formField, gridColumn: '1 / -1' }}>
                  <label style={S.formLabel}>Bounds Radius (km)</label>
                  <input style={S.formInput} type="number" min="1" value={addForm.bounds_radius_km}
                    onChange={(e) => setAddForm((p) => ({ ...p, bounds_radius_km: e.target.value }))} />
                </div>
              </div>

              <label style={S.formLabel}>Click the map to set the city centre</label>
              <div style={S.mapBox}>
                <CityCenterPickerMap
                  lat={addForm.center_lat}
                  lng={addForm.center_lng}
                  onPositionChange={(pos) => setAddForm((p) => ({ ...p, center_lat: pos.lat, center_lng: pos.lng }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" style={S.rejectBtn} onClick={() => setShowAddModal(false)} disabled={addLoading}>Cancel</button>
                <button type="submit" style={{ ...S.createBtn, opacity: addLoading ? 0.7 : 1 }} disabled={addLoading}>
                  {addLoading ? 'Creating…' : 'Create City (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// Copied from AdminPanel.jsx's `S` object, plus a handful of new tokens
// this tab needs (progress bar, map box, row arrow) — see file docstring.
const S = {
  section: { padding: '36px 40px' },
  sectionHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 6px 0' },
  pageSubtitle: { fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '520px' },
  refreshBtn: { padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: '9px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  createBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)',
    color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700',
    fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(240,102,35,0.30)',
  },
  formInputCompact: { padding: '9px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0c1b2e', backgroundColor: '#fff', cursor: 'pointer' },

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
  statusBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  rowArrow: { color: '#cbd5e1', fontWeight: '700' },

  progressWrap: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' },
  progressTrack: { width: '100%', height: '6px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: '999px' },
  progressLabel: { fontSize: '11px', color: '#64748b' },

  formError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', marginBottom: '16px', border: '1px solid #fed7d7' },
  formErrorIcon: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px', display: 'block' },
  formInput: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', width: '100%' },
  rejectBtn: { padding: '10px 18px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  mapBox: { width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: '20px' },
  modal: { width: '100%', maxWidth: '560px', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(12,27,46,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  modalStripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  modalForm: { padding: '32px' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 20px 0' },
};
