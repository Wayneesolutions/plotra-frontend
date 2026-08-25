import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

// Wires GET/POST/DELETE /api/v1/dashboard/listings/:id/media — previously
// unused by the frontend entirely (no upload UI existed anywhere).
export default function ListingMediaManager({ listing, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/v1/dashboard/listings/${listing.id}/media`);
      setPhotos(res.data.photo_urls || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load photos.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await apiClient.post(`/api/v1/dashboard/listings/${listing.id}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotos(res.data.photo_urls || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (url) => {
    if (!window.confirm('Remove this photo?')) return;
    try {
      const res = await apiClient.delete(`/api/v1/dashboard/listings/${listing.id}/media`, { data: { url } });
      setPhotos(res.data.photo_urls || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete photo.');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Photos — {listing.title}</h3>
          <button onClick={onClose} style={styles.closeX}>&times;</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.uploadBtn}>
          {uploading ? 'Uploading…' : '+ Upload Photo (JPEG/PNG/WebP, up to 10)'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} disabled={uploading} style={{ display: 'none' }} />
        </label>

        {loading ? (
          <p style={styles.emptyText}>Loading photos…</p>
        ) : photos.length === 0 ? (
          <p style={styles.emptyText}>No photos uploaded yet.</p>
        ) : (
          <div style={styles.grid}>
            {photos.map((url) => (
              <div key={url} style={styles.photoCard}>
                <img src={url} alt="" style={styles.photoImg} />
                <button onClick={() => handleDelete(url)} style={styles.deleteBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto', padding: '20px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '16px', color: '#111827', fontWeight: '600' },
  closeX: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' },
  uploadBtn: { display: 'block', textAlign: 'center', padding: '10px', border: '1px dashed #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', margin: '24px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
  photoCard: { position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' },
  photoImg: { width: '100%', height: '100px', objectFit: 'cover', display: 'block' },
  deleteBtn: { width: '100%', padding: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
};
