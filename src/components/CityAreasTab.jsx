import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/apiClient';
import { AreaRadiusPickerMap, AreaCirclesMap } from './AreaMapCircles.jsx';

const KIND_OPTIONS = ['area', 'sector', 'road', 'town', 'industrial'];
const PAGE_SIZE = 20;
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'active', label: 'Verified' },
  { value: 'disabled', label: 'Disabled' },
];
const STATUS_BADGE = {
  active: { background: '#f0fdf4', color: '#15803d', label: 'Verified' },
  needs_review: { background: '#fef3c7', color: '#92400e', label: 'Needs review' },
  disabled: { background: '#fff5f5', color: '#dc2626', label: 'Disabled' },
};

// 1024px matches this specific split-view's own stacking breakpoint from
// the build brief — deliberately not reusing src/hooks/use-mobile.tsx
// (768px, and unused/dead elsewhere in the admin panel already per that
// file's own note) since the two thresholds serve different layouts.
function useBelow(px) {
  const [below, setBelow] = useState(() => window.innerWidth < px);
  useEffect(() => {
    const onResize = () => setBelow(window.innerWidth < px);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [px]);
  return below;
}

const emptyDrawerForm = (city) => ({
  id: null, name: '', kind: 'area', parent_id: '', pincode: '',
  center_lat: city?.center_lat ?? 0, center_lng: city?.center_lng ?? 0, radius_m: 500,
  aliases: [],
});

export default function CityAreasTab({
  cityId, city, showToast,
  prefillNewArea, onPrefillConsumed,
  initialStatusFilter, onStatusFilterConsumed,
  onCityStatsChanged,
}) {
  const stacked = useBelow(1024);

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerForm, setDrawerForm] = useState(emptyDrawerForm(city));
  const [drawerLoading, setDrawerLoading] = useState(null); // 'save' | 'verify' | null
  const [drawerError, setDrawerError] = useState(null);
  const [parentQuery, setParentQuery] = useState('');
  const [parentOpen, setParentOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasError, setAliasError] = useState(null);

  const [areaPage, setAreaPage] = useState(1);

  const [mapFullscreen, setMapFullscreen] = useState(false);
  const tableScrollRef  = useRef(null);
  const topScrollRef    = useRef(null);

  const [mergeTarget, setMergeTarget] = useState(null); // area being merged away
  const [mergeInto, setMergeInto] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (statusFilter) params.status = statusFilter;
      if (kindFilter) params.kind = kindFilter;
      const res = await apiClient.get(`/api/v1/admin/cities/${cityId}/localities`, { params });
      setAreas(Array.isArray(res.data) ? res.data : (res.data.localities || res.data.rows || []));
    } catch {
      showToast('Failed to load areas.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, q, statusFilter, kindFilter]);

  useEffect(() => { fetchAreas(); setAreaPage(1); }, [fetchAreas]);

  // Import tab's "view Areas needing review" handoff.
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      onStatusFilterConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatusFilter]);

  const openAddDrawer = useCallback((prefillName) => {
    setDrawerForm({ ...emptyDrawerForm(city), name: prefillName || '' });
    setParentQuery('');
    setAliasInput('');
    setAliasError(null);
    setDrawerError(null);
    setDrawerOpen(true);
  }, [city]);

  // Unmatched tab's "New area" handoff.
  useEffect(() => {
    if (prefillNewArea) {
      openAddDrawer(prefillNewArea.name);
      onPrefillConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillNewArea]);

  const openEditDrawer = (area) => {
    setSelectedAreaId(area.id);
    setDrawerForm({
      id: area.id, name: area.name, kind: area.kind || 'area',
      parent_id: area.parent_id || '', pincode: area.pincode || '',
      center_lat: area.center_lat, center_lng: area.center_lng, radius_m: area.radius_m || 500,
      aliases: area.aliases || [],
    });
    setParentQuery(area.parent_name || '');
    setAliasInput('');
    setAliasError(null);
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const buildPayload = () => ({
    name: drawerForm.name,
    kind: drawerForm.kind,
    parent_id: drawerForm.parent_id || null,
    pincode: drawerForm.pincode || null,
    center_lat: Number(drawerForm.center_lat),
    center_lng: Number(drawerForm.center_lng),
    radius_m: Number(drawerForm.radius_m),
  });

  const saveDrawer = async () => {
    setDrawerLoading('save');
    setDrawerError(null);
    try {
      const payload = buildPayload();
      let savedId = drawerForm.id;
      if (drawerForm.id) {
        await apiClient.patch(`/api/v1/admin/localities/${drawerForm.id}`, payload);
      } else {
        const res = await apiClient.post(`/api/v1/admin/cities/${cityId}/localities`, payload);
        savedId = res.data.locality?.id || res.data.id;
        setDrawerForm((p) => ({ ...p, id: savedId }));
      }
      showToast('Area saved.');
      fetchAreas();
      onCityStatsChanged?.();
      return savedId;
    } catch (err) {
      setDrawerError(err.response?.data?.error?.message || 'Failed to save area.');
      return null;
    } finally {
      setDrawerLoading(null);
    }
  };

  const handleSave = async () => { await saveDrawer(); };

  const handleSaveAndVerify = async () => {
    const id = await saveDrawer();
    if (!id) return;
    setDrawerLoading('verify');
    try {
      await apiClient.post(`/api/v1/admin/localities/${id}/verify`, {
        center_lat: Number(drawerForm.center_lat),
        center_lng: Number(drawerForm.center_lng),
        radius_m: Number(drawerForm.radius_m),
      });
      showToast('Area saved and verified.');
      setDrawerOpen(false);
      fetchAreas();
      onCityStatsChanged?.();
    } catch (err) {
      setDrawerError(err.response?.data?.error?.message || 'Failed to verify area.');
    } finally {
      setDrawerLoading(null);
    }
  };

  const handleAddAlias = async () => {
    const alias = aliasInput.trim();
    if (!alias || !drawerForm.id) return;
    setAliasError(null);
    try {
      await apiClient.post(`/api/v1/admin/localities/${drawerForm.id}/aliases`, { alias });
      setDrawerForm((p) => ({ ...p, aliases: [...p.aliases, { alias }] }));
      setAliasInput('');
    } catch (err) {
      const e2 = err.response?.data?.error;
      setAliasError(e2?.code === 'ALIAS_IN_USE' ? e2.message : (e2?.message || 'Failed to add spelling.'));
    }
  };

  const handleRemoveAlias = async (aliasRow) => {
    if (!aliasRow.id) {
      setDrawerForm((p) => ({ ...p, aliases: p.aliases.filter((a) => a !== aliasRow) }));
      return;
    }
    try {
      await apiClient.delete(`/api/v1/admin/localities/aliases/${aliasRow.id}`);
      setDrawerForm((p) => ({ ...p, aliases: p.aliases.filter((a) => a.id !== aliasRow.id) }));
    } catch {
      showToast('Failed to remove spelling.', 'error');
    }
  };

  const handleDisableArea = async () => {
    if (!drawerForm.id) return;
    if (!window.confirm(`Disable "${drawerForm.name}"?`)) return;
    setDisableLoading(true);
    try {
      await apiClient.patch(`/api/v1/admin/localities/${drawerForm.id}`, { status: 'disabled' });
      showToast('Area disabled.');
      setDrawerOpen(false);
      fetchAreas();
      onCityStatsChanged?.();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to disable area.', 'error');
    } finally {
      setDisableLoading(false);
    }
  };

  const openMerge = (area) => { setMergeTarget(area); setMergeInto(''); };

  const handleMerge = async () => {
    if (!mergeTarget || !mergeInto) return;
    if (!window.confirm(`Merge "${mergeTarget.name}" into the selected area? This moves its listings, aliases, and unmatched suggestions, then disables it.`)) return;
    setMergeLoading(true);
    try {
      await apiClient.post(`/api/v1/admin/localities/${mergeTarget.id}/merge`, { into_id: mergeInto });
      showToast('Areas merged.');
      setMergeTarget(null);
      setDrawerOpen(false);
      fetchAreas();
      onCityStatsChanged?.();
    } catch (err) {
      const e2 = err.response?.data?.error;
      showToast(e2?.code === 'CITY_MISMATCH' ? 'Can only merge areas within the same city.' : (e2?.message || 'Failed to merge.'), 'error');
    } finally {
      setMergeLoading(false);
    }
  };

  const parentCandidates = areas.filter((a) =>
    a.id !== drawerForm.id &&
    (!parentQuery || a.name.toLowerCase().includes(parentQuery.toLowerCase()))
  );

  return (
    <div>
      <div style={S.filterRow}>
        <input style={{ ...S.formInput, flex: 1, minWidth: '180px' }} placeholder="Search areas…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={S.formInputCompact} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select style={S.formInputCompact} value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
          <option value="">All kinds</option>
          {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
        </select>
        <button style={S.createBtn} onClick={() => openAddDrawer()}>+ Add area</button>
      </div>

      {/* when drawer is open on desktop the 480px fixed panel sits over the map column — hide the map and let the table expand */}
      <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flex: stacked ? 'none' : (drawerOpen && !stacked ? '1' : '0 0 55%'), minWidth: 0 }}>
          {loading ? (
            <div style={S.empty}>Loading…</div>
          ) : areas.length === 0 ? (
            <div style={S.emptyCard}>
              <div style={S.emptyIcon}>📍</div>
              <p style={S.emptyText}>No areas yet. Import a CSV or add one.</p>
            </div>
          ) : (() => {
            const totalPages = Math.ceil(areas.length / PAGE_SIZE);
            const pageAreas = areas.slice((areaPage - 1) * PAGE_SIZE, areaPage * PAGE_SIZE);
            return (
              <>
                <div
                  ref={topScrollRef}
                  style={S.topScrollBar}
                  onScroll={(e) => { if (tableScrollRef.current) tableScrollRef.current.scrollLeft = e.target.scrollLeft; }}
                >
                  <div style={{ minWidth: '600px', height: '1px' }} />
                </div>
                <div
                  ref={tableScrollRef}
                  style={S.tableWrap}
                  onScroll={(e) => { if (topScrollRef.current) topScrollRef.current.scrollLeft = e.target.scrollLeft; }}
                >
                  <table style={S.table}>
                    <thead>
                      <tr>{['Name', 'Kind', 'Parent', 'PIN', 'Spellings', 'Listings', 'Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {pageAreas.map((a) => {
                        const badge = STATUS_BADGE[a.status] || STATUS_BADGE.disabled;
                        const isSelected = String(a.id) === String(selectedAreaId);
                        return (
                          <tr
                            key={a.id}
                            style={{ ...S.tr, cursor: 'pointer', background: isSelected ? '#fff7ed' : 'transparent' }}
                            onClick={() => openEditDrawer(a)}
                          >
                            <td style={S.td}><div style={S.tenantName}>{a.name}</div></td>
                            <td style={S.td}>{a.kind}</td>
                            <td style={S.td}>{a.parent_name || '—'}</td>
                            <td style={S.td}>{a.pincode || '—'}</td>
                            <td style={S.td}>{(a.aliases || []).length}</td>
                            <td style={S.td}>{a.listing_count ?? 0}</td>
                            <td style={S.td}><span style={{ ...S.statusBadge, background: badge.background, color: badge.color }}>{badge.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div style={S.pagination}>
                    <span style={S.pageInfo}>{areas.length} areas · page {areaPage} of {totalPages}</span>
                    <div style={S.pageButtons}>
                      <button style={{ ...S.pageBtn, opacity: areaPage === 1 ? 0.35 : 1 }} disabled={areaPage === 1} onClick={() => setAreaPage(1)}>«</button>
                      <button style={{ ...S.pageBtn, opacity: areaPage === 1 ? 0.35 : 1 }} disabled={areaPage === 1} onClick={() => setAreaPage((p) => p - 1)}>‹</button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pg = totalPages <= 7 ? i + 1 : areaPage <= 4 ? i + 1 : areaPage + i - 3;
                        if (pg < 1 || pg > totalPages) return null;
                        return (
                          <button key={pg} style={{ ...S.pageBtn, ...(pg === areaPage ? S.pageBtnActive : {}) }} onClick={() => setAreaPage(pg)}>{pg}</button>
                        );
                      })}
                      <button style={{ ...S.pageBtn, opacity: areaPage === totalPages ? 0.35 : 1 }} disabled={areaPage === totalPages} onClick={() => setAreaPage((p) => p + 1)}>›</button>
                      <button style={{ ...S.pageBtn, opacity: areaPage === totalPages ? 0.35 : 1 }} disabled={areaPage === totalPages} onClick={() => setAreaPage(totalPages)}>»</button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {(!drawerOpen || stacked) && (
        <div style={{ flex: stacked ? 'none' : '0 0 45%', minWidth: 0, height: stacked ? '400px' : 'calc(100vh - 220px)', maxHeight: stacked ? '400px' : '720px', position: stacked ? undefined : 'sticky', top: stacked ? undefined : '0' }}>
          <div style={{ ...S.mapBox, position: 'relative' }}>
            <AreaCirclesMap
              centerLat={city?.center_lat} centerLng={city?.center_lng}
              areas={areas} selectedId={selectedAreaId}
              onSelectArea={(id) => setSelectedAreaId(id)}
            />
            <button style={S.mapExpandBtn} onClick={() => setMapFullscreen(true)} title="View fullscreen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Fullscreen map overlay */}
      {mapFullscreen && (
        <div style={S.mapOverlay}>
          <div style={S.mapOverlayHeader}>
            <span style={S.mapOverlayTitle}>{city?.name || 'City'} — Areas Map</span>
            <button style={S.mapCloseBtn} onClick={() => setMapFullscreen(false)} title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AreaCirclesMap
              centerLat={city?.center_lat} centerLng={city?.center_lng}
              areas={areas} selectedId={selectedAreaId}
              onSelectArea={(id) => setSelectedAreaId(id)}
            />
          </div>
        </div>
      )}

      {/* Area edit/add drawer — right side panel on desktop, full modal on mobile */}
      {drawerOpen && (
        <div style={stacked ? S.drawerOverlayModal : S.drawerOverlaySide} onClick={() => setDrawerOpen(false)}>
          <div style={stacked ? S.drawerModal : S.drawerPanel} onClick={(e) => e.stopPropagation()}>
            <div style={S.drawerHead}>
              <h3 style={S.drawerTitle}>{drawerForm.id ? 'Edit Area' : 'Add Area'}</h3>
              <button style={S.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <div style={S.drawerBody}>
              {drawerError && <div style={S.formError}><span style={S.formErrorIcon}>!</span>{drawerError}</div>}

              <div style={S.formField}>
                <label style={S.formLabel}>Name</label>
                <input style={S.formInput} value={drawerForm.name} onChange={(e) => setDrawerForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...S.formField, flex: 1 }}>
                  <label style={S.formLabel}>Kind</label>
                  <select style={S.formInput} value={drawerForm.kind} onChange={(e) => setDrawerForm((p) => ({ ...p, kind: e.target.value }))}>
                    {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ ...S.formField, flex: 1 }}>
                  <label style={S.formLabel}>PIN Code</label>
                  <input style={S.formInput} value={drawerForm.pincode} onChange={(e) => setDrawerForm((p) => ({ ...p, pincode: e.target.value }))} />
                </div>
              </div>

              <div style={{ ...S.formField, position: 'relative' }}>
                <label style={S.formLabel}>Parent (optional)</label>
                <input
                  style={S.formInput}
                  placeholder="Search areas in this city…"
                  value={parentQuery}
                  onFocus={() => setParentOpen(true)}
                  onBlur={() => setTimeout(() => setParentOpen(false), 150)}
                  onChange={(e) => { setParentQuery(e.target.value); setParentOpen(true); if (!e.target.value) setDrawerForm((p) => ({ ...p, parent_id: '' })); }}
                />
                {parentOpen && (
                  <div style={S.parentDropdown}>
                    <div style={S.parentOption} onClick={() => { setDrawerForm((p) => ({ ...p, parent_id: '' })); setParentQuery(''); setParentOpen(false); }}>
                      None
                    </div>
                    {parentCandidates.slice(0, 30).map((a) => (
                      <div key={a.id} style={S.parentOption} onClick={() => { setDrawerForm((p) => ({ ...p, parent_id: a.id })); setParentQuery(a.name); setParentOpen(false); }}>
                        {a.name}
                      </div>
                    ))}
                    {parentCandidates.length === 0 && <div style={{ ...S.parentOption, color: '#94a3b8', cursor: 'default' }}>No matches</div>}
                  </div>
                )}
              </div>

              <div style={S.formField}>
                <label style={S.formLabel}>Radius: {drawerForm.radius_m}m</label>
                <input
                  type="range" min={200} max={5000} step={50}
                  value={drawerForm.radius_m}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, radius_m: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={S.drawerMapBox}>
                <AreaRadiusPickerMap
                  lat={drawerForm.center_lat} lng={drawerForm.center_lng} radiusM={drawerForm.radius_m}
                  onPositionChange={(pos) => setDrawerForm((p) => ({ ...p, center_lat: pos.lat, center_lng: pos.lng }))}
                />
              </div>

              <div style={S.formField}>
                <label style={S.formLabel}>Spellings (alternate spellings dealers type)</label>
                {!drawerForm.id && <p style={S.hint}>Save the area first to add spellings.</p>}
                <div style={S.chipRow}>
                  {drawerForm.aliases.map((a, i) => (
                    <span key={a.id || `${a.alias}-${i}`} style={S.chip}>
                      {a.alias}
                      <button style={S.chipRemove} onClick={() => handleRemoveAlias(a)}>✕</button>
                    </span>
                  ))}
                </div>
                {drawerForm.id && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      style={{ ...S.formInput, flex: 1 }} placeholder="Add a spelling, press Enter"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(); } }}
                    />
                    <button style={S.planEditBtn} onClick={handleAddAlias}>Add</button>
                  </div>
                )}
                {aliasError && <p style={{ ...S.hint, color: '#dc2626' }}>{aliasError}</p>}
              </div>

              {drawerForm.id && (
                <div style={S.formField}>
                  <label style={S.formLabel}>Merge into another area</label>
                  <button style={S.planEditBtn} onClick={() => openMerge(drawerForm)}>Merge into…</button>
                </div>
              )}
            </div>

            <div style={S.drawerFooter}>
              {drawerForm.id && (
                <button style={S.dangerBtn} disabled={disableLoading} onClick={handleDisableArea}>
                  {disableLoading ? 'Disabling…' : 'Disable'}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button style={S.planEditBtn} disabled={!!drawerLoading} onClick={handleSave}>
                {drawerLoading === 'save' ? 'Saving…' : 'Save'}
              </button>
              <button style={S.createBtn} disabled={!!drawerLoading} onClick={handleSaveAndVerify}>
                {drawerLoading === 'verify' ? 'Verifying…' : 'Save & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge modal */}
      {mergeTarget && (
        <div style={S.modalOverlay} onClick={() => !mergeLoading && setMergeTarget(null)}>
          <div style={{ ...S.modal, maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '28px' }}>
              <h3 style={S.drawerTitle}>Merge "{mergeTarget.name}"</h3>
              <p style={S.hint}>Choose the area to merge it into. Aliases, listings, and unmatched suggestions move over; "{mergeTarget.name}" becomes disabled.</p>
              <select style={{ ...S.formInput, marginTop: '12px' }} value={mergeInto} onChange={(e) => setMergeInto(e.target.value)}>
                <option value="">Select target area…</option>
                {areas.filter((a) => a.id !== mergeTarget.id).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button style={S.planEditBtn} onClick={() => setMergeTarget(null)} disabled={mergeLoading}>Cancel</button>
                <button style={{ ...S.createBtn, opacity: mergeLoading || !mergeInto ? 0.6 : 1 }} disabled={mergeLoading || !mergeInto} onClick={handleMerge}>
                  {mergeLoading ? 'Merging…' : 'Merge'}
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
  filterRow: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  formInput: { padding: '10px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', width: '100%' },
  formInputCompact: { padding: '9px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0c1b2e', backgroundColor: '#fff', cursor: 'pointer' },
  createBtn: { padding: '10px 18px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(240,102,35,0.30)' },
  dangerBtn: { padding: '9px 18px', border: '1.5px solid #fecaca', borderRadius: '9px', background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  planEditBtn: { padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  empty: { color: '#94a3b8', fontSize: '14px', padding: '40px 0', textAlign: 'center' },
  emptyCard: { background: '#fff', borderRadius: '16px', padding: '56px 32px', textAlign: 'center', border: '1px solid #e2e8f0' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },

  topScrollBar: { overflowX: 'auto', overflowY: 'hidden', height: '14px', borderRadius: '12px 12px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', background: '#fafbfd' },
  tableWrap: { background: '#fff', borderRadius: '0 0 16px 16px', border: '1px solid #e2e8f0', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 16px', fontSize: '13px', color: '#334155' },
  tenantName: { fontWeight: '600', color: '#0c1b2e' },
  statusBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },

  mapBox: { width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  mapExpandBtn: {
    position: 'absolute', top: '12px', right: '12px',
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#374151',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10,
  },
  mapOverlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: '#fff', display: 'flex', flexDirection: 'column',
  },
  mapOverlayHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid #e2e8f0',
    background: '#fff', flexShrink: 0,
  },
  mapOverlayTitle: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e' },
  mapCloseBtn: {
    width: '36px', height: '36px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#374151',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },

  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px 0', flexWrap: 'wrap', gap: '8px' },
  pageInfo: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },
  pageButtons: { display: 'flex', gap: '4px', alignItems: 'center' },
  pageBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  pageBtnActive: { background: '#0c1b2e', borderColor: '#0c1b2e', color: '#fff' },

  formError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', marginBottom: '4px', border: '1px solid #fed7d7' },
  formErrorIcon: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px' },
  hint: { fontSize: '11.5px', color: '#94a3b8', margin: 0 },

  parentDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(12,27,46,0.12)', maxHeight: '200px', overflowY: 'auto', zIndex: 20 },
  parentOption: { padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: '#0c1b2e' },

  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: '#f1f5f9', color: '#334155', fontSize: '12px', fontWeight: '600' },
  chipRemove: { border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: 0 },

  drawerOverlaySide: { position: 'fixed', inset: 0, background: 'transparent', zIndex: 900 },
  drawerPanel: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '92vw',
    background: '#fff', boxShadow: '-12px 0 40px rgba(12,27,46,0.18)',
    display: 'flex', flexDirection: 'column', zIndex: 901,
  },
  drawerOverlayModal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  drawerModal: { width: '100%', maxWidth: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '18px', boxShadow: '0 24px 64px rgba(12,27,46,0.25)', display: 'flex', flexDirection: 'column' },
  drawerHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 },
  drawerTitle: { fontSize: '17px', fontWeight: '800', color: '#0c1b2e', margin: 0 },
  closeBtn: { width: '30px', height: '30px', borderRadius: '8px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#64748b' },
  drawerBody: { padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, minHeight: 0 },
  drawerMapBox: { width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 },
  drawerFooter: { display: 'flex', gap: '10px', padding: '16px 22px', borderTop: '1px solid #f1f5f9', flexShrink: 0 },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(12,27,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: '20px' },
  modal: { width: '100%', maxWidth: '560px', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(12,27,46,0.25)' },
};
