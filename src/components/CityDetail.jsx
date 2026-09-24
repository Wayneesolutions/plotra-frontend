import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import CityAreasTab from './CityAreasTab.jsx';
import CityUnmatchedTab from './CityUnmatchedTab.jsx';
import CityImportTab from './CityImportTab.jsx';
import CityTestTab from './CityTestTab.jsx';

const STATUS_BADGE = {
  draft: { background: '#fef3c7', color: '#92400e', label: 'Draft' },
  live: { background: '#f0fdf4', color: '#15803d', label: 'Live' },
  disabled: { background: '#fff5f5', color: '#dc2626', label: 'Disabled' },
};

/**
 * City detail — header (status, verified progress, go-live/edit/disable)
 * + the 4 tabs (Areas/Unmatched/Import/Test), each its own file per the
 * build brief's file-structure recommendation (mirrors AdminPayments.jsx's
 * own-file-per-tab precedent). Tab switching and cross-tab handoffs
 * (Unmatched's "New area" → Areas drawer prefilled, Import's "view Areas
 * needing review" → Areas filtered) are local useState lifted up to here,
 * same "no new routes" pattern as the rest of AdminPanel.jsx.
 */
export default function CityDetail({ cityId, showToast, onBack }) {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('areas');
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [goLiveLoading, setGoLiveLoading] = useState(false);
  const [goLiveBlock, setGoLiveBlock] = useState(null); // { verified_pct, required_pct }
  const [disableLoading, setDisableLoading] = useState(false);

  // Cross-tab handoffs
  const [areaPrefill, setAreaPrefill] = useState(null);       // { name } from Unmatched "New area"
  const [areaStatusFilter, setAreaStatusFilter] = useState(null); // from Import "view needs review"

  const loadCity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/cities/${cityId}`);
      setCity(res.data.city || res.data);
      setUnmatchedCount((res.data.city || res.data).unmatched_pending || 0);
    } catch {
      showToast('Failed to load city.', 'error');
    } finally {
      setLoading(false);
    }
  }, [cityId, showToast]);

  useEffect(() => { loadCity(); }, [loadCity]);

  const openEdit = () => {
    setEditForm({
      name: city.name, state: city.state,
      center_lat: city.center_lat, center_lng: city.center_lng,
      bounds_radius_km: city.bounds_radius_km,
      code: city.code || '',
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const payload = {
        name: editForm.name, state: editForm.state,
        center_lat: Number(editForm.center_lat), center_lng: Number(editForm.center_lng),
        bounds_radius_km: Number(editForm.bounds_radius_km),
        ...(editForm.code ? { code: editForm.code } : {}),
      };
      const res = await apiClient.patch(`/api/v1/admin/cities/${cityId}`, payload);
      setCity((c) => ({ ...c, ...(res.data.city || res.data) }));
      setEditOpen(false);
      showToast('City updated.');
    } catch (err) {
      setEditError(err.response?.data?.error?.message || 'Failed to update city.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleGoLive = async () => {
    setGoLiveLoading(true);
    setGoLiveBlock(null);
    try {
      const res = await apiClient.post(`/api/v1/admin/cities/${cityId}/go-live`);
      setCity((c) => ({ ...c, ...(res.data.city || res.data), status: 'live' }));
      showToast('City is now Live.');
    } catch (err) {
      // verified_pct/required_pct come back on the response body itself,
      // not nested under `error` (see POST /cities/:id/go-live) — reading
      // them off `.error` silently produced "NaN% verified" in the banner.
      const responseBody = err.response?.data;
      if (responseBody?.error?.code === 'BELOW_VERIFICATION_GATE') {
        setGoLiveBlock({ verified_pct: responseBody.verified_pct, required_pct: responseBody.required_pct });
      } else {
        showToast(responseBody?.error?.message || 'Failed to go live.', 'error');
      }
    } finally {
      setGoLiveLoading(false);
    }
  };

  const handleDisable = async (force = false) => {
    if (!window.confirm(`Disable "${city.name}"? Dealers in this city won't be able to auto-tag new addresses against it.`)) return;
    setDisableLoading(true);
    try {
      await apiClient.post(`/api/v1/admin/cities/${cityId}/disable`, null, { params: force ? { force: true } : {} });
      setCity((c) => ({ ...c, status: 'disabled' }));
      showToast('City disabled.');
    } catch (err) {
      // `count` is a top-level field on the response body (see POST
      // /cities/:id/disable's 409), not nested under `error`.
      const responseBody = err.response?.data;
      if (responseBody?.error?.code === 'ACTIVE_LISTINGS_EXIST') {
        if (window.confirm(`${responseBody.count ?? 'Some'} active listing(s) are in this city. Disable anyway?`)) {
          return handleDisable(true);
        }
      } else {
        showToast(responseBody?.error?.message || 'Failed to disable city.', 'error');
      }
    } finally {
      setDisableLoading(false);
    }
  };

  const goToAreasForNewArea = (name) => { setAreaPrefill({ name }); setTab('areas'); };
  const goToAreasFiltered = (status) => { setAreaStatusFilter(status); setTab('areas'); };

  if (loading || !city) {
    return <section style={S.section}><div style={S.empty}>Loading…</div></section>;
  }

  const badge = STATUS_BADGE[city.status] || STATUS_BADGE.draft;
  const pct = city.verified_pct != null ? Math.round(city.verified_pct) : 0;
  const requiredPct = city.min_verified_pct != null ? Math.round(city.min_verified_pct) : null;
  const belowGate = requiredPct != null && pct < requiredPct;

  return (
    <section style={S.section}>
      <button style={S.backBtn} onClick={onBack}>← All Cities</button>

      <div style={S.header}>
        <div>
          <div style={S.headerTop}>
            <h1 style={S.pageTitle}>{city.name}</h1>
            <span style={{ ...S.statusBadge, background: badge.background, color: badge.color }}>{badge.label}</span>
          </div>
          <p style={S.pageSubtitle}>
            {city.state} · {city.verified_count ?? 0} of {city.locality_count ?? 0} areas verified — {pct}%
          </p>
        </div>
        <div style={S.headerActions}>
          <button style={S.refreshBtn} onClick={openEdit}>Edit City</button>
          {city.status !== 'disabled' && (
            <button style={S.dangerBtn} disabled={disableLoading} onClick={() => handleDisable(false)}>
              {disableLoading ? 'Disabling…' : 'Disable'}
            </button>
          )}
          {city.status === 'draft' && (
            <div style={{ position: 'relative' }} title={belowGate ? `Needs ${requiredPct}% of areas verified (currently ${pct}%)` : ''}>
              <button
                style={{ ...S.createBtn, opacity: belowGate || goLiveLoading ? 0.5 : 1, cursor: belowGate ? 'not-allowed' : 'pointer' }}
                disabled={belowGate || goLiveLoading}
                onClick={handleGoLive}
              >
                {goLiveLoading ? 'Publishing…' : 'Go Live'}
              </button>
            </div>
          )}
        </div>
      </div>

      {goLiveBlock && (
        <div style={S.gateBanner}>
          Below the verification gate — {Math.round(goLiveBlock.verified_pct)}% verified, {Math.round(goLiveBlock.required_pct)}% required.
        </div>
      )}

      {/* Sub-nav — 4 tabs within this city */}
      <div style={S.subNav}>
        {[
          { key: 'areas', label: 'Areas' },
          { key: 'unmatched', label: `Unmatched${unmatchedCount > 0 ? ` (${unmatchedCount})` : ''}` },
          { key: 'import', label: 'Import' },
          { key: 'test', label: 'Test' },
        ].map((t) => (
          <button key={t.key} style={{ ...S.subNavBtn, ...(tab === t.key ? S.subNavBtnActive : {}) }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'areas' && (
        <CityAreasTab
          cityId={cityId}
          city={city}
          showToast={showToast}
          prefillNewArea={areaPrefill}
          onPrefillConsumed={() => setAreaPrefill(null)}
          initialStatusFilter={areaStatusFilter}
          onStatusFilterConsumed={() => setAreaStatusFilter(null)}
          onCityStatsChanged={loadCity}
        />
      )}
      {tab === 'unmatched' && (
        <CityUnmatchedTab
          cityId={cityId}
          showToast={showToast}
          onCountChange={setUnmatchedCount}
          onNewArea={goToAreasForNewArea}
        />
      )}
      {tab === 'import' && (
        <CityImportTab
          cityId={cityId}
          showToast={showToast}
          onViewAreasNeedingReview={() => goToAreasFiltered('needs_review')}
        />
      )}
      {tab === 'test' && <CityTestTab cityId={cityId} city={city} />}

      {/* Edit City modal */}
      {editOpen && editForm && (
        <div style={S.modalOverlay} onClick={() => !editLoading && setEditOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalStripe} />
            <form onSubmit={handleSaveEdit} style={S.modalForm}>
              <h3 style={S.modalTitle}>Edit City</h3>
              {editError && (
                <div style={S.formError}><span style={S.formErrorIcon}>!</span>{editError}</div>
              )}
              <div style={S.formGrid}>
                <div style={S.formField}>
                  <label style={S.formLabel}>City Name</label>
                  <input style={S.formInput} required value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>State</label>
                  <input style={S.formInput} required value={editForm.state} onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Centre Latitude</label>
                  <input style={S.formInput} type="number" step="any" required value={editForm.center_lat}
                    onChange={(e) => setEditForm((p) => ({ ...p, center_lat: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Centre Longitude</label>
                  <input style={S.formInput} type="number" step="any" required value={editForm.center_lng}
                    onChange={(e) => setEditForm((p) => ({ ...p, center_lng: e.target.value }))} />
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>City Code</label>
                  <input style={S.formInput} maxLength={4} placeholder="e.g. LDH" value={editForm.code}
                    onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') }))} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Only affects new tenant codes. Existing codes never change.</span>
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Bounds Radius (km)</label>
                  <input style={S.formInput} type="number" min="1" value={editForm.bounds_radius_km}
                    onChange={(e) => setEditForm((p) => ({ ...p, bounds_radius_km: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" style={S.rejectBtn} onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</button>
                <button type="submit" style={{ ...S.createBtn, opacity: editLoading ? 0.7 : 1 }} disabled={editLoading}>
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

const S = {
  section: { padding: '36px 40px' },
  empty: { color: '#94a3b8', fontSize: '14px', padding: '40px 0', textAlign: 'center' },
  backBtn: { border: 'none', background: 'transparent', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '18px' },

  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' },
  headerTop: { display: 'flex', alignItems: 'center', gap: '10px' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#64748b', margin: '6px 0 0' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  refreshBtn: { padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: '9px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  dangerBtn: { padding: '9px 18px', border: '1.5px solid #fecaca', borderRadius: '9px', background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  createBtn: {
    padding: '10px 20px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)',
    color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700',
    fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(240,102,35,0.30)',
  },
  statusBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  gateBanner: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', marginBottom: '18px' },

  subNav: { display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' },
  subNavBtn: { padding: '10px 4px', marginBottom: '-1px', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  subNavBtnActive: { color: '#c8a96e', borderBottom: '2px solid #c8a96e' },

  formError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', marginBottom: '16px', border: '1px solid #fed7d7' },
  formErrorIcon: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px' },
  formInput: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', width: '100%' },
  rejectBtn: { padding: '10px 18px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: '20px' },
  modal: { width: '100%', maxWidth: '560px', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(12,27,46,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  modalStripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  modalForm: { padding: '32px' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 20px 0' },
};
