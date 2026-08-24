import React, { useState } from 'react';
import apiClient from '../api/apiClient';

export default function ChangePassword({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [loading, setLoading]                 = useState(false);
  const [statusMessage, setStatusMessage]     = useState(null);
  const [isError, setIsError]                 = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    try {
      setLoading(true);
      setStatusMessage(null);
      setIsError(false);
      await apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword });
      setStatusMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setIsError(true);
      setStatusMessage(err.response?.data?.error?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>

        {/* Gold top stripe */}
        <div style={S.stripe} />

        {/* Header */}
        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Account Security</p>
            <h3 style={S.title}>Change Password</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Status banner */}
        {statusMessage && (
          <div style={{
            ...S.banner,
            backgroundColor: isError ? '#fff5f5'  : '#ecfdf5',
            color:           isError ? '#c53030'  : '#059669',
            border: `1px solid ${isError ? '#fed7d7' : '#a7f3d0'}`,
          }}>
            <span style={{
              ...S.bannerIcon,
              backgroundColor: isError ? '#fecaca' : '#a7f3d0',
            }}>
              {isError ? '!' : '✓'}
            </span>
            {statusMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={S.input}
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={S.input}
            />
            <p style={S.hint}>Use at least 8 characters with a mix of letters and numbers.</p>
          </div>

          <div style={S.actions}>
            <button type="button" onClick={onClose} style={S.cancelBtn}>Cancel</button>
            <button
              type="submit"
              disabled={loading}
              style={{ ...S.submitBtn, opacity: loading ? 0.72 : 1 }}
            >
              {loading
                ? <span style={S.btnInner}><span style={S.spinner} /> Saving…</span>
                : 'Update Password'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: '20px',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '18px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)',
    overflow: 'hidden',
  },
  stripe: {
    height: '4px',
    background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)',
  },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: {
    margin: '0 0 4px', fontSize: '11px', fontWeight: '700',
    color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.5px',
  },
  title: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: '#f1f5f9', border: 'none', cursor: 'pointer',
    fontSize: '14px', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  banner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: '500',
    margin: '16px 26px 0',
  },
  bannerIcon: {
    width: '22px', height: '22px', borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '800', flexShrink: 0, color: '#0c1b2e',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '18px', padding: '20px 26px 26px' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: {
    fontSize: '11px', fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.7px',
  },
  input: {
    padding: '13px 15px', fontSize: '14px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd',
  },
  hint: { margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' },

  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
  cancelBtn: {
    padding: '11px 20px', borderRadius: '9px',
    border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '600',
  },
  submitBtn: {
    padding: '11px 24px', borderRadius: '9px', border: 'none',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
    boxShadow: '0 4px 12px rgba(12,27,46,0.22)',
  },
  btnInner: { display: 'flex', alignItems: 'center', gap: '8px' },
  spinner: {
    width: '13px', height: '13px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
};
