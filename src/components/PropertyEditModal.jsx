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
    // Sale / rent / lease (Nov 2026).
    listing_type: listing.listing_type || 'sale',
    monthly_rent: listing.monthly_rent ?? '',
    security_deposit: listing.security_deposit ?? '',
    maintenance_charges: listing.maintenance_charges ?? '',
    furnishing: listing.furnishing || '',
    preferred_tenant: listing.preferred_tenant || '',
    available_from: listing.available_from || '',
    lease_term: listing.lease_term || '',
    lock_in: listing.lock_in || '',
    rent_escalation_percent: listing.rent_escalation_percent ?? '',
    property_subtype: listing.property_subtype || '',
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
      const isRental = form.listing_type !== 'sale';
      // Empty inputs go as null (clears the value); a rental never sends a
      // sale price and a sale never sends rent fields.
      const nul = (v) => (v === '' ? null : v);
      const payload = {
        ...form,
        price: isRental ? null : nul(form.price),
        monthly_rent: isRental ? nul(form.monthly_rent) : null,
        security_deposit: isRental ? nul(form.security_deposit) : null,
        maintenance_charges: isRental ? nul(form.maintenance_charges) : null,
        rent_escalation_percent: form.listing_type === 'lease' ? nul(form.rent_escalation_percent) : null,
        furnishing: nul(form.furnishing),
        preferred_tenant: nul(form.preferred_tenant),
        available_from: nul(form.available_from),
        lease_term: form.listing_type === 'lease' ? nul(form.lease_term) : null,
        lock_in: form.listing_type === 'lease' ? nul(form.lock_in) : null,
        property_subtype: nul(form.property_subtype),
      };
      await apiClient.patch(`/api/v1/dashboard/listings/${listing.id}`, payload);
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

          <MField label="Listing For">
            <div style={S.segment}>
              {[['sale', 'Sale'], ['rent', 'Rent'], ['lease', 'Lease']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, listing_type: value }))}
                  style={{ ...S.segBtn, ...(form.listing_type === value ? S.segBtnOn : {}) }}
                >
                  {label}
                </button>
              ))}
            </div>
          </MField>

          {form.listing_type === 'sale' ? (
            <div style={S.row2}>
              <MField label="Price (₹)">
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Leave empty for 'on request'" style={S.fi} />
              </MField>
              <MField label="Plot Area">
                <input type="text" name="plot_area" value={form.plot_area} onChange={handleChange} style={S.fi} />
              </MField>
            </div>
          ) : (
            <>
              <div style={S.row2}>
                <MField label={form.listing_type === 'lease' ? 'Lease Rent / Month (₹)' : 'Monthly Rent (₹)'}>
                  <input type="number" name="monthly_rent" value={form.monthly_rent} onChange={handleChange} required style={S.fi} />
                </MField>
                <MField label="Security Deposit (₹)">
                  <input type="number" name="security_deposit" value={form.security_deposit} onChange={handleChange} style={S.fi} />
                </MField>
              </div>
              <div style={S.row2}>
                <MField label="Maintenance / Month (₹)">
                  <input type="number" name="maintenance_charges" value={form.maintenance_charges} onChange={handleChange} style={S.fi} />
                </MField>
                <MField label="Area / Size">
                  <input type="text" name="plot_area" value={form.plot_area} onChange={handleChange} style={S.fi} />
                </MField>
              </div>
              <div style={S.row2}>
                <MField label="Furnishing">
                  <select name="furnishing" value={form.furnishing} onChange={handleChange} style={S.fi}>
                    <option value="">Not specified</option>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-furnished</option>
                    <option value="furnished">Furnished</option>
                  </select>
                </MField>
                <MField label="Available From">
                  <input type="text" name="available_from" value={form.available_from} onChange={handleChange} placeholder="e.g. Immediately, 1 Dec" style={S.fi} />
                </MField>
              </div>
              {form.listing_type === 'rent' ? (
                <MField label="Preferred Tenant">
                  <select name="preferred_tenant" value={form.preferred_tenant} onChange={handleChange} style={S.fi}>
                    <option value="">Any / not specified</option>
                    <option value="family">Family</option>
                    <option value="bachelors">Bachelors</option>
                    <option value="company">Company</option>
                    <option value="any">Anyone</option>
                  </select>
                </MField>
              ) : (
                <div style={S.row3}>
                  <MField label="Lease Term">
                    <input type="text" name="lease_term" value={form.lease_term} onChange={handleChange} placeholder="e.g. 9 years" style={S.fi} />
                  </MField>
                  <MField label="Lock-in">
                    <input type="text" name="lock_in" value={form.lock_in} onChange={handleChange} placeholder="e.g. 3 years" style={S.fi} />
                  </MField>
                  <MField label="Yearly Increase %">
                    <input type="number" name="rent_escalation_percent" value={form.rent_escalation_percent} onChange={handleChange} style={S.fi} />
                  </MField>
                </div>
              )}
            </>
          )}

          <div style={S.row2}>
            <MField label="Property Type">
              <select name="property_type" value={form.property_type} onChange={handleChange} style={S.fi}>
                <option value="Plot">Plot</option>
                <option value="Flat">Flat</option>
                <option value="Villa">Villa / House</option>
                <option value="Commercial">Commercial</option>
              </select>
            </MField>
            <MField label="Kind (optional)">
              <select name="property_subtype" value={form.property_subtype} onChange={handleChange} style={S.fi}>
                <option value="">Not specified</option>
                {['Independent House', 'Independent Floor', 'Flat', 'Room', 'PG', 'Shop', 'Showroom', 'SCO', 'Office', 'Warehouse', 'Factory', 'Land', 'Plot', 'Other'].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </MField>
          </div>

          <div style={S.row2}>
            <MField label="Status">
              <select name="status" value={form.status} onChange={handleChange} style={S.fi}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sold">{form.listing_type === 'sale' ? 'Sold' : form.listing_type === 'lease' ? 'Leased out' : 'Rented out'}</option>
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
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.2px' },
  title: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', flexShrink: 0,
  },
  banner: { margin: '14px 24px 0', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' },
  segment: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' },
  segBtn: { padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  segBtnOn: { background: '#ffffff', color: '#0c1b2e', boxShadow: '0 1px 4px rgba(6,12,24,0.12)' },
  fi: { padding: '11px 13px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px', width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd' },
  footRow: { display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' },
  deleteBtn: { padding: '10px 16px', borderRadius: '9px', border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },
  secondaryBtn: { padding: '10px 16px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  cancelBtn: { padding: '10px 16px', borderRadius: '9px', border: 'none', background: '#f1f5f9', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  saveBtn: { padding: '10px 18px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, #c8a96e, #e8c98e)', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};
