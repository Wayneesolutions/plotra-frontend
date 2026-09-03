import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import TenantDetailModal from './TenantDetailModal.jsx';
import LeadsInbox from './LeadsInbox.jsx';
import Analytics from './Analytics.jsx';
import Settings from './Settings.jsx';
import OpsPanel from './OpsPanel.jsx';
import { InteractiveSatellite } from './PropertyMapMedia.jsx';
import plotraIcon from '../assets/plotra-icon.png';

const TABS = [
  { label: 'Pending Requests', icon: '📋', desc: 'Approve or reject new dealer signups' },
  { label: 'Agent Signups',    icon: '🤝', desc: 'WhatsApp agent signup requests' },
  { label: 'Geo Review',       icon: '📍', desc: 'Correct WhatsApp listing pins before the agent sees them' },
  { label: 'All Tenants',      icon: '🏢', desc: 'View and manage all active accounts' },
  { label: 'Create Tenant',    icon: '➕', desc: 'Manually onboard a new dealer account' },
  { label: 'Ad Placements',    icon: '📢', desc: 'Manage ads shown across listing pages' },
  { label: 'Plans',            icon: '💳', desc: 'Edit pricing tiers and feature limits' },
];
const AD_POSITIONS = ['calculator_result', 'listing_sidebar', 'listing_footer'];

