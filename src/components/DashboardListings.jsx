import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ChangePassword from './ChangePassword.jsx';
import PlotBoundaryTracer from './PlotBoundaryTracer';
// NEW — Phase 7
import BillingModal from './BillingModal.jsx';
import InviteUserModal from './InviteUserModal.jsx';

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
  const [formData, setFormData]           = useState({
    title: '', raw_address: '', price: '',
    plot_area: '', property_type: 'Plot', description: '',
  });
  const [submitting, setSubmitting]       = useState(false);
  const [showPwModal, setShowPwModal]     = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false); // NEW — Phase 7
  const [showInviteModal, setShowInviteModal] = useState(false); // NEW — gap #7
  const [copiedSlug, setCopiedSlug]       = useState(null);

  // Photo management
  const [photoModal, setPhotoModal]             = useState(null); // listing object
  const [photoUrls, setPhotoUrls]               = useState([]);
  const [photoLoading, setPhotoLoading]         = useState(false);
  const [photoUploading, setPhotoUploading]     = useState(false);
  const [photoDeleting, setPhotoDeleting]       = useState(null); // URL being deleted

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const r = await apiClient.get('/api/v1/dashboard/listings');
      setListings(r.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
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

  /* Greeting */
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Loading state ─────────────────────────────── */
  if (loading) return (
    <div style={S.centerScreen}>
      <div style={S.spinRing} />
      <p style={S.centerTxt}>Loading your portfolio…</p>
    </div>
  );

  if (error) return (
    <div style={S.centerScreen}>
      <span style={{ fontSize: '32px' }}>⚠️</span>
      <p style={{ color: '#dc2626', fontSize: '15px', margin: 0 }}>{error}</p>
    </div>
  );

  return (
    <div style={S.root}>

      {/* ══ TOP NAV ══════════════════════════════════════════════ */}
      <header style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.navLogo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e"/>
            </svg>
          </div>
          <span style={S.navBrand}>WayneState Pro</span>
          <div style={S.navDivider} />
          <span style={S.navSection}>Listings</span>
          {activeCount > 0 && (
            <span style={S.navBadge}>{activeCount} active</span>
          )}
        </div>

        <div style={S.navRight}>
          {storedUser && (
            <div style={S.userChip}>
              <div style={S.avatar}>
                {storedUser.name?.[0]?.toUpperCase() || 'D'}
              </div>
              <div style={S.userMeta}>
                <span style={S.userName}>{storedUser.name}</span>
                <span style={S.userBiz}>{storedUser.businessName}</span>
              </div>
            </div>
          )}
          {storedUser?.role === 'owner' && (
            <button
              className="pve-topbar-btn"
              onClick={() => setShowInviteModal(true)}
              style={S.iconBtn}
              title="Invite Team Member"
            >
              👤
            </button>
          )}
          <button
            className="pve-topbar-btn"
            onClick={() => navigate('/dashboard/ops')}
            style={S.iconBtn}
            title="Ops Panel — leads, documents, calls, visits"
          >
            🗂
          </button>
          <button
            className="pve-topbar-btn"
            onClick={() => setShowBillingModal(true)}
            style={S.iconBtn}
            title="Billing & Plan"
          >
            💳
          </button>
          <button
            className="pve-topbar-btn"
            onClick={() => setShowPwModal(true)}
            style={S.iconBtn}
            title="Change Password"
          >
            ⚙
          </button>
          <button
            className="pve-topbar-btn"
            onClick={handleLogout}
            style={S.logoutBtn}
          >
            Log out
          </button>
        </div>
      </header>

      {showPwModal && <ChangePassword onClose={() => setShowPwModal(false)} />}
      {showBillingModal && <BillingModal onClose={() => setShowBillingModal(false)} />}
      {showInviteModal && <InviteUserModal onClose={() => setShowInviteModal(false)} />}

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

        {/* ── Empty state ───────────────────────────────────────── */}
        {listings.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyIconWrap}>🏗</div>
            <h4 style={S.emptyTitle}>No properties yet</h4>
            <p style={S.emptySub}>Add your first listing to get started.</p>
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
                        ₹{parseFloat(item.price).toLocaleString('en-IN')}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
  root: { minHeight: '100vh', backgroundColor: '#f2f5fb' },

  /* Loading */
  centerScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', gap: '16px', backgroundColor: '#f2f5fb',
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
    padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
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
  navBadge: {
    fontSize: '11px', fontWeight: '700', color: '#0c1b2e',
    backgroundColor: '#c8a96e', padding: '3px 8px', borderRadius: '20px',
    letterSpacing: '0.3px',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  userChip: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #c8a96e 0%, #b08848 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '800', color: '#0c1b2e', flexShrink: 0,
  },
  userMeta: { display: 'flex', flexDirection: 'column', gap: '1px' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff', lineHeight: '1.2' },
  userBiz:  { fontSize: '11px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.2' },
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
  actionBtn: {
    flex: 1, padding: '9px 10px', fontSize: '12px', fontWeight: '600',
    border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer',
    backgroundColor: '#fff', color: '#475569', textAlign: 'center',
  },
  actionBtnBlue:  { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  actionBtnGreen: { backgroundColor: '#f0fdf4', color: '#059669', borderColor: '#a7f3d0' },

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
};
