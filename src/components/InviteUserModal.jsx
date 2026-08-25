import React, { useState } from 'react';
import apiClient from '../api/apiClient';

/**
 * Gap #7: the backend invite endpoint (POST /api/v1/dashboard/users/invite)
 * already existed — this modal is the missing frontend for it. Same modal
 * pattern as ChangePassword.jsx/BillingModal.jsx.
 */
export default function InviteUserModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [credential, setCredential] = useState(null);

  const setField = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/users/invite', form);
      setCredential({
        email: res.data.user.email,
        password: res.data.temporaryPassword,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to invite this team member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />

        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Team</p>
            <h3 style={S.title}>Invite a Team Member</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={S.body}>
          {credential ? (
            <div>
              <p style={S.successText}>
                Account created for <strong>{credential.email}</strong>. Share this temporary
                password with them directly — it will not be shown again.
              </p>
              <div style={S.credBox}>
                <span style={S.credLabel}>Temporary Password</span>
                <span style={S.credValue}>{credential.password}</span>
              </div>
              <button onClick={onClose} style={S.doneBtn}>Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={S.form}>
              <p style={S.hint}>
                They'll be added as an <strong>agent</strong> under your account, with their own
                login — able to add and manage listings, but not billing or team management.
              </p>

              {error && <div style={S.errorBox}>{error}</div>}

              <label style={S.field}>
                <span style={S.label}>Full Name</span>
                <input style={S.input} type="text" required value={form.name} onChange={setField('name')} placeholder="e.g. Ramanpreet Kaur" />
              </label>
              <label style={S.field}>
                <span style={S.label}>Email</span>
                <input style={S.input} type="email" required value={form.email} onChange={setField('email')} placeholder="agent@example.com" />
              </label>

              <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Sending invite…' : 'Send Invite'}
              </button>
            </form>
          )}
        </div>
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
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '440px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.5px' },
  title: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { padding: '20px 26px 26px' },
  hint: { margin: '0 0 16px', fontSize: '13px', color: '#64748b', lineHeight: '1.6' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px' },
  input: {
    padding: '11px 13px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box',
  },
  errorBox: {
    backgroundColor: '#fff5f5', color: '#c53030', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px', border: '1px solid #fed7d7',
  },
  submitBtn: {
    padding: '12px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  successText: { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' },
  credBox: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '14px 16px', marginBottom: '16px',
  },
  credLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  credValue: { fontSize: '16px', fontWeight: '700', color: '#0c1b2e', fontFamily: 'monospace' },
  doneBtn: {
    width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
};
