import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';
import ChangePassword from './ChangePassword.jsx';

// Wires POST /api/v1/auth/update-phone — previously this had NO UI anywhere.
// This is the single most important missing piece in the whole product: the
// entire pitch (both the dealer PDF and investor deck) is "list a property
// by texting it in," but a real dealer had no way to connect their own
// WhatsApp number without a developer calling the API for them directly.
export default function Settings() {
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');
  const [phone, setPhone] = useState('');
  const [linkedPhone, setLinkedPhone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Team invite — owner-only, wires POST /api/v1/dashboard/users/invite
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '' });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteResult(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/users/invite', inviteForm);
      setInviteResult(res.data);
      setInviteForm({ name: '', email: '', phone: '' });
    } catch (err) {
      setInviteError(err.response?.data?.error?.message || 'Failed to invite team member.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);
      setIsError(false);

      const res = await apiClient.post('/api/v1/auth/update-phone', { phone: phone.trim() });
      setLinkedPhone(res.data.phone);
      setPhone('');
      setStatusMessage('✅ WhatsApp number connected. Text your listing details to your Plotra WhatsApp number and it will show up here as a draft once approved.');
    } catch (err) {
      setIsError(true);
      setStatusMessage(`⚠️ ${err.response?.data?.error?.message || 'Something went wrong.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Settings</h2>

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Connect Your WhatsApp Number</h3>
          <p style={styles.cardHelp}>
            This is the number you'll text listings to. Once connected, any WhatsApp message from this
            number to your Plotra number is recognized as a listing you're creating — not a buyer inquiry.
          </p>

          {linkedPhone && (
            <div style={styles.currentPhoneBox}>Currently connected: <strong>{linkedPhone}</strong></div>
          )}
          {storedUser?.phone && !linkedPhone && (
            <div style={styles.currentPhoneBox}>Currently connected: <strong>{storedUser.phone}</strong></div>
          )}

          {statusMessage && (
            <div style={{ ...styles.banner, backgroundColor: isError ? '#fef2f2' : '#f0fdf4', color: isError ? '#991b1b' : '#166534' }}>
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210 or +91 98765 43210"
              style={styles.input}
              required
            />
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Connecting…' : 'Connect Number'}
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Password</h3>
          <p style={styles.cardHelp}>Change the password you use to log in to this dashboard.</p>
          <button onClick={() => setShowPasswordModal(true)} style={styles.secondaryBtn}>Change Password</button>
        </section>

        {storedUser?.role === 'owner' && (
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Invite a Team Member</h3>
            <p style={styles.cardHelp}>
              Adds an agent under your account. They get their own login and can optionally connect their
              own WhatsApp number for listing intake, same as you did above.
            </p>

            {inviteResult && (
              <div style={styles.currentPhoneBox}>
                ✅ Invited <strong>{inviteResult.user.email}</strong>. Temporary password:{' '}
                <code style={styles.codeBadge}>{inviteResult.temporaryPassword}</code> (also emailed, if SMTP is configured).
              </div>
            )}
            {inviteError && <div style={styles.banner}>⚠️ {inviteError}</div>}

            <form onSubmit={handleInviteSubmit} style={{ ...styles.form, flexDirection: 'column' }}>
              <input required placeholder="Name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} style={styles.input} />
              <input required type="email" placeholder="Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} style={styles.input} />
              <input placeholder="Phone (optional)" value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} style={styles.input} />
              <button type="submit" disabled={inviteSubmitting} style={{ ...styles.submitBtn, alignSelf: 'flex-start' }}>
                {inviteSubmitting ? 'Inviting…' : 'Invite'}
              </button>
            </form>
          </section>
        )}

        {showPasswordModal && <ChangePassword onClose={() => setShowPasswordModal(false)} />}
      </div>
    </Layout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '16px', color: '#111827' },
  cardHelp: { margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
  currentPhoneBox: { backgroundColor: '#f0fdf4', color: '#166534', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' },
  codeBadge: { backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' },
  banner: { padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' },
  form: { display: 'flex', gap: '10px' },
  input: { flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  submitBtn: { padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  secondaryBtn: { padding: '9px 16px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' },
};
