import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';
import PlotBoundaryTracer from './PlotBoundaryTracer'; // Visual perimeter tracer component built in Phase 2
import ListingMediaManager from './ListingMediaManager.jsx';
import BuilderProfileManager from './BuilderProfileManager.jsx';

const EMPTY_FORM = { title: '', raw_address: '', price: '', plot_area: '', property_type: 'Plot', description: '' };

export default function DashboardListings() {
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');

  // Inventory and Dashboard Metric States
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Management States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null); // non-null = editing that listing instead of creating
  const [activeTracerListing, setActiveTracerListing] = useState(null);
  const [activeMediaListing, setActiveMediaListing] = useState(null);
  const [activeBuilderListing, setActiveBuilderListing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenantListings();
  }, []);

  // `silent` skips the loading-screen flash: fetchTenantListings is also
  // called as a background refresh (e.g. BuilderProfileManager's onUpdated,
  // after linking/moderating) while a modal on top of the grid is still
  // open. Flipping `loading` to true there would swap the whole page for
  // the "Syncing…" screen, unmounting every child including that open
  // modal — which then remounts fresh once loading clears, losing whatever
  // local state it had built up (this was a real bug, caught by testing
  // the builder-profile flow end-to-end: linking succeeded server-side but
  // the modal silently reverted to the unlinked form).
  const fetchTenantListings = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      // Fetches current listings — apiClient attaches the JWT bearer token
      const response = await apiClient.get('/api/v1/dashboard/listings');
      setListings(response.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to sync backoffice property inventory.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingListing(null);
    setFormData(EMPTY_FORM);
    setShowCreateModal(true);
  };

  const openEditModal = (item) => {
    setEditingListing(item);
    setFormData({
      title: item.title || '',
      raw_address: item.raw_address || '',
      price: item.price || '',
      plot_area: item.plot_area || '',
      property_type: item.property_type || 'Plot',
      description: item.description || '',
    });
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingListing) {
        await apiClient.patch(`/api/v1/dashboard/listings/${editingListing.id}`, formData);
      } else {
        await apiClient.post('/api/v1/dashboard/listings', formData);
      }
      setShowCreateModal(false);
      setEditingListing(null);
      setFormData(EMPTY_FORM);
      fetchTenantListings({ silent: true }); // Refresh inventory snapshot grid
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error executing resource allocation schema write.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    try {
      await apiClient.delete(`/api/v1/dashboard/listings/${item.id}`);
      fetchTenantListings({ silent: true });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete listing.');
    }
  };

  const copyStorefrontLink = (slug) => {
    const publicUrl = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    alert('Public interactive storefront link copied to clipboard.');
  };

  if (loading) return <Layout><div style={styles.centerText}>Syncing Enterprise Datasets...</div></Layout>;
  if (error) return <Layout><div style={styles.centerText}>System Error: {error}</div></Layout>;

  return (
    <Layout>
      <div style={styles.dashboardContainer}>
        {/* Upper Overview Metrics Action Panel bar */}
        <header style={styles.dashboardHeader}>
          <div>
            <h2 style={styles.headerTitle}>Verified Property Inventory</h2>
            <p style={styles.headerSub}>Manage your localized land plots, monitor tracking engagement, and map out geometric boundaries.</p>
          </div>
          <button onClick={openCreateModal} style={styles.primaryActionBtn}>
            + Register New Plot
          </button>
        </header>

        {/* Main Interactive Inventory Grid Matrix */}
        <div style={styles.gridContainer}>
          {listings.map((item) => (
            <div key={item.id} style={styles.listingCard}>
              <div style={styles.cardHeader}>
                <span style={{...styles.statusBadge, backgroundColor: item.status === 'active' ? '#e8f5e9' : '#fff3e0', color: item.status === 'active' ? '#2e7d32' : '#ef6c00'}}>
                  {item.status}
                </span>
                <span style={styles.propertyTypeLabel}>{item.property_type}</span>
              </div>
              <h4 style={styles.cardTitle}>{item.title}</h4>
              <p style={styles.cardAddress}>📍 {item.formatted_address || item.raw_address}</p>

              <div style={styles.metaRow}>
                <div><strong>Area:</strong> {item.plot_area || 'N/A'}</div>
                <div><strong>Valuation:</strong> ₹{parseFloat(item.price).toLocaleString('en-IN')}</div>
              </div>

              {/* Interaction Analytics Counter row */}
              <div style={styles.analyticsRow}>
                <span>📈 Views logged: <strong>{item.visit_count || 0}</strong></span>
              </div>

              <div style={styles.cardActions}>
                <button onClick={() => copyStorefrontLink(item.public_slug)} style={styles.secondaryBtn}>
                  🔗 Copy Link
                </button>
                <button
                  onClick={() => setActiveTracerListing(item)}
                  disabled={item.status !== 'active'}
                  style={{...styles.secondaryBtn, border: '1px solid #2563eb', color: '#2563eb'}}
                >
                  🗺️ Trace Perimeter
                </button>
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => setActiveMediaListing(item)} style={styles.secondaryBtn}>
                  🖼️ Photos
                </button>
                <button onClick={() => openEditModal(item)} style={styles.secondaryBtn}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(item)} style={{...styles.secondaryBtn, border: '1px solid #dc2626', color: '#dc2626'}}>
                  🗑️ Delete
                </button>
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => setActiveBuilderListing(item)} style={styles.secondaryBtn}>
                  🏗️ Builder Profile{item.builder_profile_id ? ` (${item.builder_moderation_status})` : ''}
                </button>
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div style={styles.emptyContainer}>No active listings cataloged inside this corporate dashboard context yet.</div>
        )}

        {/* 🛠️ MODAL LAYER A: Property Asset Registration Creator / Edit Drawer */}
        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3>{editingListing ? 'Edit Real Estate Asset' : 'Register Real Estate Asset'}</h3>
              <form onSubmit={handleFormSubmit} style={styles.formContainer}>
                <input type="text" name="title" placeholder="Listing Title Name (e.g., Omaxe Royal Villa 230)" value={formData.title} onChange={handleInputChange} required style={styles.input} />
                <input type="text" name="raw_address" placeholder="Raw Local Address (e.g., Pakhowal Road, near Canal, Ludhiana)" value={formData.raw_address} onChange={handleInputChange} required style={styles.input} />
                <input type="number" name="price" placeholder="Target Pricing Valuation (INR)" value={formData.price} onChange={handleInputChange} required style={styles.input} />
                <input type="text" name="plot_area" placeholder="Plot Dimensions / Area (e.g., 250 Sq Yards)" value={formData.plot_area} onChange={handleInputChange} style={styles.input} />
                <select name="property_type" value={formData.property_type} onChange={handleInputChange} style={styles.input}>
                  <option value="Plot">Plot Land Matrix</option>
                  <option value="Villa">Residential Villa</option>
                  <option value="Commercial">Commercial Complex</option>
                </select>
                <textarea name="description" placeholder="Comprehensive contextual sales descriptions..." value={formData.description} onChange={handleInputChange} style={{...styles.input, height: '80px'}} />

                <div style={styles.modalActions}>
                  <button type="button" onClick={() => { setShowCreateModal(false); setEditingListing(null); }} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" disabled={submitting} style={styles.submitBtn}>
                    {submitting ? 'Saving...' : editingListing ? 'Save Changes' : 'Add Property Row'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🛠️ MODAL LAYER B: Mapbox GL Vector Geometric Tracer Drawer overlay */}
        {activeTracerListing && (
          <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: '800px', width: '90%'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                <h3>Trace Geometry Framework — {activeTracerListing.title}</h3>
                <button onClick={() => setActiveTracerListing(null)} style={styles.cancelBtn}>Close Canvas</button>
              </div>
              <PlotBoundaryTracer
                listingId={activeTracerListing.id}
                centerLat={parseFloat(activeTracerListing.lat)}
                centerLng={parseFloat(activeTracerListing.lng)}
                onSaveSuccess={() => setActiveTracerListing(null)}
              />
            </div>
          </div>
        )}

        {/* 🛠️ MODAL LAYER C: Photo management */}
        {activeMediaListing && (
          <ListingMediaManager listing={activeMediaListing} onClose={() => setActiveMediaListing(null)} />
        )}

        {/* 🛠️ MODAL LAYER D: Builder profile link + moderation */}
        {activeBuilderListing && (
          <BuilderProfileManager
            listing={activeBuilderListing}
            currentUserRole={storedUser?.role}
            onClose={() => setActiveBuilderListing(null)}
            onUpdated={() => fetchTenantListings({ silent: true })}
          />
        )}
      </div>
    </Layout>
  );
}

const styles = {
  dashboardContainer: { fontFamily: 'system-ui, sans-serif' },
  dashboardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' },
  headerTitle: { margin: 0, fontSize: '24px', color: '#111' },
  headerSub: { margin: '4px 0 0 0', color: '#666', fontSize: '14px' },
  primaryActionBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  listingCard: { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', gap: '8px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  statusBadge: { fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' },
  propertyTypeLabel: { fontSize: '12px', color: '#666', fontWeight: '500' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '18px', color: '#111' },
  cardAddress: { margin: '0 0 12px 0', fontSize: '13px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', marginBottom: '4px' },
  analyticsRow: { fontSize: '13px', color: '#4b5563', borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginBottom: '4px' },
  cardActions: { display: 'flex', gap: '8px' },
  secondaryBtn: { flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'center' },
  emptyContainer: { textAlign: 'center', padding: '48px', color: '#888', fontStyle: 'italic', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '24px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelBtn: { padding: '8px 16px', border: 'none', backgroundColor: '#eee', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '8px 16px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  centerText: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '16px', color: '#555' }
};
