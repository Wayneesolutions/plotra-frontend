import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';
import ChangePassword from './ChangePassword.jsx';

// Wires POST /api/v1/auth/update-phone — previously this had NO UI anywhere.
// This is the single most important missing piece in the whole product: the
// entire pitch (both the dealer PDF and investor deck) is "list a property
// by texting it in," but a real dealer had no way to connect their own
// WhatsApp number without a developer calling the API for them directly.
export default function Settings({ bare = false }) {
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

  // WhatsApp numbers — owner-only, wires GET/POST/DELETE
  // /api/v1/dashboard/whatsapp-numbers. Distinct from "Connect Your
  // WhatsApp Number" above: that's a personal number for texting in
  // listings (users.phone), this is the tenant's buyer-facing number(s)
  // that inbound leads/messages route to. Capped by the plan
  // (plans.max_whatsapp_numbers) — the backend rejects an add past that,
  // surfaced below as a plain error message rather than blocked client-side,
  // so this doesn't silently drift out of sync if the plan changes.
  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [newNumberForm, setNewNumberForm] = useState({ whatsappNumber: '', label: '' });
  const [numberSubmitting, setNumberSubmitting] = useState(false);
  const [numberError, setNumberError] = useState(null);
  const [maxWhatsappNumbers, setMaxWhatsappNumbers] = useState(1);

  // Team list — owner-only, wires GET /api/v1/dashboard/users. Lets the
  // owner add/change a team member's phone after invite time (PATCH
  // /api/v1/dashboard/users/:id) — previously the only way to set
  // users.phone was at invite, so a mistyped or missing number was stuck.
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadTeamUsers = () => {
    setTeamLoading(true);
    apiClient.get('/api/v1/dashboard/users')
      .then((res) => setTeamUsers(res.data.users || []))
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  };

  useEffect(() => {
    setNumbersLoading(true);
    Promise.all([
      apiClient.get('/api/v1/dashboard/whatsapp-numbers'),
      apiClient.get('/api/v1/dashboard/billing/status'),
    ]).then(([numRes, billingRes]) => {
      setWhatsappNumbers(numRes.data.numbers || []);
      setMaxWhatsappNumbers(billingRes.data.billing?.max_whatsapp_numbers ?? 1);
    }).catch(() => {})
      .finally(() => setNumbersLoading(false));
  }, [storedUser?.role]);

  useEffect(() => {
    if (storedUser?.role !== 'owner') return;
    loadTeamUsers();
  }, [storedUser?.role]);

  // Pending agent signups — owner-only, wires GET/POST
  // /api/v1/dashboard/agent-signups. These are prospective agents who
  // texted "join as agent" on WhatsApp and finished the conversational
  // name/address collection (agentSignupController.js/agentSignupWorker.js)
  // — approving creates their users row and makes their phone immediately
  // live for the existing WhatsApp listing-intake flow.
  const [agentSignups, setAgentSignups] = useState([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [signupActionLoading, setSignupActionLoading] = useState(null);
  const [signupCredential, setSignupCredential] = useState(null);

  const loadAgentSignups = () => {
    setSignupsLoading(true);
    apiClient.get('/api/v1/dashboard/agent-signups')
      .then((res) => setAgentSignups(res.data.signups || []))
      .catch(() => {})
      .finally(() => setSignupsLoading(false));
  };

  useEffect(() => {
    if (storedUser?.role !== 'owner') return;
    loadAgentSignups();
  }, [storedUser?.role]);

  const handleApproveSignup = async (id) => {
    setSignupActionLoading(id);
    setSignupError(null);
    try {
      const res = await apiClient.post(`/api/v1/dashboard/agent-signups/${id}/approve`);
      setAgentSignups((prev) => prev.filter((s) => s.id !== id));
      setSignupCredential({ name: res.data.user.name, email: res.data.user.email, password: res.data.temporaryPassword });
      loadTeamUsers(); // the newly-approved agent now also shows up in Team Members
    } catch (err) {
      setSignupError(err.response?.data?.error?.message || 'Failed to approve this request.');
    } finally {
      setSignupActionLoading(null);
    }
  };

  const handleRejectSignup = async (id) => {
    if (!window.confirm('Reject this agent signup request?')) return;
    setSignupActionLoading(id);
    setSignupError(null);
    try {
      await apiClient.post(`/api/v1/dashboard/agent-signups/${id}/reject`);
      setAgentSignups((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setSignupError(err.response?.data?.error?.message || 'Failed to reject this request.');
    } finally {
      setSignupActionLoading(null);
    }
  };

  // Web chat activation code — owner-only, wires GET/POST
  // /api/v1/dashboard/web-chat-code(/regenerate). This is the code the
  // owner hands to whoever embeds the public web chat widget
  // (ChatWidget.jsx, at /widget) on their own site — entering it there
  // activates the widget for this tenant.
  const [webChatCode, setWebChatCode] = useState(null);
  const [webChatCodeLoading, setWebChatCodeLoading] = useState(false);
  const [webChatCodeError, setWebChatCodeError] = useState(null);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  useEffect(() => {
    if (storedUser?.role !== 'owner') return;
    setWebChatCodeLoading(true);
    apiClient.get('/api/v1/dashboard/web-chat-code')
      .then((res) => setWebChatCode(res.data.code))
      .catch(() => setWebChatCodeError('Failed to load your web chat code.'))
      .finally(() => setWebChatCodeLoading(false));
  }, [storedUser?.role]);

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerate your web chat code? The old code will stop working immediately.')) return;
    setRegeneratingCode(true);
    setWebChatCodeError(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/web-chat-code/regenerate');
      setWebChatCode(res.data.code);
    } catch (err) {
      setWebChatCodeError(err.response?.data?.error?.message || 'Failed to regenerate the code.');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const startEditPhone = (user) => {
    setEditingUserId(user.id);
    setEditPhoneValue(user.phone || '');
  };

  const cancelEditPhone = () => {
    setEditingUserId(null);
    setEditPhoneValue('');
  };

  const handleSavePhone = async (userId) => {
    setEditSubmitting(true);
    setTeamError(null);
    try {
      const res = await apiClient.patch(`/api/v1/dashboard/users/${userId}`, { phone: editPhoneValue.trim() || null });
      setTeamUsers((prev) => prev.map((u) => (u.id === userId ? res.data.user : u)));
      setEditingUserId(null);
      setEditPhoneValue('');
    } catch (err) {
      setTeamError(err.response?.data?.error?.message || 'Failed to update phone number.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddNumber = async (e) => {
    e.preventDefault();
    setNumberSubmitting(true);
    setNumberError(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/whatsapp-numbers', newNumberForm);
      setWhatsappNumbers((prev) => [...prev, res.data.number]);
      setNewNumberForm({ whatsappNumber: '', label: '' });
    } catch (err) {
      setNumberError(err.response?.data?.error?.message || 'Failed to add WhatsApp number.');
    } finally {
      setNumberSubmitting(false);
    }
  };

  const handleRemoveNumber = async (id) => {
    if (!window.confirm('Remove this WhatsApp number? Messages sent to it will stop routing to this account.')) return;
    try {
      await apiClient.delete(`/api/v1/dashboard/whatsapp-numbers/${id}`);
      setWhatsappNumbers((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setNumberError(err.response?.data?.error?.message || 'Failed to remove WhatsApp number.');
    }
  };

  const handleSetDefaultNumber = async (id) => {
    try {
      const res = await apiClient.patch(`/api/v1/dashboard/whatsapp-numbers/${id}/default`);
      setWhatsappNumbers((prev) => prev.map((n) => ({ ...n, is_default: n.id === res.data.number.id })));
    } catch (err) {
      setNumberError(err.response?.data?.error?.message || 'Failed to set default number.');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteResult(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/users/invite', inviteForm);
      setInviteResult(res.data);
      setInviteForm({ name: '', email: '', phone: '' });
      loadTeamUsers();
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
      // Keep localStorage in sync so the dashboard header reflects the new number immediately
      const saved = JSON.parse(localStorage.getItem('pve_user') || 'null');
      if (saved) localStorage.setItem('pve_user', JSON.stringify({ ...saved, phone: res.data.phone }));
      setStatusMessage('✅ WhatsApp number connected. Text your listing details to your Plotra WhatsApp number and it will show up here as a draft once approved.');
    } catch (err) {
      setIsError(true);
      setStatusMessage(`⚠️ ${err.response?.data?.error?.message || 'Something went wrong.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inner = (
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

        {storedUser?.role === 'owner' && (
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Web Chat Widget</h3>
            <p style={styles.cardHelp}>
              Embed Plotra's chat widget on your own website so you (or your team) can add listings
              by chatting, the same way you can over WhatsApp. Enter this code into the widget once
              to activate it for your account.
            </p>

            {webChatCodeError && <div style={styles.banner}>⚠️ {webChatCodeError}</div>}

            {webChatCodeLoading ? (
              <p style={styles.cardHelp}>Loading…</p>
            ) : webChatCode ? (
              <div style={styles.currentPhoneBox}>
                Your activation code: <code style={styles.codeBadge}>{webChatCode}</code>
              </div>
            ) : null}

            <button onClick={handleRegenerateCode} disabled={regeneratingCode} style={styles.secondaryBtn}>
              {regeneratingCode ? 'Regenerating…' : 'Regenerate Code'}
            </button>
          </section>
        )}

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
              <input type="tel" placeholder="Phone (optional)" value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} style={styles.input} />
              <span style={styles.fieldNote}>Add their WhatsApp number to let them create listings by texting Plotra directly.</span>
              <button type="submit" disabled={inviteSubmitting} style={{ ...styles.submitBtn, alignSelf: 'flex-start' }}>
                {inviteSubmitting ? 'Inviting…' : 'Invite'}
              </button>
            </form>

            <div style={styles.teamListWrap}>
              <h4 style={styles.teamListTitle}>Team Members</h4>
              {teamError && <div style={styles.banner}>⚠️ {teamError}</div>}
              {teamLoading ? (
                <p style={styles.cardHelp}>Loading…</p>
              ) : teamUsers.length === 0 ? (
                <p style={styles.cardHelp}>No team members yet.</p>
              ) : (
                <div style={styles.numberList}>
                  {teamUsers.map((u) => (
                    <div key={u.id} style={styles.numberRow}>
                      <div>
                        <strong>{u.name}</strong>
                        <span style={styles.numberLabel}> — {u.email}</span>
                      </div>
                      {editingUserId === u.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="tel"
                            autoFocus
                            value={editPhoneValue}
                            onChange={(e) => setEditPhoneValue(e.target.value)}
                            placeholder="e.g. 9876543210"
                            style={styles.editPhoneInput}
                          />
                          <button onClick={() => handleSavePhone(u.id)} disabled={editSubmitting} style={styles.linkBtn}>Save</button>
                          <button onClick={cancelEditPhone} style={{ ...styles.linkBtn, color: '#6b7280' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: u.phone ? '#111827' : '#9ca3af' }}>{u.phone || 'No phone set'}</span>
                          <button onClick={() => startEditPhone(u)} style={styles.linkBtn}>Edit</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {storedUser?.role === 'owner' && (
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Pending Agent Signups</h3>
            <p style={styles.cardHelp}>
              Prospective agents who texted "join as agent" on WhatsApp and finished providing
              their details. Approving creates their login and makes their number immediately
              live for listing intake — no separate activation step.
            </p>

            {signupCredential && (
              <div style={styles.currentPhoneBox}>
                ✅ Approved <strong>{signupCredential.name}</strong>. Dashboard login (optional):{' '}
                {signupCredential.email} / <code style={styles.codeBadge}>{signupCredential.password}</code>
              </div>
            )}
            {signupError && <div style={styles.banner}>⚠️ {signupError}</div>}

            {signupsLoading ? (
              <p style={styles.cardHelp}>Loading…</p>
            ) : agentSignups.length === 0 ? (
              <p style={styles.cardHelp}>No pending signups.</p>
            ) : (
              <div style={styles.numberList}>
                {agentSignups.map((s) => (
                  <div key={s.id} style={styles.numberRow}>
                    <div>
                      <strong>{s.name}</strong>
                      <span style={styles.numberLabel}> — {s.phone}</span>
                      <div style={styles.signupAddress}>{s.address}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveSignup(s.id)}
                        disabled={signupActionLoading === s.id}
                        style={{ ...styles.linkBtn, color: '#16a34a', opacity: signupActionLoading === s.id ? 0.6 : 1 }}
                      >
                        {signupActionLoading === s.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectSignup(s.id)}
                        disabled={signupActionLoading === s.id}
                        style={{ ...styles.linkBtn, color: '#dc2626', opacity: signupActionLoading === s.id ? 0.6 : 1 }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {maxWhatsappNumbers >= 1 && (
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Buyer-Facing WhatsApp Numbers</h3>
            <p style={styles.cardHelp}>
              The number(s) buyers message when they tap "Get details on WhatsApp" on a listing, or when
              a WhatsApp message routes to your account. How many you can add depends on your plan.
            </p>

            {numberError && <div style={styles.banner}>⚠️ {numberError}</div>}

            {numbersLoading ? (
              <p style={styles.cardHelp}>Loading…</p>
            ) : whatsappNumbers.length === 0 ? (
              <p style={styles.cardHelp}>No numbers added yet.</p>
            ) : (
              <div style={styles.numberList}>
                {whatsappNumbers.map((n) => (
                  <div key={n.id} style={styles.numberRow}>
                    <div>
                      <strong>{n.whatsapp_number}</strong>
                      {n.label && <span style={styles.numberLabel}> — {n.label}</span>}
                      {n.is_default && <span style={styles.defaultTag}>Default</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!n.is_default && (
                        <button onClick={() => handleSetDefaultNumber(n.id)} style={styles.linkBtn}>Make default</button>
                      )}
                      <button onClick={() => handleRemoveNumber(n.id)} style={{ ...styles.linkBtn, color: '#dc2626' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddNumber} style={{ ...styles.form, marginTop: '14px' }}>
              <input
                required
                type="tel"
                placeholder="e.g. 9876543210"
                value={newNumberForm.whatsappNumber}
                onChange={(e) => setNewNumberForm({ ...newNumberForm, whatsappNumber: e.target.value })}
                style={styles.input}
              />
              <input
                placeholder="Label (optional, e.g. Front desk)"
                value={newNumberForm.label}
                onChange={(e) => setNewNumberForm({ ...newNumberForm, label: e.target.value })}
                style={styles.input}
              />
              <button type="submit" disabled={numberSubmitting} style={styles.submitBtn}>
                {numberSubmitting ? 'Adding…' : 'Add Number'}
              </button>
            </form>
          </section>
        )}

        {showPasswordModal && <ChangePassword onClose={() => setShowPasswordModal(false)} />}
      </div>
  );

  return bare ? inner : <Layout>{inner}</Layout>;
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
  fieldNote: { margin: '-4px 0 0', fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' },
  teamListWrap: { marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
  teamListTitle: { margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#374151' },
  editPhoneInput: { padding: '7px 9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '150px' },
  numberList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' },
  numberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '13px' },
  numberLabel: { color: '#6b7280' },
  signupAddress: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  defaultTag: { marginLeft: '8px', fontSize: '10px', fontWeight: '700', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 7px', borderRadius: '10px', textTransform: 'uppercase' },
  linkBtn: { border: 'none', background: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', padding: 0 },
  input: { flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  submitBtn: { padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  secondaryBtn: { padding: '9px 16px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' },
};
