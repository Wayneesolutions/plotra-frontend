import React, { useState } from 'react';
import apiClient from '../api/apiClient';

// Wires POST /api/v1/dashboard/listings/:id/builder-profile and PATCH
// /api/v1/dashboard/builder-profiles/:id/moderation — previously no UI at
// all despite three layers of legal-risk safeguards built server-side
// (see the migration header on builder_profiles — this human moderation
// step is real defamation-risk mitigation, not a formality).
export default function BuilderProfileManager({ listing, currentUserRole, onClose, onUpdated }) {
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [linked, setLinked] = useState(
    listing.builder_profile_id
      ? { id: listing.builder_profile_id, company_name: listing.builder_company_name, moderation_status: listing.builder_moderation_status }
      : null
  );

  const handleLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post(`/api/v1/dashboard/listings/${listing.id}/builder-profile`, { companyName });
      setLinked(res.data.builderProfile);
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to link builder profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const moderate = async (status) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/api/v1/dashboard/builder-profiles/${linked.id}/moderation`, { status });
      setLinked((prev) => ({ ...prev, moderation_status: res.data.builderProfile.moderation_status }));
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update moderation status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Builder Profile — {listing.title}</h3>
          <button onClick={onClose} style={styles.closeX}>&times;</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!linked ? (
          <form onSubmit={handleLink} style={styles.form}>
            <p style={styles.helpText}>
              Link this listing to a builder/developer company. If a profile for this company already exists it's
              reused instantly; a brand-new company name kicks off AI research (RERA/MCA/court records/news, all
              cited) — takes a few minutes.
            </p>
            <input
              required
              placeholder="Builder / developer company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={styles.input}
            />
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Linking…' : 'Link Builder Profile'}
            </button>
          </form>
        ) : (
          <div>
            <p style={styles.linkedName}>{linked.company_name}</p>
            <p style={styles.helpText}>
              Moderation status: <strong>{linked.moderation_status}</strong>. Publishing makes the researched,
              cited claims visible to buyers on the public listing page — this is the required human sign-off,
              not a formality.
            </p>
            {currentUserRole === 'owner' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button disabled={submitting || linked.moderation_status === 'published'} onClick={() => moderate('published')} style={styles.approveBtn}>Publish</button>
                <button disabled={submitting || linked.moderation_status === 'rejected'} onClick={() => moderate('rejected')} style={styles.rejectBtn}>Reject</button>
              </div>
            ) : (
              <p style={styles.helpText}>Only the account owner can publish or reject a builder profile.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '440px', padding: '20px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { margin: 0, fontSize: '16px', color: '#111827', fontWeight: '600' },
  closeX: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  helpText: { fontSize: '12px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 12px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px' },
  submitBtn: { padding: '9px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  linkedName: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' },
  approveBtn: { padding: '8px 14px', border: '1px solid #16a34a', color: '#16a34a', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  rejectBtn: { padding: '8px 14px', border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
};
