import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import PlotBoundaryTracer from './PlotBoundaryTracer';
import BuilderProfileManager from './BuilderProfileManager.jsx';
import PropertyEditModal from './PropertyEditModal.jsx';
import LeadsInbox from './LeadsInbox.jsx';
import OpsPanel from './OpsPanel.jsx';
import Analytics from './Analytics.jsx';
import plotraIcon from '../assets/plotra-icon.png';

export default function DashboardListings() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('pve_token');
    localStorage.removeItem('pve_user');
    navigate('/login');
  };

  const [listings, setListings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [showCreateModal, setShowCreate]  = useState(false);
  const [activeTracerListing, setTracer]  = useState(null);
  const [builderModalListing, setBuilderModalListing] = useState(null); // Flat listings only — see the button below
  const [formData, setFormData]           = useState({
    title: '', raw_address: '', price: '',
    plot_area: '', property_type: 'Plot', description: '',
  });
  const [submitting, setSubmitting]       = useState(false);
  const [editListing, setEditListing] = useState(null);
  const [copiedSlug, setCopiedSlug]       = useState(null);

  // Search/filter — "search by area or budget" (area lives in the address
  // text, not a separate field, so q searches title/address together).
  // Applied on submit (Enter or the Search button), not live-as-you-type,
  // to avoid firing a request per keystroke.
  const [filters, setFilters] = useState({ q: '', min_price: '', max_price: '', property_type: '' });
  const [filterInputs, setFilterInputs] = useState({ q: '', min_price: '', max_price: '', property_type: '' });

  // Per-listing WhatsApp attribution — only makes sense for a plan with
  // more than one WhatsApp number to assign FROM (plans.max_whatsapp_numbers,
  // surfaced via /billing/status). Re-pointed here from the old
  // multi_agent_whatsapp boolean to the new tier flag (Part 2, build-order
  // item 7) — see listingService.js's validateAssignedAgent for the
  // matching backend-side re-point. teamMembers only fetched when this is
  // actually true — no point loading the team list for a single-number
  // tenant who can't use the feature anyway.
  const [multiAgentEnabled, setMultiAgentEnabled] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Header: billing plan + WhatsApp connection status
  const [planInfo, setPlanInfo] = useState(null); // { plan, subscription_status }
  const [connectedPhone, setConnectedPhone] = useState(storedUser?.phone || null);

  // Plan-gated tab navigation
  const [activeTab, setActiveTab] = useState('listings');

  // Inline WhatsApp connect modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhoneInput, setWaPhoneInput] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState(null);

  // Photo management
  const [photoModal, setPhotoModal]             = useState(null);
  const [photoUrls, setPhotoUrls]               = useState([]);
  const [photoLoading, setPhotoLoading]         = useState(false);
  const [photoUploading, setPhotoUploading]     = useState(false);
  const [photoDeleting, setPhotoDeleting]       = useState(null);

  useEffect(() => {
    fetchListings();
    loadHeaderInfo();
  }, []);

  const loadHeaderInfo = async () => {
    try {
      const res = await apiClient.get('/api/v1/dashboard/billing/status');
      const billing = res.data.billing;
      setPlanInfo(billing);
      const enabled = (billing?.max_whatsapp_numbers ?? 1) > 1;
      setMultiAgentEnabled(enabled);
      if (enabled) {
        const usersRes = await apiClient.get('/api/v1/dashboard/users');
        setTeamMembers((usersRes.data.users || []).filter((u) => u.phone));
      }
    } catch {
      // Non-fatal
    }
  };

  const handleConnectWa = async (e) => {
    e.preventDefault();
    if (!waPhoneInput.trim()) return;
    setWaSubmitting(true);
    setWaError(null);
    try {
      const res = await apiClient.post('/api/v1/auth/update-phone', { phone: waPhoneInput.trim() });
      setConnectedPhone(res.data.phone);
      const saved = JSON.parse(localStorage.getItem('pve_user') || 'null');
      if (saved) localStorage.setItem('pve_user', JSON.stringify({ ...saved, phone: res.data.phone }));
      setShowWaModal(false);
      setWaPhoneInput('');
    } catch (err) {
      setWaError(err.response?.data?.error?.message || 'Failed to connect number. Check the format and try again.');
    } finally {
      setWaSubmitting(false);
    }
  };

  const fetchListings = async ({ withFilters = filters } = {}) => {
    try {
      setLoading(true);
      const params = {};
      if (withFilters.q) params.q = withFilters.q;
      if (withFilters.min_price) params.min_price = withFilters.min_price;
      if (withFilters.max_price) params.max_price = withFilters.max_price;
      if (withFilters.property_type) params.property_type = withFilters.property_type;

      const r = await apiClient.get('/api/v1/dashboard/listings', { params });
      setListings(r.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e?.preventDefault();
    setFilters(filterInputs);
    fetchListings({ withFilters: filterInputs });
  };

  const clearFilters = () => {
    const empty = { q: '', min_price: '', max_price: '', property_type: '' };
    setFilterInputs(empty);
    setFilters(empty);
    fetchListings({ withFilters: empty });
  };

  const handleAssignAgent = async (listingId, agentId) => {
    try {
      await apiClient.patch(`/api/v1/dashboard/listings/${listingId}`, { assigned_agent_id: agentId || null });
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update WhatsApp assignment.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/dashboard/listings', formData);
      setShowCreate(false);
      setFormData({ title: '', raw_address: '', price: '', plot_area: '', property_type: 'Plot', description: '' });
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error creating listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2200);
  };

  const openPhotoModal = async (listing) => {
    setPhotoModal(listing);
    setPhotoLoading(true);
    try {
      const r = await apiClient.get(`/api/v1/dashboard/listings/${listing.id}/media`);
      setPhotoUrls(r.data.photo_urls || []);
    } catch {
      setPhotoUrls([]);
    } finally {
      setPhotoLoading(false);
    }
  };

  const closePhotoModal = () => {
    setPhotoModal(null);
    setPhotoUrls([]);
    setPhotoDeleting(null);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoModal) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const r = await apiClient.post(`/api/v1/dashboard/listings/${photoModal.id}/media`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrls(r.data.photo_urls || []);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Upload failed.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handlePhotoDelete = async (url) => {
    if (!photoModal) return;
    setPhotoDeleting(url);
    try {
      const r = await apiClient.delete(`/api/v1/dashboard/listings/${photoModal.id}/media`, { data: { url } });
      setPhotoUrls(r.data.photo_urls || []);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Delete failed.');
    } finally {
      setPhotoDeleting(null);
    }
  };

  /* Derived stats */
  const totalViews  = listings.reduce((s, l) => s + (l.visit_count || 0), 0);
  const activeCount = listings.filter(l => l.status === 'active').length;

  /* Plan gates */
  const planKey      = (planInfo?.plan || 'starter').toLowerCase();
  const isGrowthPlus = ['growth', 'unlimited'].includes(planKey);
  const isUnlimited  = planKey === 'unlimited';
  const PLAN_TABS    = [
    { key: 'listings',  label: '🏠 Listings' },
    ...(isGrowthPlus ? [{ key: 'leads', label: '💬 Leads' }, { key: 'ops', label: '🗂 Ops' }] : []),
    ...(isUnlimited  ? [{ key: 'analytics', label: '📊 Analytics' }] : []),
  ];

  /* Greeting */
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Loading state ─────────────────────────────── */
  if (loading) return (
    <div style={S.root}>
      <div style={S.centerScreen}>
        <div style={S.spinRing} />
        <p style={S.centerTxt}>Loading your portfolio…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={S.root}>
      <div style={S.centerScreen}>
        <span style={{ fontSize: '32px' }}>⚠️</span>
        <p style={{ color: '#dc2626', fontSize: '15px', margin: 0 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={S.root}>

      {/* ══ TOP NAV ══════════════════════════════════════════════ */}
      <header style={S.nav} role="banner">
        <div style={S.navLeft}>
          <img src={plotraIcon} alt="Plotra" style={{ height: '32px', width: 'auto', flexShrink: 0 }} />
          <span style={S.navBrand}>Plotra</span>
          <div style={S.navDivider} />
          <div style={S.navMeta}>
            <span style={S.navBizName}>{storedUser?.businessName || storedUser?.name}</span>
            {planInfo && (
              <span style={{
                ...S.planBadge,
                ...(planInfo.subscription_status === 'active' ? S.planBadgeActive : S.planBadgeFree),
              }}>
                {planInfo.plan?.toUpperCase() || 'FREE'}
              </span>
            )}
          </div>
        </div>

        <div style={S.navRight}>
          {/* WhatsApp connection status — core feature indicator */}
          {connectedPhone ? (
            <div style={S.waChip}>
              <span style={S.waDot} />
              <span style={S.waChipText}>WhatsApp: {connectedPhone}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowWaModal(true)}
              style={S.waConnectBtn}
              title="Connect your WhatsApp number to receive listing intake via chat"
            >
              <span style={S.waBtnDot}>!</span>
              Connect WhatsApp
            </button>
          )}

          {storedUser?.role === 'super_admin' && (
            <button
              className="pve-topbar-btn"
              onClick={() => navigate('/admin')}
              style={S.iconBtn}
              title="Admin Panel"
            >
              🛡️
            </button>
          )}
          <button
            className="pve-topbar-btn"
            onClick={handleLogout}
            style={S.logoutBtn}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ══ PLAN-GATED TAB BAR ═══════════════════════════════════ */}
      {PLAN_TABS.length > 1 && (
        <div style={S.tabBar}>
          {PLAN_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ ...S.tabBtn, ...(activeTab === t.key ? S.tabBtnActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {editListing && (
        <PropertyEditModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSaved={() => { setEditListing(null); fetchListings(); }}
          onDeleted={() => { setEditListing(null); fetchListings(); }}
        />
      )}
      {builderModalListing && (
        <BuilderProfileManager
          listing={builderModalListing}
          currentUserRole={storedUser?.role}
          onClose={() => setBuilderModalListing(null)}
          onUpdated={() => fetchListings()}
        />
      )}

      {/* ══ MODAL: Photo Management ═══════════════════════════════ */}
      {photoModal && (
        <div className="pve-modal-wrap" style={S.overlay}>
          <div className="pve-modal" style={{ ...S.modal, maxWidth: '600px' }}>
            <div style={S.modalStripe} />
            <div style={S.modalHead}>
              <div>
                <p style={S.modalEye}>Property Photos</p>
                <h3 style={S.modalTitle}>{photoModal.title}</h3>
              </div>
              <button onClick={closePhotoModal} style={S.closeBtn}>✕</button>
            </div>

            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Upload button */}
              <label style={S.uploadLabel}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading || photoUrls.length >= 10}
                  style={{ display: 'none' }}
                />
                {photoUploading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={S.miniSpin} /> Uploading…
                  </span>
                ) : photoUrls.length >= 10 ? (
                  '10/10 photos — limit reached'
                ) : (
                  `+ Upload Photo (${photoUrls.length}/10)`
                )}
              </label>

              {/* Photo grid */}
              {photoLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <div style={{ ...S.miniSpin, margin: '0 auto 10px' }} />
                  Loading photos…
                </div>
              ) : photoUrls.length === 0 ? (
                <div style={S.photoEmpty}>
                  <span style={{ fontSize: '36px' }}>📷</span>
                  <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                    No photos yet. Upload some to show buyers.
                  </p>
                </div>
              ) : (
                <div style={S.photoGrid}>
                  {photoUrls.map((url) => (
                    <div key={url} style={S.photoThumb}>
                      <img src={url} alt="Property" style={S.thumbImg} />
                      <button
                        onClick={() => handlePhotoDelete(url)}
                        disabled={photoDeleting === url}
                        style={S.thumbDel}
                        title="Delete photo"
                      >
                        {photoDeleting === url ? '…' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                JPEG, PNG, or WebP · Max 10 MB per photo · Max 10 photos per listing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAGE BODY ════════════════════════════════════════════ */}
      {activeTab === 'listings' && <div style={S.pageBody}>
      <div style={S.page}>

        {/* ── Welcome Strip ─────────────────────────────────────── */}
        <div style={S.welcomeStrip}>
          <div>
            <h2 style={S.welcomeTitle}>
              {greeting}{storedUser?.name ? `, ${storedUser.name.split(' ')[0]}` : ''} 👋
            </h2>
            <p style={S.welcomeSub}>Here's your property portfolio at a glance.</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={S.addBtn}>
            + Add Property
          </button>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div style={S.statsRow}>
          {[
            {
              label: 'Total Properties',
              value: listings.length,
              icon: '🏘',
              bg: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
            },
            {
              label: 'Active Listings',
              value: activeCount,
              icon: '✅',
              bg: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
            },
            {
              label: 'Total Views',
              value: totalViews,
              icon: '📊',
              bg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            },
          ].map(s => (
            <div key={s.label} className="pve-stat-card" style={{ ...S.statCard, background: s.bg }}>
              <span style={S.statIcon}>{s.icon}</span>
              <span style={S.statValue}>{s.value}</span>
              <span style={S.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Section header ────────────────────────────────────── */}
        <div style={S.sectionBar}>
          <div>
            <h3 style={S.sectionTitle}>My Properties</h3>
            <p style={S.sectionSub}>
              {listings.length === 0
                ? 'No listings yet — add your first property above.'
                : `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} in your portfolio`}
            </p>
          </div>
        </div>

        {/* ── Search/filter bar — area lives in the address text (q searches
            title + raw_address + formatted_address together), budget is
            min/max price, property type is an exact-match dropdown. ── */}
        <form onSubmit={applyFilters} style={S.filterBar}>
          <input
            type="text"
            name="q"
            placeholder="Search by area, locality, or title…"
            value={filterInputs.q}
            onChange={handleFilterInputChange}
            style={{ ...S.filterInput, flex: 2, minWidth: '200px' }}
          />
          <input
            type="number"
            name="min_price"
            placeholder="Min budget (₹)"
            value={filterInputs.min_price}
            onChange={handleFilterInputChange}
            style={{ ...S.filterInput, flex: 1, minWidth: '120px' }}
          />
          <input
            type="number"
            name="max_price"
            placeholder="Max budget (₹)"
            value={filterInputs.max_price}
            onChange={handleFilterInputChange}
            style={{ ...S.filterInput, flex: 1, minWidth: '120px' }}
          />
          <select
            name="property_type"
            value={filterInputs.property_type}
            onChange={handleFilterInputChange}
            style={{ ...S.filterInput, flex: 1, minWidth: '140px' }}
          >
            <option value="">All types</option>
            <option value="Plot">Plot</option>
            <option value="Villa">Villa</option>
            <option value="Flat">Flat</option>
            <option value="Commercial">Commercial</option>
          </select>
          <button type="submit" style={S.filterSearchBtn}>Search</button>
          {(filters.q || filters.min_price || filters.max_price || filters.property_type) && (
            <button type="button" onClick={clearFilters} style={S.filterClearBtn}>Clear</button>
          )}
        </form>

        {/* ── Empty state ───────────────────────────────────────── */}
        {listings.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyIconWrap}>🏗</div>
            <h4 style={S.emptyTitle}>
              {(filters.q || filters.min_price || filters.max_price || filters.property_type)
                ? 'No listings match these filters'
                : 'No properties yet'}
            </h4>
            <p style={S.emptySub}>
              {(filters.q || filters.min_price || filters.max_price || filters.property_type)
                ? 'Try widening your search or clearing the filters.'
                : 'Add your first listing to get started.'}
            </p>
            <button onClick={() => setShowCreate(true)} style={S.addBtn}>+ Add Property</button>
          </div>
        )}

        {/* ── Listings Grid ─────────────────────────────────────── */}
        {listings.length > 0 && (
          <div style={S.grid}>
            {listings.map(item => {
              const isActive = item.status === 'active';
              return (
                <div
                  key={item.id}
                  className="pve-card pve-fade-up"
                  style={{
                    ...S.card,
                    borderLeft: `4px solid ${isActive ? '#c8a96e' : '#f59e0b'}`,
                  }}
                >
                  {/* Card top */}
                  <div style={S.cardTop}>
                    <span style={{
                      ...S.badge,
                      backgroundColor: isActive ? '#ecfdf5' : '#fffbeb',
                      color:           isActive ? '#059669' : '#d97706',
                      border: `1px solid ${isActive ? '#a7f3d0' : '#fde68a'}`,
                    }}>
                      <span style={{ fontSize: '7px', marginRight: '4px' }}>
                        {isActive ? '●' : '○'}
                      </span>
                      {isActive ? 'Active' : 'Pending'}
                    </span>
                    <span style={S.typePill}>{item.property_type}</span>
                  </div>

                  {/* Title */}
                  <h3 style={S.cardTitle}>{item.title}</h3>
                  <p style={S.cardAddr}>📍 {item.formatted_address || item.raw_address}</p>

                  {/* Meta */}
                  <div style={S.metaGrid}>
                    <div style={S.metaBlock}>
                      <span style={S.metaLbl}>Price</span>
                      <span className="pve-card-price" style={S.metaPrice}>
                        {item.price != null && !isNaN(Number(item.price)) ? `₹${Number(item.price).toLocaleString('en-IN')}` : '—'}
                      </span>
                    </div>
                    <div style={S.metaBlock}>
                      <span style={S.metaLbl}>Area</span>
                      <span style={S.metaVal}>{item.plot_area || '—'}</span>
                    </div>
                  </div>

                  {/* Views */}
                  <div style={S.viewsRow}>
                    <span style={S.viewsIcon}>📈</span>
                    <strong>{item.visit_count || 0}</strong>&nbsp;page views
                  </div>

                  {/* Actions */}
                  <div style={S.cardActions}>
                    <button
                      className="pve-action-btn"
                      onClick={() => copyLink(item.public_slug)}
                      style={S.actionBtn}
                    >
                      {copiedSlug === item.public_slug ? '✓ Copied!' : '🔗 Copy Link'}
                    </button>
                    <button
                      className="pve-action-btn"
                      onClick={() => openPhotoModal(item)}
                      style={{ ...S.actionBtn, ...S.actionBtnGreen }}
                    >
                      📷 Photos
                    </button>
                    {isGrowthPlus ? (
                      <button
                        className="pve-action-btn pve-action-btn-blue"
                        onClick={() => setTracer(item)}
                        disabled={!isActive}
                        style={{
                          ...S.actionBtn,
                          ...S.actionBtnBlue,
                          opacity: isActive ? 1 : 0.35,
                          cursor: isActive ? 'pointer' : 'not-allowed',
                        }}
                      >
                        🗺 Trace
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Plot boundary tracing — upgrade to Growth plan"
                        style={{ ...S.actionBtn, opacity: 0.35, cursor: 'not-allowed' }}
                      >
                        🔒 Trace
                      </button>
                    )}
                    <button
                      className="pve-action-btn"
                      onClick={() => setEditListing(item)}
                      style={{ ...S.actionBtn, ...S.actionBtnEdit }}
                    >
                      ✎ Edit
                    </button>
                    {/* Flat/Commercial only — a builder profile (developer
                        rating, possession record, nearby comparisons)
                        doesn't apply to a plot or villa, so the option isn't
                        even offered for those, rather than showing it and
                        rejecting it server-side. See builderProfileController.js. */}
                    {['Flat', 'Commercial'].includes(item.property_type) && (
                      <button
                        className="pve-action-btn"
                        onClick={() => setBuilderModalListing(item)}
                        style={S.actionBtn}
                      >
                        🏗️ {item.builder_profile_id ? 'Builder Profile' : 'Link Builder'}
                      </button>
                    )}
                  </div>

                  {multiAgentEnabled && (
                    <div style={S.assignRow}>
                      <label style={S.assignLabel}>💬 WhatsApp contact for buyers:</label>
                      <select
                        value={item.assigned_agent_id || ''}
                        onChange={(e) => handleAssignAgent(item.id, e.target.value)}
                        style={S.filterInput}
                      >
                        <option value="">Default (tenant number)</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>{member.name} ({member.phone})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* ── Upgrade nudge for STARTER ─────────────────────────── */}
        {!isGrowthPlus && (
          <div style={S.upgradeCard}>
            <div style={{ fontSize: '28px' }}>🚀</div>
            <div style={{ flex: 1 }}>
              <div style={S.upgradeTitle}>Unlock More with Growth</div>
              <div style={S.upgradeSub}>Leads inbox, Ops panel, plot boundary tracing, and a dedicated WhatsApp number — available on Growth and above.</div>
            </div>
          </div>
        )}
      </div>
      </div>}

      {/* ══ NON-LISTINGS TAB CONTENT ════════════════════════════ */}
      {activeTab === 'leads' && isGrowthPlus && (
        <div style={S.pageBody}><div style={S.page}><LeadsInbox bare /></div></div>
      )}
      {activeTab === 'ops' && isGrowthPlus && (
        <div style={S.pageBody}><OpsPanel bare /></div>
      )}
      {activeTab === 'analytics' && isUnlimited && (
        <div style={S.pageBody}><div style={S.page}><Analytics bare /></div></div>
      )}

      {/* ══ MODAL: Create Listing ═══════════════════════════════ */}
      {showCreateModal && (
        <div className="pve-modal-wrap" style={S.overlay}>
          <div className="pve-modal" style={S.modal}>

            <div style={S.modalStripe} />
            <div style={S.modalHead}>
              <div>
                <p style={S.modalEye}>New Listing</p>
                <h3 style={S.modalTitle}>Add Property</h3>
              </div>
              <button onClick={() => setShowCreate(false)} style={S.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={S.modalForm}>
              <MField label="Property Title">
                <input type="text" name="title" placeholder="e.g. Omaxe Royal Villa 230"
                  value={formData.title} onChange={handleInputChange} required style={S.fi} />
              </MField>

              <MField label="Full Address">
                <input type="text" name="raw_address" placeholder="e.g. Pakhowal Road, near Canal, Ludhiana"
                  value={formData.raw_address} onChange={handleInputChange} required style={S.fi} />
              </MField>

              <div style={S.row2}>
                <MField label="Price (₹)">
                  <input type="number" name="price" placeholder="e.g. 4500000"
                    value={formData.price} onChange={handleInputChange} required style={S.fi} />
                </MField>
                <MField label="Plot Area">
                  <input type="text" name="plot_area" placeholder="e.g. 250 Sq Yards"
                    value={formData.plot_area} onChange={handleInputChange} style={S.fi} />
                </MField>
              </div>

              <MField label="Property Type">
                <select name="property_type" value={formData.property_type}
                  onChange={handleInputChange} style={S.fi}>
                  <option value="Plot">Plot</option>
                  <option value="Villa">Villa</option>
                  <option value="Flat">Flat</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </MField>

              <MField label="Description">
                <textarea name="description" placeholder="Describe the property, key features…"
                  value={formData.description} onChange={handleInputChange}
                  style={{ ...S.fi, height: '88px', resize: 'vertical' }} />
              </MField>

              <div style={S.modalFoot}>
                <button type="button" onClick={() => setShowCreate(false)} style={S.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ ...S.submitBtn, opacity: submitting ? 0.72 : 1 }}>
                  {submitting ? 'Saving…' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Connect WhatsApp ════════════════════════════ */}
      {showWaModal && (
        <div className="pve-modal-wrap" style={S.overlay}>
          <div className="pve-modal" style={{ ...S.modal, maxWidth: '440px' }}>
            <div style={S.modalStripe} />
            <div style={S.modalHead}>
              <div>
                <p style={S.modalEye}>WhatsApp Setup</p>
                <h3 style={S.modalTitle}>Connect Your Number</h3>
              </div>
              <button onClick={() => { setShowWaModal(false); setWaError(null); }} style={S.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                Once connected, any WhatsApp message from this number to your Plotra number
                is treated as a listing you're creating — not a buyer inquiry.
              </p>
              {waError && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                  ⚠️ {waError}
                </div>
              )}
              <form onSubmit={handleConnectWa} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="tel"
                  value={waPhoneInput}
                  onChange={(e) => setWaPhoneInput(e.target.value)}
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  style={{ ...S.fi, padding: '11px 14px', fontSize: '14px' }}
                  required
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { setShowWaModal(false); setWaError(null); }} style={S.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={waSubmitting} style={{ ...S.submitBtn, opacity: waSubmitting ? 0.7 : 1 }}>
                    {waSubmitting ? 'Connecting…' : 'Connect Number'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Boundary Tracer ══════════════════════════════ */}
      {activeTracerListing && (
        <div className="pve-modal-wrap" style={S.overlay}>
          <div className="pve-modal" style={{ ...S.modal, maxWidth: '840px', width: '92%' }}>
            <div style={S.modalStripe} />
            <div style={S.modalHead}>
              <div>
                <p style={S.modalEye}>Plot Boundary</p>
                <h3 style={S.modalTitle}>{activeTracerListing.title}</h3>
              </div>
              <button onClick={() => setTracer(null)} style={S.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <PlotBoundaryTracer
                listingId={activeTracerListing.id}
                centerLat={parseFloat(activeTracerListing.lat)}
                centerLng={parseFloat(activeTracerListing.lng)}
                onSaveSuccess={() => setTracer(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small helper: modal form field wrapper */
function MField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '11px', fontWeight: '700', color: '#374151',
        textTransform: 'uppercase', letterSpacing: '0.6px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════ */
const S = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f2f5fb' },
  pageBody: { flex: 1, overflowY: 'auto' },

  /* Loading */
  centerScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', flex: 1, gap: '16px',
  },
  spinRing: {
    width: '44px', height: '44px',
    border: '3px solid #e2e8f0', borderTop: '3px solid #0c1b2e',
    borderRadius: '50%', animation: 'spin 0.75s linear infinite',
  },
  centerTxt: { color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' },

  /* ── Nav ─────────────────────────────────────────── */
  nav: {
    height: '62px',
    background: 'linear-gradient(90deg, #080f1c 0%, #0c1b2e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', flexShrink: 0, zIndex: 100,
    boxShadow: '0 2px 20px rgba(0,0,0,0.32)',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  navLogo: {
    width: '34px', height: '34px', borderRadius: '9px',
    backgroundColor: '#c8a96e',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(200,169,110,0.35)',
  },
  navBrand: {
    fontSize: '13px', fontWeight: '800', color: '#c8a96e',
    letterSpacing: '2px', textTransform: 'uppercase',
  },
  navDivider: { width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.12)', margin: '0 2px' },
  navSection: { fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontWeight: '500' },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },

  /* Brand + plan meta */
  navMeta: { display: 'flex', alignItems: 'center', gap: '8px' },
  navBizName: { fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  planBadge: {
    fontSize: '9px', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase',
    padding: '3px 8px', borderRadius: '20px',
  },
  planBadgeActive: { backgroundColor: 'rgba(200,169,110,0.20)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.35)' },
  planBadgeFree:   { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.12)' },

  /* WhatsApp status chip */
  waChip: {
    display: 'flex', alignItems: 'center', gap: '7px',
    backgroundColor: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.30)',
    padding: '6px 12px', borderRadius: '8px',
  },
  waDot: {
    width: '7px', height: '7px', borderRadius: '50%',
    backgroundColor: '#22c55e', flexShrink: 0,
    boxShadow: '0 0 6px rgba(34,197,94,0.6)',
  },
  waChipText: { fontSize: '12px', fontWeight: '600', color: '#4ade80' },

  /* WhatsApp connect CTA */
  waConnectBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
    padding: '7px 14px', borderRadius: '8px',
    color: '#fbbf24', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
    letterSpacing: '0.2px', whiteSpace: 'nowrap',
  },
  waBtnDot: {
    width: '16px', height: '16px', borderRadius: '50%',
    backgroundColor: '#f59e0b', color: '#0c1b2e',
    fontSize: '10px', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBtn: {
    width: '34px', height: '34px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
    cursor: 'pointer', fontSize: '15px', color: '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    padding: '8px 16px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
    cursor: 'pointer', fontSize: '13px', color: '#94a3b8', fontWeight: '500',
  },

  /* ── Page body ───────────────────────────────────── */
  page: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },

  /* Welcome strip */
  welcomeStrip: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '28px',
  },
  welcomeTitle: { margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0c1b2e' },
  welcomeSub:   { margin: 0, fontSize: '13px', color: '#64748b' },
  addBtn: {
    padding: '12px 22px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    letterSpacing: '0.3px', whiteSpace: 'nowrap',
    boxShadow: '0 4px 14px rgba(12,27,46,0.24)',
  },

  /* Stat cards */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    borderRadius: '14px', padding: '22px 22px 20px',
    display: 'flex', flexDirection: 'column', gap: '6px',
    boxShadow: '0 4px 16px rgba(12,27,46,0.14)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statIcon: { fontSize: '22px', marginBottom: '2px' },
  statValue: { fontSize: '36px', fontWeight: '900', color: '#fff', lineHeight: '1' },
  statLabel: {
    fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase', letterSpacing: '0.6px',
  },

  /* Section header */
  sectionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
  filterBar: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px', alignItems: 'center' },
  filterInput: {
    padding: '10px 12px', fontSize: '13px',
    border: '1.5px solid #e2e8f0', borderRadius: '9px',
    color: '#0c1b2e', backgroundColor: '#fafbfd',
  },
  filterSearchBtn: {
    padding: '10px 18px', border: 'none', borderRadius: '9px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
  },
  filterClearBtn: {
    padding: '10px 18px', borderRadius: '9px',
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    color: '#475569', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  },
  sectionTitle: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0c1b2e' },
  sectionSub:   { margin: 0, fontSize: '13px', color: '#64748b' },

  /* Empty state */
  empty: {
    textAlign: 'center', padding: '72px 32px',
    backgroundColor: '#fff', borderRadius: '16px',
    border: '2px dashed #e2e8f0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
  },
  emptyIconWrap: { fontSize: '48px' },
  emptyTitle: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  emptySub:   { margin: 0, fontSize: '14px', color: '#64748b' },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },

  /* Card */
  card: {
    backgroundColor: '#ffffff', borderRadius: '14px',
    padding: '20px', display: 'flex', flexDirection: 'column',
    border: '1px solid #e8edf4',
    boxShadow: '0 2px 10px rgba(12,27,46,0.06)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  badge: {
    display: 'inline-flex', alignItems: 'center',
    fontSize: '11px', fontWeight: '700',
    padding: '4px 10px', borderRadius: '20px',
    textTransform: 'uppercase', letterSpacing: '0.4px',
  },
  typePill: {
    fontSize: '11px', color: '#64748b', fontWeight: '600',
    backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '20px',
    textTransform: 'uppercase', letterSpacing: '0.4px',
  },
  cardTitle: { margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: '#0c1b2e', lineHeight: '1.3' },
  cardAddr: {
    margin: '0 0 16px 0', fontSize: '13px', color: '#64748b',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  metaGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
    backgroundColor: '#f8fafd', borderRadius: '10px',
    padding: '12px 14px', marginBottom: '12px',
    border: '1px solid #f0f4fa',
  },
  metaBlock: { display: 'flex', flexDirection: 'column', gap: '3px' },
  metaLbl: {
    fontSize: '10px', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700',
  },
  metaPrice: { fontSize: '15px', fontWeight: '800', color: '#0c1b2e', transition: 'color 0.2s' },
  metaVal:   { fontSize: '14px', fontWeight: '700', color: '#0c1b2e' },
  viewsRow: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: '#94a3b8', fontWeight: '500',
    borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginBottom: '14px',
  },
  viewsIcon: { fontSize: '13px' },
  cardActions: { display: 'flex', gap: '10px', marginTop: 'auto' },
  assignRow: { borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' },
  assignLabel: { display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '5px', fontWeight: '600' },
  actionBtn: {
    flex: 1, padding: '9px 10px', fontSize: '12px', fontWeight: '600',
    border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer',
    backgroundColor: '#fff', color: '#475569', textAlign: 'center',
  },
  actionBtnBlue:  { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  actionBtnGreen: { backgroundColor: '#f0fdf4', color: '#059669', borderColor: '#a7f3d0' },
  actionBtnEdit:  { backgroundColor: '#fdfbf6', color: '#92702f', borderColor: '#eadfc7' },

  /* Overlay / Modal */
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, padding: '20px',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '18px',
    width: '100%', maxWidth: '520px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)',
    maxHeight: '92vh', overflowY: 'auto', overflow: 'hidden',
  },
  modalStripe: {
    height: '4px',
    background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalEye: {
    margin: '0 0 4px', fontSize: '11px', fontWeight: '700',
    color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.2px',
  },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: '#f1f5f9', border: 'none', cursor: 'pointer',
    fontSize: '14px', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fi: {
    padding: '11px 13px', fontSize: '14px',
    border: '1.5px solid #e2e8f0', borderRadius: '9px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd',
  },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
  cancelBtn: {
    padding: '10px 20px', borderRadius: '9px',
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '600',
  },
  submitBtn: {
    padding: '10px 24px', borderRadius: '9px', border: 'none',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
    boxShadow: '0 4px 12px rgba(12,27,46,0.22)',
  },

  /* Photo modal */
  uploadLabel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '12px', borderRadius: '10px', cursor: 'pointer',
    border: '2px dashed #c8a96e', color: '#b08848',
    fontSize: '13px', fontWeight: '700', letterSpacing: '0.3px',
    backgroundColor: '#fffbf0', userSelect: 'none',
    transition: 'background 0.15s',
  },
  miniSpin: {
    width: '16px', height: '16px', borderRadius: '50%',
    border: '2px solid #e2e8f0', borderTop: '2px solid #c8a96e',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  photoEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '32px', backgroundColor: '#f8fafd', borderRadius: '12px',
    border: '1px dashed #e2e8f0',
  },
  photoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px',
  },
  photoThumb: {
    position: 'relative', borderRadius: '8px', overflow: 'hidden',
    aspectRatio: '4/3', backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  thumbImg: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  thumbDel: {
    position: 'absolute', top: '4px', right: '4px',
    width: '22px', height: '22px', borderRadius: '50%',
    backgroundColor: 'rgba(15,23,42,0.75)', border: 'none',
    color: '#fff', fontSize: '11px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
  },

  /* Plan-gated tab bar */
  tabBar: {
    display: 'flex', gap: 0,
    backgroundColor: '#0c1b2e',
    padding: '0 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  tabBtn: {
    padding: '12px 18px',
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    borderBottom: '2px solid transparent',
    letterSpacing: '0.2px',
  },
  tabBtnActive: {
    color: '#c8a96e',
    borderBottom: '2px solid #c8a96e',
  },

  /* Upgrade nudge card */
  upgradeCard: {
    display: 'flex', alignItems: 'center', gap: '16px',
    backgroundColor: '#fffbf0', border: '1.5px solid #f5d589',
    borderRadius: '12px', padding: '18px 22px', marginTop: '24px',
  },
  upgradeTitle: { fontSize: '14px', fontWeight: '800', color: '#92702f', marginBottom: '4px' },
  upgradeSub:   { fontSize: '12px', color: '#a0845c', lineHeight: '1.5' },
};
