import React, { useState } from 'react';
import apiClient from '../api/apiClient';

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

export default function PropertyEditModal({ listing, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: listing.title || '',
    raw_address: listing.raw_address || '',
    price: listing.price || '',
    plot_area: listing.plot_area || '',
    property_type: listing.property_type || 'Plot',
    description: listing.description || '',
    status: listing.status === 'pending' ? 'active' : listing.status,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/api/v1/dashboard/listings/${listing.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateToggle = async () => {
    const nextStatus = form.status === 'inactive' ? 'active' : 'inactive';
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/api/v1/dashboard/listings/${listing.id}`, { status: nextStatus });
      setForm((p) => ({ ...p, status: nextStatus }));
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${listing.title}"? This cannot be undone — view history for this listing will also be removed.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/api/v1/dashboard/listings/${listing.id}`);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete listing.');
      setDeleting(false);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />
        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Edit Listing</p>
            <h3 style={S.title}>{listing.title}</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {error && <div style={S.banner}>{error}</div>}

        <form onSubmit={handleSave} style={S.form}>
          <MField label="Property Title">
            <input type="text" name="title" value={form.title} onChange={handleChange} required style={S.fi} />
          </MField>

          <MField label="Full Address">
            <input type="text" name="raw_address" value={form.raw_address} onChange={handleChange} required style={S.fi} />
          </MField>

          <div style={S.row2}>
            <MField label="Price (₹)">
              <input type="number" name="price" value={form.price} onChange={handleChange} required style={S.fi} />
            </MField>
            <MField label="Plot Area">
              <input type="text" name="plot_area" value={form.plot_area} onChange={handleChange} style={S.fi} />
            </MField>
          </div>

          <div style={S.row2}>
            <MField label="Property Type">
              <select name="property_type" value={form.property_type} onChange={handleChange} style={S.fi}>
                <option value="Plot">Plot</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
              </select>
            </MField>
            <MField label="Status">
              <select name="status" value={form.status} onChange={handleChange} style={S.fi}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sold">Sold</option>
              </select>
            </MField>
          </div>

          <MField label="Description">
            <textarea name="description" value={form.description} onChange={handleChange}
              style={{ ...S.fi, height: '80px', resize: 'vertical' }} />
          </MField>

          <div style={S.footRow}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              style={S.deleteBtn}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={handleDeactivateToggle}
              disabled={saving || deleting}
              style={S.secondaryBtn}
            >
              {form.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
            </button>
            <button type="button" onClick={onClose} style={S.cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving || deleting} style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: '20px', backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '520px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, oklch(0.7 0.184 33.5) 0%, oklch(0.8 0.15 40) 50%, oklch(0.7 0.184 33.5) 100%)' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: 'oklch(0.7 0.184 33.5)', textTransform: 'uppercase', letterSpacing: '1.2px' },
  title: { margin: 0, fontSize: '18px', fontWeight: '800', color: 'oklch(0.219 0.032 264.2)' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', flexShrink: 0,
  },
  banner: { margin: '14px 24px 0', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', backgroundColor: 'oklch(0.577 0.245 27.325 / 0.06)', color: 'oklch(0.55 0.22 27.325)', border: '1px solid oklch(0.577 0.245 27.325 / 0.25)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fi: { padding: '11px 13px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px', width: '100%', color: 'oklch(0.219 0.032 264.2)', backgroundColor: '#fafbfd' },
  footRow: { display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' },
  deleteBtn: { padding: '10px 16px', borderRadius: '9px', border: '1.5px solid oklch(0.577 0.245 27.325 / 0.5)', background: '#fff', color: 'oklch(0.577 0.245 27.325)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },
  secondaryBtn: { padding: '10px 16px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fff', color: 'oklch(0.219 0.032 264.2)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  cancelBtn: { padding: '10px 16px', borderRadius: '9px', border: 'none', background: '#f1f5f9', color: 'oklch(0.219 0.032 264.2)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  saveBtn: { padding: '10px 18px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, oklch(0.7 0.184 33.5), oklch(0.8 0.15 40))', color: 'oklch(0.219 0.032 264.2)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};