export default function AdminPanel() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('pve_user') || '{}');

  const [tab, setTab]           = useState('listings');
  const [requests, setRequests] = useState([]);
  // WhatsApp signups (Part 3) that are approved but still waiting on a
  // human to confirm payment — see fetchRequests.
  const [awaitingPaymentRequests, setAwaitingPaymentRequests] = useState([]);
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of row being actioned
  const [credential, setCredential] = useState(null); // { email, password, businessName }
  const [checkoutLinkSent, setCheckoutLinkSent] = useState(null); // WhatsApp-signup approval result, no credential to show
  const [createForm, setCreateForm] = useState({ business_name: '', contact_name: '', email: '', phone: '' });
  const [createError, setCreateError]   = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null); // NEW — gap: tenant drill-down
  const [toast, setToast] = useState(null);

  // NEW — Phase 6: Ad Placements tab state
  const [ads, setAds]                 = useState([]);
  const [adForm, setAdForm]           = useState({
    advertiser_name: '', position: AD_POSITIONS[0], image_url: '', click_url: '',
    city_filter: '', revenue_model: 'flat_fee', active_from: '', active_to: '',
  });
  const [adCreateError, setAdCreateError]     = useState(null);
  const [adCreateLoading, setAdCreateLoading] = useState(false);
  const [adToggleLoading, setAdToggleLoading] = useState(null);

  // Plans tab state
  const [plans, setPlans] = useState([]);
  const [editModal, setEditModal] = useState(null);       // plan object being edited
  const [planEditForm, setPlanEditForm] = useState({ label: '', price_inr: '', listing_limit: '' });
  const [planSaveLoading, setPlanSaveLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // plan key pending delete
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [planToggleLoading, setPlanToggleLoading] = useState(null); // plan key being toggled
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [createPlanForm, setCreatePlanForm] = useState({ key: '', label: '', price_inr: '', listing_limit: '' });
  const [createPlanLoading, setCreatePlanLoading] = useState(false);

  // Agent signups (WhatsApp "join as agent" requests)
  const [agentSignups, setAgentSignups] = useState([]);
  const [agentSignupsLoading, setAgentSignupsLoading] = useState(false);
  const [agentSignupActionLoading, setAgentSignupActionLoading] = useState(null);
  const [agentSignupCredential, setAgentSignupCredential] = useState(null);

  // Platform-wide "All Listings" tab — GET /api/v1/admin/listings, every
  // tenant's listings, not just the logged-in admin's own. This used to be
  // a plain redirect to /dashboard (the same single-tenant view every
  // owner/agent sees); see adminController.js's listAllListings.
  const [platformListings, setPlatformListings] = useState([]);
  const [platformListingsLoading, setPlatformListingsLoading] = useState(false);
  const [platformListingsPage, setPlatformListingsPage] = useState({ page: 1, totalPages: 1, total: 0 });
  const [platformListingsFilters, setPlatformListingsFilters] = useState({ q: '', status: '', property_type: '' });
  const [platformListingsFilterInputs, setPlatformListingsFilterInputs] = useState({ q: '', status: '', property_type: '' });

  // "Geo Review" tab — WhatsApp listings parked at status='pending_geo_review'
  // (see geoEnrichmentWorker.js + adminGeoReviewController.js). Only one row's
  // map is ever mounted at a time (geoReviewExpandedId) — a Google Maps
  // instance per row for a queue of dozens would be wasteful, and the admin
  // is only ever correcting one pin at a time anyway.
  const [geoReviewQueue, setGeoReviewQueue] = useState([]);
  const [geoReviewLoading, setGeoReviewLoading] = useState(false);
  const [geoReviewActionLoading, setGeoReviewActionLoading] = useState(null);
  const [geoReviewExpandedId, setGeoReviewExpandedId] = useState(null);
  const [geoReviewDraggedPosition, setGeoReviewDraggedPosition] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Two calls, not one: an approved WhatsApp signup (Part 3) drops out
      // of ?status=pending the moment it's approved, but it isn't actually
      // live yet — it's sitting in status='approved' waiting on a human to
      // confirm payment (confirmSignupPayment). Both need to show up here
      // so nothing silently disappears from view mid-flow.
      const [pendingRes, approvedRes] = await Promise.all([
        apiClient.get('/api/v1/admin/requests?status=pending'),
        apiClient.get('/api/v1/admin/requests?status=approved'),
      ]);
      const awaitingPayment = (approvedRes.data.requests || []).filter(
        (r) => r.source === 'whatsapp' && r.payment_status && !r.payment_status.startsWith('paid_')
      );
      setRequests(pendingRes.data.requests || []);
      setAwaitingPaymentRequests(awaitingPayment);
    } catch {
      showToast('Failed to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/tenants');
      setTenants(res.data.tenants);
    } catch {
      showToast('Failed to load tenants.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatformListings = useCallback(async (page = 1, filters = platformListingsFilters) => {
    setPlatformListingsLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      const res = await apiClient.get('/api/v1/admin/listings', { params });
      setPlatformListings(res.data.listings || []);
      setPlatformListingsPage(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      showToast('Failed to load listings.', 'error');
    } finally {
      setPlatformListingsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPlatformListingsFilters = (e) => {
    e?.preventDefault();
    setPlatformListingsFilters(platformListingsFilterInputs);
    fetchPlatformListings(1, platformListingsFilterInputs);
  };

  const clearPlatformListingsFilters = () => {
    const empty = { q: '', status: '', property_type: '' };
    setPlatformListingsFilterInputs(empty);
    setPlatformListingsFilters(empty);
    fetchPlatformListings(1, empty);
  };

  // NEW — Phase 6
  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/ads');
      setAds(res.data.placements);
    } catch {
      showToast('Failed to load ad placements.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW — gap #3
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/plans');
      setPlans(res.data.plans);
    } catch {
      showToast('Failed to load plans.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgentSignups = useCallback(async () => {
    setAgentSignupsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/agent-signups');
      setAgentSignups(res.data.signups || []);
    } catch {
      showToast('Failed to load agent signups.', 'error');
    } finally {
      setAgentSignupsLoading(false);
    }
  }, []);

  const handleApproveAgentSignup = async (id) => {
    setAgentSignupActionLoading(id);
    try {
      const res = await apiClient.post(`/api/v1/admin/agent-signups/${id}/approve`);
      setAgentSignups((prev) => prev.filter((s) => s.id !== id));
      setAgentSignupCredential({
        name: res.data.user.name,
        email: res.data.user.email,
        password: res.data.temporaryPassword,
      });
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to approve signup.', 'error');
    } finally {
      setAgentSignupActionLoading(null);
    }
  };

  const handleRejectAgentSignup = async (id) => {
    if (!window.confirm('Reject this agent signup request?')) return;
    setAgentSignupActionLoading(id);
    try {
      await apiClient.post(`/api/v1/admin/agent-signups/${id}/reject`);
      setAgentSignups((prev) => prev.filter((s) => s.id !== id));
      showToast('Signup rejected — applicant notified via WhatsApp.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to reject signup.', 'error');
    } finally {
      setAgentSignupActionLoading(null);
    }
  };

  const fetchGeoReviewQueue = useCallback(async () => {
    setGeoReviewLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/listings/geo-review');
      setGeoReviewQueue(res.data.listings || []);
    } catch {
      showToast('Failed to load geo-review queue.', 'error');
    } finally {
      setGeoReviewLoading(false);
    }
  }, []);

  const toggleGeoReviewExpanded = (id) => {
    setGeoReviewExpandedId((prev) => (prev === id ? null : id));
    setGeoReviewDraggedPosition(null);
  };

  // corrected is undefined when the admin approves without touching the
  // pin (it was already right) — adminGeoReviewController.js treats a
  // request with no lat/lng as "confirmed as-is", not "no change needed
  // so skip it", since the status still has to flip and the preview still
  // has to go out either way.
  const handleApproveGeoReview = async (id, corrected) => {
    setGeoReviewActionLoading(id);
    try {
      const body = corrected ? { lat: corrected.lat, lng: corrected.lng } : {};
      await apiClient.patch(`/api/v1/admin/listings/${id}/geo-review`, body);
      setGeoReviewQueue((prev) => prev.filter((l) => l.id !== id));
      setGeoReviewExpandedId(null);
      setGeoReviewDraggedPosition(null);
      showToast('Approved — preview link sent to the agent.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to approve listing.', 'error');
    } finally {
      setGeoReviewActionLoading(null);
    }
  };

  useEffect(() => {
    if (tab === 'Pending Requests') fetchRequests();
    if (tab === 'Agent Signups') fetchAgentSignups();
    if (tab === 'Geo Review') fetchGeoReviewQueue();
    if (tab === 'All Tenants') { fetchTenants(); fetchPlans(); }
    if (tab === 'Ad Placements') fetchAds();
    if (tab === 'Plans') fetchPlans();
    if (tab === 'listings') fetchPlatformListings(1, platformListingsFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, fetchRequests, fetchAgentSignups, fetchGeoReviewQueue, fetchTenants, fetchAds, fetchPlans, fetchPlatformListings]);

  const handleChangeTenantPlan = async (tenantId, newPlan) => {
    setActionLoading(tenantId);
    try {
      const res = await apiClient.patch(`/api/v1/admin/tenants/${tenantId}/plan`, { plan: newPlan });
      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, plan: res.data.tenant.plan } : t)));
      showToast('Plan updated.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to change plan.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await apiClient.post(`/api/v1/admin/requests/${id}/approve`);
      // A WhatsApp signup's approval response has no `user` at all (Tier 1
      // gets no dashboard login, so there's no owner account/credential to
      // show) — it has a checkoutUrl instead, already sent to the prospect
      // over WhatsApp. Show that instead of the credential modal, and pull
      // this request into "Awaiting Payment" rather than just dropping it.
      if (res.data.user) {
        setCredential({
          businessName: res.data.tenant.business_name,
          email: res.data.user.email,
          password: res.data.temporaryPassword,
        });
      } else {
        setCheckoutLinkSent({ businessName: res.data.tenant.business_name, checkoutUrl: res.data.checkoutUrl });
      }
      setRequests((r) => r.filter((req) => req.id !== id));
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (id, method) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/api/v1/admin/requests/${id}/confirm-payment`, { method });
      setAwaitingPaymentRequests((r) => r.filter((req) => req.id !== id));
      showToast('Payment confirmed — tenant activated.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to confirm payment.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this request?')) return;
    setActionLoading(id);
    try {
      await apiClient.post(`/api/v1/admin/requests/${id}/reject`);
      setRequests((r) => r.filter((req) => req.id !== id));
      showToast('Request rejected.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const setField = (f) => (e) => setCreateForm((p) => ({ ...p, [f]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await apiClient.post('/api/v1/admin/tenants', createForm);
      setCredential({
        businessName: res.data.tenant.business_name,
        email: res.data.user.email,
        password: res.data.temporaryPassword,
      });
      setCreateForm({ business_name: '', contact_name: '', email: '', phone: '' });
    } catch (err) {
      setCreateError(err.response?.data?.error?.message || 'Failed to create tenant.');
    } finally {
      setCreateLoading(false);
    }
  };

  // NEW — Phase 6: Ad Placements handlers
  const setAdField = (f) => (e) => setAdForm((p) => ({ ...p, [f]: e.target.value }));


  const handleCreateAd = async (e) => {
    e.preventDefault();
    setAdCreateLoading(true);
    setAdCreateError(null);
    try {
      const payload = { ...adForm, city_filter: adForm.city_filter.trim() || null };
      await apiClient.post('/api/v1/admin/ads', payload);
      setAdForm({
        advertiser_name: '', position: AD_POSITIONS[0], image_url: '', click_url: '',
        city_filter: '', revenue_model: 'flat_fee', active_from: '', active_to: '',
      });
      showToast('Ad placement created.');
      fetchAds();
    } catch (err) {
      setAdCreateError(err.response?.data?.error?.message || 'Failed to create ad placement.');
    } finally {
      setAdCreateLoading(false);
    }
  };

  const handleToggleAd = async (ad) => {
    setAdToggleLoading(ad.id);
    try {
      await apiClient.patch(`/api/v1/admin/ads/${ad.id}`, { is_active: !ad.is_active });
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, is_active: !a.is_active } : a)));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update ad placement.', 'error');
    } finally {
      setAdToggleLoading(null);
    }
  };

  // Plan handlers
  const openEditModal = (plan) => {
    setEditModal(plan);
    setPlanEditForm({
      label: plan.label,
      price_inr: plan.price_inr,
      listing_limit: plan.listing_limit === null ? '' : plan.listing_limit,
    });
  };

  const saveEditModal = async () => {
    if (!editModal) return;
    setPlanSaveLoading(true);
    try {
      const payload = {
        label: planEditForm.label,
        price_inr: Number(planEditForm.price_inr),
        listing_limit: planEditForm.listing_limit === '' ? null : Number(planEditForm.listing_limit),
      };
      const res = await apiClient.patch(`/api/v1/admin/plans/${editModal.key}`, payload);
      setPlans((prev) => prev.map((p) => (p.key === editModal.key ? res.data.plan : p)));
      setEditModal(null);
      showToast('Plan updated.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update plan.', 'error');
    } finally {
      setPlanSaveLoading(false);
    }
  };

  const togglePlanActive = async (plan) => {
    setPlanToggleLoading(plan.key);
    try {
      const res = await apiClient.patch(`/api/v1/admin/plans/${plan.key}`, { is_active: !plan.is_active });
      setPlans((prev) => prev.map((p) => (p.key === plan.key ? res.data.plan : p)));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update plan.', 'error');
    } finally {
      setPlanToggleLoading(null);
    }
  };

  const handleDeletePlan = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/api/v1/admin/plans/${deleteConfirm}`);
      setPlans((prev) => prev.filter((p) => p.key !== deleteConfirm));
      setDeleteConfirm(null);
      showToast('Plan deleted.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete plan.', 'error');
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setCreatePlanLoading(true);
    try {
      const payload = {
        key: createPlanForm.key.toLowerCase().trim(),
        label: createPlanForm.label,
        price_inr: Number(createPlanForm.price_inr),
        listing_limit: createPlanForm.listing_limit === '' ? null : Number(createPlanForm.listing_limit),
        sort_order: plans.length + 1,
      };
      const res = await apiClient.post('/api/v1/admin/plans', payload);
      setPlans((prev) => [...prev, res.data.plan]);
      setShowCreatePlan(false);
      setCreatePlanForm({ key: '', label: '', price_inr: '', listing_limit: '' });
      showToast('Plan created.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to create plan.', 'error');
    } finally {
      setCreatePlanLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pve_token');
    localStorage.removeItem('pve_user');
    navigate('/login');
  };

  return (
    <div style={S.root}>

      {/* ══ Sidebar ══════════════════════════════════════════ */}
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.logoRow}>
            <img src={plotraIcon} alt="Plotra" style={{ height: '40px', width: 'auto', flexShrink: 0 }} />
            <div>
              <div style={S.logoName}>Plotra</div>
              <div style={S.logoBadge}>Super Admin</div>
            </div>
          </div>

          <nav style={S.nav}>
            <div style={S.navSection}>DEALER DASHBOARD</div>
            {[
              { label: 'Listings',  icon: '🏠', key: 'listings',  desc: 'All property listings' },
              { label: 'Leads',     icon: '💬', key: 'leads',     desc: 'Buyer inquiries & contacts' },
              { label: 'Ops',       icon: '🗂',  key: 'ops',       desc: 'Documents, calls, visits' },
              { label: 'Analytics', icon: '📊', key: 'analytics', desc: 'Views, traffic, performance' },
              { label: 'Settings',  icon: '⚙️', key: 'settings',  desc: 'WhatsApp number, team, password' },
            ].map((l) => (
              <button key={l.key} style={{ ...S.navItem, ...(tab === l.key ? S.navItemActive : {}) }} onClick={() => setTab(l.key)}>
                <div style={S.navItemInner}>
                  <div style={S.navItemTop}>
                    <span style={S.navIcon}>{l.icon}</span>
                    <span>{l.label}</span>
                  </div>
                  <div style={S.navDesc}>{l.desc}</div>
                </div>
              </button>
            ))}

            <div style={{ ...S.navSection, marginTop: '12px' }}>PLATFORM MANAGEMENT</div>
            {TABS.map((t, i) => (
              <button key={t.label} style={{ ...S.navItem, ...(tab === t.label ? S.navItemActive : {}) }} onClick={() => setTab(t.label)}>
                <div style={S.navItemInner}>
                  <div style={S.navItemTop}>
                    <span style={S.navIcon}>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.label === 'Pending Requests' && requests.length > 0 && (
                      <span style={S.navBadge}>{requests.length}</span>
                    )}
                    {t.label === 'Agent Signups' && agentSignups.length > 0 && (
                      <span style={S.navBadge}>{agentSignups.length}</span>
                    )}
                  </div>
                  <div style={S.navDesc}>{t.desc}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div style={S.sideBottom}>
          <div style={S.userInfo}>
            <div style={S.userAvatar}>{user.name?.[0] || 'A'}</div>
            <div>
              <div style={S.userName}>{user.name || 'Admin'}</div>
              <div style={S.userEmail}>{user.email || ''}</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* ══ Main Content ════════════════════════════════════ */}
      <main style={S.main}>

        {/* Toast */}
        {toast && (
          <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>
            {toast.msg}
          </div>
        )}

        {/* Credential Modal */}
        {credential && (
          <div style={S.modalOverlay}>
            <div style={S.modal}>
              <div style={S.modalStripe} />
              <div style={S.modalBody}>
                <div style={S.modalIcon}>🎉</div>
                <h3 style={S.modalTitle}>Account Created</h3>
                <p style={S.modalSub}>
                  <strong>{credential.businessName}</strong> is now on the platform.
                  Share these credentials directly with the owner.
                </p>
                <div style={S.credBox}>
                  <div style={S.credRow}>
                    <span style={S.credLabel}>Email</span>
                    <span style={S.credValue}>{credential.email}</span>
                  </div>
                  <div style={S.credDivider} />
                  <div style={S.credRow}>
                    <span style={S.credLabel}>Temp Password</span>
                    <span style={{ ...S.credValue, ...S.credPassword }}>{credential.password}</span>
                  </div>
                </div>
                <p style={S.modalNote}>This password will not be shown again. Copy it now.</p>
                <button style={S.modalClose} onClick={() => setCredential(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Signup Approval Credential Modal */}
        {agentSignupCredential && (
          <div style={S.modalOverlay}>
            <div style={S.modal}>
              <div style={S.modalStripe} />
              <div style={S.modalBody}>
                <div style={S.modalIcon}>✅</div>
                <h3 style={S.modalTitle}>Agent Approved</h3>
                <p style={S.modalSub}>
                  <strong>{agentSignupCredential.name}</strong> has been approved. A WhatsApp notification with these credentials has been sent to them automatically.
                </p>
                <div style={S.credBox}>
                  <div style={S.credRow}>
                    <span style={S.credLabel}>Email</span>
                    <span style={S.credValue}>{agentSignupCredential.email}</span>
                  </div>
                  <div style={S.credDivider} />
                  <div style={S.credRow}>
                    <span style={S.credLabel}>Temp Password</span>
                    <span style={{ ...S.credValue, ...S.credPassword }}>{agentSignupCredential.password}</span>
                  </div>
                </div>
                <p style={S.modalNote}>WhatsApp notification already sent. Save this as backup.</p>
                <button style={S.modalClose} onClick={() => setAgentSignupCredential(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Detail Drill-down — NEW, fixes gap: clicking a tenant row did nothing */}
        {selectedTenantId && (
          <TenantDetailModal
            tenantId={selectedTenantId}
            onClose={() => setSelectedTenantId(null)}
            onChanged={fetchTenants}
          />
        )}

        {/* WhatsApp signup approval result — no credential (Tier 1 has no
            dashboard login), just confirmation the payment link went out. */}
        {checkoutLinkSent && (
          <div style={S.modalOverlay}>
            <div style={S.modal}>
              <div style={S.modalStripe} />
              <div style={S.modalBody}>
                <div style={S.modalIcon}>💬</div>
                <h3 style={S.modalTitle}>Payment Link Sent</h3>
                <p style={S.modalSub}>
                  <strong>{checkoutLinkSent.businessName}</strong> was approved. A Stripe payment link
                  was sent to them over WhatsApp — the account activates once you confirm payment below
                  (under "Awaiting Payment Confirmation").
                </p>
                <div style={S.credBox}>
                  <div style={S.credRow}>
                    <span style={S.credLabel}>Checkout link</span>
                    <span style={{ ...S.credValue, wordBreak: 'break-all', fontSize: '11px' }}>{checkoutLinkSent.checkoutUrl}</span>
                  </div>
                </div>
                <button style={S.modalClose} onClick={() => setCheckoutLinkSent(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dealer Dashboard Embedded Views ──────────────── */}
        {tab === 'listings' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>All Listings</h1>
                <p style={S.pageSubtitle}>
                  Every property listing across every dealer on the platform ({platformListingsPage.total} total)
                </p>
              </div>
              <button style={S.refreshBtn} onClick={() => fetchPlatformListings(platformListingsPage.page, platformListingsFilters)}>
                Refresh
              </button>
            </div>

            <form onSubmit={applyPlatformListingsFilters} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                style={{ ...S.formInput, flex: 1, minWidth: '200px' }}
                type="text"
                placeholder="Search by title or address…"
                value={platformListingsFilterInputs.q}
                onChange={(e) => setPlatformListingsFilterInputs((p) => ({ ...p, q: e.target.value }))}
              />
              <select
                style={S.formInput}
                value={platformListingsFilterInputs.status}
                onChange={(e) => setPlatformListingsFilterInputs((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="awaiting_approval">Awaiting approval</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                style={S.formInput}
                value={platformListingsFilterInputs.property_type}
                onChange={(e) => setPlatformListingsFilterInputs((p) => ({ ...p, property_type: e.target.value }))}
              >
                <option value="">Any type</option>
                <option value="Plot">Plot</option>
                <option value="Flat">Flat</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
              </select>
              <button type="submit" style={S.refreshBtn}>Search</button>
              <button type="button" style={S.refreshBtn} onClick={clearPlatformListingsFilters}>Clear</button>
            </form>

            {platformListingsLoading ? (
              <div style={S.empty}>Loading…</div>
            ) : platformListings.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>🏠</div>
                <p style={S.emptyText}>No listings match these filters</p>
              </div>
            ) : (
              <>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Title', 'Dealer', 'Type', 'Price', 'Status', 'Assigned Agent', 'Created'].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {platformListings.map((l) => (
                        <tr key={l.id} style={S.tr}>
                          <td style={S.td}>
                            <a href={`/p/${l.public_slug}`} target="_blank" rel="noreferrer" style={{ color: '#0c1b2e', fontWeight: '600', textDecoration: 'none' }}>
                              {l.title || l.raw_address || 'Untitled listing'}
                            </a>
                          </td>
                          <td style={S.td}>{l.tenant_business_name}</td>
                          <td style={S.td}>{l.property_type}</td>
                          <td style={S.td}>{l.price != null ? `₹${Number(l.price).toLocaleString('en-IN')}` : '—'}</td>
                          <td style={S.td}>
                            <span style={{ ...S.statusBadge, ...(l.status === 'active' ? S.statusActive : S.statusInactive) }}>
                              {l.status}
                            </span>
                          </td>
                          <td style={S.td}>{l.assigned_agent_name || '—'}</td>
                          <td style={S.td}>{new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {platformListingsPage.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                    <button
                      style={S.refreshBtn}
                      disabled={platformListingsPage.page <= 1}
                      onClick={() => fetchPlatformListings(platformListingsPage.page - 1, platformListingsFilters)}
                    >
                      ← Prev
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '13px', color: '#64748b' }}>
                      Page {platformListingsPage.page} of {platformListingsPage.totalPages}
                    </span>
                    <button
                      style={S.refreshBtn}
                      disabled={platformListingsPage.page >= platformListingsPage.totalPages}
                      onClick={() => fetchPlatformListings(platformListingsPage.page + 1, platformListingsFilters)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
        {tab === 'leads' && <section style={S.section}><LeadsInbox bare /></section>}
        {tab === 'ops' && <section style={{ padding: '36px 40px' }}><OpsPanel bare /></section>}
        {tab === 'analytics' && <section style={S.section}><Analytics bare /></section>}
        {tab === 'settings' && <section style={S.section}><Settings bare /></section>}

        {/* ── Tab: Agent Signups ──────────────────────────── */}
        {tab === 'Agent Signups' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Agent Signup Requests</h1>
                <p style={S.pageSubtitle}>People who texted "join as agent" on WhatsApp — approve to make them live</p>
              </div>
              <button style={S.refreshBtn} onClick={fetchAgentSignups}>Refresh</button>
            </div>

            {agentSignupsLoading ? (
              <div style={S.empty}>Loading…</div>
            ) : agentSignups.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>✓</div>
                <p style={S.emptyText}>No pending agent signup requests</p>
              </div>
            ) : (
              <div style={S.cardList}>
                {agentSignups.map((s) => (
                  <div key={s.id} style={S.requestCard}>
                    <div style={S.requestInfo}>
                      <div style={{ ...S.requestAvatar, background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)' }}>
                        {s.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={S.requestBiz}>
                          {s.name}
                          <span style={{ ...S.waBadge, background: '#e8f5e9', color: '#2e7d32' }}>🤝 WhatsApp Signup</span>
                        </div>
                        <div style={S.requestMeta}>
                          📱 {s.phone} &nbsp;·&nbsp; 📍 {s.address}
                          {s.tenant_name && <>&nbsp;·&nbsp; 🏢 {s.tenant_name}</>}
                        </div>
                        <div style={{ ...S.requestMeta, marginTop: '2px' }}>
                          Requested {new Date(s.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={S.requestActions}>
                      <button
                        style={{ ...S.approveBtn, opacity: agentSignupActionLoading === s.id ? 0.6 : 1 }}
                        disabled={agentSignupActionLoading === s.id}
                        onClick={() => handleApproveAgentSignup(s.id)}
                      >
                        {agentSignupActionLoading === s.id ? '…' : '✓ Approve'}
                      </button>
                      <button
                        style={{ ...S.rejectBtn, opacity: agentSignupActionLoading === s.id ? 0.6 : 1 }}
                        disabled={agentSignupActionLoading === s.id}
                        onClick={() => handleRejectAgentSignup(s.id)}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Geo Review ──────────────────────────────── */}
        {tab === 'Geo Review' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Geo Review</h1>
                <p style={S.pageSubtitle}>WhatsApp listings waiting on a pin check before the agent gets their preview link</p>
              </div>
              <button style={S.refreshBtn} onClick={fetchGeoReviewQueue}>Refresh</button>
            </div>

            {geoReviewLoading ? (
              <div style={S.empty}>Loading…</div>
            ) : geoReviewQueue.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>✓</div>
                <p style={S.emptyText}>Nothing waiting on geo review right now</p>
              </div>
            ) : (
              <div style={S.cardList}>
                {geoReviewQueue.map((l) => {
                  const isExpanded = geoReviewExpandedId === l.id;
                  const isActing = geoReviewActionLoading === l.id;
                  return (
                    <div key={l.id} style={S.requestCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={S.requestInfo}>
                          <div style={{ ...S.requestAvatar, background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)' }}>
                            📍
                          </div>
                          <div>
                            <div style={S.requestBiz}>
                              {l.title || 'Untitled listing'}
                              {l.location_low_confidence && (
                                <span style={{ ...S.waBadge, background: '#fef3c7', color: '#92400e' }}>⚠️ Low confidence</span>
                              )}
                            </div>
                            <div style={S.requestMeta}>
                              📝 typed: "{l.raw_address}"
                            </div>
                            {l.formatted_address && (
                              <div style={{ ...S.requestMeta, marginTop: '2px' }}>
                                📍 geocoded to: {l.formatted_address}
                              </div>
                            )}
                            <div style={{ ...S.requestMeta, marginTop: '2px' }}>
                              🏢 {l.tenant_business_name}
                              {l.agent_name && <>&nbsp;·&nbsp; 🤝 {l.agent_name} ({l.agent_phone})</>}
                              &nbsp;·&nbsp; {new Date(l.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={S.requestActions}>
                          <button style={S.refreshBtn} onClick={() => toggleGeoReviewExpanded(l.id)}>
                            {isExpanded ? 'Hide map' : 'Review pin'}
                          </button>
                          <button
                            style={{ ...S.approveBtn, opacity: isActing ? 0.6 : 1 }}
                            disabled={isActing}
                            onClick={() => handleApproveGeoReview(l.id, isExpanded ? geoReviewDraggedPosition : undefined)}
                          >
                            {isActing ? '…' : (isExpanded && geoReviewDraggedPosition ? '✓ Save & Approve' : '✓ Approve')}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ height: '340px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <InteractiveSatellite
                              lat={geoReviewDraggedPosition?.lat ?? l.lat}
                              lng={geoReviewDraggedPosition?.lng ?? l.lng}
                              draggable
                              onPositionChange={(coords) => setGeoReviewDraggedPosition(coords)}
                            />
                          </div>
                          <p style={{ ...S.requestMeta, marginTop: '8px' }}>
                            Drag the pin to match "{l.raw_address}", then Save &amp; Approve — or just Approve if the pin already looks right.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Pending Requests ────────────────────────── */}
        {tab === 'Pending Requests' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Pending Requests</h1>
                <p style={S.pageSubtitle}>Review and act on access requests from prospective dealers</p>
              </div>
              <button style={S.refreshBtn} onClick={fetchRequests}>Refresh</button>
            </div>

            {loading ? (
              <div style={S.empty}>Loading…</div>
            ) : requests.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>✓</div>
                <p style={S.emptyText}>No pending requests</p>
              </div>
            ) : (
              <div style={S.cardList}>
                {requests.map((req) => (
                  <div key={req.id} style={S.requestCard}>
                    <div style={S.requestInfo}>
                      <div style={S.requestAvatar}>{req.business_name[0]}</div>
                      <div>
                        <div style={S.requestBiz}>
                          {req.business_name}
                          {req.source === 'whatsapp' && <span style={S.waBadge}>💬 WhatsApp signup</span>}
                        </div>
                        <div style={S.requestMeta}>
                          {req.contact_name} · {req.email || 'no email'} · {req.phone}
                        </div>
                        {req.message && <div style={S.requestMsg}>"{req.message}"</div>}
                        <div style={S.requestDate}>{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div style={S.requestActions}>
                      <button
                        style={{ ...S.approveBtn, opacity: actionLoading === req.id ? 0.6 : 1 }}
                        disabled={actionLoading === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        {actionLoading === req.id ? '…' : 'Approve'}
                      </button>
                      <button
                        style={{ ...S.rejectBtn, opacity: actionLoading === req.id ? 0.6 : 1 }}
                        disabled={actionLoading === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WhatsApp signups (Part 3) that are approved but not yet
                activated — a human still has to confirm payment (QR paid
                via the Stripe link sent over WhatsApp, or cash) before the
                tenant goes live and the number starts routing. */}
            {awaitingPaymentRequests.length > 0 && (
              <>
                <h2 style={S.subheading}>Awaiting Payment Confirmation</h2>
                <div style={S.cardList}>
                  {awaitingPaymentRequests.map((req) => (
                    <div key={req.id} style={S.requestCard}>
                      <div style={S.requestInfo}>
                        <div style={S.requestAvatar}>{req.business_name[0]}</div>
                        <div>
                          <div style={S.requestBiz}>
                            {req.business_name}
                            <span style={S.waBadge}>💬 WhatsApp signup</span>
                          </div>
                          <div style={S.requestMeta}>
                            {req.phone} · requested number: {req.requested_whatsapp_number}
                          </div>
                          <div style={S.requestMeta}>
                            Payment status: <strong>{req.payment_status === 'cash_pending' ? 'Prospect says paid in cash' : 'Payment link sent, not yet confirmed'}</strong>
                          </div>
                        </div>
                      </div>
                      <div style={S.requestActions}>
                        <button
                          style={{ ...S.approveBtn, opacity: actionLoading === req.id ? 0.6 : 1 }}
                          disabled={actionLoading === req.id}
                          onClick={() => handleConfirmPayment(req.id, req.payment_status === 'cash_pending' ? 'cash' : 'qr')}
                        >
                          {actionLoading === req.id ? '…' : 'Confirm Payment & Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Tab: All Tenants ───────────────────────────── */}
        {tab === 'All Tenants' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>All Tenants</h1>
                <p style={S.pageSubtitle}>Every real estate company on the platform</p>
              </div>
              <button style={S.refreshBtn} onClick={fetchTenants}>Refresh</button>
            </div>

            {loading ? (
              <div style={S.empty}>Loading…</div>
            ) : tenants.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>🏢</div>
                <p style={S.emptyText}>No tenants yet</p>
              </div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Business Name', 'Plan', 'Users', 'Status', 'Joined'].map((h) => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr
                        key={t.id}
                        style={{ ...S.tr, cursor: 'pointer' }}
                        onClick={() => setSelectedTenantId(t.id)}
                        title="Click for tenant detail"
                      >
                        <td style={S.td}>
                          <div style={S.tenantName}>{t.business_name}</div>
                        </td>
                        <td style={S.td}>
                          {plans.length > 0 ? (
                            <select
                              value={t.plan}
                              disabled={actionLoading === t.id}
                              onChange={(e) => handleChangeTenantPlan(t.id, e.target.value)}
                              style={{ ...S.planSelect, ...S.planColors[t.plan] || S.planColors.starter }}
                            >
                              {/* Only active plans are real choices (the backend rejects
                                  assigning an inactive one anyway) — but the tenant's CURRENT
                                  plan is always shown as an option even if it's since been
                                  deactivated (e.g. starter/growth/unlimited after the new tier
                                  system launched), so the dropdown still accurately reflects
                                  where they actually are instead of silently substituting
                                  something else as "selected". */}
                              {!plans.some((p) => p.key === t.plan && p.is_active) && (
                                <option value={t.plan}>{t.plan} (inactive)</option>
                              )}
                              {plans.filter((p) => p.is_active).map((p) => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ ...S.planBadge, ...S.planColors[t.plan] || S.planColors.starter }}>
                              {t.plan}
                            </span>
                          )}
                        </td>
                        <td style={S.td}>{t.user_count}</td>
                        <td style={S.td}>
                          <span style={{ ...S.statusBadge, ...(t.status === 'active' ? S.statusActive : S.statusInactive) }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={S.td}>{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Create Tenant ─────────────────────────── */}
        {tab === 'Create Tenant' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Create Tenant</h1>
                <p style={S.pageSubtitle}>Directly onboard a new real estate company without a request</p>
              </div>
            </div>

            <div style={S.formCard}>
              <form onSubmit={handleCreate} style={S.createForm}>
                {createError && (
                  <div style={S.formError}>
                    <span style={S.formErrorIcon}>!</span>
                    {createError}
                  </div>
                )}

                <div style={S.formGrid}>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Business / Company Name</label>
                    <input style={S.formInput} type="text" required placeholder="e.g. Sunrise Realty" value={createForm.business_name} onChange={setField('business_name')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Owner / Contact Name</label>
                    <input style={S.formInput} type="text" required placeholder="e.g. Rajesh Sharma" value={createForm.contact_name} onChange={setField('contact_name')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Email Address</label>
                    <input style={S.formInput} type="email" required placeholder="owner@company.com" value={createForm.email} onChange={setField('email')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Phone Number</label>
                    <input style={S.formInput} type="tel" required placeholder="+91 98765 43210" value={createForm.phone} onChange={setField('phone')} />
                  </div>
                </div>

                <button type="submit" disabled={createLoading} style={{ ...S.createBtn, opacity: createLoading ? 0.7 : 1 }}>
                  {createLoading ? 'Creating…' : 'Create Tenant Account'}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ── Tab: Ad Placements ─────────────────────────── */}
        {tab === 'Ad Placements' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Ad Placements</h1>
                <p style={S.pageSubtitle}>Direct-sold display campaigns shown on public property pages</p>
              </div>
              <button style={S.refreshBtn} onClick={fetchAds}>Refresh</button>
            </div>

            <div style={S.formCard}>
              <form onSubmit={handleCreateAd} style={S.createForm}>
                {adCreateError && (
                  <div style={S.formError}>
                    <span style={S.formErrorIcon}>!</span>
                    {adCreateError}
                  </div>
                )}

                <div style={S.formGrid}>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Advertiser Name</label>
                    <input style={S.formInput} type="text" required placeholder="e.g. Homely Interiors" value={adForm.advertiser_name} onChange={setAdField('advertiser_name')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Position</label>
                    <select style={S.formInput} value={adForm.position} onChange={setAdField('position')}>
                      {AD_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Image URL</label>
                    <input style={S.formInput} type="url" required placeholder="https://…" value={adForm.image_url} onChange={setAdField('image_url')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Click-through URL</label>
                    <input style={S.formInput} type="url" required placeholder="https://…" value={adForm.click_url} onChange={setAdField('click_url')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>City Filter (optional)</label>
                    <input style={S.formInput} type="text" placeholder="Leave blank for all cities" value={adForm.city_filter} onChange={setAdField('city_filter')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Revenue Model</label>
                    <select style={S.formInput} value={adForm.revenue_model} onChange={setAdField('revenue_model')}>
                      <option value="flat_fee">Flat Fee</option>
                      <option value="cpl">Cost Per Lead</option>
                    </select>
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Active From</label>
                    <input style={S.formInput} type="datetime-local" required value={adForm.active_from} onChange={setAdField('active_from')} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Active To</label>
                    <input style={S.formInput} type="datetime-local" required value={adForm.active_to} onChange={setAdField('active_to')} />
                  </div>
                </div>

                <button type="submit" disabled={adCreateLoading} style={{ ...S.createBtn, opacity: adCreateLoading ? 0.7 : 1 }}>
                  {adCreateLoading ? 'Creating…' : 'Create Ad Placement'}
                </button>
              </form>
            </div>

            {loading ? (
              <div style={S.empty}>Loading…</div>
            ) : ads.length === 0 ? (
              <div style={S.emptyCard}>
                <div style={S.emptyIcon}>📢</div>
                <p style={S.emptyText}>No ad placements yet</p>
              </div>
            ) : (
              <div style={{ ...S.tableWrap, marginTop: '20px' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Advertiser', 'Position', 'City', 'Impressions', 'Clicks', 'Status', 'Active Window', ''].map((h) => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => (
                      <tr key={ad.id} style={S.tr}>
                        <td style={S.td}>
                          <div style={S.tenantName}>{ad.advertiser_name}</div>
                        </td>
                        <td style={S.td}>{ad.position}</td>
                        <td style={S.td}>{ad.city_filter || 'All'}</td>
                        <td style={S.td}>{ad.impressions}</td>
                        <td style={S.td}>{ad.clicks}</td>
                        <td style={S.td}>
                          <span style={{ ...S.statusBadge, ...(ad.is_active ? S.statusActive : S.statusInactive) }}>
                            {ad.is_active ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td style={S.td}>
                          {new Date(ad.active_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(ad.active_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={S.td}>
                          <button
                            style={{ ...S.refreshBtn, opacity: adToggleLoading === ad.id ? 0.6 : 1 }}
                            disabled={adToggleLoading === ad.id}
                            onClick={() => handleToggleAd(ad)}
                          >
                            {ad.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Plans ──────────────────────────────────── */}
        {tab === 'Plans' && (
          <section style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <h1 style={S.pageTitle}>Plans</h1>
                <p style={S.pageSubtitle}>Pricing, listing limits, and features shown to every tenant — editable without a code deploy</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={S.refreshBtn} onClick={fetchPlans}>Refresh</button>
                <button style={S.createBtn} onClick={() => setShowCreatePlan(true)}>+ Add Plan</button>
              </div>
            </div>

            {/* Create Plan Form */}
            {showCreatePlan && (
              <div style={S.planCreateCard}>
                <div style={S.planCreateHeader}>
                  <span style={S.planCreateTitle}>New Plan</span>
                  <button style={S.planCreateClose} onClick={() => setShowCreatePlan(false)}>✕</button>
                </div>
                <form onSubmit={handleCreatePlan} style={S.planCreateForm}>
                  <div style={S.formGrid}>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Plan Key (unique ID)</label>
                      <input style={S.formInput} required placeholder="e.g. enterprise" value={createPlanForm.key}
                        onChange={(e) => setCreatePlanForm((p) => ({ ...p, key: e.target.value }))} />
                    </div>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Display Label</label>
                      <input style={S.formInput} required placeholder="e.g. Enterprise" value={createPlanForm.label}
                        onChange={(e) => setCreatePlanForm((p) => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Price / Month (₹)</label>
                      <input style={S.formInput} type="number" required placeholder="e.g. 29999" value={createPlanForm.price_inr}
                        onChange={(e) => setCreatePlanForm((p) => ({ ...p, price_inr: e.target.value }))} />
                    </div>
                    <div style={S.formField}>
                      <label style={S.formLabel}>Listing Limit (blank = unlimited)</label>
                      <input style={S.formInput} type="number" placeholder="Leave blank for unlimited" value={createPlanForm.listing_limit}
                        onChange={(e) => setCreatePlanForm((p) => ({ ...p, listing_limit: e.target.value }))} />
                    </div>
                  </div>
                  <button type="submit" disabled={createPlanLoading} style={{ ...S.createBtn, opacity: createPlanLoading ? 0.7 : 1 }}>
                    {createPlanLoading ? 'Creating…' : 'Create Plan'}
                  </button>
                </form>
              </div>
            )}

            {loading ? (
              <div style={S.empty}>Loading…</div>
            ) : (
              <div style={S.planGrid}>
                {plans.map((plan) => {
                  const color = S.planAccentColors[plan.key] || S.planAccentColors._default;
                  const isToggling = planToggleLoading === plan.key;
                  return (
                    <div key={plan.key} style={S.planCard}>
                      {/* Colored top accent */}
                      <div style={{ ...S.planCardAccent, background: color.gradient }} />

                      {/* Header */}
                      <div style={S.planCardHead}>
                        <div style={S.planCardMeta}>
                          <div style={{ ...S.planCardDot, background: color.accent }} />
                          <span style={S.planCardKey}>{plan.label.toUpperCase()}</span>
                        </div>
                        <span style={{ ...S.statusBadge, ...(plan.is_active ? S.statusActive : S.statusInactive) }}>
                          {plan.is_active ? 'active' : 'inactive'}
                        </span>
                      </div>

                      {/* Price */}
                      <div style={S.planCardPriceRow}>
                        <span style={S.planCardPrice}>₹{plan.price_inr.toLocaleString('en-IN')}</span>
                        <span style={S.planCardPricePer}>/month</span>
                      </div>

                      <div style={S.planCardDivider} />

                      {/* Stats */}
                      <div style={S.planCardStats}>
                        <div style={S.planCardStat}>
                          <span style={S.planCardStatLabel}>Listing Limit</span>
                          <span style={{ ...S.planCardStatVal, color: color.accent }}>
                            {plan.listing_limit === null ? '∞ Unlimited' : plan.listing_limit}
                          </span>
                        </div>
                        <div style={S.planCardStat}>
                          <span style={S.planCardStatLabel}>Features</span>
                          <span style={{ ...S.planCardStatVal, color: color.accent }}>
                            {Array.isArray(plan.features) ? plan.features.length : 0}
                          </span>
                        </div>
                      </div>

                      <div style={S.planCardDivider} />

                      {/* Features list */}
                      <div style={S.planCardFeatures}>
                        {(Array.isArray(plan.features) ? plan.features : []).map((f) => (
                          <div key={f} style={S.planCardFeature}>
                            <span style={{ ...S.planCardCheck, color: color.accent }}>✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <div style={S.planCardDivider} />

                      {/* Toggle */}
                      <div style={S.planCardToggleRow}>
                        <span style={S.planCardToggleLabel}>Status</span>
                        <div style={S.planCardToggleGroup}>
                          <div
                            style={{
                              width: '44px', height: '24px', borderRadius: '12px', cursor: isToggling ? 'not-allowed' : 'pointer',
                              background: plan.is_active ? '#16a34a' : '#d1d5db',
                              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                              opacity: isToggling ? 0.6 : 1,
                            }}
                            onClick={() => !isToggling && togglePlanActive(plan)}
                          >
                            <div style={{
                              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: '3px',
                              left: plan.is_active ? '23px' : '3px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: plan.is_active ? '#15803d' : '#9ca3af' }}>
                            {isToggling ? '…' : (plan.is_active ? 'Active' : 'Inactive')}
                          </span>
                        </div>
                      </div>

                      <div style={S.planCardDivider} />

                      {/* Actions */}
                      <div style={S.planCardActions}>
                        <button style={S.planEditBtn} onClick={() => openEditModal(plan)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit Plan
                        </button>
                        <button style={S.planDeleteBtn} onClick={() => setDeleteConfirm(plan.key)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Edit Plan Modal ──────────────────────────────── */}
        {editModal && (
          <div style={S.modalOverlay}>
            <div style={{ ...S.modal, maxWidth: '480px' }}>
              <div style={S.modalStripe} />
              <div style={{ padding: '32px' }}>
                <h3 style={{ ...S.modalTitle, fontSize: '18px', textAlign: 'left', marginBottom: '6px' }}>
                  Edit Plan — {editModal.label}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                  Changes apply immediately to all agents viewing pricing.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Display Label</label>
                    <input style={S.formInput} value={planEditForm.label}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, label: e.target.value }))} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Price / Month (₹)</label>
                    <input style={S.formInput} type="number" value={planEditForm.price_inr}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, price_inr: e.target.value }))} />
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Listing Limit (blank = unlimited)</label>
                    <input style={S.formInput} type="number" placeholder="Leave blank for unlimited"
                      value={planEditForm.listing_limit}
                      onChange={(e) => setPlanEditForm((p) => ({ ...p, listing_limit: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '28px', justifyContent: 'flex-end' }}>
                  <button style={S.rejectBtn} onClick={() => setEditModal(null)}>Cancel</button>
                  <button
                    style={{ ...S.approveBtn, opacity: planSaveLoading ? 0.6 : 1 }}
                    disabled={planSaveLoading}
                    onClick={saveEditModal}
                  >
                    {planSaveLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Plan Confirmation Modal ───────────────── */}
        {deleteConfirm && (
          <div style={S.modalOverlay}>
            <div style={{ ...S.modal, maxWidth: '420px' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fef2f2', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 8px' }}>Delete Plan</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0 0 8px' }}>
                  Are you sure you want to delete <strong>"{plans.find(p => p.key === deleteConfirm)?.label}"</strong>?
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 28px' }}>
                  This cannot be undone. If any tenants are currently on this plan, deletion will be blocked — deactivate it instead.
                </p>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    style={{ ...S.rejectBtn, flex: 1, justifyContent: 'center' }}
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.6 : 1 }}
                    onClick={handleDeletePlan}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const S = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f1f5f9', fontFamily: 'inherit' },

  // Sidebar
  sidebar: {
    width: '260px', flexShrink: 0,
    background: 'linear-gradient(180deg, #060d18 0%, #0b1929 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '28px 0', overflowY: 'auto',
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: '32px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 24px' },
  logoBox: {
    width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#c8a96e', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(200,169,110,0.35)',
  },
  logoName: { fontSize: '14px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' },
  logoBadge: { fontSize: '10px', fontWeight: '600', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' },
  navSection: {
    fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.25)',
    letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 14px 4px',
  },
  navItem: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '10px 14px', borderRadius: '10px', border: 'none',
    background: 'transparent', color: 'rgba(255,255,255,0.55)',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: { background: 'rgba(200,169,110,0.15)', color: '#c8a96e' },
  navItemInner: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  navItemTop: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
  navDesc: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '400', paddingLeft: '23px' },
  navIcon: { fontSize: '15px', flexShrink: 0 },
  navBadge: {
    marginLeft: 'auto', backgroundColor: '#c8a96e', color: '#0c1b2e',
    fontSize: '10px', fontWeight: '800', borderRadius: '999px',
    padding: '2px 7px', minWidth: '18px', textAlign: 'center',
  },
  backBtn: {
    display: 'block', width: '100%', padding: '9px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
    color: 'rgba(255,255,255,0.45)', fontSize: '12px', cursor: 'pointer', textAlign: 'left',
  },
  sideBottom: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: {
    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
    background: 'rgba(200,169,110,0.20)', border: '1px solid rgba(200,169,110,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#c8a96e', fontSize: '14px', fontWeight: '700',
  },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff' },
  userEmail: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' },
  logoutBtn: {
    padding: '9px', width: '100%', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '9px', background: 'transparent', color: 'rgba(255,255,255,0.45)',
    fontSize: '12px', cursor: 'pointer', fontWeight: '500',
  },

  // Main
  main: { flex: 1, overflowY: 'auto', position: 'relative' },

  // Toast
  toast: {
    position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
    padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  toastSuccess: { backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  toastError: { backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' },

  // Section
  section: { padding: '36px 40px' },
  sectionHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 6px 0' },
  pageSubtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  refreshBtn: {
    padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },

  // Empty
  empty: { color: '#94a3b8', fontSize: '14px', padding: '40px 0', textAlign: 'center' },
  emptyCard: {
    background: '#fff', borderRadius: '16px', padding: '56px 32px', textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },

  // Request cards
  cardList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  requestCard: {
    background: '#fff', borderRadius: '14px', padding: '20px 24px',
    border: '1px solid #e2e8f0', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: '20px',
    boxShadow: '0 1px 4px rgba(12,27,46,0.05)',
  },
  requestInfo: { display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 },
  requestAvatar: {
    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
    background: 'linear-gradient(135deg, #f06623, #d95215)',
    color: '#fff', fontSize: '18px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  requestBiz: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e', marginBottom: '4px' },
  requestMeta: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  requestMsg: { fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '4px' },
  requestDate: { fontSize: '11px', color: '#cbd5e1' },
  requestActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  waBadge: {
    marginLeft: '8px', fontSize: '10px', fontWeight: '700', color: '#059669',
    backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px',
    padding: '2px 8px', verticalAlign: 'middle',
  },
  subheading: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e', margin: '28px 0 12px' },
  approveBtn: {
    padding: '9px 20px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff', border: 'none', borderRadius: '9px', fontSize: '13px',
    fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.30)',
  },
  rejectBtn: {
    padding: '9px 20px', background: '#fff', color: '#dc2626',
    border: '1.5px solid #fca5a5', borderRadius: '9px',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },

  // Tenant / ads table
  tableWrap: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#334155' },
  tenantName: { fontWeight: '600', color: '#0c1b2e' },
  planBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  planColors: {
    starter: { background: '#eff6ff', color: '#1d4ed8' },
    growth: { background: '#fefce8', color: '#ca8a04' },
    unlimited: { background: '#f0fdf4', color: '#15803d' },
    tier1: { background: '#f0fdfa', color: '#0f766e' },
    tier2: { background: '#eef2ff', color: '#4338ca' },
    tier3: { background: '#fdf4ff', color: '#a21caf' },
  },
  planSelect: {
    border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '5px 8px',
    fontSize: '12px', fontWeight: '700', color: '#0c1b2e', backgroundColor: '#fff', cursor: 'pointer',
  },
  statusBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  statusActive: { background: '#f0fdf4', color: '#15803d' },
  statusInactive: { background: '#fff5f5', color: '#dc2626' },

  // Create form (shared by Create Tenant + Ad Placements tabs)
  formCard: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', maxWidth: '760px' },
  createForm: { display: 'flex', flexDirection: 'column', gap: '0' },
  formError: {
    display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px',
    borderRadius: '10px', fontSize: '13px', fontWeight: '500', marginBottom: '20px',
    border: '1px solid #fed7d7',
  },
  formErrorIcon: {
    width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0,
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '7px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px' },
  formInput: {
    padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd',
    transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
  },
  createBtn: {
    padding: '13px 28px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)',
    color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start',
    boxShadow: '0 4px 16px rgba(240,102,35,0.30)',
  },


  // Plan cards
  planGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  planCard: {
    background: '#fff', borderRadius: '18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 12px rgba(12,27,46,0.07)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  planCardAccent: { height: '5px', flexShrink: 0 },
  planCardHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px 10px',
  },
  planCardMeta: { display: 'flex', alignItems: 'center', gap: '8px' },
  planCardDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  planCardKey: { fontSize: '11px', fontWeight: '800', color: '#0c1b2e', letterSpacing: '1px' },
  planCardPriceRow: { padding: '4px 20px 16px', display: 'flex', alignItems: 'baseline', gap: '4px' },
  planCardPrice: { fontSize: '32px', fontWeight: '800', color: '#0c1b2e', letterSpacing: '-1px' },
  planCardPricePer: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
  planCardDivider: { height: '1px', background: '#f1f5f9', margin: '0 20px' },
  planCardStats: { display: 'flex', gap: '0', padding: '14px 20px' },
  planCardStat: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' },
  planCardStatLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' },
  planCardStatVal: { fontSize: '16px', fontWeight: '800' },
  planCardFeatures: { padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  planCardFeature: { display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#475569', lineHeight: '1.4' },
  planCardCheck: { fontWeight: '800', fontSize: '13px', flexShrink: 0, marginTop: '1px' },
  planCardToggleRow: {
    padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  planCardToggleLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px' },
  planCardToggleGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  planCardActions: {
    padding: '14px 20px', display: 'flex', gap: '10px',
  },
  planEditBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    background: '#f8fafc', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  planDeleteBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '10px 16px', border: '1.5px solid #fecaca', borderRadius: '10px',
    background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  planAccentColors: {
    starter:   { accent: '#1d4ed8', gradient: 'linear-gradient(90deg, #1d4ed8, #3b82f6)' },
    growth:    { accent: '#b45309', gradient: 'linear-gradient(90deg, #b45309, #c8a96e)' },
    unlimited: { accent: '#065f46', gradient: 'linear-gradient(90deg, #065f46, #10b981)' },
    _default:  { accent: '#6b7280', gradient: 'linear-gradient(90deg, #6b7280, #9ca3af)' },
  },
  planCreateCard: {
    background: '#fff', borderRadius: '16px', border: '1.5px solid #c8a96e',
    padding: '24px', marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(200,169,110,0.12)',
  },
  planCreateHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  planCreateTitle: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e' },
  planCreateClose: {
    width: '28px', height: '28px', border: 'none', borderRadius: '8px',
    background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  planCreateForm: { display: 'flex', flexDirection: 'column', gap: '0' },

  // Credential modal
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
  modalStripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  modalBody: { padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  modalIcon: { fontSize: '36px', marginBottom: '16px' },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 10px 0' },
  modalSub: { fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.6' },
  credBox: {
    width: '100%', backgroundColor: '#f8fafc', borderRadius: '12px',
    border: '1.5px solid #e2e8f0', overflow: 'hidden', marginBottom: '12px',
  },
  credRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: '12px' },
  credDivider: { height: '1px', backgroundColor: '#e2e8f0' },
  credLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0 },
  credValue: { fontSize: '14px', color: '#0c1b2e', fontWeight: '500', wordBreak: 'break-all', textAlign: 'right' },
  credPassword: { fontFamily: 'monospace', color: '#0c1b2e', fontWeight: '700', fontSize: '15px' },
  modalNote: { fontSize: '12px', color: '#f59e0b', fontWeight: '600', margin: '0 0 24px 0' },
  modalClose: {
    padding: '12px 36px', background: 'linear-gradient(135deg, #0c1b2e, #1a3558)',
    color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer',
  },
};
