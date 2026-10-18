import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Super-admin "Support" tab — people the WhatsApp assistant flagged as
 * needing a human: agents with a problem, anyone asking for a call back,
 * complaints. The team calls/WhatsApps them, marks the request contacted,
 * then closes it. "View chat" shows the recent WhatsApp conversation so
 * whoever calls already knows what it's about.
 */

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'closed', label: 'Closed' },
  { key: '', label: 'All' },
];
const STATUS_PILL = {
  open:      { background: '#fee2e2', color: '#b91c1c' },
  contacted: { background: '#fef3c7', color: '#92400e' },
  closed:    { background: '#f1f5f9', color: '#475569' },
};
const KIND_LABEL = { problem: 'Needs help', callback: 'Call back', complaint: 'Complaint' };
const AUDIENCE_LABEL = { agent: 'Agent', visitor: 'New contact', buyer: 'Buyer' };

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString();
}

function digits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default function AdminSupportRequests({ showToast }) {
  const [filter, setFilter] = useState('open');
  const [requests, setRequests] = useState([]);
  const [byStatus, setByStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [notes, setNotes] = useState({});      // id -> draft note
  const [chat, setChat] = useState({});        // id -> conversation[] | 'loading'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/support-requests', { params: filter ? { status: filter } : {} });
      setRequests(res.data.requests || []);
      setByStatus(res.data.byStatus || {});
    } catch {
      showToast('Failed to load support requests.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const update = async (r, patch, okMsg) => {
    setBusy(r.id);
    try {
      await apiClient.patch(`/api/v1/admin/support-requests/${r.id}`, patch);
      if (okMsg) showToast(okMsg);
      await load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleChat = async (r) => {
    if (chat[r.id]) { setChat((c) => ({ ...c, [r.id]: undefined })); return; }
    setChat((c) => ({ ...c, [r.id]: 'loading' }));
    try {
      const res = await apiClient.get(`/api/v1/admin/support-requests/${r.id}`);
      setChat((c) => ({ ...c, [r.id]: res.data.conversation || [] }));
    } catch {
      setChat((c) => ({ ...c, [r.id]: undefined }));
      showToast('Failed to load the conversation.', 'error');
    }
  };

  return (
    <section style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Support</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            People the WhatsApp assistant flagged for a human. Contact them, then mark it done.
          </p>
        </div>
        <button style={S.btn} onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...S.btn, ...(filter === f.key ? S.btnActive : {}) }}>
            {f.label}{f.key && byStatus[f.key] != null ? ` (${byStatus[f.key]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : requests.length === 0 ? (
        <p style={{ color: '#64748b' }}>{filter === 'open' ? 'Nobody is waiting. 🎉' : 'Nothing here.'}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {requests.map((r) => {
            const note = notes[r.id] ?? r.admin_notes ?? '';
            const conv = chat[r.id];
            return (
              <div key={r.id} style={{ ...S.card, ...(r.status === 'open' ? S.cardOpen : {}) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ ...S.pill, ...(r.kind === 'complaint' ? S.pillComplaint : S.pillKind) }}>{KIND_LABEL[r.kind] || r.kind}</span>
                    <span style={{ fontWeight: 700 }}>{r.name || 'Unknown'}</span>
                    <span style={S.meta0}>{AUDIENCE_LABEL[r.audience] || r.audience}{r.tenant_name ? ` · ${r.tenant_name}` : ''}</span>
                  </div>
                  <span style={{ ...S.pill, ...(STATUS_PILL[r.status] || {}) }}>{r.status}</span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.phone}</span>
                  <a href={`https://wa.me/${digits(r.phone)}`} target="_blank" rel="noopener noreferrer" style={{ ...S.btn, ...S.btnWa }}>WhatsApp</a>
                  <a href={`tel:${r.phone}`} style={S.btn}>Call</a>
                </div>

                {r.summary && <div style={{ ...S.meta, color: '#0f172a', fontSize: 14 }}>{r.summary}</div>}
                {r.last_message && <div style={S.quote}>“{r.last_message}”</div>}
                <div style={S.meta}>
                  {r.message_count > 1 ? `${r.message_count} messages · ` : ''}Last update {timeAgo(r.updated_at)}
                  {r.contacted_at ? ` · Contacted ${timeAgo(r.contacted_at)}${r.contacted_by_name ? ` by ${r.contacted_by_name}` : ''}` : ''}
                </div>

                <textarea
                  value={note}
                  placeholder="Notes for the team (what was done, what's pending)…"
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  style={S.textarea}
                  rows={2}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {note !== (r.admin_notes ?? '') && (
                    <button style={S.btn} disabled={busy === r.id} onClick={() => update(r, { admin_notes: note }, 'Note saved.')}>Save note</button>
                  )}
                  {r.status === 'open' && (
                    <button style={{ ...S.btn, ...S.btnActive }} disabled={busy === r.id}
                      onClick={() => update(r, { status: 'contacted', ...(note !== (r.admin_notes ?? '') ? { admin_notes: note } : {}) }, 'Marked as contacted.')}>
                      Mark contacted
                    </button>
                  )}
                  {r.status !== 'closed' && (
                    <button style={S.btn} disabled={busy === r.id}
                      onClick={() => update(r, { status: 'closed', ...(note !== (r.admin_notes ?? '') ? { admin_notes: note } : {}) }, 'Closed.')}>
                      Close
                    </button>
                  )}
                  {r.status === 'closed' && (
                    <button style={S.btn} disabled={busy === r.id} onClick={() => update(r, { status: 'open' })}>Reopen</button>
                  )}
                  <button style={S.btnLink} onClick={() => toggleChat(r)}>
                    {conv ? 'Hide chat' : 'View chat'}
                  </button>
                </div>

                {conv === 'loading' && <div style={S.meta}>Loading conversation…</div>}
                {Array.isArray(conv) && (
                  <div style={S.chat}>
                    {conv.length === 0 ? <div style={S.meta}>No messages saved.</div> : conv.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: m.direction === 'inbound' ? 'flex-start' : 'flex-end' }}>
                        <div style={{ ...S.bubble, ...(m.direction === 'inbound' ? S.bubbleIn : S.bubbleOut) }}>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                          <div style={S.bubbleTime}>{m.direction === 'inbound' ? (r.name || 'Them') : 'Plotraa'} · {new Date(m.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const S = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' },
  cardOpen: { borderLeft: '4px solid #ef4444' },
  meta0: { fontSize: 13, color: '#64748b' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 6 },
  quote: { fontSize: 13, color: '#334155', marginTop: 6, background: '#f8fafc', borderRadius: 8, padding: '8px 10px', whiteSpace: 'pre-wrap' },
  pill: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999 },
  pillKind: { background: '#e0f2fe', color: '#075985' },
  pillComplaint: { background: '#fee2e2', color: '#b91c1c' },
  btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#0f172a', textDecoration: 'none', display: 'inline-block' },
  btnActive: { background: '#0c1b2e', color: '#fff', borderColor: '#0c1b2e' },
  btnWa: { background: '#16a34a', color: '#fff', borderColor: '#16a34a' },
  btnLink: { padding: '8px 4px', border: 'none', background: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  textarea: { width: '100%', marginTop: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  chat: { marginTop: 12, display: 'grid', gap: 6, maxHeight: 360, overflowY: 'auto', background: '#f8fafc', borderRadius: 10, padding: 10 },
  bubble: { maxWidth: '78%', borderRadius: 10, padding: '7px 10px', fontSize: 13, lineHeight: 1.45 },
  bubbleIn: { background: '#fff', border: '1px solid #e5e7eb' },
  bubbleOut: { background: '#dcfce7' },
  bubbleTime: { fontSize: 10.5, color: '#64748b', marginTop: 3 },
};
